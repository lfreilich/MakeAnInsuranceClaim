// API routes for insurance claim portal
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import { enhanceIncidentDescription } from "./openai";
import { sendClaimConfirmationEmail } from "./email";
import { insertClaimSchema, type InsertClaim } from "@shared/schema";
import { z } from "zod";

const objectStorageService = new ObjectStorageService();

export async function registerRoutes(app: Express): Promise<Server> {
  // Submit a new insurance claim
  app.post("/api/claims", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = insertClaimSchema.parse(req.body);
      
      // Create claim in database
      const claim = await storage.createClaim({
        ...validatedData,
      } as any);

      // Send confirmation email (non-blocking)
      sendClaimConfirmationEmail(claim).catch((error) => {
        console.error("Failed to send confirmation email:", error);
      });

      res.status(201).json({
        id: claim.id,
        referenceNumber: claim.referenceNumber,
        status: claim.status,
        submittedAt: claim.submittedAt,
      });
    } catch (error: any) {
      console.error("Claim submission error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors,
        });
      } else {
        res.status(500).json({
          error: error.message || "Failed to submit claim",
        });
      }
    }
  });

  // Get a claim by ID
  app.get("/api/claims/:id", async (req: Request, res: Response) => {
    try {
      const claim = await storage.getClaim(parseInt(req.params.id));
      if (!claim) {
        res.status(404).json({ error: "Claim not found" });
        return;
      }
      res.json(claim);
    } catch (error: any) {
      console.error("Get claim error:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve claim" });
    }
  });

  // Get a claim by reference number
  app.get("/api/claims/ref/:referenceNumber", async (req: Request, res: Response) => {
    try {
      const claim = await storage.getClaimByReference(req.params.referenceNumber);
      if (!claim) {
        res.status(404).json({ error: "Claim not found" });
        return;
      }
      res.json(claim);
    } catch (error: any) {
      console.error("Get claim by reference error:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve claim" });
    }
  });

  // Get all claims (admin endpoint)
  app.get("/api/claims", async (req: Request, res: Response) => {
    try {
      const claims = await storage.getAllClaims();
      res.json(claims);
    } catch (error: any) {
      console.error("Get all claims error:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve claims" });
    }
  });

  // Update claim status (admin endpoint)
  app.patch("/api/claims/:id/status", async (req: Request, res: Response) => {
    try {
      const claimId = parseInt(req.params.id);
      const { status } = req.body;

      if (!status || !["pending", "approved", "rejected"].includes(status)) {
        res.status(400).json({ error: "Invalid status value" });
        return;
      }

      const updatedClaim = await storage.updateClaimStatus(claimId, status);
      if (!updatedClaim) {
        res.status(404).json({ error: "Claim not found" });
        return;
      }

      res.json(updatedClaim);
    } catch (error: any) {
      console.error("Update claim status error:", error);
      res.status(500).json({ error: error.message || "Failed to update claim status" });
    }
  });

  // Update insurer submission details (admin endpoint)
  app.patch("/api/claims/:id/insurer-details", async (req: Request, res: Response) => {
    try {
      const claimId = parseInt(req.params.id);
      if (isNaN(claimId)) {
        res.status(400).json({ error: "Invalid claim ID" });
        return;
      }

      const { insurerClaimRef, insurerSubmittedAt, insurerResponseDate, userId } = req.body;

      const updates: any = {};
      if (insurerClaimRef !== undefined) {
        updates.insurerClaimRef = insurerClaimRef.trim() || null;
      }
      
      if (insurerSubmittedAt !== undefined) {
        const trimmed = insurerSubmittedAt.trim();
        if (trimmed) {
          const date = new Date(trimmed);
          if (isNaN(date.getTime())) {
            res.status(400).json({ error: "Invalid submission date" });
            return;
          }
          updates.insurerSubmittedAt = date;
        } else {
          updates.insurerSubmittedAt = null;
        }
      }
      
      if (insurerResponseDate !== undefined) {
        const trimmed = insurerResponseDate.trim();
        if (trimmed) {
          const date = new Date(trimmed);
          if (isNaN(date.getTime())) {
            res.status(400).json({ error: "Invalid response date" });
            return;
          }
          updates.insurerResponseDate = date;
        } else {
          updates.insurerResponseDate = null;
        }
      }

      const updatedClaim = await storage.updateClaim(claimId, updates);
      if (!updatedClaim) {
        res.status(404).json({ error: "Claim not found" });
        return;
      }

      // Create audit log for insurer submission
      if (userId && updates.insurerSubmittedAt) {
        await storage.createAuditLog({
          claimId,
          userId: parseInt(userId),
          action: 'insurer_submitted',
          entityType: 'claim',
          entityId: claimId,
          changes: updates,
        });
      }

      res.json(updatedClaim);
    } catch (error: any) {
      console.error("Update insurer details error:", error);
      res.status(500).json({ error: error.message || "Failed to update insurer details" });
    }
  });

  // Get presigned URL for file upload
  app.post("/api/objects/upload", async (req: Request, res: Response) => {
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error("Upload URL generation error:", error);
      res.status(500).json({
        error: error.message || "Failed to generate upload URL",
      });
    }
  });

  // Serve uploaded objects
  app.get("/objects/*", async (req: Request, res: Response) => {
    try {
      const objectPath = req.path;
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      
      // Public access for claim attachments (no auth required)
      await objectStorageService.downloadObject(objectFile, res, 3600);
    } catch (error: any) {
      console.error("Object download error:", error);
      if (error.name === "ObjectNotFoundError") {
        res.status(404).json({ error: "File not found" });
      } else {
        res.status(500).json({
          error: error.message || "Failed to download file",
        });
      }
    }
  });

  // Google Places API - Address autocomplete and validation
  app.get("/api/address/autocomplete", async (req: Request, res: Response) => {
    try {
      const input = req.query.input as string;
      if (!input || input.length < 3) {
        res.status(400).json({ error: "Input must be at least 3 characters" });
        return;
      }

      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        console.warn("GOOGLE_PLACES_API_KEY not configured, address autocomplete disabled");
        res.status(503).json({ error: "Address autocomplete service not configured" });
        return;
      }

      // Call Google Places Autocomplete API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=address&components=country:gb&key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Address autocomplete error:", error);
      res.status(500).json({
        error: error.message || "Failed to search addresses",
      });
    }
  });

  // Google Places API - Get place details
  app.get("/api/address/details/:placeId", async (req: Request, res: Response) => {
    try {
      const placeId = req.params.placeId;
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;

      if (!apiKey) {
        res.status(503).json({ error: "Google Places API not configured" });
        return;
      }

      // Get place details from Google
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,address_components&key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Place details error:", error);
      res.status(500).json({
        error: error.message || "Failed to get place details",
      });
    }
  });

  // Chimnie API - Get construction details
  app.post("/api/address/construction-details", async (req: Request, res: Response) => {
    try {
      const { address } = req.body;
      if (!address) {
        res.status(400).json({ error: "Address is required" });
        return;
      }

      const apiKey = process.env.CHIMNIE_API_KEY;
      if (!apiKey) {
        console.warn("CHIMNIE_API_KEY not configured, construction details disabled");
        res.status(503).json({ error: "Construction details service not configured" });
        return;
      }

      // Call Chimnie API for construction and age details
      const response = await fetch(
        `https://api.chimnie.com/v1/property/details`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ address }),
        }
      );

      if (!response.ok) {
        throw new Error(`Chimnie API error: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Construction details error:", error);
      res.status(500).json({
        error: error.message || "Failed to get construction details",
      });
    }
  });

  // AI enhancement endpoint
  app.post("/api/ai/enhance-description", async (req: Request, res: Response) => {
    try {
      const { text } = req.body;

      if (!text || typeof text !== "string") {
        res.status(400).json({ error: "Text is required" });
        return;
      }

      if (text.trim().length < 10) {
        res.status(400).json({ error: "Text is too short to enhance" });
        return;
      }

      const enhancedText = await enhanceIncidentDescription(text);

      res.json({ enhancedText });
    } catch (error: any) {
      console.error("AI enhancement error:", error);
      res.status(500).json({
        error: error.message || "Failed to enhance description",
      });
    }
  });

  // ========== CLAIM NOTES ENDPOINTS ==========
  
  // Get all notes for a claim
  app.get("/api/claims/:claimId/notes", async (req: Request, res: Response) => {
    try {
      const claimId = parseInt(req.params.claimId);
      const notes = await storage.getClaimNotes(claimId);
      res.json(notes);
    } catch (error: any) {
      console.error("Get notes error:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve notes" });
    }
  });

  // Create a new note for a claim
  app.post("/api/claims/:claimId/notes", async (req: Request, res: Response) => {
    try {
      const claimId = parseInt(req.params.claimId);
      const { authorUserId, body, visibility, noteType, followUpDate, autoChaserFlag } = req.body;

      if (!authorUserId || !body) {
        res.status(400).json({ error: "authorUserId and body are required" });
        return;
      }

      const note = await storage.createNote({
        claimId,
        authorUserId,
        body,
        visibility: visibility || "internal",
        noteType: noteType || "general",
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        autoChaserFlag: autoChaserFlag || false,
        completed: false,
      });

      res.status(201).json(note);
    } catch (error: any) {
      console.error("Create note error:", error);
      res.status(500).json({ error: error.message || "Failed to create note" });
    }
  });

  // Update a note
  app.patch("/api/notes/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      const updatedNote = await storage.updateNote(id, updates);
      if (!updatedNote) {
        res.status(404).json({ error: "Note not found" });
        return;
      }

      res.json(updatedNote);
    } catch (error: any) {
      console.error("Update note error:", error);
      res.status(500).json({ error: error.message || "Failed to update note" });
    }
  });

  // Delete a note
  app.delete("/api/notes/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteNote(id);
      
      if (!success) {
        res.status(404).json({ error: "Note not found" });
        return;
      }

      res.status(204).send();
    } catch (error: any) {
      console.error("Delete note error:", error);
      res.status(500).json({ error: error.message || "Failed to delete note" });
    }
  });

  // ========== INSURANCE POLICIES ENDPOINTS ==========

  // Get all policies
  app.get("/api/policies", async (req: Request, res: Response) => {
    try {
      const policies = await storage.getAllPolicies();
      res.json(policies);
    } catch (error: any) {
      console.error("Get policies error:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve policies" });
    }
  });

  // Get a single policy
  app.get("/api/policies/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const policy = await storage.getPolicy(id);
      
      if (!policy) {
        res.status(404).json({ error: "Policy not found" });
        return;
      }

      res.json(policy);
    } catch (error: any) {
      console.error("Get policy error:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve policy" });
    }
  });

  // Create a new policy
  app.post("/api/policies", async (req: Request, res: Response) => {
    try {
      const { policyNumber, policyName, insurerName, coverageType, excessAmount, policyStartDate, policyEndDate, buildingAddress, notes } = req.body;

      if (!policyNumber || !policyName || !insurerName || !coverageType) {
        res.status(400).json({ error: "policyNumber, policyName, insurerName, and coverageType are required" });
        return;
      }

      const policy = await storage.createPolicy({
        policyNumber,
        policyName,
        insurerName,
        coverageType,
        excessAmount,
        policyStartDate: policyStartDate ? new Date(policyStartDate) : undefined,
        policyEndDate: policyEndDate ? new Date(policyEndDate) : undefined,
        buildingAddress,
        notes,
        active: true,
      });

      res.status(201).json(policy);
    } catch (error: any) {
      console.error("Create policy error:", error);
      res.status(500).json({ error: error.message || "Failed to create policy" });
    }
  });

  // Update a policy
  app.patch("/api/policies/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      // Convert date strings to Date objects if present
      if (updates.policyStartDate) {
        updates.policyStartDate = new Date(updates.policyStartDate);
      }
      if (updates.policyEndDate) {
        updates.policyEndDate = new Date(updates.policyEndDate);
      }

      const updatedPolicy = await storage.updatePolicy(id, updates);
      if (!updatedPolicy) {
        res.status(404).json({ error: "Policy not found" });
        return;
      }

      res.json(updatedPolicy);
    } catch (error: any) {
      console.error("Update policy error:", error);
      res.status(500).json({ error: error.message || "Failed to update policy" });
    }
  });

  // ========== AUDIT LOG ENDPOINTS ==========

  // Get audit logs for a claim
  app.get("/api/claims/:claimId/audit-logs", async (req: Request, res: Response) => {
    try {
      const claimId = parseInt(req.params.claimId);
      const logs = await storage.getClaimAuditLogs(claimId);
      res.json(logs);
    } catch (error: any) {
      console.error("Get audit logs error:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve audit logs" });
    }
  });

  // Get status transitions for a claim
  app.get("/api/claims/:claimId/status-transitions", async (req: Request, res: Response) => {
    try {
      const claimId = parseInt(req.params.claimId);
      const transitions = await storage.getClaimStatusTransitions(claimId);
      res.json(transitions);
    } catch (error: any) {
      console.error("Get status transitions error:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve status transitions" });
    }
  });

  // ========== USER MANAGEMENT ENDPOINTS ==========

  // Get all users
  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      console.error("Get users error:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve users" });
    }
  });

  // Get a single user
  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json(user);
    } catch (error: any) {
      console.error("Get user error:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve user" });
    }
  });

  // Create a new user
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const { name, email, role } = req.body;

      if (!name || !email) {
        res.status(400).json({ error: "name and email are required" });
        return;
      }

      const user = await storage.createUser({
        name,
        email,
        role: role || "admin",
        active: true,
      });

      res.status(201).json(user);
    } catch (error: any) {
      console.error("Create user error:", error);
      res.status(500).json({ error: error.message || "Failed to create user" });
    }
  });

  // Update claim assignment (assign handler)
  app.patch("/api/claims/:id/assign", async (req: Request, res: Response) => {
    try {
      const claimId = parseInt(req.params.id);
      const { handlerUserId, policyId } = req.body;

      const updates: any = {};
      if (handlerUserId !== undefined) updates.handlerUserId = handlerUserId;
      if (policyId !== undefined) updates.policyId = policyId;

      const updatedClaim = await storage.updateClaim(claimId, updates);
      if (!updatedClaim) {
        res.status(404).json({ error: "Claim not found" });
        return;
      }

      // Log the assignment
      if (handlerUserId) {
        await storage.createAuditLog({
          claimId,
          userId: handlerUserId,
          action: 'claim_assigned',
          entityType: 'claim',
          entityId: claimId,
          changes: { handlerUserId },
        });
      }

      res.json(updatedClaim);
    } catch (error: any) {
      console.error("Assign claim error:", error);
      res.status(500).json({ error: error.message || "Failed to assign claim" });
    }
  });

  // ========== LOSS ASSESSOR ENDPOINTS ==========

  // Get all loss assessors
  app.get("/api/loss-assessors", async (req: Request, res: Response) => {
    try {
      const assessors = await storage.getAllLossAssessors();
      res.json(assessors);
    } catch (error: any) {
      console.error("Get loss assessors error:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve loss assessors" });
    }
  });

  // Get a single loss assessor
  app.get("/api/loss-assessors/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: "Invalid assessor ID" });
        return;
      }

      const assessor = await storage.getLossAssessor(id);
      
      if (!assessor) {
        res.status(404).json({ error: "Loss assessor not found" });
        return;
      }

      res.json(assessor);
    } catch (error: any) {
      console.error("Get loss assessor error:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve loss assessor" });
    }
  });

  // Create a new loss assessor
  app.post("/api/loss-assessors", async (req: Request, res: Response) => {
    try {
      const { companyName, contactName, email, phone, specializations, address, notes } = req.body;

      if (!companyName || !contactName || !email || !phone) {
        res.status(400).json({ error: "companyName, contactName, email, and phone are required" });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: "Invalid email format" });
        return;
      }

      const assessor = await storage.createLossAssessor({
        companyName,
        contactName,
        email,
        phone,
        specializations: Array.isArray(specializations) ? specializations : [],
        address: address || null,
        notes: notes || null,
        active: true,
      });

      res.status(201).json(assessor);
    } catch (error: any) {
      console.error("Create loss assessor error:", error);
      res.status(500).json({ error: error.message || "Failed to create loss assessor" });
    }
  });

  // Update a loss assessor
  app.patch("/api/loss-assessors/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: "Invalid assessor ID" });
        return;
      }

      const updates = req.body;

      // Validate email if provided
      if (updates.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updates.email)) {
          res.status(400).json({ error: "Invalid email format" });
          return;
        }
      }

      // Ensure specializations is an array if provided
      if (updates.specializations && !Array.isArray(updates.specializations)) {
        res.status(400).json({ error: "Specializations must be an array" });
        return;
      }

      const updatedAssessor = await storage.updateLossAssessor(id, updates);
      if (!updatedAssessor) {
        res.status(404).json({ error: "Loss assessor not found" });
        return;
      }

      res.json(updatedAssessor);
    } catch (error: any) {
      console.error("Update loss assessor error:", error);
      res.status(500).json({ error: error.message || "Failed to update loss assessor" });
    }
  });

  // Delete a loss assessor
  app.delete("/api/loss-assessors/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: "Invalid assessor ID" });
        return;
      }

      const success = await storage.deleteLossAssessor(id);
      
      if (!success) {
        res.status(404).json({ error: "Loss assessor not found" });
        return;
      }

      res.status(204).send();
    } catch (error: any) {
      console.error("Delete loss assessor error:", error);
      res.status(500).json({ error: error.message || "Failed to delete loss assessor" });
    }
  });

  // Assign loss assessor to claim
  app.patch("/api/claims/:id/assign-assessor", async (req: Request, res: Response) => {
    try {
      const claimId = parseInt(req.params.id);
      if (isNaN(claimId)) {
        res.status(400).json({ error: "Invalid claim ID" });
        return;
      }

      // Verify claim exists
      const claim = await storage.getClaim(claimId);
      if (!claim) {
        res.status(404).json({ error: "Claim not found" });
        return;
      }

      const { assessorId, userId } = req.body;

      // Parse and validate assessorId
      let validatedAssessorId: number | null = null;
      if (assessorId !== null && assessorId !== undefined) {
        const parsed = parseInt(assessorId);
        if (isNaN(parsed)) {
          res.status(400).json({ error: "Invalid assessor ID" });
          return;
        }
        
        // Verify assessor exists
        const assessor = await storage.getLossAssessor(parsed);
        if (!assessor) {
          res.status(404).json({ error: "Loss assessor not found" });
          return;
        }
        validatedAssessorId = parsed;
      }

      // Parse userId if provided
      const validatedUserId = userId ? parseInt(userId) : undefined;
      if (userId && isNaN(validatedUserId!)) {
        res.status(400).json({ error: "Invalid user ID" });
        return;
      }

      const updatedClaim = await storage.assignLossAssessorToClaim(
        claimId,
        validatedAssessorId,
        validatedUserId
      );

      // This should not fail since we already verified claim exists
      if (!updatedClaim) {
        res.status(500).json({ error: "Failed to update claim" });
        return;
      }

      res.json(updatedClaim);
    } catch (error: any) {
      console.error("Assign loss assessor error:", error);
      res.status(500).json({ error: error.message || "Failed to assign loss assessor" });
    }
  });

  // ========================================
  // Payment Endpoints (Phase 3)
  // ========================================

  // Create a new payment record
  app.post("/api/claims/:id/payments", async (req: Request, res: Response) => {
    try {
      const claimId = parseInt(req.params.id);
      if (isNaN(claimId)) {
        res.status(400).json({ error: "Invalid claim ID" });
        return;
      }

      // Verify claim exists
      const claim = await storage.getClaim(claimId);
      if (!claim) {
        res.status(404).json({ error: "Claim not found" });
        return;
      }

      const { 
        paymentType, 
        amount, 
        currency = "GBP",
        description,
        recipientName,
        recipientEmail,
        userId
      } = req.body;

      // Validate required fields
      if (!paymentType || !amount) {
        res.status(400).json({ error: "Payment type and amount are required" });
        return;
      }

      if (!["settlement", "excess", "refund"].includes(paymentType)) {
        res.status(400).json({ error: "Invalid payment type" });
        return;
      }

      if (typeof amount !== "number" || amount <= 0) {
        res.status(400).json({ error: "Amount must be a positive number in pence" });
        return;
      }

      const payment = await storage.createPayment({
        claimId,
        paymentType,
        amount,
        currency,
        description,
        recipientName,
        recipientEmail,
        status: "pending",
        createdBy: userId ? parseInt(userId) : null,
      }, userId ? parseInt(userId) : undefined);

      res.status(201).json(payment);
    } catch (error: any) {
      console.error("Create payment error:", error);
      res.status(500).json({ error: error.message || "Failed to create payment" });
    }
  });

  // Get all payments for a claim
  app.get("/api/claims/:id/payments", async (req: Request, res: Response) => {
    try {
      const claimId = parseInt(req.params.id);
      if (isNaN(claimId)) {
        res.status(400).json({ error: "Invalid claim ID" });
        return;
      }

      const payments = await storage.getClaimPayments(claimId);
      res.json(payments);
    } catch (error: any) {
      console.error("Get claim payments error:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve payments" });
    }
  });

  // Update payment status
  app.patch("/api/payments/:id/status", async (req: Request, res: Response) => {
    try {
      const paymentId = parseInt(req.params.id);
      if (isNaN(paymentId)) {
        res.status(400).json({ error: "Invalid payment ID" });
        return;
      }

      const { status, transactionReference, paymentMethod, blinkPaymentId } = req.body;

      if (!status) {
        res.status(400).json({ error: "Status is required" });
        return;
      }

      if (!["pending", "completed", "failed", "cancelled"].includes(status)) {
        res.status(400).json({ error: "Invalid status value" });
        return;
      }

      const paidAt = status === "completed" ? new Date() : undefined;
      
      // Build update object
      const updates: any = {
        status,
        updatedAt: new Date(),
      };
      
      if (paidAt) updates.paidAt = paidAt;
      if (transactionReference) updates.transactionReference = transactionReference;
      if (paymentMethod) updates.paymentMethod = paymentMethod;
      if (blinkPaymentId) updates.blinkPaymentId = blinkPaymentId;

      const updatedPayment = await storage.updatePayment(paymentId, updates);
      
      if (!updatedPayment) {
        res.status(404).json({ error: "Payment not found" });
        return;
      }

      res.json(updatedPayment);
    } catch (error: any) {
      console.error("Update payment status error:", error);
      res.status(500).json({ error: error.message || "Failed to update payment status" });
    }
  });

  // ========================================
  // Claim Closure Endpoint (Phase 4)
  // ========================================

  // Close a claim
  app.post("/api/claims/:id/close", async (req: Request, res: Response) => {
    try {
      const claimId = parseInt(req.params.id);
      if (isNaN(claimId)) {
        res.status(400).json({ error: "Invalid claim ID" });
        return;
      }

      // Verify claim exists and is not already closed
      const claim = await storage.getClaim(claimId);
      if (!claim) {
        res.status(404).json({ error: "Claim not found" });
        return;
      }

      if (claim.closedAt) {
        res.status(400).json({ error: "Claim is already closed" });
        return;
      }

      const { closeReason, userId, finalNotes } = req.body;

      if (!closeReason || typeof closeReason !== "string" || closeReason.length < 10) {
        res.status(400).json({ 
          error: "Close reason is required and must be at least 10 characters" 
        });
        return;
      }

      const closedClaim = await storage.closeClaim(
        claimId,
        closeReason,
        userId ? parseInt(userId) : undefined,
        finalNotes
      );

      if (!closedClaim) {
        res.status(500).json({ error: "Failed to close claim" });
        return;
      }

      res.json(closedClaim);
    } catch (error: any) {
      console.error("Close claim error:", error);
      res.status(500).json({ error: error.message || "Failed to close claim" });
    }
  });

  // Return the HTTP server
  return createServer(app);
}
