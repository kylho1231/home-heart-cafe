import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const menu = JSON.parse(
  await readFile(path.join(root, "app/menu-data.json"), "utf8"),
);
const images = JSON.parse(
  await readFile(path.join(root, "app/product-images.json"), "utf8"),
);
const productIds = new Set(
  menu.categories.flatMap((category) =>
    category.items.map(({ name }) =>
      name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    ),
  ),
);

test("product photos map to catalog items and existing public assets", async () => {
  assert.equal(Object.keys(images).length, 20);

  for (const [productId, imagePath] of Object.entries(images)) {
    assert.ok(productIds.has(productId), `${productId} is not in the menu catalog`);
    assert.match(imagePath, /^\/products\/[a-z0-9-]+\.webp$/);
    await access(path.join(root, "public", imagePath.slice(1)));
  }
});
