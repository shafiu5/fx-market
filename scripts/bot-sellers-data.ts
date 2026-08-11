// Shared data for the demo "bot" sellers used by seed-bot-sellers.ts and
// seller-bot.ts. Bot accounts live under a dedicated email domain so they're
// trivially identifiable and can never collide with a real registrant.
export const BOT_EMAIL_DOMAIN = "bot.exchangemv.internal";
export const BOT_PASSWORD = "DemoBot123!";

export type BotSellerSeed = {
  slug: string;
  name: string;
  phone: string;
  isBusiness: boolean;
  verificationStatus: "VERIFIED" | "PENDING";
  boosted: boolean;
  rates: Partial<Record<"USD" | "EUR" | "MYR" | "CNY", [buy: number, sell: number]>>;
};

export const BOT_SELLERS: BotSellerSeed[] = [
  {
    slug: "male-city",
    name: "Male City Exchange",
    phone: "+960 771-2001",
    isBusiness: true,
    verificationStatus: "VERIFIED",
    boosted: true,
    rates: { USD: [17.6, 18.2], EUR: [18.9, 19.6], MYR: [3.75, 3.95], CNY: [2.42, 2.58] },
  },
  {
    slug: "hulhumale-fx",
    name: "Hulhumale FX Point",
    phone: "+960 772-2002",
    isBusiness: false,
    verificationStatus: "PENDING",
    boosted: false,
    rates: { USD: [17.5, 18.35], EUR: [18.7, 19.8] },
  },
  {
    slug: "airport-corner",
    name: "Airport Corner Exchange",
    phone: "+960 773-2003",
    isBusiness: true,
    verificationStatus: "VERIFIED",
    boosted: false,
    rates: { USD: [17.8, 18.1], MYR: [3.7, 3.9], CNY: [2.45, 2.6] },
  },
  {
    slug: "addu-money",
    name: "Addu Money Changers",
    phone: "+960 774-2004",
    isBusiness: false,
    verificationStatus: "PENDING",
    boosted: false,
    rates: { USD: [17.4, 18.4], EUR: [18.6, 20.0], CNY: [2.38, 2.65] },
  },
  {
    slug: "villa-point",
    name: "Villa Point Forex",
    phone: "+960 775-2005",
    isBusiness: true,
    verificationStatus: "VERIFIED",
    boosted: false,
    rates: { USD: [17.65, 18.15], MYR: [3.72, 3.98] },
  },
  {
    slug: "coral-hub",
    name: "Coral Currency Hub",
    phone: "+960 776-2006",
    isBusiness: false,
    verificationStatus: "PENDING",
    boosted: false,
    rates: { USD: [17.55, 18.25], EUR: [18.8, 19.7], MYR: [3.68, 3.92], CNY: [2.4, 2.55] },
  },
  {
    slug: "maafushi-fx",
    name: "Maafushi FX Corner",
    phone: "+960 777-2007",
    isBusiness: true,
    verificationStatus: "PENDING",
    boosted: false,
    rates: { USD: [17.7, 18.05] },
  },
  {
    slug: "nasheed-forex",
    name: "Nasheed Forex Services",
    phone: "+960 778-2008",
    isBusiness: false,
    verificationStatus: "VERIFIED",
    boosted: false,
    rates: { USD: [17.45, 18.5], EUR: [18.5, 20.2], MYR: [3.6, 4.05], CNY: [2.35, 2.7] },
  },
];

export function botEmail(slug: string): string {
  return `${slug}@${BOT_EMAIL_DOMAIN}`;
}
