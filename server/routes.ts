import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSubdomainSchema, type Subdomain } from "@shared/schema";
import { ZodError } from "zod";

const BLOCKED_SUBDOMAINS = [
  "admin", "api", "cdn", "ns1", "ns2", "mail", "ftp", 
  "cpanel", "webmail", "webdisk", "server", "localhost"
];

const MAX_SUBDOMAINS_PER_IP = 5;

// Cloudflare API integration
async function createCloudflareRecord(name: string, type: string, target: string): Promise<string | null> {
  const cfToken = process.env.CF_API_TOKEN;
  const cfZoneId = process.env.CF_ZONE_ID;
  
  if (!cfToken || !cfZoneId) {
    console.error("Cloudflare credentials not configured");
    return null;
  }

  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${cfZoneId}/dns_records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        name,
        content: target,
        proxied: false, // Always set to false as required
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      return data.result.id;
    } else {
      console.error('Cloudflare API error:', data.errors);
      return null;
    }
  } catch (error) {
    console.error('Cloudflare API request failed:', error);
    return null;
  }
}

async function deleteCloudflareRecord(recordId: string): Promise<boolean> {
  const cfToken = process.env.CF_API_TOKEN;
  const cfZoneId = process.env.CF_ZONE_ID;
  
  if (!cfToken || !cfZoneId || !recordId) {
    return false;
  }

  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${cfZoneId}/dns_records/${recordId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${cfToken}`,
      },
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Cloudflare delete API request failed:', error);
    return false;
  }
}

function getUserIP(req: any): string {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         '127.0.0.1';
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all subdomains for current user IP
  app.get("/api/subdomains", async (req, res) => {
    try {
      const userIp = getUserIP(req);
      const userSubdomains = await storage.getSubdomainsByUserIp(userIp);
      
      res.json({
        success: true,
        data: userSubdomains,
        count: userSubdomains.length,
      });
    } catch (error) {
      console.error("Error fetching subdomains:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mengambil data subdomain",
        error: "INTERNAL_ERROR",
      });
    }
  });

  // Check subdomain availability
  app.post("/api/check-availability", async (req, res) => {
    try {
      const { name } = req.body;
      
      if (!name || typeof name !== 'string') {
        return res.status(400).json({
          success: false,
          message: "Nama subdomain harus diisi",
          error: "INVALID_INPUT",
        });
      }

      const normalizedName = name.toLowerCase().trim();
      
      // Check if blocked
      if (BLOCKED_SUBDOMAINS.includes(normalizedName)) {
        return res.json({
          success: true,
          available: false,
          reason: "BLOCKED_SUBDOMAIN",
          message: "Nama subdomain ini dilarang",
        });
      }

      // Check if exists
      const existing = await storage.getSubdomainByName(normalizedName);
      
      res.json({
        success: true,
        available: !existing,
        reason: existing ? "ALREADY_EXISTS" : null,
        message: existing ? "Subdomain sudah ada" : "Subdomain tersedia",
      });
    } catch (error) {
      console.error("Error checking availability:", error);
      res.status(500).json({
        success: false,
        message: "Gagal memeriksa ketersediaan subdomain",
        error: "INTERNAL_ERROR",
      });
    }
  });

  // Create subdomain
  app.post("/api/create", async (req, res) => {
    try {
      const userIp = getUserIP(req);
      
      // Check rate limit
      const currentCount = await storage.countSubdomainsByUserIp(userIp);
      if (currentCount >= MAX_SUBDOMAINS_PER_IP) {
        return res.status(429).json({
          success: false,
          message: `Batas maksimal ${MAX_SUBDOMAINS_PER_IP} subdomain per sesi telah tercapai`,
          error: "RATE_LIMIT_EXCEEDED",
        });
      }

      // Validate request body
      const validatedData = insertSubdomainSchema.parse(req.body);
      const { name, type, target } = validatedData;
      
      const normalizedName = name.toLowerCase().trim();
      
      // Check if blocked
      if (BLOCKED_SUBDOMAINS.includes(normalizedName)) {
        return res.status(403).json({
          success: false,
          message: "Nama subdomain ini dilarang",
          error: "FORBIDDEN_SUBDOMAIN",
        });
      }

      // Check if already exists
      const existing = await storage.getSubdomainByName(normalizedName);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Subdomain sudah ada",
          error: "SUBDOMAIN_EXISTS",
        });
      }

      // Create full domain name
      const domain = process.env.CF_DOMAIN;
      if (!domain) {
        return res.status(500).json({
          success: false,
          message: "Konfigurasi domain tidak ditemukan",
          error: "MISSING_DOMAIN_CONFIG",
        });
      }

      const fullDomain = `${normalizedName}.${domain}`;

      // Create Cloudflare record
      const cfRecordId = await createCloudflareRecord(fullDomain, type, target);
      
      // Create subdomain in database
      const subdomain = await storage.createSubdomain({
        name: normalizedName,
        type,
        target,
        userIp,
      });

      // Update with Cloudflare record ID if successful
      if (cfRecordId) {
        await storage.updateSubdomain(subdomain.id, { cfRecordId });
      }

      res.status(201).json({
        success: true,
        message: "Subdomain berhasil dibuat",
        data: {
          id: subdomain.id,
          name: fullDomain,
          type: subdomain.type,
          target: subdomain.target,
          status: cfRecordId ? "active" : "pending",
          created: subdomain.createdAt.toISOString(),
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: error.errors[0]?.message || "Data tidak valid",
          error: "VALIDATION_ERROR",
          details: error.errors,
        });
      }

      console.error("Error creating subdomain:", error);
      res.status(500).json({
        success: false,
        message: "Gagal membuat subdomain",
        error: "INTERNAL_ERROR",
      });
    }
  });

  // Update subdomain
  app.put("/api/subdomains/:id", async (req, res) => {
    try {
      const subdomainId = parseInt(req.params.id);
      const userIp = getUserIP(req);
      
      if (isNaN(subdomainId)) {
        return res.status(400).json({
          success: false,
          message: "ID subdomain tidak valid",
          error: "INVALID_ID",
        });
      }

      // Get existing subdomain
      const userSubdomains = await storage.getSubdomainsByUserIp(userIp);
      const existing = userSubdomains.find(s => s.id === subdomainId);
      
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Subdomain tidak ditemukan",
          error: "SUBDOMAIN_NOT_FOUND",
        });
      }

      // Validate updates
      const { target } = req.body;
      if (!target) {
        return res.status(400).json({
          success: false,
          message: "Target harus diisi",
          error: "MISSING_TARGET",
        });
      }

      // Update Cloudflare record if available
      if (existing.cfRecordId) {
        // For simplicity, we'll delete and recreate the record
        await deleteCloudflareRecord(existing.cfRecordId);
        
        const domain = process.env.CF_DOMAIN;
        const fullDomain = `${existing.name}.${domain}`;
        const newCfRecordId = await createCloudflareRecord(fullDomain, existing.type, target);
        
        await storage.updateSubdomain(subdomainId, { 
          target, 
          cfRecordId: newCfRecordId 
        });
      } else {
        await storage.updateSubdomain(subdomainId, { target });
      }

      const updated = await storage.updateSubdomain(subdomainId, { target });
      
      res.json({
        success: true,
        message: "Subdomain berhasil diperbarui",
        data: updated,
      });
    } catch (error) {
      console.error("Error updating subdomain:", error);
      res.status(500).json({
        success: false,
        message: "Gagal memperbarui subdomain",
        error: "INTERNAL_ERROR",
      });
    }
  });

  // Delete subdomain
  app.delete("/api/subdomains/:id", async (req, res) => {
    try {
      const subdomainId = parseInt(req.params.id);
      const userIp = getUserIP(req);
      
      if (isNaN(subdomainId)) {
        return res.status(400).json({
          success: false,
          message: "ID subdomain tidak valid",
          error: "INVALID_ID",
        });
      }

      // Get existing subdomain
      const userSubdomains = await storage.getSubdomainsByUserIp(userIp);
      const existing = userSubdomains.find(s => s.id === subdomainId);
      
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Subdomain tidak ditemukan",
          error: "SUBDOMAIN_NOT_FOUND",
        });
      }

      // Delete from Cloudflare if record exists
      if (existing.cfRecordId) {
        await deleteCloudflareRecord(existing.cfRecordId);
      }

      // Delete from database
      const deleted = await storage.deleteSubdomain(subdomainId);
      
      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: "Gagal menghapus subdomain",
          error: "DELETE_FAILED",
        });
      }

      res.json({
        success: true,
        message: "Subdomain berhasil dihapus",
      });
    } catch (error) {
      console.error("Error deleting subdomain:", error);
      res.status(500).json({
        success: false,
        message: "Gagal menghapus subdomain",
        error: "INTERNAL_ERROR",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
