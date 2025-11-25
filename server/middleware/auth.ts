import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export function requireStaff(req: Request, res: Response, next: NextFunction) {
  const role = req.session.user?.role?.toLowerCase();
  const isStaff = role === 'staff' || role === 'superuser' || role === 'admin';
  
  if (!req.session.user || !isStaff) {
    console.log(`[AUTH] Staff access denied - session role: ${req.session.user?.role}`);
    return res.status(403).json({ message: "Staff access required" });
  }
  next();
}

export async function requireClaimAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const claimId = parseInt(req.params.id || req.params.claimId || req.body.claimId);
  if (isNaN(claimId)) {
    return res.status(400).json({ message: "Invalid claim ID" });
  }

  const role = req.session.user.role?.toLowerCase();
  if (role === 'staff' || role === 'superuser' || role === 'admin') {
    return next();
  }

  if (!req.session.user.claimAccess.includes(claimId)) {
    return res.status(403).json({ message: "Access denied to this claim" });
  }

  next();
}

export async function requireClaimWrite(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const claimId = parseInt(req.params.id || req.params.claimId || req.body.claimId);
  if (isNaN(claimId)) {
    return res.status(400).json({ message: "Invalid claim ID" });
  }

  const role = req.session.user.role?.toLowerCase();
  const isStaff = role === 'staff' || role === 'superuser' || role === 'admin';
  
  if (isStaff || role === 'tenant') {
    if (role === 'tenant' && !req.session.user.claimAccess.includes(claimId)) {
      return res.status(403).json({ message: "Access denied to this claim" });
    }
    return next();
  }

  return res.status(403).json({ message: "Write access denied (assessors are read-only)" });
}

export async function determineUserRole(email: string): Promise<{ role: 'staff' | 'tenant' | 'assessor' | 'none', claimAccess: number[] }> {
  const normalizedEmail = email.toLowerCase().trim();

  // Check if user has staff/superuser role in database
  const dbUser = await storage.getUserByEmail(normalizedEmail);
  if (dbUser && (dbUser.role === 'staff' || dbUser.role === 'superuser' || dbUser.role === 'admin')) {
    return { role: 'staff', claimAccess: [] };
  }

  // Check staff domains
  const staffDomains = ['@mnninsure.com', '@morelandestate.co.uk'];
  const isStaff = staffDomains.some(domain => normalizedEmail.endsWith(domain));

  if (isStaff) {
    return { role: 'staff', claimAccess: [] };
  }

  const assessorClaims = await storage.getAssessorClaims(normalizedEmail);
  if (assessorClaims.length > 0) {
    return { role: 'assessor', claimAccess: assessorClaims.map((c) => c.id) };
  }

  const tenantClaims = await storage.getClaimsByEmail(normalizedEmail);
  if (tenantClaims.length > 0) {
    return { role: 'tenant', claimAccess: tenantClaims.map((c) => c.id) };
  }

  return { role: 'none', claimAccess: [] };
}
