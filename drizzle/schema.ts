import { index, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/** Existing platform-auth user table. CFOP email/password accounts intentionally do not use this table. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** Native CFOP account. It is deliberately separate from Manus/OAuth users. */
export const cfopAccounts = mysqlTable("cfop_accounts", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  displayName: varchar("displayName", { length: 80 }).notNull(),
  bio: varchar("bio", { length: 280 }).default("").notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** Token hashes only; a stolen database never reveals an active browser session token. */
export const cfopAccountSessions = mysqlTable("cfop_account_sessions", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull().references(() => cfopAccounts.id, { onDelete: "cascade" }),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
}, (table) => [index("cfop_account_sessions_account_idx").on(table.accountId), index("cfop_account_sessions_expires_idx").on(table.expiresAt)]);

/** One versioned JSON snapshot per CFOP account; Timer and Study remain mergeable on the client. */
export const cfopAccountCloudStates = mysqlTable("cfop_account_cloud_states", {
  accountId: int("accountId").primaryKey().references(() => cfopAccounts.id, { onDelete: "cascade" }),
  payload: json("payload").notNull(),
  version: int("version").notNull().default(1),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Reset hashes only. Raw reset links are never persisted in the database. */
export const cfopPasswordResetTokens = mysqlTable("cfop_password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull().references(() => cfopAccounts.id, { onDelete: "cascade" }),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("cfop_password_reset_account_idx").on(table.accountId), index("cfop_password_reset_expires_idx").on(table.expiresAt)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type CfopAccount = typeof cfopAccounts.$inferSelect;
export type InsertCfopAccount = typeof cfopAccounts.$inferInsert;
export type CfopAccountCloudState = typeof cfopAccountCloudStates.$inferSelect;
