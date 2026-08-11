import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Kept small: each serverless function instance gets its own pool, and the
// Supabase pooler this connects through has a limited total client budget
// shared across all concurrent instances.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  idleTimeoutMillis: 10_000,
});
const adapter = new PrismaPg(pool);

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// The driver adapter connects lazily; without this, the very first query
// issued anywhere in the app can race the connection setup and fail with
// a spurious "table does not exist" error.
await db.$connect();
