import { index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

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
  avatarUrl: varchar("avatarUrl", { length: 512 }).default("").notNull(),
  goalMs: int("goalMs"),
  wcaId: varchar("wcaId", { length: 10 }).unique(),
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

/** Short-lived hashes for OAuth CSRF protection. WCA access tokens are used once for identity verification and never persisted. */
export const cfopWcaOauthStates = mysqlTable("cfop_wca_oauth_states", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull().references(() => cfopAccounts.id, { onDelete: "cascade" }),
  stateHash: varchar("stateHash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("cfop_wca_oauth_account_idx").on(table.accountId), index("cfop_wca_oauth_expires_idx").on(table.expiresAt)]);

/** Server-backed battle room. It always belongs to native CFOP accounts, never Manus OAuth identities. */
export const cfopCompetitionRooms = mysqlTable("cfop_competition_rooms", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 10 }).notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  hostAccountId: int("hostAccountId").notNull().references(() => cfopAccounts.id, { onDelete: "cascade" }),
  status: mysqlEnum("status", ["waiting", "active", "finished"]).notNull().default("waiting"),
  format: mysqlEnum("format", ["best_of_3", "ao5", "ao12"]).notNull().default("ao5"),
  eventId: varchar("eventId", { length: 10 }).notNull().default("333"),
  multiBlindCubes: int("multiBlindCubes").notNull().default(2),
  maxPlayers: int("maxPlayers").notNull().default(8),
  currentRound: int("currentRound").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("cfop_competition_rooms_code_unique").on(table.code), index("cfop_competition_rooms_host_idx").on(table.hostAccountId)]);

/** Active membership is one row per account and room; leaving removes the row instead of retaining stale presence. */
export const cfopCompetitionMembers = mysqlTable("cfop_competition_members", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull().references(() => cfopCompetitionRooms.id, { onDelete: "cascade" }),
  accountId: int("accountId").notNull().references(() => cfopAccounts.id, { onDelete: "cascade" }),
  role: mysqlEnum("role", ["player", "spectator", "moderator"]).notNull().default("player"),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  lastSeen: timestamp("lastSeen").defaultNow().notNull(),
}, (table) => [uniqueIndex("cfop_competition_members_room_account_unique").on(table.roomId, table.accountId), index("cfop_competition_members_account_idx").on(table.accountId)]);

/** A room round freezes one shared scramble so every competitor solves the identical state. */
export const cfopCompetitionRounds = mysqlTable("cfop_competition_rounds", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull().references(() => cfopCompetitionRooms.id, { onDelete: "cascade" }),
  sequence: int("sequence").notNull(),
  scramble: varchar("scramble", { length: 255 }).notNull(),
  scrambleBundle: json("scrambleBundle"),
  status: mysqlEnum("status", ["active", "finished"]).notNull().default("active"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => [uniqueIndex("cfop_competition_rounds_room_sequence_unique").on(table.roomId, table.sequence), index("cfop_competition_rounds_room_idx").on(table.roomId)]);

/** Every competitor can submit one immutable timed result for a room round. */
export const cfopCompetitionResults = mysqlTable("cfop_competition_results", {
  id: int("id").autoincrement().primaryKey(),
  roundId: int("roundId").notNull().references(() => cfopCompetitionRounds.id, { onDelete: "cascade" }),
  accountId: int("accountId").notNull().references(() => cfopAccounts.id, { onDelete: "cascade" }),
  elapsedMs: int("elapsedMs").notNull(),
  inspectionMs: int("inspectionMs").notNull().default(0),
  penalty: mysqlEnum("penalty", ["none", "+2", "DNF"]).notNull().default("none"),
  multiBlindAttempted: int("multiBlindAttempted"),
  multiBlindSolved: int("multiBlindSolved"),
  multiBlindScore: int("multiBlindScore"),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
}, (table) => [uniqueIndex("cfop_competition_results_round_account_unique").on(table.roundId, table.accountId), index("cfop_competition_results_account_idx").on(table.accountId)]);

/** Short, room-scoped text messages. The sender must be an active room member at API level. */
export const cfopCompetitionMessages = mysqlTable("cfop_competition_messages", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull().references(() => cfopCompetitionRooms.id, { onDelete: "cascade" }),
  accountId: int("accountId").notNull().references(() => cfopAccounts.id, { onDelete: "cascade" }),
  content: varchar("content", { length: 500 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("cfop_competition_messages_room_created_idx").on(table.roomId, table.createdAt), index("cfop_competition_messages_account_idx").on(table.accountId)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type CfopAccount = typeof cfopAccounts.$inferSelect;
export type InsertCfopAccount = typeof cfopAccounts.$inferInsert;
export type CfopAccountCloudState = typeof cfopAccountCloudStates.$inferSelect;
export type CfopWcaOauthState = typeof cfopWcaOauthStates.$inferSelect;
export type CfopCompetitionRoom = typeof cfopCompetitionRooms.$inferSelect;
