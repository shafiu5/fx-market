import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { BOT_SELLERS, botEmail, BOT_PASSWORD } from "./bot-sellers-data";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const passwordHash = await bcrypt.hash(BOT_PASSWORD, 10);
  const subscriptionExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const boostedUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);

  for (const s of BOT_SELLERS) {
    const email = botEmail(s.slug);

    const user = await db.user.upsert({
      where: { email },
      update: {
        isBusiness: s.isBusiness,
        verificationStatus: s.verificationStatus,
        subscriptionActive: true,
        subscriptionExpiresAt,
        boostedUntil: s.boosted ? boostedUntil : null,
        suspended: false,
      },
      create: {
        name: s.name,
        email,
        passwordHash,
        role: "SELLER",
        isBusiness: s.isBusiness,
        verificationStatus: s.verificationStatus,
        subscriptionActive: true,
        subscriptionExpiresAt,
        boostedUntil: s.boosted ? boostedUntil : null,
      },
    });

    for (const [currency, [buyRate, sellRate]] of Object.entries(s.rates)) {
      await db.sellerRate.upsert({
        where: { sellerId_currency: { sellerId: user.id, currency } },
        update: { buyRate, sellRate },
        create: { sellerId: user.id, currency, buyRate, sellRate },
      });
    }
  }

  console.log(`Seeded ${BOT_SELLERS.length} bot sellers. Password for all: ${BOT_PASSWORD}`);

  await db.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
