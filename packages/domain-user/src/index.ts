import { eq } from "drizzle-orm";
import type { MySql2Database } from "drizzle-orm/mysql2";
import { int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type UserSchema = {
  users: typeof users;
};

export const userSchema: UserSchema = {
  users,
};

export type UserDB = MySql2Database<UserSchema>;

export function createUserRepository(db: UserDB) {

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
      return;
    }
  };
}
