import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const userSyncDocuments = mysqlTable("user_sync_documents", {
  userId: int("user_id").primaryKey(),
  payload: text("payload").notNull(),
  revision: int("revision").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const familySpaces = mysqlTable("family_spaces", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: varchar("title", { length: 120 }).notNull(),
  ownerId: int("owner_id").notNull(),
  inviteCode: varchar("invite_code", { length: 16 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const familyMembers = mysqlTable("family_members", {
  id: int("id").autoincrement().primaryKey(),
  familyId: varchar("family_id", { length: 36 }).notNull(),
  userId: int("user_id").notNull(),
  role: mysqlEnum("role", ["owner", "member"]).default("member").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const familySyncDocuments = mysqlTable("family_sync_documents", {
  familyId: varchar("family_id", { length: 36 }).primaryKey(),
  payload: text("payload").notNull(),
  revision: int("revision").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type UserSyncDocument = typeof userSyncDocuments.$inferSelect;
export type FamilySpace = typeof familySpaces.$inferSelect;
export type FamilyMember = typeof familyMembers.$inferSelect;
export type FamilySyncDocument = typeof familySyncDocuments.$inferSelect;
