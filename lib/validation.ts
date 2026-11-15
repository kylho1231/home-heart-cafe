import { z } from "zod";
import catalogSource from "../app/menu-data.json" with { type: "json" };
import type { OrderItem } from "./types.ts";

// Types derived from catalogSource
interface CatalogItem {
  name: string;
  description?: string;
  prices: Record<string, number | undefined>;
}

interface CatalogCategory {
  category: string;
  items: CatalogItem[];
}

const menuCatalog = catalogSource as {
  categories: CatalogCategory[];
  addOns: { name: string; price: number }[];
  bundlesAndPromos: Array<{
    name: string;
    includes?: string[];
    price?: number;
    condition?: string;
    reward?: string;
  }>;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Flat lookup map of product slugs to their canonical details
interface CanonicalProduct {
  slug: string;
  name: string;
  category: string;
  prices: Record<string, number>;
}

const canonicalProductsMap = new Map<string, CanonicalProduct>();

for (const cat of menuCatalog.categories) {
  for (const item of cat.items) {
    const slug = slugify(item.name);
    const validPrices: Record<string, number> = {};

    for (const [sizeKey, priceVal] of Object.entries(item.prices)) {
      if (typeof priceVal === "number") {
        // Standardize size labels (e.g. "12oz" -> "12 oz", "regular" -> "Regular")
        const label = sizeKey.match(/^(\d+)oz$/i)
          ? `${sizeKey.match(/^(\d+)oz$/i)![1]} oz`
          : sizeKey.toLowerCase() === "regular"
            ? "Regular"
            : sizeKey;
        validPrices[label] = priceVal;
        validPrices[sizeKey] = priceVal; // support raw key too
      }
    }

    canonicalProductsMap.set(slug, {
      slug,
      name: item.name,
      category: cat.category,
      prices: validPrices,
    });
  }
}

// Allowed add-on prices from single source of truth
export const EXTRA_BOBA_PRICE = 10;
export const CREAM_CHEESE_ADDON_PRICE = 15;

// Barkada bundle authorized prices
export const FRUIT_SODA_BUNDLE_PRICE = 135;
export const MILK_TEA_BUNDLE_PRICE = 155;

/**
 * Zod Schema for Order Item input from client
 */
export const orderItemInputSchema = z.object({
  id: z.string().min(1).max(200),
  productId: z.string().min(1).max(100),
  productName: z.string().min(1).max(100),
  category: z.string().min(1).max(100),
  flavor: z.string().min(1).max(100),
  size: z.string().min(1).max(50),
  sugarLevel: z.enum(["0%", "25%", "50%", "75%", "100%"]),
  iceLevel: z.enum(["No Ice", "Less Ice", "Regular Ice", "Extra Ice"]),
  addBoba: z.boolean(),
  addCreamCheese: z.boolean().optional(),
  quantity: z.number().int().min(1).max(20),
  notes: z.string().max(300).optional(),
  bundleName: z.string().max(100).optional(),
  bundleSelections: z.array(z.string().max(100)).max(10).optional(),
});

/**
 * Zod Schema for Customer Verification
 */
export const customerVerificationSchema = z
  .object({
    role: z.enum(["student", "teacher_staff"]),
    fullName: z
      .string()
      .trim()
      .min(2, "Full Name must be at least 2 characters")
      .max(100, "Full Name must be under 100 characters"),
    lrn: z.string().optional(),
    gradeSection: z.string().trim().max(100).optional(),
    department: z.string().trim().max(100).optional(),
    employeeId: z.string().trim().max(50).optional(),
    contactNumber: z
      .string()
      .trim()
      .min(7, "Contact number must be at least 7 digits")
      .max(20, "Contact number must be under 20 characters"),
    idPhotoUrl: z.string().min(1, "School or Faculty ID photo is required"),
    selfiePhotoUrl: z.string().optional(),
    privacyConsent: z
      .boolean()
      .refine((val) => val === true, "You must agree to the data privacy terms pursuant to RA 10173"),
  })
  .superRefine((data, ctx) => {
    if (data.role === "student") {
      const cleanLrn = (data.lrn || "").replace(/\D/g, "");
      if (cleanLrn.length !== 12) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Student LRN must be exactly 12 digits (DepEd Philippine standard)",
          path: ["lrn"],
        });
      }
      if (!data.gradeSection || data.gradeSection.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Grade & Section is required for students",
          path: ["gradeSection"],
        });
      }
    } else if (data.role === "teacher_staff") {
      if (!data.department || data.department.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Department or Faculty Designation is required for teachers/staff",
          path: ["department"],
        });
      }
    }
  });

/**
 * Zod Schema for Payment details
 */
export const paymentInfoSchema = z
  .object({
    method: z.enum(["gcash_downpayment", "gcash_full", "counter_cash"]),
    gcashReferenceNumber: z.string().trim().max(50).optional(),
    receiptScreenshotUrl: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.method === "gcash_downpayment" || data.method === "gcash_full") {
      const ref = (data.gcashReferenceNumber || "").replace(/\s/g, "");
      if (!ref || ref.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Valid GCash Reference Number (min 8 digits) is required",
          path: ["gcashReferenceNumber"],
        });
      }
    }
  });

/**
 * Master Order Input Schema
 */
export const createOrderSchema = z.object({
  customer: customerVerificationSchema,
  items: z.array(orderItemInputSchema).min(1, "Cart cannot be empty"),
  payment: paymentInfoSchema,
});

export interface RecalculatedOrder {
  items: OrderItem[];
  totalAmount: number;
  downPaymentAmount: number;
  eligibleDrinkSpend: number;
  unlockedFreeFries: boolean;
}

/**
 * Authoritative Server-Side Price & Promotion Recalculation
 * Never trusts prices or line subtotals sent by the client.
 */
export function recalculateOrderPrices(
  items: z.infer<typeof orderItemInputSchema>[],
  paymentMethod: "gcash_downpayment" | "gcash_full" | "counter_cash",
): RecalculatedOrder {
  let totalAmount = 0;
  let eligibleDrinkSpend = 0;

  const verifiedItems: OrderItem[] = items.map((rawItem) => {
    // 1. Check if Barkada Bundle
    if (rawItem.category === "Bundles" || rawItem.productId.startsWith("bundle-")) {
      const isMilkTea = rawItem.productName.toLowerCase().includes("milk tea");
      const unitPrice = isMilkTea ? MILK_TEA_BUNDLE_PRICE : FRUIT_SODA_BUNDLE_PRICE;
      const subtotal = unitPrice * rawItem.quantity;
      totalAmount += subtotal;

      return {
        id: rawItem.id,
        productId: rawItem.productId,
        productName: rawItem.productName,
        category: "Bundles",
        flavor: rawItem.flavor,
        size: "Bundle",
        sugarLevel: rawItem.sugarLevel,
        iceLevel: rawItem.iceLevel,
        addBoba: false,
        addCreamCheese: false,
        quantity: rawItem.quantity,
        unitPrice,
        subtotal,
        notes: rawItem.notes,
        bundleName: rawItem.bundleName || rawItem.productName,
        bundleSelections: rawItem.bundleSelections,
      };
    }

    // 2. Normal menu item - lookup in canonical catalog
    const slug = slugify(rawItem.productId);
    const canonical = canonicalProductsMap.get(slug) || canonicalProductsMap.get(slugify(rawItem.productName));

    if (!canonical) {
      throw new Error(`Product not found in authorized menu: ${rawItem.productName}`);
    }

    // Check size price
    const authorizedBasePrice = canonical.prices[rawItem.size];
    if (authorizedBasePrice === undefined) {
      throw new Error(
        `Invalid size "${rawItem.size}" for product ${canonical.name}. Valid sizes: ${Object.keys(canonical.prices).join(", ")}`,
      );
    }

    let unitPrice = authorizedBasePrice;

    // Add Boba
    if (rawItem.addBoba) {
      unitPrice += EXTRA_BOBA_PRICE;
    }

    // Add Cream Cheese (prohibited on Cream Cheese series)
    const isCreamCheeseSeries = canonical.category === "Cream Cheese Series";
    const addCreamCheese = !isCreamCheeseSeries && Boolean(rawItem.addCreamCheese);
    if (addCreamCheese) {
      unitPrice += CREAM_CHEESE_ADDON_PRICE;
    }

    const subtotal = unitPrice * rawItem.quantity;
    totalAmount += subtotal;

    // Drink spend calculation: snacks and bundles do not count
    if (canonical.category !== "Snacks" && rawItem.category !== "Bundles") {
      eligibleDrinkSpend += subtotal;
    }

    return {
      id: rawItem.id,
      productId: canonical.slug,
      productName: canonical.name,
      category: canonical.category,
      flavor: rawItem.flavor,
      size: rawItem.size,
      sugarLevel: rawItem.sugarLevel,
      iceLevel: rawItem.iceLevel,
      addBoba: rawItem.addBoba,
      addCreamCheese,
      quantity: rawItem.quantity,
      unitPrice,
      subtotal,
      notes: rawItem.notes,
    };
  });

  const unlockedFreeFries = eligibleDrinkSpend >= 200;

  if (unlockedFreeFries) {
    verifiedItems.push({
      id: "promo-free-medium-fries",
      productId: "promo-free-medium-fries",
      productName: "Free Medium Fries (Promo Reward)",
      category: "Snacks",
      flavor: "Cheese",
      size: "Medium",
      sugarLevel: "100%",
      iceLevel: "Regular Ice",
      addBoba: false,
      quantity: 1,
      unitPrice: 0,
      subtotal: 0,
      notes: "Reward for ordering ₱200+ in drinks",
    });
  }

  let downPaymentAmount = 0;
  if (paymentMethod === "gcash_full") {
    downPaymentAmount = totalAmount;
  } else if (paymentMethod === "gcash_downpayment") {
    downPaymentAmount = Math.ceil(totalAmount * 0.5);
  }

  return {
    items: verifiedItems,
    totalAmount,
    downPaymentAmount,
    eligibleDrinkSpend,
    unlockedFreeFries,
  };
}
