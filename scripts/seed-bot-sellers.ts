import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { BOT_SELLERS, botEmail, BOT_PASSWORD } from "./bot-sellers-data";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

async function recordSnapshot(currency: string) {
  const avg = await db.sellerRate.aggregate({
    where: { currency, buyRate: { gt: 0 }, sellRate: { gt: 0 }, seller: { suspended: false } },
    _avg: { buyRate: true, sellRate: true },
  });
  if (avg._avg.buyRate == null || avg._avg.sellRate == null) return;
  await db.rateSnapshot.create({
    data: { currency, avgBuyRate: avg._avg.buyRate, avgSellRate: avg._avg.sellRate },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(BOT_PASSWORD, 10);
  const subscriptionExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const boostedUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const touchedCurrencies = new Set<string>();

  for (const s of BOT_SELLERS) {
    const email = botEmail(s.slug);

    const user = await db.user.upsert({
      where: { email },
      update: {
        role: "SELLER",
        phone: s.phone,
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
        phone: s.phone,
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
      touchedCurrencies.add(currency);
    }
  }

  for (const currency of touchedCurrencies) {
    await recordSnapshot(currency);
  }

  console.log(`Seeded ${BOT_SELLERS.length} bot sellers. Password for all: ${BOT_PASSWORD}`);

  await db.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
