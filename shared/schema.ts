// Database schema for insurance claim portal
import { pgTable, varchar, text, timestamp, boolean, serial, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table - for admin staff attribution
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  replitUserId: varchar("replit_user_id", { length: 255 }).unique(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  role: varchar("role", { length: 50 }).notNull().default("admin"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insurance Policies table - multiple policies per building
export const insurancePolicies = pgTable("insurance_policies", {
  id: serial("id").primaryKey(),
  policyNumber: varchar("policy_number", { length: 100 }).notNull().unique(),
  policyName: varchar("policy_name", { length: 255 }).notNull(),
  insurerName: varchar("insurer_name", { length: 255 }).notNull(),
  coverageType: varchar("coverage_type", { length: 100 }).notNull(), // e.g., "Buildings", "Public Liability"
  excessAmount: integer("excess_amount"), // Deductible amount in pence
  policyStartDate: timestamp("policy_start_date"),
  policyEndDate: timestamp("policy_end_date"),
  buildingAddress: text("building_address"), // Can be multiple buildings
  active: boolean("active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Claims table
export const claims = pgTable("claims", {
  id: serial("id").primaryKey(),
  referenceNumber: varchar("reference_number", { length: 50 }).notNull().unique(),
  status: varchar("status", { length: 50 }).notNull().default("submitted"),
  
  // Workflow & Assignment
  currentStage: varchar("current_stage", { length: 50 }).notNull().default("new"),
  handlerUserId: integer("handler_user_id"),
  policyId: integer("policy_id"),
  
  // Insurer Details
  insurerClaimRef: varchar("insurer_claim_ref", { length: 100 }),
  insurerSubmittedAt: timestamp("insurer_submitted_at"),
  
  // Closure
  closedAt: timestamp("closed_at"),
  closeReason: text("close_reason"),
  
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
  incidentType: varchar("incident_type", { length: 100 }).notNull(),
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
  
  // Property Occupancy
  isInvestmentProperty: boolean("is_investment_property").notNull().default(false),
  tenantName: varchar("tenant_name", { length: 255 }),
  tenantPhone: varchar("tenant_phone", { length: 50 }),
  tenantEmail: varchar("tenant_email", { length: 255 }),
  tenancyAgreements: text("tenancy_agreements").array(),
  
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
  lastUpdatedAt: timestamp("last_updated_at").notNull().defaultNow(),
});

// Audit Logs table - track ALL actions on claims
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  claimId: integer("claim_id").notNull(),
  userId: integer("user_id"), // null for system actions
  action: varchar("action", { length: 100 }).notNull(), // e.g., "status_change", "note_added", "file_uploaded"
  entityType: varchar("entity_type", { length: 50 }).notNull(), // "claim", "note", "payment"
  entityId: integer("entity_id"),
  changes: jsonb("changes"), // Store before/after values
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Claim Status Transitions table - dedicated tracking of status changes
export const claimStatusTransitions = pgTable("claim_status_transitions", {
  id: serial("id").primaryKey(),
  claimId: integer("claim_id").notNull(),
  fromStatus: varchar("from_status", { length: 50 }),
  toStatus: varchar("to_status", { length: 50 }).notNull(),
  userId: integer("user_id"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Claim Notes table - comments and internal notes
export const claimNotes = pgTable("claim_notes", {
  id: serial("id").primaryKey(),
  claimId: integer("claim_id").notNull(),
  authorUserId: integer("author_user_id").notNull(),
  visibility: varchar("visibility", { length: 20 }).notNull().default("internal"), // "internal" or "insurer"
  noteType: varchar("note_type", { length: 50 }).notNull().default("general"), // "general", "chaser", "escalation"
  body: text("body").notNull(),
  followUpDate: timestamp("follow_up_date"),
  autoChaserFlag: boolean("auto_chaser_flag").notNull().default(false),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// TypeScript types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type InsurancePolicy = typeof insurancePolicies.$inferSelect;
export type InsertInsurancePolicy = typeof insurancePolicies.$inferInsert;

export type Claim = typeof claims.$inferSelect;
export type InsertClaim = typeof claims.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

export type ClaimStatusTransition = typeof claimStatusTransitions.$inferSelect;
export type InsertClaimStatusTransition = typeof claimStatusTransitions.$inferInsert;

export type ClaimNote = typeof claimNotes.$inferSelect;
export type InsertClaimNote = typeof claimNotes.$inferInsert;

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
  tenancyAgreements: z.array(z.string()).optional().default([]),
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
).refine(
  (data) => {
    // Require tenant details and tenancy agreement ONLY when property is marked as investment
    if (data.isInvestmentProperty) {
      return data.tenantName && data.tenantPhone && data.tenantEmail && 
             data.tenancyAgreements && data.tenancyAgreements.length >= 1;
    }
    return true;
  },
  {
    message: "Investment properties require tenant contact details and a tenancy agreement",
    path: ["tenantName"],
  }
);

// Step-by-step form schemas for frontend validation
export const step1Schema = z.object({
  claimantName: z.string().min(2, "Name must be at least 2 characters"),
  claimantEmail: z.string().email("Invalid email address"),
  claimantPhone: z.string().min(10, "Phone number must be at least 10 characters"),
});

export const step2Schema = z.object({
  propertyAddress: z.string().min(10, "Please select an address using the search"),
  propertyBlock: z.string().optional(),
  propertyPlaceId: z.string().min(1, "Please select an address using the search"),
  propertyConstructionAge: z.string().optional(),
  propertyConstructionType: z.string().optional(),
});

export const step3Schema = z.object({
  incidentDate: z.date({
    required_error: "Please select the date of the incident",
  }),
  incidentType: z.enum([
    "fire",
    "lightning", 
    "explosion",
    "aircraft",
    "riot",
    "civil_commotion",
    "strikers_locked_out_workers",
    "malicious_persons",
    "theft_or_attempted_theft",
    "earthquake",
    "storm",
    "flood",
    "escape_of_water",
    "escape_of_oil",
    "impact_by_vehicle_or_animal",
    "leakage_of_oil_from_heating"
  ], {
    required_error: "Please select the type of incident",
  }),
  incidentDescription: z.string().min(50, "Description must be at least 50 characters"),
});

export const step4Schema = z.object({
  hasBuildingDamage: z.boolean(),
  buildingDamageDescription: z.string().optional(),
  buildingDamageAffectedAreas: z.string().optional(),
}).refine(
  (data) => {
    if (data.hasBuildingDamage) {
      return data.buildingDamageDescription && data.buildingDamageDescription.length >= 20;
    }
    return true;
  },
  {
    message: "Building damage description is required (minimum 20 characters)",
    path: ["buildingDamageDescription"],
  }
);

export const step5Schema = z.object({
  hasTheft: z.boolean(),
  theftDescription: z.string().optional(),
  theftPoliceReported: z.boolean(),
  theftPoliceReference: z.string().optional(),
}).refine(
  (data) => {
    if (data.hasTheft) {
      return data.theftDescription && data.theftDescription.length >= 20;
    }
    return true;
  },
  {
    message: "Theft description is required (minimum 20 characters)",
    path: ["theftDescription"],
  }
).refine(
  (data) => {
    if (data.hasTheft && data.theftPoliceReported) {
      return data.theftPoliceReference && data.theftPoliceReference.length >= 5;
    }
    return true;
  },
  {
    message: "Police reference number is required for reported theft",
    path: ["theftPoliceReference"],
  }
);

export const step6Schema = z.object({
  isInvestmentProperty: z.boolean(),
  tenantName: z.string().optional(),
  tenantPhone: z.string().optional(),
  tenantEmail: z.string().optional(),
}).refine(
  (data) => {
    if (data.isInvestmentProperty) {
      return data.tenantName && data.tenantName.length >= 2;
    }
    return true;
  },
  {
    message: "Tenant name is required for investment properties",
    path: ["tenantName"],
  }
).refine(
  (data) => {
    if (data.isInvestmentProperty) {
      return data.tenantPhone && data.tenantPhone.length >= 10;
    }
    return true;
  },
  {
    message: "Tenant phone number is required for investment properties",
    path: ["tenantPhone"],
  }
).refine(
  (data) => {
    if (data.isInvestmentProperty) {
      return data.tenantEmail && z.string().email().safeParse(data.tenantEmail).success;
    }
    return true;
  },
  {
    message: "Valid tenant email is required for investment properties",
    path: ["tenantEmail"],
  }
);

export const step7Schema = z.object({
  damagePhotos: z.array(z.string()).optional().default([]),
  repairQuotes: z.array(z.string()).optional().default([]),
  invoices: z.array(z.string()).optional().default([]),
  policeReports: z.array(z.string()).optional().default([]),
  otherDocuments: z.array(z.string()).optional().default([]),
  tenancyAgreements: z.array(z.string()).optional().default([]),
});

export const step8Schema = z.object({
  signatureData: z.string().min(10, "Signature is required"),
  signatureType: z.enum(["drawn", "typed"]),
  declarationAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the declaration" }),
  }),
  fraudWarningAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must acknowledge the fraud warning" }),
  }),
  contentsExclusionAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must acknowledge the contents exclusion" }),
  }),
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
