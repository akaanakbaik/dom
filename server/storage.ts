import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { subdomains, users, type User, type InsertUser, type Subdomain, type InsertSubdomain } from "@shared/schema";

let db: any = null;

// Initialize database connection only if DATABASE_URL is available
if (process.env.DATABASE_URL) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    db = drizzle(sql);
    console.log("✅ Connected to PostgreSQL database");
    
    // Create tables if they don't exist
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
        
        console.log("✅ Database tables verified/created");
      } catch (tableError) {
        console.error("❌ Failed to create database tables:", tableError);
        console.log("🔄 Falling back to in-memory storage");
        db = null;
      }
    })();
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
    console.log("🔄 Falling back to in-memory storage");
  }
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Subdomain methods
  getSubdomainsByUserIp(userIp: string): Promise<Subdomain[]>;
  getSubdomainByName(name: string): Promise<Subdomain | undefined>;
  createSubdomain(subdomain: InsertSubdomain & { userIp: string }): Promise<Subdomain>;
  updateSubdomain(id: number, updates: Partial<Subdomain>): Promise<Subdomain | undefined>;
  deleteSubdomain(id: number): Promise<boolean>;
  countSubdomainsByUserIp(userIp: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getSubdomainsByUserIp(userIp: string): Promise<Subdomain[]> {
    return await db.select().from(subdomains).where(eq(subdomains.userIp, userIp));
  }

  async getSubdomainByName(name: string): Promise<Subdomain | undefined> {
    const result = await db.select().from(subdomains).where(eq(subdomains.name, name)).limit(1);
    return result[0];
  }

  async createSubdomain(subdomainData: InsertSubdomain & { userIp: string }): Promise<Subdomain> {
    const result = await db.insert(subdomains).values(subdomainData).returning();
    return result[0];
  }

  async updateSubdomain(id: number, updates: Partial<Subdomain>): Promise<Subdomain | undefined> {
    const result = await db.update(subdomains)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subdomains.id, id))
      .returning();
    return result[0];
  }

  async deleteSubdomain(id: number): Promise<boolean> {
    const result = await db.delete(subdomains).where(eq(subdomains.id, id)).returning();
    return result.length > 0;
  }

  async countSubdomainsByUserIp(userIp: string): Promise<number> {
    const result = await db.select().from(subdomains).where(eq(subdomains.userIp, userIp));
    return result.length;
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private subdomains: Map<number, Subdomain>;
  private currentUserId: number;
  private currentSubdomainId: number;

  constructor() {
    this.users = new Map();
    this.subdomains = new Map();
    this.currentUserId = 1;
    this.currentSubdomainId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getSubdomainsByUserIp(userIp: string): Promise<Subdomain[]> {
    return Array.from(this.subdomains.values()).filter(
      (subdomain) => subdomain.userIp === userIp
    );
  }

  async getSubdomainByName(name: string): Promise<Subdomain | undefined> {
    return Array.from(this.subdomains.values()).find(
      (subdomain) => subdomain.name === name
    );
  }

  async createSubdomain(subdomainData: InsertSubdomain & { userIp: string }): Promise<Subdomain> {
    const id = this.currentSubdomainId++;
    const now = new Date();
    const subdomain: Subdomain = {
      ...subdomainData,
      id,
      status: "active",
      cfRecordId: null,
      createdAt: now,
      updatedAt: now,
    };
    this.subdomains.set(id, subdomain);
    return subdomain;
  }

  async updateSubdomain(id: number, updates: Partial<Subdomain>): Promise<Subdomain | undefined> {
    const existing = this.subdomains.get(id);
    if (!existing) return undefined;
    
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.subdomains.set(id, updated);
    return updated;
  }

  async deleteSubdomain(id: number): Promise<boolean> {
    return this.subdomains.delete(id);
  }

  async countSubdomainsByUserIp(userIp: string): Promise<number> {
    return Array.from(this.subdomains.values()).filter(
      (subdomain) => subdomain.userIp === userIp
    ).length;
  }
}

// Use in-memory storage for now until valid database is configured
// To enable database storage, ensure DATABASE_URL is properly configured with a valid Supabase connection string
console.log("🗄️  Using in-memory storage (data will not persist between restarts)");
console.log("💡 To enable persistent storage, configure a valid Supabase DATABASE_URL");

export const storage = new MemStorage();
