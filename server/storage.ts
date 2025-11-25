// Storage layer for insurance claims
import { 
  claims, 
  users,
  insurancePolicies,
  auditLogs,
  claimStatusTransitions,
  claimNotes,
  lossAssessors,
  payments,
  verificationCodes,
  type Claim, 
  type InsertClaim,
  type User,
  type InsertUser,
  type InsurancePolicy,
  type InsertInsurancePolicy,
  type AuditLog,
  type InsertAuditLog,
  type ClaimStatusTransition,
  type InsertClaimStatusTransition,
  type ClaimNote,
  type InsertClaimNote,
  type LossAssessor,
  type InsertLossAssessor,
  type Payment,
  type InsertPayment,
  type VerificationCode,
  type InsertVerificationCode,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Claim operations
  createClaim(claim: Omit<InsertClaim, 'id' | 'referenceNumber' | 'submittedAt' | 'status'>): Promise<Claim>;
  getClaim(id: number): Promise<Claim | undefined>;
  getClaimByReference(referenceNumber: string): Promise<Claim | undefined>;
  getAllClaims(): Promise<Claim[]>;
  updateClaimStatus(id: number, status: string, userId?: number, note?: string): Promise<Claim | undefined>;
  updateClaim(id: number, updates: Partial<Claim>): Promise<Claim | undefined>;
  
  // User operations
  createUser(user: Omit<InsertUser, 'id' | 'createdAt'>): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Policy operations
  createPolicy(policy: Omit<InsertInsurancePolicy, 'id' | 'createdAt'>): Promise<InsurancePolicy>;
  getPolicy(id: number): Promise<InsurancePolicy | undefined>;
  getAllPolicies(): Promise<InsurancePolicy[]>;
  updatePolicy(id: number, updates: Partial<InsurancePolicy>): Promise<InsurancePolicy | undefined>;
  
  // Audit operations
  createAuditLog(log: Omit<InsertAuditLog, 'id' | 'createdAt'>): Promise<AuditLog>;
  getClaimAuditLogs(claimId: number): Promise<AuditLog[]>;
  
  // Status transition operations
  createStatusTransition(transition: Omit<InsertClaimStatusTransition, 'id' | 'createdAt'>): Promise<ClaimStatusTransition>;
  getClaimStatusTransitions(claimId: number): Promise<ClaimStatusTransition[]>;
  
  // Notes operations
  createNote(note: Omit<InsertClaimNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClaimNote>;
  getNote(id: number): Promise<ClaimNote | undefined>;
  getClaimNotes(claimId: number): Promise<ClaimNote[]>;
  updateNote(id: number, updates: Partial<ClaimNote>): Promise<ClaimNote | undefined>;
  deleteNote(id: number): Promise<boolean>;
  
  // Loss Assessor operations
  createLossAssessor(assessor: Omit<InsertLossAssessor, 'id' | 'createdAt'>): Promise<LossAssessor>;
  getLossAssessor(id: number): Promise<LossAssessor | undefined>;
  getAllLossAssessors(): Promise<LossAssessor[]>;
  updateLossAssessor(id: number, updates: Partial<LossAssessor>): Promise<LossAssessor | undefined>;
  deleteLossAssessor(id: number): Promise<boolean>;
  assignLossAssessorToClaim(claimId: number, assessorId: number | null, userId?: number): Promise<Claim | undefined>;
  
  // Payment operations
  createPayment(payment: Omit<InsertPayment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment>;
  getPayment(id: number): Promise<Payment | undefined>;
  getClaimPayments(claimId: number): Promise<Payment[]>;
  updatePayment(id: number, updates: Partial<Payment>): Promise<Payment | undefined>;
  updatePaymentStatus(id: number, status: string, paidAt?: Date, transactionReference?: string): Promise<Payment | undefined>;
  
  // Verification code operations
  createVerificationCode(email: string, claimId?: number): Promise<{ code: string; expiresAt: Date }>;
  verifyCode(email: string, code: string): Promise<boolean>;
  cleanupExpiredCodes(): Promise<void>;
  getUserAccessLevel(email: string, claimId?: number): Promise<{
    role: 'staff' | 'tenant' | 'assessor' | 'none';
    claimAccess?: number[];
  }>;
  
  // Claim access operations
  getClaimsByEmail(email: string): Promise<Claim[]>;
  getAssessorClaims(email: string): Promise<Claim[]>;
  
  // Claim closure operations
  closeClaim(claimId: number, closeReason: string, userId?: number, finalNotes?: string): Promise<Claim | undefined>;
}

// Generate a unique claim reference number
function generateReferenceNumber(): string {
  const prefix = "MEI";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export class DatabaseStorage implements IStorage {
  async createClaim(
    claimData: Omit<InsertClaim, 'id' | 'referenceNumber' | 'submittedAt' | 'status'>
  ): Promise<Claim> {
    const referenceNumber = generateReferenceNumber();
    
    const [claim] = await db
      .insert(claims)
      .values({
        ...claimData,
        referenceNumber,
        status: 'submitted',
      } as any)
      .returning();
    
    return claim;
  }

  async getClaim(id: number): Promise<Claim | undefined> {
    const [claim] = await db.select().from(claims).where(eq(claims.id, id));
    return claim || undefined;
  }

  async getClaimByReference(referenceNumber: string): Promise<Claim | undefined> {
    const [claim] = await db.select().from(claims).where(eq(claims.referenceNumber, referenceNumber));
    return claim || undefined;
  }

  async getAllClaims(): Promise<Claim[]> {
    return await db.select().from(claims);
  }

  async updateClaimStatus(id: number, status: string, userId?: number, note?: string): Promise<Claim | undefined> {
    // Get current claim for audit trail
    const currentClaim = await this.getClaim(id);
    if (!currentClaim) return undefined;

    return await db.transaction(async (tx) => {
      // Update claim status
      const [updatedClaim] = await tx
        .update(claims)
        .set({ 
          status,
          lastUpdatedAt: new Date(),
        })
        .where(eq(claims.id, id))
        .returning();

      // Create status transition record
      await tx.insert(claimStatusTransitions).values({
        claimId: id,
        fromStatus: currentClaim.status,
        toStatus: status,
        userId,
        note,
      });

      // Create audit log
      await tx.insert(auditLogs).values({
        claimId: id,
        userId,
        action: 'status_change',
        entityType: 'claim',
        entityId: id,
        changes: {
          field: 'status',
          from: currentClaim.status,
          to: status,
          note,
        },
      });

      return updatedClaim;
    });
  }

  async updateClaim(id: number, updates: Partial<Claim>): Promise<Claim | undefined> {
    const [updatedClaim] = await db
      .update(claims)
      .set({ ...updates, lastUpdatedAt: new Date() })
      .where(eq(claims.id, id))
      .returning();
    return updatedClaim || undefined;
  }

  // User operations
  async createUser(userData: Omit<InsertUser, 'id' | 'createdAt'>): Promise<User> {
    const [user] = await db.insert(users).values(userData as any).returning();
    return user;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getOrCreateUser(email: string): Promise<User> {
    // Check if user exists
    const existingUser = await this.getUserByEmail(email);
    if (existingUser) {
      return existingUser;
    }
    
    // Determine role from email domain
    const isStaff = email.endsWith('@mnninsure.com') || email.endsWith('@morelandestate.co.uk');
    const role = isStaff ? 'staff' : 'tenant';
    
    // Create new user
    const [user] = await db.insert(users).values({
      email,
      name: email.split('@')[0],
      role,
      active: true,
    } as any).returning();
    
    return user;
  }

  async updateUserPhone(email: string, phone: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ phone })
      .where(eq(users.email, email))
      .returning();
    return updatedUser || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.active, true));
  }

  // Policy operations
  async createPolicy(policyData: Omit<InsertInsurancePolicy, 'id' | 'createdAt'>): Promise<InsurancePolicy> {
    const [policy] = await db.insert(insurancePolicies).values(policyData as any).returning();
    return policy;
  }

  async getPolicy(id: number): Promise<InsurancePolicy | undefined> {
    const [policy] = await db.select().from(insurancePolicies).where(eq(insurancePolicies.id, id));
    return policy || undefined;
  }

  async getAllPolicies(): Promise<InsurancePolicy[]> {
    return await db.select().from(insurancePolicies).where(eq(insurancePolicies.active, true));
  }

  async updatePolicy(id: number, updates: Partial<InsurancePolicy>): Promise<InsurancePolicy | undefined> {
    const [updatedPolicy] = await db
      .update(insurancePolicies)
      .set(updates)
      .where(eq(insurancePolicies.id, id))
      .returning();
    return updatedPolicy || undefined;
  }

  // Audit operations
  async createAuditLog(logData: Omit<InsertAuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(logData as any).returning();
    return log;
  }

  async getClaimAuditLogs(claimId: number): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.claimId, claimId))
      .orderBy(desc(auditLogs.createdAt));
  }

  // Status transition operations
  async createStatusTransition(transitionData: Omit<InsertClaimStatusTransition, 'id' | 'createdAt'>): Promise<ClaimStatusTransition> {
    const [transition] = await db.insert(claimStatusTransitions).values(transitionData as any).returning();
    return transition;
  }

  async getClaimStatusTransitions(claimId: number): Promise<ClaimStatusTransition[]> {
    return await db
      .select()
      .from(claimStatusTransitions)
      .where(eq(claimStatusTransitions.claimId, claimId))
      .orderBy(desc(claimStatusTransitions.createdAt));
  }

  // Notes operations
  async createNote(noteData: Omit<InsertClaimNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClaimNote> {
    const [note] = await db.insert(claimNotes).values(noteData as any).returning();
    
    // Create audit log for note creation
    await this.createAuditLog({
      claimId: noteData.claimId,
      userId: noteData.authorUserId,
      action: 'note_added',
      entityType: 'note',
      entityId: note.id,
      changes: {
        noteType: noteData.noteType,
        visibility: noteData.visibility,
      },
    });
    
    return note;
  }

  async getNote(id: number): Promise<ClaimNote | undefined> {
    const [note] = await db
      .select()
      .from(claimNotes)
      .where(eq(claimNotes.id, id));
    return note || undefined;
  }

  async getClaimNotes(claimId: number): Promise<ClaimNote[]> {
    return await db
      .select()
      .from(claimNotes)
      .where(eq(claimNotes.claimId, claimId))
      .orderBy(desc(claimNotes.createdAt));
  }

  async updateNote(id: number, updates: Partial<ClaimNote>): Promise<ClaimNote | undefined> {
    const [updatedNote] = await db
      .update(claimNotes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(claimNotes.id, id))
      .returning();
    return updatedNote || undefined;
  }

  async deleteNote(id: number): Promise<boolean> {
    const result = await db.delete(claimNotes).where(eq(claimNotes.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Loss Assessor operations
  async createLossAssessor(assessorData: Omit<InsertLossAssessor, 'id' | 'createdAt'>): Promise<LossAssessor> {
    const [assessor] = await db.insert(lossAssessors).values(assessorData as any).returning();
    return assessor;
  }

  async getLossAssessor(id: number): Promise<LossAssessor | undefined> {
    const [assessor] = await db.select().from(lossAssessors).where(eq(lossAssessors.id, id));
    return assessor;
  }

  async getAllLossAssessors(): Promise<LossAssessor[]> {
    return await db
      .select()
      .from(lossAssessors)
      .orderBy(desc(lossAssessors.createdAt));
  }

  async updateLossAssessor(id: number, updates: Partial<LossAssessor>): Promise<LossAssessor | undefined> {
    const [updatedAssessor] = await db
      .update(lossAssessors)
      .set(updates)
      .where(eq(lossAssessors.id, id))
      .returning();
    return updatedAssessor || undefined;
  }

  async deleteLossAssessor(id: number): Promise<boolean> {
    const result = await db.delete(lossAssessors).where(eq(lossAssessors.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async assignLossAssessorToClaim(claimId: number, assessorId: number | null, userId?: number): Promise<Claim | undefined> {
    const [updatedClaim] = await db
      .update(claims)
      .set({ 
        lossAssessorId: assessorId,
        lastUpdatedAt: new Date(),
      })
      .where(eq(claims.id, claimId))
      .returning();

    if (updatedClaim && userId) {
      // Create audit log for assessor assignment
      await this.createAuditLog({
        claimId,
        userId,
        action: assessorId ? 'loss_assessor_assigned' : 'loss_assessor_removed',
        entityType: 'claim',
        entityId: claimId,
        changes: { lossAssessorId: assessorId },
      });
    }

    return updatedClaim || undefined;
  }

  // Payment operations
  async createPayment(
    paymentData: Omit<InsertPayment, 'id' | 'createdAt' | 'updatedAt'>, 
    userId?: number
  ): Promise<Payment> {
    // Validate amount - reject NaN, negative, or zero
    if (!paymentData.amount || isNaN(paymentData.amount) || paymentData.amount <= 0) {
      throw new Error('Payment amount must be a positive number');
    }

    const [payment] = await db.insert(payments).values(paymentData as any).returning();
    
    // Create audit log for payment creation
    if (userId) {
      await this.createAuditLog({
        claimId: payment.claimId,
        userId,
        action: 'payment_created',
        entityType: 'payment',
        entityId: payment.id,
        changes: {
          amount: payment.amount,
          paymentType: payment.paymentType,
          status: payment.status,
        },
      });
    }
    
    return payment;
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async getClaimPayments(claimId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.claimId, claimId))
      .orderBy(desc(payments.createdAt));
  }

  async updatePayment(id: number, updates: Partial<Payment>): Promise<Payment | undefined> {
    const [updatedPayment] = await db
      .update(payments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment || undefined;
  }

  async updatePaymentStatus(
    id: number, 
    status: string, 
    paidAt?: Date, 
    transactionReference?: string,
    userId?: number
  ): Promise<Payment | undefined> {
    const updates: Partial<Payment> = {
      status,
      updatedAt: new Date(),
    };
    
    if (paidAt) updates.paidAt = paidAt;
    if (transactionReference) updates.transactionReference = transactionReference;
    
    const [updatedPayment] = await db
      .update(payments)
      .set(updates)
      .where(eq(payments.id, id))
      .returning();
    
    // Create audit log for payment status update
    if (updatedPayment && userId) {
      await this.createAuditLog({
        claimId: updatedPayment.claimId,
        userId,
        action: 'payment_status_updated',
        entityType: 'payment',
        entityId: updatedPayment.id,
        changes: {
          status,
          ...(transactionReference && { transactionReference }),
        },
      });
    }
    
    return updatedPayment || undefined;
  }

  // Claim closure operations
  async closeClaim(
    claimId: number, 
    closeReason: string, 
    userId?: number, 
    finalNotes?: string
  ): Promise<Claim | undefined> {
    return await db.transaction(async (tx) => {
      // Update claim with closure info
      const [closedClaim] = await tx
        .update(claims)
        .set({
          closedAt: new Date(),
          closeReason,
          status: 'closed',
          lastUpdatedAt: new Date(),
        })
        .where(eq(claims.id, claimId))
        .returning();

      if (!closedClaim) return undefined;

      // Create status transition record
      await tx.insert(claimStatusTransitions).values({
        claimId,
        fromStatus: closedClaim.status,
        toStatus: 'closed',
        changedBy: userId || null,
        reason: closeReason,
      } as any);

      // Create audit log for closure
      if (userId) {
        await tx.insert(auditLogs).values({
          claimId,
          userId,
          action: 'claim_closed',
          entityType: 'claim',
          entityId: claimId,
          changes: { 
            closedAt: new Date(),
            closeReason,
            status: 'closed',
          },
        } as any);
      }

      // Add final notes if provided
      if (finalNotes && userId) {
        await tx.insert(claimNotes).values({
          claimId,
          authorUserId: userId,
          noteType: 'general',
          visibility: 'internal',
          body: `Closure Notes: ${finalNotes}`,
        } as any);
      }

      return closedClaim;
    });
  }

  // Verification code operations
  async createVerificationCode(email: string, claimId?: number): Promise<{ code: string; expiresAt: Date }> {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing unverified codes for this email
    await db.delete(verificationCodes)
      .where(and(
        eq(verificationCodes.email, email),
        eq(verificationCodes.verified, false)
      ));

    // Create new verification code
    await db.insert(verificationCodes).values({
      email,
      code,
      expiresAt,
      claimId: claimId || null,
      verified: false,
    } as any);

    return { code, expiresAt };
  }

  async verifyCode(email: string, code: string): Promise<boolean> {
    const [record] = await db
      .select()
      .from(verificationCodes)
      .where(and(
        eq(verificationCodes.email, email),
        eq(verificationCodes.code, code),
        eq(verificationCodes.verified, false)
      ))
      .limit(1);

    if (!record) return false;

    // Check if expired
    if (new Date() > new Date(record.expiresAt)) {
      await db.delete(verificationCodes).where(eq(verificationCodes.id, record.id));
      return false;
    }

    // Mark as verified
    await db.update(verificationCodes)
      .set({ verified: true })
      .where(eq(verificationCodes.id, record.id));

    return true;
  }

  async cleanupExpiredCodes(): Promise<void> {
    await db.delete(verificationCodes)
      .where(and(
        eq(verificationCodes.verified, false)
      ));
  }

  async getUserAccessLevel(email: string, claimId?: number): Promise<{
    role: 'staff' | 'tenant' | 'assessor' | 'none';
    claimAccess?: number[];
  }> {
    const emailLower = email.toLowerCase();

    // Check if staff domain (@mnninsure.com or @morelandestate.co.uk)
    if (emailLower.endsWith('@mnninsure.com') || emailLower.endsWith('@morelandestate.co.uk')) {
      return { role: 'staff' };
    }

    // Check if loss assessor
    const [assessor] = await db
      .select()
      .from(lossAssessors)
      .where(eq(lossAssessors.email, emailLower))
      .limit(1);

    if (assessor) {
      // Get all claims assigned to this assessor
      const assignedClaims = await db
        .select({ id: claims.id })
        .from(claims)
        .where(eq(claims.lossAssessorId, assessor.id));
      
      const claimIds = assignedClaims.map(c => c.id);
      return { 
        role: 'assessor', 
        claimAccess: claimIds 
      };
    }

    // Check if tenant (claimant)
    if (claimId) {
      const [claim] = await db
        .select()
        .from(claims)
        .where(eq(claims.id, claimId))
        .limit(1);

      if (claim && claim.claimantEmail.toLowerCase() === emailLower) {
        return { 
          role: 'tenant', 
          claimAccess: [claimId] 
        };
      }
    }

    // Check all claims for this email as claimant
    const userClaims = await db
      .select({ id: claims.id })
      .from(claims)
      .where(eq(claims.claimantEmail, emailLower));

    if (userClaims.length > 0) {
      const claimIds = userClaims.map(c => c.id);
      return { 
        role: 'tenant', 
        claimAccess: claimIds 
      };
    }

    return { role: 'none' };
  }

  async getClaimsByEmail(email: string): Promise<Claim[]> {
    const normalizedEmail = email.toLowerCase().trim();
    return await db
      .select()
      .from(claims)
      .where(eq(claims.claimantEmail, normalizedEmail));
  }

  async getAssessorClaims(email: string): Promise<Claim[]> {
    const normalizedEmail = email.toLowerCase().trim();
    
    const assessor = await db
      .select()
      .from(lossAssessors)
      .where(eq(lossAssessors.email, normalizedEmail))
      .limit(1);
    
    if (assessor.length === 0) {
      return [];
    }
    
    return await db
      .select()
      .from(claims)
      .where(eq(claims.lossAssessorId, assessor[0].id));
  }
}

export const storage = new DatabaseStorage();
