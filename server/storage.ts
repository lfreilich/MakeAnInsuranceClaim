// Storage layer for insurance claims
import { claims, type Claim, type InsertClaim } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  createClaim(claim: Omit<InsertClaim, 'id' | 'referenceNumber' | 'submittedAt' | 'status'>): Promise<Claim>;
  getClaim(id: string): Promise<Claim | undefined>;
  getClaimByReference(referenceNumber: string): Promise<Claim | undefined>;
  getAllClaims(): Promise<Claim[]>;
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

  async getClaim(id: string): Promise<Claim | undefined> {
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
}

export const storage = new DatabaseStorage();
