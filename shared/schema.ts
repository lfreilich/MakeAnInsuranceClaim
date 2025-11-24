// Database schema for insurance claim portal
import { pgTable, varchar, text, timestamp, boolean, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Claims table
export const claims = pgTable("claims", {
  id: serial("id").primaryKey(),
  referenceNumber: varchar("reference_number", { length: 50 }).notNull().unique(),
  status: varchar("status", { length: 50 }).notNull().default("submitted"),
  
  // Claimant Details
  claimantName: varchar("claimant_name", { length: 255 }).notNull(),
  claimantEmail: varchar("claimant_email", { length: 255 }).notNull(),
  claimantPhone: varchar("claimant_phone", { length: 50 }).notNull(),
  
  // Property Details
  propertyAddress: text("property_address").notNull(),
  propertyBlock: varchar("property_block", { length: 255 }),
  propertyUnit: varchar("property_unit", { length: 100 }),
  propertyPlaceId: varchar("property_place_id", { length: 500 }),
  propertyConstructionAge: varchar("property_construction_age", { length: 100 }),
  propertyConstructionType: varchar("property_construction_type", { length: 255 }),
  
  // Incident Details
  incidentDate: timestamp("incident_date").notNull(),
  incidentType: varchar("incident_type", { length: 50 }).notNull(),
  incidentDescription: text("incident_description").notNull(),
  
  // Building Damage
  hasBuildingDamage: boolean("has_building_damage").notNull().default(false),
  buildingDamageDescription: text("building_damage_description"),
  buildingDamageAffectedAreas: text("building_damage_affected_areas"),
  
  // Theft/Vandalism
  hasTheft: boolean("has_theft").notNull().default(false),
  theftDescription: text("theft_description"),
  theftPoliceReported: boolean("theft_police_reported").notNull().default(false),
  theftPoliceReference: varchar("theft_police_reference", { length: 100 }),
  
  // Sublet
  hasSublet: boolean("has_sublet").notNull().default(false),
  subletDescription: text("sublet_description"),
  subletEvidence: text("sublet_evidence"),
  
  // File Uploads (stored as JSON arrays of paths)
  damagePhotos: text("damage_photos").array(),
  repairQuotes: text("repair_quotes").array(),
  invoices: text("invoices").array(),
  policeReports: text("police_reports").array(),
  otherDocuments: text("other_documents").array(),
  
  // Declaration & Signature
  signatureData: text("signature_data").notNull(),
  signatureType: varchar("signature_type", { length: 20 }).notNull(),
  declarationAccepted: boolean("declaration_accepted").notNull(),
  fraudWarningAccepted: boolean("fraud_warning_accepted").notNull(),
  contentsExclusionAccepted: boolean("contents_exclusion_accepted").notNull(),
  
  // Timestamps
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

// TypeScript types
export type Claim = typeof claims.$inferSelect;
export type InsertClaim = typeof claims.$inferInsert;

// Zod schemas for validation
export const insertClaimSchema = createInsertSchema(claims, {
  claimantEmail: z.string().email("Invalid email address"),
  claimantPhone: z.string().min(10, "Phone number must be at least 10 characters"),
  incidentDescription: z.string().min(50, "Description must be at least 50 characters"),
  damagePhotos: z.array(z.string()).optional().default([]),
  repairQuotes: z.array(z.string()).optional().default([]),
  invoices: z.array(z.string()).optional().default([]),
  policeReports: z.array(z.string()).optional().default([]),
  otherDocuments: z.array(z.string()).optional().default([]),
}).omit({
  id: true,
  referenceNumber: true,
  status: true,
  submittedAt: true,
}).refine(
  (data) => {
    // Require damage photos and repair quotes ONLY when user explicitly marks building damage
    if (data.hasBuildingDamage) {
      return (data.damagePhotos && data.damagePhotos.length >= 2) && 
             (data.repairQuotes && data.repairQuotes.length >= 1);
    }
    return true;
  },
  {
    message: "Building damage claims require at least 2 damage photos and 1 repair quote",
    path: ["damagePhotos"],
  }
).refine(
  (data) => {
    // Require police reports ONLY when user explicitly marks theft AND reports it to police
    if (data.hasTheft && data.theftPoliceReported) {
      return data.policeReports && data.policeReports.length >= 1;
    }
    return true;
  },
  {
    message: "Police reports are required when theft/vandalism is reported to police",
    path: ["policeReports"],
  }
);

// Step-by-step form schemas for frontend validation
// TEMPORARY: Minimal validation for testing
export const step1Schema = z.object({
  claimantName: z.string().optional().default("Test User"),
  claimantEmail: z.string().optional().default("test@example.com"),
  claimantPhone: z.string().optional().default("07700000000"),
});

export const step2Schema = z.object({
  propertyAddress: z.string().min(1, "Please select an address from Google Places"),
  propertyBlock: z.string().optional(),
  propertyPlaceId: z.string().min(1, "Please select an address from Google Places"),
  propertyConstructionAge: z.string().optional(),
  propertyConstructionType: z.string().optional(),
});

export const step3Schema = z.object({
  incidentDate: z.date().optional().default(new Date()),
  incidentType: z.enum(["building_damage", "theft", "vandalism", "sublet"]).optional().default("building_damage"),
  incidentDescription: z.string().optional().default("Test incident description"),
});

export const step4Schema = z.object({
  hasBuildingDamage: z.boolean().optional().default(false),
  buildingDamageDescription: z.string().optional(),
  buildingDamageAffectedAreas: z.string().optional(),
});

export const step5Schema = z.object({
  hasTheft: z.boolean().optional().default(false),
  theftDescription: z.string().optional(),
  theftPoliceReported: z.boolean().optional().default(false),
  theftPoliceReference: z.string().optional(),
});

export const step6Schema = z.object({
  hasSublet: z.boolean().optional().default(false),
  subletDescription: z.string().optional(),
  subletEvidence: z.string().optional(),
});

export const step7Schema = z.object({
  damagePhotos: z.array(z.string()).optional().default([]),
  repairQuotes: z.array(z.string()).optional().default([]),
  invoices: z.array(z.string()).optional().default([]),
  policeReports: z.array(z.string()).optional().default([]),
  otherDocuments: z.array(z.string()).optional().default([]),
});

export const step8Schema = z.object({
  signatureData: z.string().optional().default("test-signature"),
  signatureType: z.enum(["drawn", "typed"]).optional().default("typed"),
  declarationAccepted: z.boolean().optional().default(true),
  fraudWarningAccepted: z.boolean().optional().default(true),
  contentsExclusionAccepted: z.boolean().optional().default(true),
});

// Combined form data type
export type ClaimFormData = z.infer<typeof step1Schema> &
  z.infer<typeof step2Schema> &
  z.infer<typeof step3Schema> &
  z.infer<typeof step4Schema> &
  z.infer<typeof step5Schema> &
  z.infer<typeof step6Schema> &
  z.infer<typeof step7Schema> &
  z.infer<typeof step8Schema>;

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type Step4Data = z.infer<typeof step4Schema>;
export type Step5Data = z.infer<typeof step5Schema>;
export type Step6Data = z.infer<typeof step6Schema>;
export type Step7Data = z.infer<typeof step7Schema>;
export type Step8Data = z.infer<typeof step8Schema>;
