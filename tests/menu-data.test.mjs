import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const menu = JSON.parse(
  await readFile(new URL("../app/menu-data.json", import.meta.url), "utf8"),
);
const categories = new Map(
  menu.categories.map((category) => [category.category, category.items]),
);

test("menu contains all supplied products in the correct categories", () => {
  assert.deepEqual(
    Object.fromEntries([...categories].map(([category, items]) => [category, items.length])),
    {
      "Cream Cheese Series": 11,
      "Milk Tea Series": 8,
      "Milky Bomb Tea": 2,
      "Fruit Soda": 10,
      "Yakult Fruit Soda": 3,
      "Coffee Series": 6,
      "Float Series": 7,
      Snacks: 3,
    },
  );
});

test("catalog prices are positive and milk tea only has the supplied 12 oz price", () => {
  for (const category of menu.categories) {
    for (const item of category.items) {
      for (const price of Object.values(item.prices)) {
        assert.ok(Number.isInteger(price) && price > 0, `${item.name} has an invalid price`);
      }
    }
  }

  for (const item of categories.get("Milk Tea Series")) {
    assert.deepEqual(item.prices, { "12oz": 39 });
  }
});

test("float size labels preserve regular variants and the supplied Matcha prices", () => {
  const floats = categories.get("Float Series");
  assert.deepEqual(floats.find((item) => item.name === "Matcha Float").prices, {
    "12oz": 50,
    regular: 65,
  });
  assert.deepEqual(floats.find((item) => item.name === "Coffee Float").prices, {
    regular: 65,
  });
});

test("bundle prices and free-fries promotion match the supplied menu", () => {
  assert.deepEqual(
    menu.bundlesAndPromos.map(({ name, price }) => [name, price ?? null]),
    [
      ["Barkada Bundle (Fruit Soda)", 135],
      ["Barkada Bundle (Milk Tea)", 155],
      ["Free Medium Fries Promo", null],
    ],
  );
  assert.equal(menu.bundlesAndPromos[2].condition, "Buy drinks worth at least 200 PHP");
  assert.equal(menu.bundlesAndPromos[2].reward, "Free Medium Fries");
});
