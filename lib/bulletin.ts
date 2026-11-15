import fs from "fs/promises";
import path from "path";
import os from "os";
import defaultEvents from "../data/events.json" with { type: "json" };

export interface BulletinEvent {
  id: string;
  title: string;
  schedule: string;
  description: string;
  icon: string;
  badgeColor: string;
  image: string;
}

export interface BulletinConfig {
  promoBanner: string;
  promoSpendThreshold: number;
  events: BulletinEvent[];
}

const DEFAULT_BULLETIN: BulletinConfig = {
  promoBanner: "Spend ₱200 on drinks, get free Medium Fries! 🍟",
  promoSpendThreshold: 200,
  events: defaultEvents as BulletinEvent[],
};

let inMemoryBulletin: BulletinConfig | null = null;

function getBulletinFilePath(): string {
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return path.join(os.tmpdir(), "home-heart-cafe-bulletin.json");
  }
  return path.join(process.cwd(), "data", "bulletin.json");
}

export async function getBulletinConfig(): Promise<BulletinConfig> {
  if (inMemoryBulletin) return inMemoryBulletin;
  try {
    const filePath = getBulletinFilePath();
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.promoBanner === "string" && Array.isArray(parsed.events)) {
      inMemoryBulletin = parsed;
      return parsed;
    }
  } catch {
    // If not found, use default
  }
  inMemoryBulletin = { ...DEFAULT_BULLETIN };
  return inMemoryBulletin;
}

export async function updateBulletinConfig(
  updates: Partial<BulletinConfig>,
): Promise<BulletinConfig> {
  const current = await getBulletinConfig();
  const next: BulletinConfig = {
    promoBanner: updates.promoBanner ?? current.promoBanner,
    promoSpendThreshold: updates.promoSpendThreshold ?? current.promoSpendThreshold,
    events: updates.events ?? current.events,
  };

  inMemoryBulletin = next;
  try {
    const filePath = getBulletinFilePath();
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(next, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist bulletin:", err);
  }
  return next;
}
