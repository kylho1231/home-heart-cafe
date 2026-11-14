"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import catalogSource from "./menu-data.json";
import productImages from "./product-images.json";

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  flavors: string[];
  sizes: { label: string; price: number }[];
  colors: [string, string];
  accent: string;
  image?: string;
  badge?: string;
  ownerReview?: string;
};

type CartItem = {
  id: string;
  productId: string;
  flavor: string;
  size: string;
  quantity: number;
  addBoba: boolean;
  basePrice: number;
  bundleName?: string;
  bundleSelections?: string[];
};

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.productId === "string" &&
    typeof item.flavor === "string" &&
    typeof item.size === "string" &&
    typeof item.quantity === "number" &&
    typeof item.addBoba === "boolean" &&
    typeof item.basePrice === "number" &&
    (item.bundleName === undefined || typeof item.bundleName === "string") &&
    (item.bundleSelections === undefined ||
      (Array.isArray(item.bundleSelections) &&
        item.bundleSelections.every((selection) => typeof selection === "string")))
  );
}

type CatalogCategory = {
  category: string;
  notes?: string;
  items: {
    name: string;
    description?: string;
    prices: Record<string, number | undefined>;
  }[];
};

type CatalogBundle = {
  name: string;
  includes: string[];
  price: number;
};

type CatalogPromotion = {
  name: string;
  condition: string;
  reward: string;
};

type CatalogBundleOrPromotion = {
  name: string;
  includes?: string[];
  price?: number;
  condition?: string;
  reward?: string;
};

type MenuCatalog = {
  cafeName: string;
  currency: string;
  categories: CatalogCategory[];
  addOns: { name: string; price: number }[];
  bundlesAndPromos: CatalogBundleOrPromotion[];
};

const menuData: MenuCatalog = catalogSource;
const productImageMap: Record<string, string> = productImages;
const categories = ["All", ...menuData.categories.map(({ category }) => category)];
const paidBundles = menuData.bundlesAndPromos.filter(
  (bundle): bundle is CatalogBundle =>
    typeof bundle.price === "number" && Array.isArray(bundle.includes),
);
const freeFriesPromotion = menuData.bundlesAndPromos.find(
  (promotion): promotion is CatalogPromotion =>
    typeof promotion.condition === "string" &&
    typeof promotion.reward === "string",
);
const friesFlavorOptions = menuData.categories
  .find(({ category }) => category === "Snacks")
  ?.items.map(({ name }) => name) ?? [];

const productPalettes: Record<string, { colors: [string, string]; accent: string }> = {
  "Cream Cheese Series": { colors: ["#f4afc8", "#f9e1e9"], accent: "#b42356" },
  "Milk Tea Series": { colors: ["#d0aa82", "#f1e2cf"], accent: "#815538" },
  "Milky Bomb Tea": { colors: ["#c1c5f4", "#f0eefa"], accent: "#6265b9" },
  "Fruit Soda": { colors: ["#a9c5ff", "#e4edff"], accent: "#3d5d9c" },
  "Yakult Fruit Soda": { colors: ["#ffc6d2", "#fff0ed"], accent: "#bf4169" },
  "Coffee Series": { colors: ["#c99563", "#efdab9"], accent: "#70442d" },
  "Float Series": { colors: ["#9b684d", "#f0d7b1"], accent: "#70452f" },
  Snacks: { colors: ["#edbd73", "#f6e1bb"], accent: "#b8782b" },
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatSizeLabel(size: string) {
  const ounceSize = size.match(/^(\d+)oz$/i);
  if (ounceSize) return `${ounceSize[1]} oz`;
  return size === "regular" ? "Regular" : size;
}

function requireMenuPrice(
  productName: string,
  size: string,
  price: number | undefined,
) {
  if (price === undefined) {
    throw new Error(`Missing price for ${productName} (${size}).`);
  }
  return price;
}

function getProductPalette(category: string, name: string) {
  const palette = productPalettes[category] ?? productPalettes["Coffee Series"];
  const lowerName = name.toLowerCase();
  if (lowerName.includes("strawberry")) {
    return { colors: ["#f5adc4", "#fae3e7"] as [string, string], accent: "#b42356" };
  }
  if (lowerName.includes("blueberry") || lowerName.includes("blue lemonade")) {
    return { colors: ["#9cb8fa", "#e2ecff"] as [string, string], accent: "#3e5ba0" };
  }
  if (lowerName.includes("mango") || lowerName.includes("peach")) {
    return { colors: ["#f1bb73", "#fff0cb"] as [string, string], accent: "#a65a25" };
  }
  if (lowerName.includes("matcha") || lowerName.includes("green apple")) {
    return { colors: ["#b1c38a", "#edf0d5"] as [string, string], accent: "#4e6942" };
  }
  if (lowerName.includes("taro") || lowerName.includes("ube")) {
    return { colors: ["#b6a4de", "#eee6f8"] as [string, string], accent: "#665090" };
  }
  return palette;
}

const products: Product[] = menuData.categories.flatMap((category) =>
  category.items.map((item) => {
    const palette = getProductPalette(category.category, item.name);
    return {
      id: slugify(item.name),
      name: item.name,
      category: category.category,
      description: item.description ?? "",
      flavors: [item.name],
      sizes: Object.entries(item.prices).map(([label, price]) => ({
        label: formatSizeLabel(label),
        price: requireMenuPrice(item.name, label, price),
      })),
      colors: palette.colors,
      accent: palette.accent,
      image: productImageMap[slugify(item.name)],
    };
  }),
);

const bundleChoices = paidBundles.map((bundle) => ({
  ...bundle,
  id: slugify(bundle.name),
  drinkCategory: bundle.name.includes("Fruit Soda") ? "Fruit Soda" : "Milk Tea Series",
}));

function getBundleDrinks(category: string) {
  return products.filter(
    (product) =>
      product.category === category &&
      product.sizes.some((size) => size.label === "12 oz"),
  );
}

const ownerReviewItems = [
  "The small label near the bottom of the fruit soda section says 'Iced Coffee' and should be reviewed before publication.",
  "Extra Boba Pearls compatibility has not been configured for specific drinks.",
  "Free fries promotion terms such as eligible drinks, stacking, and redemption limits need owner confirmation.",
];

const queueItems = [
  { id: "HC-4821", name: "Walk-in customer", status: "Preparing", items: 2 },
  { id: "HC-4819", name: "Dine-in order", status: "Accepted", items: 3 },
  { id: "HC-4817", name: "Pickup order", status: "Ready", items: 1 },
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
}

function getProductById(productId: string) {
  return products.find((product) => product.id === productId) ?? products[0];
}

function getCartItemTitle(item: CartItem) {
  return item.bundleName ?? getProductById(item.productId).name;
}

function getCartItemDescription(item: CartItem) {
  if (item.bundleSelections) return item.bundleSelections.join(" · ");
  return `${item.size}${item.addBoba ? ` · Boba +${formatMoney(menuData.addOns[0].price)}` : ""}`;
}

function CupArt({
  product,
  flavor,
  size,
  priority = false,
}: {
  product: Product;
  flavor: string;
  size: string;
  priority?: boolean;
}) {
  const match = product.sizes.find((entry) => entry.label === size) ?? product.sizes[0];
  const fill = product.colors[0];

  if (product.image) {
    return (
      <div className="cup-stage cup-stage--photo">
        <Image
          src={product.image}
          alt=""
          fill
          loading={priority ? "eager" : "lazy"}
          sizes={priority
            ? "(max-width: 620px) 100vw, 50vw"
            : "(max-width: 620px) 50vw, (max-width: 860px) 50vw, 33vw"}
          className="product-photo"
        />
      </div>
    );
  }

  return (
    <div className="cup-stage" style={{ background: `linear-gradient(135deg, ${product.colors[0]}, ${product.colors[1]})` }}>
      <div className="cup-shadow" />
      <div className="cup-body" style={{ background: `linear-gradient(180deg, ${fill}, ${product.colors[1]})` }}>
        <div className="cup-ripple" style={{ background: product.accent }} />
        <div className="cup-label">
          <span>Home Café</span>
          <small>{flavor}</small>
        </div>
      </div>
      <div className="cup-top" style={{ background: `linear-gradient(180deg, ${product.colors[1]}, ${fill})` }} />
      <div className="cup-serve" style={{ background: `linear-gradient(180deg, ${product.accent}, ${product.colors[0]})` }} />
      <div className="cup-price">{formatMoney(match.price)}</div>
      <div className="cup-size">{size}</div>
    </div>
  );
}

function FriesArt({ flavor }: { flavor: string }) {
  const flavorColor = flavor.toLowerCase().includes("cheese")
    ? "#f0bb4d"
    : flavor.toLowerCase().includes("onion")
      ? "#cda85c"
      : "#f0d586";

  return (
    <div className="fries-stage">
      <div className="fries-cup" style={{ background: `linear-gradient(180deg, #f4e8d7, #f4d2a5)` }}>
        <div className="fries-label" style={{ background: flavorColor }}>{flavor}</div>
        <div className="fries-stack">
          {Array.from({ length: 8 }).map((_, index) => (
            <span key={index} style={{ background: `linear-gradient(180deg, ${index % 2 === 0 ? "#f5d089" : "#f7e4a5"}, #e4ab45)` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(products[0].id);
  const [selectedFlavor, setSelectedFlavor] = useState(products[0].flavors[0]);
  const [selectedSize, setSelectedSize] = useState(products[0].sizes[0].label);
  const [selectedBoba, setSelectedBoba] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [bundleId, setBundleId] = useState(bundleChoices[0].id);
  const [bundleDrinkIds, setBundleDrinkIds] = useState(() =>
    Array.from({ length: 3 }, () => getBundleDrinks(bundleChoices[0].drinkCategory)[0].id),
  );
  const [bundleFriesId, setBundleFriesId] = useState(
    products.find((product) => product.category === "Snacks")?.id ?? "",
  );
  const [customerName, setCustomerName] = useState("Guest");
  const [paymentMethod, setPaymentMethod] = useState("Pay at counter");

  useEffect(() => {
    const saved = window.localStorage.getItem("home-heart-cart-v2");
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      if (saved) {
        try {
          const parsed: unknown = JSON.parse(saved);
          if (!Array.isArray(parsed) || !parsed.every(isCartItem)) {
            throw new Error("Stored cart has an invalid shape.");
          }
          setCart(parsed);
        } catch (error) {
          console.error("Could not restore the saved cart.", error);
        }
      }
      setCartHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!cartHydrated) return;
    window.localStorage.setItem("home-heart-cart-v2", JSON.stringify(cart));
  }, [cart, cartHydrated]);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        activeCategory === "All" || product.category === activeCategory;
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchTerm]);

  const selectedProduct = useMemo(
    () => getProductById(selectedProductId),
    [selectedProductId],
  );

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.basePrice * item.quantity, 0),
    [cart],
  );

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartSubtotal;
  const activeBundle =
    bundleChoices.find((bundle) => bundle.id === bundleId) ?? bundleChoices[0];
  const activeBundleDrinks = getBundleDrinks(activeBundle.drinkCategory);
  const activeCategoryNote =
    menuData.categories.find(({ category }) => category === activeCategory)?.notes;
  const bobaAddon = menuData.addOns.find((addon) => addon.name === "Extra Boba Pearls");

  const selectedPrice = useMemo(() => {
    const sizeEntry = selectedProduct.sizes.find((size) => size.label === selectedSize);
    return (sizeEntry?.price ?? 0) + (selectedBoba ? (bobaAddon?.price ?? 0) : 0);
  }, [selectedProduct, selectedSize, selectedBoba, bobaAddon]);

  function addLineItem(product: Product, flavor: string, size: string, addBoba: boolean, quantity = 1) {
    const sizeEntry = product.sizes.find((entry) => entry.label === size) ?? product.sizes[0];
    const linePrice = (sizeEntry?.price ?? 0) + (addBoba ? (bobaAddon?.price ?? 0) : 0);
    const key = `${product.id}-${flavor}-${size}-${addBoba ? "boba" : "plain"}`;

    setCart((current) => {
      const existing = current.find((item) => item.id === key);
      if (existing) {
        return current.map((item) =>
          item.id === key ? { ...item, quantity: item.quantity + quantity } : item,
        );
      }

      return [
        ...current,
        {
          id: key,
          productId: product.id,
          flavor,
          size,
          quantity,
          addBoba,
          basePrice: linePrice,
        },
      ];
    });
  }

  function addProductToCart() {
    addLineItem(selectedProduct, selectedFlavor, selectedSize, selectedBoba, 1);
  }

  function updateCartQuantity(id: string, delta: number) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function selectCategory(category: string) {
    setActiveCategory(category);
    setSearchTerm("");
    const firstProduct =
      category === "All"
        ? products[0]
        : products.find((product) => product.category === category);

    if (!firstProduct) return;

    setSelectedProductId(firstProduct.id);
    setSelectedFlavor(firstProduct.flavors[0]);
    setSelectedSize(firstProduct.sizes[0].label);
    setSelectedBoba(false);
  }

  function addBundleToCart() {
    const selectedDrinks = bundleDrinkIds.map((id) =>
      activeBundleDrinks.find((product) => product.id === id),
    );
    const friesProduct = products.find((product) => product.id === bundleFriesId);
    const friesIsLarge = friesProduct?.sizes.some(
      (size) => size.label === "Large",
    );
    const validDrinks = selectedDrinks.filter(
      (product): product is Product => product !== undefined,
    );

    if (
      validDrinks.length !== 3 ||
      !friesProduct ||
      friesProduct.category !== "Snacks" ||
      !friesIsLarge
    ) {
      window.alert("Select three eligible 12 oz drinks and one large fries flavor.");
      return;
    }

    const selections = [
      ...validDrinks.map((product) => product.name),
      `${friesProduct.name} (Large)`,
    ];
    const lineId = `${activeBundle.id}:${bundleDrinkIds.join("|")}:${bundleFriesId}`;
    setCart((current) => {
      const existing = current.find((item) => item.id === lineId);
      if (existing) {
        return current.map((item) =>
          item.id === lineId ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [
        ...current,
        {
          id: lineId,
          productId: "",
          flavor: "",
          size: "Bundle",
          quantity: 1,
          addBoba: false,
          basePrice: activeBundle.price,
          bundleName: activeBundle.name,
          bundleSelections: selections,
        },
      ];
    });
    setCheckoutOpen(true);
  }

  return (
    <main className="page-shell">
      <div className="topbar-wrap">
        <header className="topbar container-shell">
          <div>
            <p className="eyebrow">Home ❤️ Café</p>
            <h1>Home ❤️ Cafe</h1>
          </div>
          <div className="topbar-meta">
            <span>Eat, Drink & Good Vibes</span>
            <button className="secondary-btn" onClick={() => setCheckoutOpen(true)}>
              Cart ({cartItemCount})
            </button>
          </div>
        </header>
      </div>

      <section className="hero container-shell">
        <div className="hero-info">
          <p className="mini-tag">Sips of happiness in every cup.</p>
          <h2>Fresh drinks, fries, and creamy café favorites.</h2>
          <p>
            Browse the menu, build a barkada bundle, and complete a simple walk-in order flow for the Home Café menu.
          </p>
          <div className="hero-actions">
            <a className="primary-btn" href="#menu" onClick={() => selectCategory("All")}>Order Now</a>
            <button className="ghost-btn" onClick={() => setCheckoutOpen(true)}>View Cart</button>
          </div>
        </div>

        <div className="hero-showcase">
          <CupArt
            product={selectedProduct}
            flavor={selectedFlavor}
            size={selectedSize}
            priority
          />
          <div className="hero-fries">
            <FriesArt flavor={friesFlavorOptions[0]} />
          </div>
        </div>
      </section>

      <section className="category-bar container-shell" aria-label="Menu categories">
        <div className="tab-row" role="group" aria-label="Filter menu by category">
          {categories.map((category) => (
            <button
              key={category}
              className={activeCategory === category ? "tab active" : "tab"}
              aria-pressed={activeCategory === category}
              onClick={() => selectCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="menu-intro container-shell" id="menu">
        <div>
          <p className="section-kicker">THE HOME CAFÉ MENU</p>
          <h2>Find your new favorite.</h2>
          {activeCategoryNote ? (
            <p className="menu-category-note">{activeCategoryNote}</p>
          ) : null}
        </div>
        <div className="menu-tools">
          <label className="menu-search">
            <span className="sr-only">Search menu</span>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <circle cx="10.8" cy="10.8" r="6.8" />
              <path d="m16 16 4.5 4.5" />
            </svg>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search drinks & fries"
            />
          </label>
          <p>Product photos and illustrations · Prices in Philippine pesos</p>
        </div>
      </section>

      <section className="menu-grid container-shell">
        <div className="product-list">
          {filteredProducts.length === 0 ? (
            <div className="menu-empty" role="status">
              <strong>No menu items found</strong>
              <span>Try a different search or category.</span>
            </div>
          ) : null}
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              className={selectedProductId === product.id ? "product-card selected" : "product-card"}
              aria-pressed={selectedProductId === product.id}
              onClick={() => {
                setSelectedProductId(product.id);
                setSelectedFlavor(product.flavors[0]);
                setSelectedSize(product.sizes[0].label);
                setSelectedBoba(false);
              }}
            >
              <div className="card-visual" style={{ background: `linear-gradient(135deg, ${product.colors[0]}, ${product.colors[1]})` }}>
                <CupArt product={product} flavor={product.flavors[0]} size={product.sizes[0].label} />
              </div>
              <div className="card-copy">
                <div className="card-title-row">
                  <h3>{product.name}</h3>
                  {product.badge ? <span className="badge">{product.badge}</span> : null}
                </div>
                {product.description ? <p>{product.description}</p> : null}
                <div className="card-price-row">
                  <strong>{formatMoney(product.sizes[0].price)}</strong>
                  <span>{product.sizes[0].label}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <aside className="cart-panel">
          <div className="panel-block">
            <div className="panel-header">
              <h3>Customize</h3>
              <span>{selectedProduct.category}</span>
            </div>

            <div className="selected-product-summary">
              <strong>{selectedProduct.name}</strong>
              {selectedProduct.description ? <p>{selectedProduct.description}</p> : null}
            </div>

            <div className="selection-block">
              <label>Size</label>
              <div className="chip-grid compact">
                {selectedProduct.sizes.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    className={selectedSize === option.label ? "chip active" : "chip"}
                    onClick={() => setSelectedSize(option.label)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="selection-block check-row">
              <label htmlFor="boba-addon">
                {bobaAddon?.name ?? "Extra Boba Pearls"} (+{formatMoney(bobaAddon?.price ?? 0)})
                <small>Availability by drink needs owner confirmation.</small>
              </label>
              <input
                id="boba-addon"
                type="checkbox"
                checked={false}
                disabled
                title="Boba compatibility has not been configured."
                onChange={(event) => setSelectedBoba(event.target.checked)}
              />
            </div>

            <div className="price-summary">
              <div>
                <span>Unit price</span>
                <strong>{formatMoney(selectedPrice)}</strong>
              </div>
              <button className="primary-btn full" onClick={addProductToCart}>Add to cart</button>
            </div>
          </div>

          <div className="panel-block">
            <div className="panel-header">
              <h3>Cart</h3>
              <span>{cartItemCount} {cartItemCount === 1 ? "item" : "items"}</span>
            </div>
            {cart.length === 0 ? (
              <p className="empty-state">Your cart is empty.</p>
            ) : (
              <div className="cart-list">
                {cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div>
                      <strong>{getCartItemTitle(item)}</strong>
                      <small>{getCartItemDescription(item)}</small>
                    </div>
                    <div className="cart-controls">
                      <button type="button" aria-label={`Remove one ${getCartItemTitle(item)}`} onClick={() => updateCartQuantity(item.id, -1)}>-</button>
                      <span>{item.quantity}</span>
                      <button type="button" aria-label={`Add one ${getCartItemTitle(item)}`} onClick={() => updateCartQuantity(item.id, 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="totals-box">
              <div><span>Subtotal</span><strong>{formatMoney(cartSubtotal)}</strong></div>
              <div><span>Promotion</span><strong className="promo-state">Pending approval</strong></div>
              <div className="grand-total"><span>Total</span><strong>{formatMoney(cartTotal)}</strong></div>
            </div>
            <button className="primary-btn full" onClick={() => setCheckoutOpen(true)}>Checkout</button>
          </div>
        </aside>
      </section>

      <section className="bundle-area container-shell">
        <div className="bundle-card">
          <div className="panel-header">
            <h3>Barkada bundle builder</h3>
            <label className="bundle-kind">
              <span>Bundle type</span>
              <select
                value={bundleId}
                onChange={(event) => {
                  const nextBundle =
                    bundleChoices.find((bundle) => bundle.id === event.target.value) ??
                    bundleChoices[0];
                  setBundleId(nextBundle.id);
                  const eligibleDrinks = getBundleDrinks(nextBundle.drinkCategory);
                  setBundleDrinkIds(
                    Array.from({ length: 3 }, () => eligibleDrinks[0].id),
                  );
                }}
              >
                {bundleChoices.map((bundle) => (
                  <option key={bundle.id} value={bundle.id}>
                    {bundle.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="bundle-description">{activeBundle.includes.join(" + ")}</p>

          <div className="bundle-grid">
            {bundleDrinkIds.map((productId, index) => (
              <div key={`drink-${index + 1}`} className="bundle-slot">
                <label htmlFor={`bundle-drink-${index + 1}`}>Drink {index + 1} · 12 oz</label>
                <select
                  id={`bundle-drink-${index + 1}`}
                  value={productId}
                  onChange={(event) =>
                    setBundleDrinkIds((current) =>
                      current.map((id, slot) =>
                        slot === index ? event.target.value : id,
                      ),
                    )
                  }
                >
                  {activeBundleDrinks.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            <div className="bundle-slot">
              <label htmlFor="bundle-fries">Large fries</label>
              <select
                id="bundle-fries"
                value={bundleFriesId}
                onChange={(event) => setBundleFriesId(event.target.value)}
              >
                {products
                  .filter(
                    (product) =>
                      product.category === "Snacks" &&
                      product.sizes.some((size) => size.label === "Large"),
                  )
                  .map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="bundle-footer">
            <div className="promo-pill">Bundle price: {formatMoney(activeBundle.price)}</div>
            <button className="primary-btn" onClick={addBundleToCart}>Add bundle</button>
          </div>
        </div>
        {freeFriesPromotion ? (
          <div className="promo-note">
            <strong>{freeFriesPromotion.name}</strong>
            <span>
              {freeFriesPromotion.condition} and get {freeFriesPromotion.reward.toLowerCase()}.
              Eligibility and redemption terms are still being confirmed.
            </span>
          </div>
        ) : null}
      </section>

      <section className="operations container-shell">
        <div className="ops-card">
          <div className="panel-header">
            <h3>Staff queue</h3>
            <span>Today</span>
          </div>
          <div className="queue-list">
            {queueItems.map((order) => (
              <div key={order.id} className="queue-item">
                <div>
                  <strong>{order.id}</strong>
                  <small>{order.name}</small>
                </div>
                <span>{order.status}</span>
                <em>{order.items} items</em>
              </div>
            ))}
          </div>
        </div>

        <div className="ops-card">
          <div className="panel-header">
            <h3>Owner review</h3>
            <span>Draft notes</span>
          </div>
          <ul className="review-list">
            {ownerReviewItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mobile-cart-bar" role="region" aria-label="Current cart summary">
        <div>
          <strong>{formatMoney(cartTotal)}</strong>
          <span>{cartItemCount} {cartItemCount === 1 ? "item" : "items"} in your cart</span>
        </div>
        <button className="primary-btn" onClick={() => setCheckoutOpen(true)}>
          View cart
        </button>
      </div>

      {checkoutOpen ? (
        <div className="checkout-sheet" onClick={() => setCheckoutOpen(false)}>
          <div
            className="checkout-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="panel-header">
              <h3 id="checkout-title">Checkout</h3>
              <button className="close-btn" aria-label="Close checkout" onClick={() => setCheckoutOpen(false)}>×</button>
            </div>

            <label className="field-row">
              <span>Customer</span>
              <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
            </label>

            <label className="field-row">
              <span>Payment</span>
              <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                <option>Pay at counter</option>
                <option>GCash (draft)</option>
                <option>Card (draft)</option>
              </select>
            </label>

            <div className="receipt-block">
              {cart.length === 0 ? (
                <p>No items yet. Add a drink or fries to begin.</p>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="receipt-row">
                    <div>
                      <strong>{getCartItemTitle(item)}</strong>
                      <small>{getCartItemDescription(item)}</small>
                    </div>
                    <span>{formatMoney(item.basePrice * item.quantity)}</span>
                  </div>
                ))
              )}
            </div>
            <div className="totals-box summary-box">
              <div><span>Subtotal</span><strong>{formatMoney(cartSubtotal)}</strong></div>
              <div><span>Promotion</span><strong className="promo-state">Pending approval</strong></div>
              <div className="grand-total"><span>Total</span><strong>{formatMoney(cartTotal)}</strong></div>
            </div>
            <button className="primary-btn full" onClick={() => setCheckoutOpen(false)}>
              Submit order
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
