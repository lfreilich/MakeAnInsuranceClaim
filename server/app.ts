import { type Server } from "node:http";

import express, {
  type Express,
  type Request,
  Response,
  NextFunction,
} from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

import { registerRoutes } from "./routes";
import { backupToS3 } from "./backup-to-s3";
import { runAutoMigrations } from "./auto-migrate";

// Configure WebSocket for Neon serverless driver
neonConfig.webSocketConstructor = ws;

const PgSession = connectPgSimple(session);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  limit: '50mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Create PostgreSQL pool for session storage
const sessionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Session configuration with PostgreSQL store (persistent across restarts)
app.use(session({
  store: new PgSession({
    pool: sessionPool,
    tableName: 'user_sessions',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'moreland-claims-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS attacks
    maxAge: 30 * 60 * 1000, // 30 minutes in milliseconds
    sameSite: 'lax', // CSRF protection
  },
  rolling: true, // Reset expiration on activity (sliding window)
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

export default async function runApp(
  setup: (app: Express, server: Server) => Promise<void>,
) {
  // Run auto-migrations to ensure database schema is up-to-date
  await runAutoMigrations();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly run the final setup after setting up all the other routes so
  // the catch-all route doesn't interfere with the other routes
  await setup(app, server);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Start scheduled backup every 12 hours
    startScheduledBackups();
  });
}

// Scheduled backup configuration
const BACKUP_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

function startScheduledBackups() {
  // Check if S3 backup is configured
  if (!process.env.S3_BACKUP_BUCKET || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    log("Scheduled S3 backups disabled - AWS credentials not configured", "backup");
    return;
  }
  
  log(`Scheduled S3 backups enabled - running every 12 hours`, "backup");
  
  // Run first backup after 1 minute (to let server fully start)
  setTimeout(async () => {
    await runScheduledBackup();
  }, 60 * 1000);
  
  // Then run every 12 hours
  setInterval(async () => {
    await runScheduledBackup();
  }, BACKUP_INTERVAL_MS);
}

async function runScheduledBackup() {
  try {
    log("Starting scheduled S3 backup...", "backup");
    const result = await backupToS3();
    log(`Scheduled backup complete: ${result.tablesBackedUp} tables, ${result.filesBackedUp} files -> ${result.s3Location}`, "backup");
  } catch (error: any) {
    log(`Scheduled backup failed: ${error.message}`, "backup");
    console.error("Scheduled backup error details:", error);
  }
}
