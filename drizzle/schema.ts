import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type CfopAccount = typeof cfopAccounts.$inferSelect;
export type InsertCfopAccount = typeof cfopAccounts.$inferInsert;
