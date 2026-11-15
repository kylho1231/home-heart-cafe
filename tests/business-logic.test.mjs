import assert from "node:assert/strict";
import test from "node:test";
import { recalculateOrderPrices } from "../lib/validation.ts";
import { getManilaDateKey } from "../lib/orders-db.ts";

test("Business Logic: Free Medium Fries promo requires ₱200+ in drinks, excluding snacks and bundles", () => {
  // Case A: Only snacks (₱240 worth of French Fries) -> must NOT unlock free fries
  const snacksOnly = [
    {
      id: "snack-1",
      productId: "cheese-french-fries",
      productName: "Cheese French Fries",
      category: "Snacks",
      flavor: "Cheese",
      size: "Large",
      sugarLevel: "100%",
      iceLevel: "Regular Ice",
      addBoba: false,
      quantity: 4, // 4 x ₱60 = ₱240
    },
  ];

  const snackResult = recalculateOrderPrices(snacksOnly, "counter_cash");
  assert.equal(snackResult.totalAmount, 240);
  assert.equal(snackResult.eligibleDrinkSpend, 0, "Snacks do not count toward drink spend");
  assert.equal(snackResult.unlockedFreeFries, false, "Snacks only must not unlock free fries");

  // Case B: Barkada Bundle (₱155) -> must NOT count toward ₱200 threshold
  const bundleOnly = [
    {
      id: "bundle-1",
      productId: "bundle-barkada-milk-tea",
      productName: "Barkada Bundle (Milk Tea)",
      category: "Bundles",
      flavor: "Barkada Mix",
      size: "Bundle",
      sugarLevel: "75%",
      iceLevel: "Regular Ice",
      addBoba: false,
      quantity: 1,
    },
  ];

  const bundleResult = recalculateOrderPrices(bundleOnly, "counter_cash");
  assert.equal(bundleResult.totalAmount, 155);
  assert.equal(bundleResult.eligibleDrinkSpend, 0, "Bundles do not count toward ₱200 threshold");
  assert.equal(bundleResult.unlockedFreeFries, false, "Bundle alone must not unlock free fries");

  // Case C: Ala-carte drinks reaching ₱208 -> MUST unlock exactly 1 free medium fries
  const eligibleDrinks = [
    {
      id: "drink-1",
      productId: "strawberry-cream-cheese",
      productName: "Strawberry Cream Cheese",
      category: "Cream Cheese Series",
      flavor: "Strawberry",
      size: "16 oz",
      sugarLevel: "75%",
      iceLevel: "Regular Ice",
      addBoba: false,
      quantity: 3, // 3 x ₱59 = ₱177
    },
    {
      id: "drink-2",
      productId: "chocolate-milk-tea",
      productName: "Chocolate Milk Tea",
      category: "Milk Tea Series",
      flavor: "Chocolate",
      size: "12 oz",
      sugarLevel: "75%",
      iceLevel: "Regular Ice",
      addBoba: false,
      quantity: 1, // 1 x ₱39 = ₱39 (Total = ₱216)
    },
  ];

  const eligibleResult = recalculateOrderPrices(eligibleDrinks, "counter_cash");
  assert.equal(eligibleResult.eligibleDrinkSpend, 216);
  assert.equal(eligibleResult.unlockedFreeFries, true, "Must unlock free fries when drink spend >= ₱200");

  const promoItem = eligibleResult.items.find((it) => it.productId === "promo-free-medium-fries");
  assert.ok(promoItem, "Order items must include the free medium fries reward");
  assert.equal(promoItem.unitPrice, 0);
  assert.equal(promoItem.subtotal, 0);

  // Case D: Higher spend (₱450) does not stack multiple free fries
  const largeDrinkOrder = [
    {
      ...eligibleDrinks[0],
      quantity: 8, // 8 x ₱59 = ₱472
    },
  ];

  const largeResult = recalculateOrderPrices(largeDrinkOrder, "counter_cash");
  const freeFriesCount = largeResult.items.filter((it) => it.productId === "promo-free-medium-fries").length;
  assert.equal(freeFriesCount, 1, "Must never stack promo reward twice on a single order");
});

test("Business Logic: Barkada bundle price enforcement", () => {
  const fruitSodaBundle = [
    {
      id: "b-soda",
      productId: "bundle-barkada-fruit-soda",
      productName: "Barkada Bundle (Fruit Soda)",
      category: "Bundles",
      flavor: "Barkada Mix",
      size: "Bundle",
      sugarLevel: "75%",
      iceLevel: "Regular Ice",
      addBoba: false,
      quantity: 1,
    },
  ];

  const fruitSodaRes = recalculateOrderPrices(fruitSodaBundle, "counter_cash");
  assert.equal(fruitSodaRes.totalAmount, 135, "Fruit Soda Barkada bundle must be exactly ₱135");

  const milkTeaBundle = [
    {
      id: "b-milktea",
      productId: "bundle-barkada-milk-tea",
      productName: "Barkada Bundle (Milk Tea)",
      category: "Bundles",
      flavor: "Barkada Mix",
      size: "Bundle",
      sugarLevel: "75%",
      iceLevel: "Regular Ice",
      addBoba: false,
      quantity: 1,
    },
  ];

  const milkTeaRes = recalculateOrderPrices(milkTeaBundle, "counter_cash");
  assert.equal(milkTeaRes.totalAmount, 155, "Milk Tea Barkada bundle must be exactly ₱155");
});

test("Business Logic: Manila timezone date formatting for daily sequential reset", () => {
  const manilaDate = getManilaDateKey();
  assert.match(manilaDate, /^\d{4}-\d{2}-\d{2}$/, "Manila date key must be YYYY-MM-DD");

  // Specific ISO date formatting in Manila
  const testIso = "2026-11-15T01:00:00.000Z"; // 9:00 AM Manila on 2026-11-15
  assert.equal(getManilaDateKey(testIso), "2026-11-15");
});
