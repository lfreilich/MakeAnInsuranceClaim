// Type declarations for Express session
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      email: string;
      role: 'staff' | 'superuser' | 'admin' | 'tenant' | 'assessor' | 'none';
      claimAccess: number[];
    };
  }
}
