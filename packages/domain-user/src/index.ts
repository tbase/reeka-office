import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";
import mysql from "mysql2/promise";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export function createUserRepository(connectionUri: string) {
  const pool = mysql.createPool({
    uri: connectionUri,
    connectionLimit: 10
  });

  const db = drizzle(pool, { schema: { users }, mode: "default" });

  return {
    db,
    async createUser(input: NewUser) {
      const result = await db.insert(users).values(input).$returningId();
      return result[0]?.id ?? null;
    },
    async listUsers() {
      return db.select().from(users);
    },
    async getUserById(id: number) {
      const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return rows[0] ?? null;
    },
    async close() {
      await pool.end();
    }
  };
}
