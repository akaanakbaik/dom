import { pgTable, text, serial, timestamp, varchar, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const subdomains = pgTable("subdomains", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 63 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(),
  target: text("target").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  cfRecordId: text("cf_record_id"),
  userIp: text("user_ip").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSubdomainSchema = createInsertSchema(subdomains).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userIp: true,
  cfRecordId: true,
  status: true,
}).extend({
  name: z.string()
    .min(1, "Nama subdomain harus diisi")
    .max(63, "Nama subdomain maksimal 63 karakter")
    .regex(/^[a-zA-Z0-9-]+$/, "Hanya huruf, angka, dan strip (-) yang diperbolehkan")
    .refine(name => !name.startsWith('-') && !name.endsWith('-'), "Nama subdomain tidak boleh dimulai atau diakhiri dengan strip"),
  type: z.enum(["A", "CNAME", "AAAA"], { required_error: "Tipe record harus dipilih" }),
  target: z.string().min(1, "Target harus diisi"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSubdomain = z.infer<typeof insertSubdomainSchema>;
export type Subdomain = typeof subdomains.$inferSelect;
