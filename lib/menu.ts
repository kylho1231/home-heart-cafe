import catalogSource from "../app/menu-data.json" with { type: "json" };
import productImages from "../app/product-images.json" with { type: "json" };
import fs from "fs/promises";
import path from "path";
import os from "os";
import { registerCustomProduct } from "./validation";

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
  isCustom?: boolean;
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

// Custom products storage
let inMemoryCustomProducts: MenuItem[] = [];
let customProductsLoaded = false;

function getCustomProductsFilePath(): string {
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return path.join(os.tmpdir(), "home-heart-cafe-custom-products.json");
  }
  return path.join(process.cwd(), "data", "custom-products.json");
}

export async function getCustomProducts(): Promise<MenuItem[]> {
  if (customProductsLoaded) return inMemoryCustomProducts;
  try {
    const filePath = getCustomProductsFilePath();
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      inMemoryCustomProducts = parsed;
      customProductsLoaded = true;

      // Register with validation catalog
      for (const item of inMemoryCustomProducts) {
        const prices: Record<string, number> = {};
        item.sizes.forEach((s) => {
          prices[s.label] = s.price;
        });
        registerCustomProduct({
          slug: item.id,
          name: item.name,
          category: item.category,
          prices,
        });
      }
    }
  } catch {
    // No custom products yet
  }
  return inMemoryCustomProducts;
}

async function persistCustomProducts(): Promise<void> {
  try {
    const filePath = getCustomProductsFilePath();
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(inMemoryCustomProducts, null, 2), "utf-8");
  } catch {}
}

export async function addCustomProduct(data: {
  name: string;
  category: string;
  description?: string;
  sizes: MenuItemSize[];
  image?: string;
  allowsBoba?: boolean;
  allowsCreamCheese?: boolean;
}): Promise<MenuItem> {
  await getCustomProducts();
  const slug = slugify(data.name);

  // Check if exists
  const existingIdx = inMemoryCustomProducts.findIndex((p) => p.id === slug);
  const startingPrice = Math.min(...data.sizes.map((s) => s.price));

  const newItem: MenuItem = {
    id: slug,
    name: data.name,
    category: data.category,
    description: data.description || `${data.category} specialty prepared fresh.`,
    sizes: data.sizes,
    startingPrice: isFinite(startingPrice) ? startingPrice : 0,
    image: data.image || "/products/chocolate-milk-tea.webp",
    isBestseller: false,
    allowsBoba: data.allowsBoba ?? true,
    allowsCreamCheese: data.allowsCreamCheese ?? false,
    isAvailable: true,
    isCustom: true,
  };

  if (existingIdx >= 0) {
    inMemoryCustomProducts[existingIdx] = newItem;
  } else {
    inMemoryCustomProducts.push(newItem);
  }

  // Register in validation engine
  const prices: Record<string, number> = {};
  newItem.sizes.forEach((s) => {
    prices[s.label] = s.price;
  });
  registerCustomProduct({
    slug: newItem.id,
    name: newItem.name,
    category: newItem.category,
    prices,
  });

  await persistCustomProducts();
  return newItem;
}

export async function deleteCustomProduct(id: string): Promise<boolean> {
  await getCustomProducts();
  const beforeCount = inMemoryCustomProducts.length;
  inMemoryCustomProducts = inMemoryCustomProducts.filter((p) => p.id !== id);
  if (inMemoryCustomProducts.length !== beforeCount) {
    await persistCustomProducts();
    return true;
  }
  return false;
}

/**
 * Builds the canonical list of menu items from app/menu-data.json + dynamic custom products
 */
export async function getCanonicalMenu(): Promise<MenuItem[]> {
  await loadAvailability();
  const customItems = await getCustomProducts();

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
        description:
          rawItem.description ||
          (isSnack
            ? "Crispy golden shoestring fries tossed in your favorite savory seasoning."
            : `${cat.category} prepared fresh to order.`),
        sizes,
        startingPrice: sizes[0]?.price || 0,
        image: productImageMap[slug] || "/products/chocolate-milk-tea.webp",
        isBestseller,
        allowsBoba: !isSnack,
        allowsCreamCheese: !isCreamCheeseCat && !isSnack,
        isAvailable: !unavailableSet.has(slug),
        isCustom: false,
      });
    }
  }

  // Append custom items
  for (const custom of customItems) {
    items.push({
      ...custom,
      isAvailable: !unavailableSet.has(custom.id),
      isCustom: true,
    });
  }

  return items;
}
