import "dotenv/config";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

type SellerSeed = {
  name: string;
  email: string;
  isBusiness: boolean;
  verified: boolean;
  rates: Partial<Record<"USD" | "EUR" | "MYR" | "CNY", [buy: number, sell: number]>>;
};

const SELLERS: SellerSeed[] = [
  {
    name: "Male City Exchange",
    email: "male-city@example.com",
    isBusiness: true,
    verified: true,
    rates: { USD: [17.6, 18.2], EUR: [18.9, 19.6], MYR: [3.75, 3.95], CNY: [2.42, 2.58] },
  },
  {
    name: "Hulhumale FX Point",
    email: "hulhumale-fx@example.com",
    isBusiness: false,
    verified: false,
    rates: { USD: [17.5, 18.35], EUR: [18.7, 19.8] },
  },
  {
    name: "Airport Corner Exchange",
    email: "airport-corner@example.com",
    isBusiness: true,
    verified: true,
    rates: { USD: [17.8, 18.1], MYR: [3.7, 3.9], CNY: [2.45, 2.6] },
  },
  {
    name: "Addu Money Changers",
    email: "addu-money@example.com",
    isBusiness: false,
    verified: false,
    rates: { USD: [17.4, 18.4], EUR: [18.6, 20.0], CNY: [2.38, 2.65] },
  },
  {
    name: "Villa Point Forex",
    email: "villa-point@example.com",
    isBusiness: true,
    verified: true,
    rates: { USD: [17.65, 18.15], MYR: [3.72, 3.98] },
  },
  {
    name: "Coral Currency Hub",
    email: "coral-hub@example.com",
    isBusiness: false,
    verified: false,
    rates: { USD: [17.55, 18.25], EUR: [18.8, 19.7], MYR: [3.68, 3.92], CNY: [2.4, 2.55] },
  },
  {
    name: "Maafushi FX Corner",
    email: "maafushi-fx@example.com",
    isBusiness: true,
    verified: false,
    rates: { USD: [17.7, 18.05] },
  },
  {
    name: "Nasheed Forex Services",
    email: "nasheed-forex@example.com",
    isBusiness: false,
    verified: true,
    rates: { USD: [17.45, 18.5], EUR: [18.5, 20.2], MYR: [3.6, 4.05], CNY: [2.35, 2.7] },
  },
];

const BUYERS = [
  { name: "Aisha Rasheed", email: "aisha.rasheed@example.com" },
  { name: "Hassan Waheed", email: "hassan.waheed@example.com" },
];

const PASSWORD = "password123";

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  for (const s of SELLERS) {
    const verificationStatus = s.verified ? "VERIFIED" : "PENDING";

    const user = await db.user.upsert({
      where: { email: s.email },
      update: { isBusiness: s.isBusiness, verificationStatus },
      create: {
        name: s.name,
        email: s.email,
        passwordHash,
        role: "SELLER",
        isBusiness: s.isBusiness,
        verificationStatus,
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

  for (const b of BUYERS) {
    await db.user.upsert({
      where: { email: b.email },
      update: {},
      create: { name: b.name, email: b.email, passwordHash, role: "BUYER" },
    });
  }

  console.log(
    `Seeded ${SELLERS.length} sellers and ${BUYERS.length} buyers. Password for all: ${PASSWORD}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
