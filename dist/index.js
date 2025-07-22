// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";

// shared/schema.ts
import { pgTable, text, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var subdomains = pgTable("subdomains", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 63 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(),
  target: text("target").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  cfRecordId: text("cf_record_id"),
  userIp: text("user_ip").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var insertSubdomainSchema = createInsertSchema(subdomains).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userIp: true,
  cfRecordId: true,
  status: true
}).extend({
  name: z.string().min(1, "Nama subdomain harus diisi").max(63, "Nama subdomain maksimal 63 karakter").regex(/^[a-zA-Z0-9-]+$/, "Hanya huruf, angka, dan strip (-) yang diperbolehkan").refine((name) => !name.startsWith("-") && !name.endsWith("-"), "Nama subdomain tidak boleh dimulai atau diakhiri dengan strip"),
  type: z.enum(["A", "CNAME", "AAAA"], { required_error: "Tipe record harus dipilih" }),
  target: z.string().min(1, "Target harus diisi")
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});

// server/storage.ts
var db = null;
if (process.env.DATABASE_URL) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    db = drizzle(sql);
    console.log("\u2705 Connected to PostgreSQL database");
    (async () => {
      try {
        await db.execute(`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
          );
        `);
        await db.execute(`
          CREATE TABLE IF NOT EXISTS subdomains (
            id SERIAL PRIMARY KEY,
            name VARCHAR(63) NOT NULL,
            type VARCHAR(10) NOT NULL,
            target TEXT NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            cf_record_id TEXT,
            user_ip TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          );
        `);
        console.log("\u2705 Database tables verified/created");
      } catch (tableError) {
        console.error("\u274C Failed to create database tables:", tableError);
        console.log("\u{1F504} Falling back to in-memory storage");
        db = null;
      }
    })();
  } catch (error) {
    console.error("\u274C Failed to connect to database:", error);
    console.log("\u{1F504} Falling back to in-memory storage");
  }
}
var MemStorage = class {
  users;
  subdomains;
  currentUserId;
  currentSubdomainId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.subdomains = /* @__PURE__ */ new Map();
    this.currentUserId = 1;
    this.currentSubdomainId = 1;
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  async getSubdomainsByUserIp(userIp) {
    return Array.from(this.subdomains.values()).filter(
      (subdomain) => subdomain.userIp === userIp
    );
  }
  async getSubdomainByName(name) {
    return Array.from(this.subdomains.values()).find(
      (subdomain) => subdomain.name === name
    );
  }
  async createSubdomain(subdomainData) {
    const id = this.currentSubdomainId++;
    const now = /* @__PURE__ */ new Date();
    const subdomain = {
      ...subdomainData,
      id,
      status: "active",
      cfRecordId: null,
      createdAt: now,
      updatedAt: now
    };
    this.subdomains.set(id, subdomain);
    return subdomain;
  }
  async updateSubdomain(id, updates) {
    const existing = this.subdomains.get(id);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.subdomains.set(id, updated);
    return updated;
  }
  async deleteSubdomain(id) {
    return this.subdomains.delete(id);
  }
  async countSubdomainsByUserIp(userIp) {
    return Array.from(this.subdomains.values()).filter(
      (subdomain) => subdomain.userIp === userIp
    ).length;
  }
};
console.log("\u{1F5C4}\uFE0F  Using in-memory storage (data will not persist between restarts)");
console.log("\u{1F4A1} To enable persistent storage, configure a valid Supabase DATABASE_URL");
var storage = new MemStorage();

// server/routes.ts
import { ZodError } from "zod";
var BLOCKED_SUBDOMAINS = [
  "admin",
  "api",
  "cdn",
  "ns1",
  "ns2",
  "mail",
  "ftp",
  "cpanel",
  "webmail",
  "webdisk",
  "server",
  "localhost"
];
var MAX_SUBDOMAINS_PER_IP = 5;
async function createCloudflareRecord(name, type, target) {
  const cfToken = process.env.CF_API_TOKEN;
  const cfZoneId = process.env.CF_ZONE_ID;
  if (!cfToken || !cfZoneId) {
    console.error("Cloudflare credentials not configured");
    return null;
  }
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${cfZoneId}/dns_records`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${cfToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type,
        name,
        content: target,
        proxied: false
        // Always set to false as required
      })
    });
    const data = await response.json();
    if (data.success) {
      return data.result.id;
    } else {
      console.error("Cloudflare API error:", data.errors);
      return null;
    }
  } catch (error) {
    console.error("Cloudflare API request failed:", error);
    return null;
  }
}
async function deleteCloudflareRecord(recordId) {
  const cfToken = process.env.CF_API_TOKEN;
  const cfZoneId = process.env.CF_ZONE_ID;
  if (!cfToken || !cfZoneId || !recordId) {
    return false;
  }
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${cfZoneId}/dns_records/${recordId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${cfToken}`
      }
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Cloudflare delete API request failed:", error);
    return false;
  }
}
function getUserIP(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.headers["x-real-ip"] || req.connection?.remoteAddress || req.socket?.remoteAddress || "127.0.0.1";
}
async function registerRoutes(app2) {
  app2.get("/api/subdomains", async (req, res) => {
    try {
      const userIp = getUserIP(req);
      const userSubdomains = await storage.getSubdomainsByUserIp(userIp);
      res.json({
        success: true,
        data: userSubdomains,
        count: userSubdomains.length
      });
    } catch (error) {
      console.error("Error fetching subdomains:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mengambil data subdomain",
        error: "INTERNAL_ERROR"
      });
    }
  });
  app2.post("/api/check-availability", async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== "string") {
        return res.status(400).json({
          success: false,
          message: "Nama subdomain harus diisi",
          error: "INVALID_INPUT"
        });
      }
      const normalizedName = name.toLowerCase().trim();
      if (BLOCKED_SUBDOMAINS.includes(normalizedName)) {
        return res.json({
          success: true,
          available: false,
          reason: "BLOCKED_SUBDOMAIN",
          message: "Nama subdomain ini dilarang"
        });
      }
      const existing = await storage.getSubdomainByName(normalizedName);
      res.json({
        success: true,
        available: !existing,
        reason: existing ? "ALREADY_EXISTS" : null,
        message: existing ? "Subdomain sudah ada" : "Subdomain tersedia"
      });
    } catch (error) {
      console.error("Error checking availability:", error);
      res.status(500).json({
        success: false,
        message: "Gagal memeriksa ketersediaan subdomain",
        error: "INTERNAL_ERROR"
      });
    }
  });
  app2.post("/api/create", async (req, res) => {
    try {
      const userIp = getUserIP(req);
      const currentCount = await storage.countSubdomainsByUserIp(userIp);
      if (currentCount >= MAX_SUBDOMAINS_PER_IP) {
        return res.status(429).json({
          success: false,
          message: `Batas maksimal ${MAX_SUBDOMAINS_PER_IP} subdomain per sesi telah tercapai`,
          error: "RATE_LIMIT_EXCEEDED"
        });
      }
      const validatedData = insertSubdomainSchema.parse(req.body);
      const { name, type, target } = validatedData;
      const normalizedName = name.toLowerCase().trim();
      if (BLOCKED_SUBDOMAINS.includes(normalizedName)) {
        return res.status(403).json({
          success: false,
          message: "Nama subdomain ini dilarang",
          error: "FORBIDDEN_SUBDOMAIN"
        });
      }
      const existing = await storage.getSubdomainByName(normalizedName);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Subdomain sudah ada",
          error: "SUBDOMAIN_EXISTS"
        });
      }
      const domain = process.env.CF_DOMAIN;
      if (!domain) {
        return res.status(500).json({
          success: false,
          message: "Konfigurasi domain tidak ditemukan",
          error: "MISSING_DOMAIN_CONFIG"
        });
      }
      const fullDomain = `${normalizedName}.${domain}`;
      const cfRecordId = await createCloudflareRecord(fullDomain, type, target);
      const subdomain = await storage.createSubdomain({
        name: normalizedName,
        type,
        target,
        userIp
      });
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
          created: subdomain.createdAt.toISOString()
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: error.errors[0]?.message || "Data tidak valid",
          error: "VALIDATION_ERROR",
          details: error.errors
        });
      }
      console.error("Error creating subdomain:", error);
      res.status(500).json({
        success: false,
        message: "Gagal membuat subdomain",
        error: "INTERNAL_ERROR"
      });
    }
  });
  app2.put("/api/subdomains/:id", async (req, res) => {
    try {
      const subdomainId = parseInt(req.params.id);
      const userIp = getUserIP(req);
      if (isNaN(subdomainId)) {
        return res.status(400).json({
          success: false,
          message: "ID subdomain tidak valid",
          error: "INVALID_ID"
        });
      }
      const userSubdomains = await storage.getSubdomainsByUserIp(userIp);
      const existing = userSubdomains.find((s) => s.id === subdomainId);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Subdomain tidak ditemukan",
          error: "SUBDOMAIN_NOT_FOUND"
        });
      }
      const { target } = req.body;
      if (!target) {
        return res.status(400).json({
          success: false,
          message: "Target harus diisi",
          error: "MISSING_TARGET"
        });
      }
      if (existing.cfRecordId) {
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
        data: updated
      });
    } catch (error) {
      console.error("Error updating subdomain:", error);
      res.status(500).json({
        success: false,
        message: "Gagal memperbarui subdomain",
        error: "INTERNAL_ERROR"
      });
    }
  });
  app2.delete("/api/subdomains/:id", async (req, res) => {
    try {
      const subdomainId = parseInt(req.params.id);
      const userIp = getUserIP(req);
      if (isNaN(subdomainId)) {
        return res.status(400).json({
          success: false,
          message: "ID subdomain tidak valid",
          error: "INVALID_ID"
        });
      }
      const userSubdomains = await storage.getSubdomainsByUserIp(userIp);
      const existing = userSubdomains.find((s) => s.id === subdomainId);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Subdomain tidak ditemukan",
          error: "SUBDOMAIN_NOT_FOUND"
        });
      }
      if (existing.cfRecordId) {
        await deleteCloudflareRecord(existing.cfRecordId);
      }
      const deleted = await storage.deleteSubdomain(subdomainId);
      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: "Gagal menghapus subdomain",
          error: "DELETE_FAILED"
        });
      }
      res.json({
        success: true,
        message: "Subdomain berhasil dihapus"
      });
    } catch (error) {
      console.error("Error deleting subdomain:", error);
      res.status(500).json({
        success: false,
        message: "Gagal menghapus subdomain",
        error: "INTERNAL_ERROR"
      });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  console.log("\u{1F527} Initializing Domku server...");
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
