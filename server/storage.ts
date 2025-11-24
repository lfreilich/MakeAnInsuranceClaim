// Storage layer for insurance claims
import { 
  claims, 
  users,
  insurancePolicies,
  auditLogs,
  claimStatusTransitions,
  claimNotes,
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
  getClaimNotes(claimId: number): Promise<ClaimNote[]>;
  updateNote(id: number, updates: Partial<ClaimNote>): Promise<ClaimNote | undefined>;
  deleteNote(id: number): Promise<boolean>;
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
}

export const storage = new DatabaseStorage();
