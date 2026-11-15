import catalogSource from "../app/menu-data.json" with { type: "json" };
import productImages from "../app/product-images.json" with { type: "json" };
import fs from "fs/promises";
import path from "path";
import os from "os";

export interface MenuItemSize {
  label: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  description: string;
  sizes: MenuItemSize[];
  startingPrice: number;
  image?: string;
  isBestseller: boolean;
  allowsBoba: boolean;
  allowsCreamCheese: boolean;
  isAvailable: boolean;
}

const productImageMap = productImages as Record<string, string>;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatSizeLabel(size: string): string {
  const ounceMatch = size.match(/^(\d+)oz$/i);
  if (ounceMatch) return `${ounceMatch[1]} oz`;
  return size.toLowerCase() === "regular" ? "Regular" : size;
}

// In-memory availability store (falls back to os.tmpdir in serverless)
let unavailableSet: Set<string> = new Set();
let availabilityLoaded = false;

function getAvailabilityFilePath(): string {
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return path.join(os.tmpdir(), "home-heart-cafe-availability.json");
  }
  return path.join(process.cwd(), "data", "menu-availability.json");
}

async function loadAvailability(): Promise<Set<string>> {
  if (availabilityLoaded) return unavailableSet;
  try {
    const filePath = getAvailabilityFilePath();
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      unavailableSet = new Set(parsed);
      availabilityLoaded = true;
    }
  } catch {
    // If not found, all available
  }
  return unavailableSet;
}

async function persistAvailability(): Promise<void> {
  try {
    const filePath = getAvailabilityFilePath();
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(Array.from(unavailableSet), null, 2), "utf-8");
  } catch {}
}

export async function getUnavailableSlugs(): Promise<string[]> {
  await loadAvailability();
  return Array.from(unavailableSet);
}

export async function setItemAvailability(slug: string, isAvailable: boolean): Promise<boolean> {
  await loadAvailability();
  if (isAvailable) {
    unavailableSet.delete(slug);
  } else {
    unavailableSet.add(slug);
  }
  await persistAvailability();
  return isAvailable;
}

/**
 * Builds the canonical list of menu items from app/menu-data.json
 */
export async function getCanonicalMenu(): Promise<MenuItem[]> {
  await loadAvailability();

  const items: MenuItem[] = [];

  for (const cat of catalogSource.categories) {
    for (const item of cat.items) {
      const slug = slugify(item.name);
      const isCreamCheeseCat = cat.category === "Cream Cheese Series";
      const isSnack = cat.category === "Snacks";
      const isBestseller =
        slug.includes("strawberry-cream-cheese") ||
        slug.includes("okinawa-cream-cheese") ||
        slug.includes("chuckie-float") ||
        slug.includes("spanish-latte") ||
        slug.includes("cheese-french-fries");

      const sizes: MenuItemSize[] = Object.entries(item.prices).map(([sizeKey, priceVal]) => ({
        label: formatSizeLabel(sizeKey),
        price: typeof priceVal === "number" ? priceVal : 0,
      }));

      const rawItem = item as { name: string; description?: string; prices: Record<string, number> };
      items.push({
        id: slug,
        name: item.name,
        category: cat.category,
        description: rawItem.description || (isSnack ? "Crispy golden shoestring fries tossed in your favorite savory seasoning." : `${cat.category} prepared fresh to order.`),
        sizes,
        startingPrice: sizes[0]?.price || 0,
        image: productImageMap[slug],
        isBestseller,
        allowsBoba: !isSnack,
        allowsCreamCheese: !isCreamCheeseCat && !isSnack,
        isAvailable: !unavailableSet.has(slug),
      });
    }
  }

  return items;
}
