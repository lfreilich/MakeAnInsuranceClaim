import { Pool } from "@neondatabase/serverless";
import { log } from "./app";

const CLAIMS_MIGRATIONS = [
  // Workflow & Assignment
  `ALTER TABLE claims ADD COLUMN IF NOT EXISTS current_stage varchar(50) DEFAULT 'new'`,
  `ALTER TABLE claims ADD COLUMN IF NOT EXISTS handler_user_id integer`,
  `ALTER TABLE claims ADD COLUMN IF NOT EXISTS policy_id integer`,
  `ALTER TABLE claims ADD COLUMN IF NOT EXISTS loss_assessor_id integer`,
  
  // Insurer Details
  `ALTER TABLE claims ADD COLUMN IF NOT EXISTS insurer_claim_ref varchar(100)`,
  `ALTER TABLE claims ADD COLUMN IF NOT EXISTS insurer_submitted_at timestamp`,
  `ALTER TABLE claims ADD COLUMN IF NOT EXISTS insurer_response_date timestamp`,
  
  // Closure
  `ALTER TABLE claims ADD COLUMN IF NOT EXISTS closed_at timestamp`,
  `ALTER TABLE claims ADD COLUMN IF NOT EXISTS close_reason text`,
  
  // Property (Google Places)
  `ALTER TABLE claims ADD COLUMN IF NOT EXISTS property_place_id varchar(500)`,
  `ALTER TABLE claims ADD COLUMN IF NOT EXISTS property_construction_age varchar(100)`,
  `ALTER TABLE claims ADD COLUMN IF NOT EXISTS property_construction_type varchar(255)`,
  
  // Late notification
  `ALTER TABLE claims ADD COLUMN IF NOT EXISTS late_notification_acknowledged boolean DEFAULT false`,
  `ALTER TABLE claims ADD COLUMN IF NOT EXISTS late_notification_audit_log jsonb`,
  
  // Timestamps
  `ALTER TABLE claims ADD COLUMN IF NOT EXISTS last_updated_at timestamp DEFAULT now()`,
];

export async function runAutoMigrations(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    log("Skipping auto-migrations: DATABASE_URL not configured", "migrate");
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    log("Running auto-migrations for claims table...", "migrate");
    
    let successCount = 0;
    let skipCount = 0;
    
    for (const sql of CLAIMS_MIGRATIONS) {
      try {
        await pool.query(sql);
        successCount++;
      } catch (error: any) {
        // Column already exists or other non-critical error
        if (error.code === '42701') {
          skipCount++;
        } else {
          log(`Migration warning: ${error.message}`, "migrate");
        }
      }
    }
    
    log(`Auto-migrations complete: ${successCount} applied, ${skipCount} skipped`, "migrate");
  } catch (error: any) {
    log(`Auto-migration error: ${error.message}`, "migrate");
  } finally {
    await pool.end();
  }
}
