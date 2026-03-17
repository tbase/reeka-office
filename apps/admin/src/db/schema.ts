import { mysqlTable, varchar, datetime, index, uniqueIndex, boolean } from "drizzle-orm/mysql-core";

export const admin = mysqlTable("admin", {
  id: varchar("id", { length: 128 }).primaryKey(),
  name: varchar("name", { length: 256 }),
  email: varchar("email", { length: 256 }).notNull(),
  emailVerified: boolean("email_verified"),
  image: varchar("image", { length: 512 }),
  createdAt: datetime("created_at", { mode: "string" }).notNull(),
  updatedAt: datetime("updated_at", { mode: "string" }).notNull(),
}, (t) => [
  uniqueIndex("admin_email_idx").on(t.email)
]);

export const adminSession = mysqlTable("admin_session", {
  id: varchar("id", { length: 128 }).primaryKey(),
  expiresAt: datetime("expires_at", { mode: "string" }).notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  createdAt: datetime("created_at", { mode: "string" }).notNull(),
  updatedAt: datetime("updated_at", { mode: "string" }).notNull(),
  ipAddress: varchar("ip_address", { length: 64 }),
  userAgent: varchar("user_agent", { length: 512 }),
  userId: varchar("user_id", { length: 128 }).notNull().references(() => admin.id, { onDelete: "cascade" }),
}, (t) => [
  index("admin_session_user_id_idx").on(t.userId),
  index("admin_session_token_idx").on(t.token),
]);

export const adminAccount = mysqlTable("admin_account", {
  id: varchar("id", { length: 128 }).primaryKey(),
  accountId: varchar("account_id", { length: 128 }).notNull(),
  providerId: varchar("provider_id", { length: 128 }).notNull(),
  userId: varchar("user_id", { length: 128 }).notNull().references(() => admin.id, { onDelete: "cascade" }),
  accessToken: varchar("access_token", { length: 512 }),
  refreshToken: varchar("refresh_token", { length: 512 }),
  idToken: varchar("id_token", { length: 2048 }),
  accessTokenExpiresAt: datetime("access_token_expires_at", { mode: "string" }),
  refreshTokenExpiresAt: datetime("refresh_token_expires_at", { mode: "string" }),
  scope: varchar("scope", { length: 512 }),
  password: varchar("password", { length: 256 }),
  createdAt: datetime("created_at", { mode: "string" }).notNull(),
  updatedAt: datetime("updated_at", { mode: "string" }).notNull(),
}, (t) => [
  index("admin_account_user_id_idx").on(t.userId),
  index("admin_account_provider_id_idx").on(t.providerId, t.accountId),
]);

export const adminVerification = mysqlTable("admin_verification", {
  id: varchar("id", { length: 128 }).primaryKey(),
  identifier: varchar("identifier", { length: 256 }).notNull(),
  value: varchar("value", { length: 256 }).notNull(),
  expiresAt: datetime("expires_at", { mode: "string" }).notNull(),
  createdAt: datetime("created_at", { mode: "string" }).notNull(),
}, (t) => [
  index("admin_verification_identifier_idx").on(t.identifier)
]);

// Types
export type Admin = typeof admin.$inferSelect;
export type AdminSession = typeof adminSession.$inferSelect;
export type AdminAccount = typeof adminAccount.$inferSelect;
export type AdminVerification = typeof adminVerification.$inferSelect;
