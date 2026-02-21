import { config } from "dotenv";
import { and, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { formatISO9075 } from "date-fns";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { closeDB, getDB } from "../src/db";
import * as schema from "../src/db/schema";
import { auth } from "../src/lib/auth";

async function promptHidden(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!input.isTTY || !output.isTTY) {
      reject(new Error("Interactive terminal is required"));
      return;
    }

    output.write(question);
    input.resume();
    input.setRawMode(true);
    input.setEncoding("utf8");

    let value = "";

    const onData = (chunk: string) => {
      const key = chunk;

      if (key === "\r" || key === "\n") {
        output.write("\n");
        input.setRawMode(false);
        input.pause();
        input.removeListener("data", onData);
        resolve(value);
        return;
      }

      if (key === "\u0003") {
        output.write("\n");
        input.setRawMode(false);
        input.pause();
        input.removeListener("data", onData);
        reject(new Error("Input cancelled"));
        return;
      }

      if (key === "\u007f") {
        if (value.length > 0) {
          value = value.slice(0, -1);
          output.write("\b \b");
        }
        return;
      }

      value += key;
      output.write("*");
    };

    input.on("data", onData);
  });
}

async function collectAdminCredentials(): Promise<{ email: string; password: string }> {
  const rl = createInterface({ input, output });

  try {
    const email = (await rl.question("Admin email: ")).trim().toLowerCase();
    if (!email) {
      throw new Error("Email is required");
    }

    const password = (await promptHidden("Admin password: ")).trim();
    if (!password) {
      throw new Error("Password is required");
    }

    return { email, password };
  } finally {
    rl.close();
  }
}

async function initAdmin(): Promise<void> {
  config({ path: ".env.local" });
  config();

  const { email, password } = await collectAdminCredentials();
  const name = process.env.ADMIN_NAME?.trim() || "Administrator";

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters");
  }

  const db = getDB();
  const existingUser = await db.query.admin.findFirst({
    where: eq(schema.admin.email, email),
  });

  if (!existingUser) {
    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });
    console.log(`Created admin account: ${email}`);
    return;
  }

  const passwordHash = await hashPassword(password);
  const result = await db
    .update(schema.adminAccount)
    .set({
      password: passwordHash,
      updatedAt: formatISO9075(new Date()),
    })
    .where(
      and(
        eq(schema.adminAccount.userId, existingUser.id),
        eq(schema.adminAccount.providerId, "credential"),
      ),
    );

  if (result[0].affectedRows === 0) {
    throw new Error(`Admin user exists but credential account is missing for ${email}`);
  }

  console.log(`Updated admin password: ${email}`);
}

initAdmin()
  .catch((error) => {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error("Failed to initialize admin account");
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDB();
  });
