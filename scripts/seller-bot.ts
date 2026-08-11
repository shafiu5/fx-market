import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { BOT_EMAIL_DOMAIN } from "./bot-sellers-data";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

const ORDER_POLL_MS = 4000;
const RATE_NUDGE_MS = 60_000;
const CONFIRM_DELAY_MS: [number, number] = [3000, 8000];
const COMPLETE_DELAY_MS: [number, number] = [5000, 15000];
const RATE_NUDGE_PCT = 0.004;

// Orders currently scheduled for a delayed confirm/complete, keyed by
// orderId (confirm) or `complete:${orderId}` (complete) so repeated polls
// don't double-schedule the same transition.
const inFlight = new Set<string>();

function randomBetween([min, max]: [number, number]): number {
  return min + Math.random() * (max - min);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

async function getBotSellerIds(): Promise<string[]> {
  const rows = await db.user.findMany({
    where: { role: "SELLER", email: { endsWith: `@${BOT_EMAIL_DOMAIN}` } },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

async function pollOrders(botIds: string[]) {
  const pending = await db.order.findMany({
    where: { sellerId: { in: botIds }, status: "PENDING" },
    select: { id: true },
  });
  for (const o of pending) {
    if (inFlight.has(o.id)) continue;
    inFlight.add(o.id);
    setTimeout(async () => {
      try {
        await db.order.update({ where: { id: o.id }, data: { status: "CONFIRMED" } });
        console.log(`[bot] confirmed order ${o.id}`);
      } catch (e) {
        console.error(`[bot] failed to confirm ${o.id}`, e);
      } finally {
        inFlight.delete(o.id);
      }
    }, randomBetween(CONFIRM_DELAY_MS));
  }

  const confirmed = await db.order.findMany({
    where: { sellerId: { in: botIds }, status: "CONFIRMED" },
    select: { id: true },
  });
  for (const o of confirmed) {
    const key = `complete:${o.id}`;
    if (inFlight.has(key)) continue;
    inFlight.add(key);
    setTimeout(async () => {
      try {
        await db.order.update({ where: { id: o.id }, data: { status: "COMPLETED" } });
        console.log(`[bot] completed order ${o.id}`);
      } catch (e) {
        console.error(`[bot] failed to complete ${o.id}`, e);
      } finally {
        inFlight.delete(key);
      }
    }, randomBetween(COMPLETE_DELAY_MS));
  }
}

async function nudgeRates(botIds: string[]) {
  const rates = await db.sellerRate.findMany({ where: { sellerId: { in: botIds } } });
  const currencies = new Set<string>();
  for (const r of rates) {
    const buyRate = round2(r.buyRate * (1 + (Math.random() * 2 - 1) * RATE_NUDGE_PCT));
    const sellRate = round2(
      Math.max(r.sellRate * (1 + (Math.random() * 2 - 1) * RATE_NUDGE_PCT), buyRate + 0.02)
    );
    await db.sellerRate.update({ where: { id: r.id }, data: { buyRate, sellRate } });
    currencies.add(r.currency);
  }
  console.log(`[bot] nudged ${rates.length} rates`);

  // Snapshot the market's best (lowest) rate to buy each touched currency —
  // same metric the rate board's default sort and the trend graph use.
  for (const currency of currencies) {
    const best = await db.sellerRate.aggregate({
      where: { currency, buyRate: { gt: 0 }, sellRate: { gt: 0 }, seller: { suspended: false } },
      _min: { sellRate: true },
    });
    if (best._min.sellRate != null) {
      await db.rateSnapshot.create({ data: { currency, rate: best._min.sellRate } });
    }
  }
}

async function main() {
  const botIds = await getBotSellerIds();
  if (botIds.length === 0) {
    console.error("No bot sellers found. Run `npx tsx scripts/seed-bot-sellers.ts` first.");
    process.exit(1);
  }
  console.log(`[bot] watching ${botIds.length} bot sellers. Press Ctrl+C to stop.`);

  setInterval(() => pollOrders(botIds).catch(console.error), ORDER_POLL_MS);
  setInterval(() => nudgeRates(botIds).catch(console.error), RATE_NUDGE_MS);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
