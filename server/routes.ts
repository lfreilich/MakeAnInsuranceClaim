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
      const claim = await storage.getClaim(req.params.id);
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

  // Chimnie API - Address autocomplete
  app.get("/api/address/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 3) {
        res.status(400).json({ error: "Query must be at least 3 characters" });
        return;
      }

      const apiKey = process.env.CHIMNIE_API_KEY;
      if (!apiKey) {
        console.warn("CHIMNIE_API_KEY not configured, address autocomplete disabled");
        res.status(503).json({ error: "Address autocomplete service not configured" });
        return;
      }

      // Call Chimnie API for address autocomplete
      const response = await fetch(
        `https://api.chimnie.com/v1/address/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Chimnie API error: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Address search error:", error);
      res.status(500).json({
        error: error.message || "Failed to search addresses",
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

  // Return the HTTP server
  return createServer(app);
}
