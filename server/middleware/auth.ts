import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export function requireStaff(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user || req.session.user.role !== 'staff') {
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

  if (req.session.user.role === 'staff') {
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

  if (req.session.user.role === 'staff' || req.session.user.role === 'tenant') {
    if (req.session.user.role === 'tenant' && !req.session.user.claimAccess.includes(claimId)) {
      return res.status(403).json({ message: "Access denied to this claim" });
    }
    return next();
  }

  return res.status(403).json({ message: "Write access denied (assessors are read-only)" });
}

export async function determineUserRole(email: string): Promise<{ role: 'staff' | 'tenant' | 'assessor' | 'none', claimAccess: number[] }> {
  const normalizedEmail = email.toLowerCase().trim();

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
