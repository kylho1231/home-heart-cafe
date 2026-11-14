"use client";

import { useEffect, useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  flavors: string[];
  sizes: { label: string; price: number }[];
  colors: [string, string];
  accent: string;
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
};

const categories = [
  "All",
  "Cream Cheese Series",
  "Milk Tea Series",
  "Fruit Soda",
  "Yakult Fruit Soda",
  "Milky Bomb Tea",
  "Coffee Series",
  "Float Series",
  "French Fries",
];

const products: Product[] = [
  {
    id: "cream-cheese-strawberry",
    name: "Cream Cheese Strawberry",
    category: "Cream Cheese Series",
    description: "Strawberry cream cheese float with a soft pink finish.",
    flavors: ["Strawberry", "Mango", "Blueberry", "Chocolate", "Matcha", "Taro", "Okinawa", "Cookies & Cream", "Dark Chocolate", "Wintermelon", "Red Velvet"],
    sizes: [
      { label: "12 oz", price: 49 },
      { label: "16 oz", price: 59 },
      { label: "22 oz", price: 79 },
    ],
    colors: ["#f7b5d2", "#f3d7e5"],
    accent: "#c52f68",
    badge: "Best seller",
  },
  {
    id: "milk-tea-cookies-cream",
    name: "Milk Tea Cookies & Cream",
    category: "Milk Tea Series",
    description: "Classic milk tea with a mellow creamy finish.",
    flavors: ["Cookies & Cream", "Taro", "Okinawa", "Wintermelon", "Dark Chocolate", "Red Velvet", "Matcha", "Chocolate"],
    sizes: [
      { label: "12 oz", price: 39 },
      { label: "16 oz", price: 0 },
      { label: "22 oz", price: 0 },
    ],
    colors: ["#e5d1a8", "#f5e3d8"],
    accent: "#8d6d52",
    badge: "Draft price",
    ownerReview: "Owner approval required for 16 oz and 22 oz variants.",
  },
  {
    id: "fruit-soda-blueberry",
    name: "Fruit Soda Blueberry",
    category: "Fruit Soda",
    description: "Sparkling fruit soda in a bright, refreshing finish.",
    flavors: ["Blueberry", "Strawberry", "Green Apple", "Mango", "Yogurt", "Grapes", "Four Seasons", "Peach Mango", "Blue Lemonade"],
    sizes: [
      { label: "12 oz", price: 29 },
      { label: "16 oz", price: 39 },
      { label: "22 oz", price: 49 },
    ],
    colors: ["#b0c7ff", "#dfe7ff"],
    accent: "#2d5c8f",
  },
  {
    id: "yakult-fruit-soda-blueberry",
    name: "Yakult Fruit Soda Blueberry",
    category: "Yakult Fruit Soda",
    description: "Yakult fruit soda with a crisp fruit finish.",
    flavors: ["Yakult Blueberry", "Yakult Grapes", "Yakult Mango"],
    sizes: [
      { label: "22 oz", price: 65 },
    ],
    colors: ["#90b2ff", "#e2f0ff"],
    accent: "#2a4a95",
  },
  {
    id: "milky-bomb-tea-blueberry",
    name: "Milky Bomb Tea Blueberry",
    category: "Milky Bomb Tea",
    description: "Creamy milk tea with soft fruit notes and pearls.",
    flavors: ["Blueberry", "Mango"],
    sizes: [
      { label: "12 oz", price: 40 },
      { label: "16 oz", price: 50 },
      { label: "22 oz", price: 60 },
    ],
    colors: ["#b7beff", "#edf2ff"],
    accent: "#5362c4",
  },
  {
    id: "coffee-spanish-latte",
    name: "Spanish Latte",
    category: "Coffee Series",
    description: "Sweet coffee blend with a caramel cream impression.",
    flavors: ["Spanish Latte", "Salted Caramel", "French Vanilla", "Matcha Latte", "Hazelnut Latte", "Americano"],
    sizes: [
      { label: "12 oz", price: 69 },
      { label: "16 oz", price: 79 },
    ],
    colors: ["#dfb88d", "#f5e0bf"],
    accent: "#7a492d",
  },
  {
    id: "double-chocolate-float",
    name: "Double Chocolate Float",
    category: "Float Series",
    description: "Chocolate float with a creamy top and syrup finish.",
    flavors: ["Double Chocolate Float", "Coffee Float", "Ube Float", "Coke Float", "Sprite Float", "Matcha Float"],
    sizes: [
      { label: "12 oz", price: 50 },
      { label: "16 oz", price: 60 },
    ],
    colors: ["#8d5a3a", "#eac48d"],
    accent: "#5b2d14",
    ownerReview: "Matcha Float price conflicts between posters; owner confirmation needed.",
  },
  {
    id: "fries-salt",
    name: "French Fries",
    category: "French Fries",
    description: "Crispy fries served in a branded Home Café sleeve.",
    flavors: ["Salt", "Cheese", "Onion"],
    sizes: [
      { label: "Medium", price: 40 },
      { label: "Large", price: 60 },
    ],
    colors: ["#f0b17a", "#f1d8a8"],
    accent: "#c77b2b",
  },
  {
    id: "barkada-fruit-soda",
    name: "Fruit Soda Barkada Bundle",
    category: "Bundles",
    description: "Three 12 oz fruit sodas plus one large fries.",
    flavors: ["Blueberry", "Strawberry", "Green Apple", "Mango"],
    sizes: [{ label: "Bundle", price: 135 }],
    colors: ["#f8d7db", "#f4a6bf"],
    accent: "#ce4e7d",
    badge: "PROMO",
  },
];

const bundleSlots = [
  { label: "Drink 1" },
  { label: "Drink 2" },
  { label: "Drink 3" },
  { label: "Fries" },
];

const friesFlavorOptions = ["Salt", "Cheese", "Onion"];

const ownerReviewItems = [
  "Milk Tea Series 16 oz and 22 oz pricing needs owner approval.",
  "Matcha Float has conflicting pricing between the general menu and the float poster.",
  "The small label near the bottom of the fruit soda section says 'Iced Coffee' and should be reviewed before publication.",
  "The drink-spend promotion needs eligible products and active dates confirmed.",
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

function CupArt({ product, flavor, size }: { product: Product; flavor: string; size: string; }) {
  const match = product.sizes.find((entry) => entry.label === size) ?? product.sizes[0];
  const fill = product.colors[0];

  return (
    <div className="cup-stage" style={{ background: `linear-gradient(135deg, ${product.colors[0]}, ${product.colors[1]})` }}>
      <div className="cup-shadow" />
      <div className="cup-body" style={{ background: `linear-gradient(180deg, ${fill}, ${product.colors[1]})` }}>
        <div className="cup-ripple" style={{ background: product.accent }} />
        <div className="cup-label">
          <span>{product.name.split(" ").slice(0, 2).join(" ")}</span>
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
  const flavorMap: Record<string, string> = {
    Salt: "#f0d586",
    Cheese: "#f0bb4d",
    Onion: "#cda85c",
  };

  return (
    <div className="fries-stage">
      <div className="fries-cup" style={{ background: `linear-gradient(180deg, #f4e8d7, #f4d2a5)` }}>
        <div className="fries-label" style={{ background: flavorMap[flavor] }}>{flavor}</div>
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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState(products[0].id);
  const [selectedFlavor, setSelectedFlavor] = useState(products[0].flavors[0]);
  const [selectedSize, setSelectedSize] = useState(products[0].sizes[0].label);
  const [selectedBoba, setSelectedBoba] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [bundleSelections, setBundleSelections] = useState([
    { productId: products[0].id, flavor: products[0].flavors[0], size: products[0].sizes[0].label },
    { productId: products[1].id, flavor: products[1].flavors[0], size: products[1].sizes[0].label },
    { productId: products[2].id, flavor: products[2].flavors[0], size: products[2].sizes[0].label },
    { productId: "fries-salt", flavor: "Salt", size: "Large" },
  ]);
  const [bundleFriesFlavor, setBundleFriesFlavor] = useState("Salt");
  const [customerName, setCustomerName] = useState("Guest");
  const [paymentMethod, setPaymentMethod] = useState("Pay at counter");

  useEffect(() => {
    const saved = window.localStorage.getItem("home-heart-cart");
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch {
        setCart([]);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("home-heart-cart", JSON.stringify(cart));
  }, [cart]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === "All") return products;
    return products.filter((product) => product.category === activeCategory);
  }, [activeCategory]);

  const selectedProduct = useMemo(
    () => getProductById(selectedProductId),
    [selectedProductId],
  );

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.basePrice * item.quantity, 0),
    [cart],
  );

  const promoDiscount = cartSubtotal >= 200 ? 40 : 0;
  const cartTotal = cartSubtotal - promoDiscount;

  const selectedPrice = useMemo(() => {
    const sizeEntry = selectedProduct.sizes.find((size) => size.label === selectedSize);
    return (sizeEntry?.price ?? 0) + (selectedBoba ? 10 : 0);
  }, [selectedProduct, selectedSize, selectedBoba]);

  function addLineItem(product: Product, flavor: string, size: string, addBoba: boolean, quantity = 1) {
    const sizeEntry = product.sizes.find((entry) => entry.label === size) ?? product.sizes[0];
    const linePrice = (sizeEntry?.price ?? 0) + (addBoba ? 10 : 0);
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

  function handleBundleSelection(index: number, productId: string, flavor: string, size: string) {
    setBundleSelections((current) => {
      const next = [...current];
      next[index] = { productId, flavor, size };
      return next;
    });
  }

  function addBundleToCart() {
    const bundleDrinks = bundleSelections.slice(0, 3);
    const friesItem = bundleSelections[3];
    const hasMissing = bundleDrinks.some((drink) => !drink.productId || !drink.size) || !friesItem.productId;

    if (hasMissing) {
      window.alert("Please select all drink slots and a fries option to complete the bundle.");
      return;
    }

    setCart((current) => {
      const next = [...current];
      bundleDrinks.forEach((drink) => {
        const product = getProductById(drink.productId);
        const sizeEntry = product.sizes.find((entry) => entry.label === drink.size) ?? product.sizes[0];
        const key = `${product.id}-${drink.flavor}-${drink.size}-plain`;
        const existing = next.find((item) => item.id === key);
        if (existing) {
          existing.quantity += 1;
        } else {
          next.push({
            id: key,
            productId: product.id,
            flavor: drink.flavor,
            size: drink.size,
            quantity: 1,
            addBoba: false,
            basePrice: sizeEntry.price,
          });
        }
      });

      const friesProduct = getProductById(friesItem.productId);
      const friesSize = friesItem.size || "Large";
      const friesKey = `${friesProduct.id}-${bundleFriesFlavor}-${friesSize}-plain`;
      const existingFries = next.find((item) => item.id === friesKey);
      if (existingFries) {
        existingFries.quantity += 1;
      } else {
        next.push({
          id: friesKey,
          productId: friesProduct.id,
          flavor: bundleFriesFlavor,
          size: friesSize,
          quantity: 1,
          addBoba: false,
          basePrice: friesProduct.sizes.find((entry) => entry.label === friesSize)?.price ?? 60,
        });
      }

      return next;
    });
    setCheckoutOpen(true);
  }

  function getSelectedProductForSlot(slotIndex: number) {
    const selection = bundleSelections[slotIndex];
    return getProductById(selection.productId);
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
              Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
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
            <button className="primary-btn" onClick={() => setActiveCategory("All")}>Order Now</button>
            <button className="ghost-btn" onClick={() => setCheckoutOpen(true)}>View Cart</button>
          </div>
        </div>

        <div className="hero-showcase">
          <CupArt product={selectedProduct} flavor={selectedFlavor} size={selectedSize} />
          <div className="hero-fries">
            <FriesArt flavor={friesFlavorOptions[0]} />
          </div>
        </div>
      </section>

      <section className="category-bar container-shell">
        <div className="tab-row">
          {categories.map((category) => (
            <button
              key={category}
              className={activeCategory === category ? "tab active" : "tab"}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="menu-grid container-shell">
        <div className="product-list">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              className={selectedProductId === product.id ? "product-card selected" : "product-card"}
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
                <p>{product.description}</p>
                <div className="card-price-row">
                  <strong>{formatMoney(product.sizes[0].price || 0)}</strong>
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

            <div className="selection-block">
              <label>Flavor</label>
              <div className="chip-grid">
                {selectedProduct.flavors.map((flavor) => (
                  <button
                    key={flavor}
                    type="button"
                    className={selectedFlavor === flavor ? "chip active" : "chip"}
                    onClick={() => setSelectedFlavor(flavor)}
                  >
                    {flavor}
                  </button>
                ))}
              </div>
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
              <label>Approved add-on: Boba pearls</label>
              <input
                type="checkbox"
                checked={selectedBoba}
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
              <span>{cart.reduce((sum, item) => sum + item.quantity, 0)} items</span>
            </div>
            {cart.length === 0 ? (
              <p className="empty-state">Your cart is empty.</p>
            ) : (
              <div className="cart-list">
                {cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div>
                      <strong>{getProductById(item.productId).name}</strong>
                      <small>
                        {item.flavor} • {item.size}
                        {item.addBoba ? " • Boba +₱10" : ""}
                      </small>
                    </div>
                    <div className="cart-controls">
                      <button type="button" onClick={() => updateCartQuantity(item.id, -1)}>-</button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => updateCartQuantity(item.id, 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="totals-box">
              <div><span>Subtotal</span><strong>{formatMoney(cartSubtotal)}</strong></div>
              <div><span>Promo</span><strong>-{formatMoney(promoDiscount)}</strong></div>
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
            <span>3 drinks + 1 fries</span>
          </div>

          <div className="bundle-grid">
            {bundleSlots.map((slot, index) => {
              const product = index < 3 ? getSelectedProductForSlot(index) : getProductById("fries-salt");
              const selection = bundleSelections[index];

              return (
                <div key={slot.label} className="bundle-slot">
                  <label>{slot.label}</label>
                  {index < 3 ? (
                    <>
                      <select
                        value={selection.productId}
                        onChange={(event) => {
                          const selected = getProductById(event.target.value);
                          setBundleSelections((current) => {
                            const next = [...current];
                            next[index] = {
                              productId: selected.id,
                              flavor: selected.flavors[0],
                              size: selected.sizes[0].label,
                            };
                            return next;
                          });
                        }}
                      >
                        {products
                          .filter((item) => item.category !== "French Fries" && item.category !== "Bundles")
                          .map((item) => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                          ))}
                      </select>
                      <select
                        value={selection.flavor}
                        onChange={(event) => handleBundleSelection(index, selection.productId, event.target.value, selection.size)}
                      >
                        {product.flavors.map((flavor) => (
                          <option key={flavor} value={flavor}>{flavor}</option>
                        ))}
                      </select>
                      <select
                        value={selection.size}
                        onChange={(event) => handleBundleSelection(index, selection.productId, selection.flavor, event.target.value)}
                      >
                        {product.sizes.map((size) => (
                          <option key={size.label} value={size.label}>{size.label}</option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      <select
                        value={selection.productId}
                        onChange={(event) => {
                          const fries = getProductById(event.target.value);
                          setBundleFriesFlavor(fries.flavors[0]);
                          handleBundleSelection(index, fries.id, fries.flavors[0], fries.sizes[1]?.label ?? "Large");
                        }}
                      >
                        <option value="fries-salt">French Fries</option>
                      </select>
                      <select
                        value={bundleFriesFlavor}
                        onChange={(event) => {
                          setBundleFriesFlavor(event.target.value);
                          handleBundleSelection(index, selection.productId, event.target.value, selection.size || "Large");
                        }}
                      >
                        {friesFlavorOptions.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bundle-footer">
            <div className="promo-pill">Bundle price: ₱155</div>
            <button className="primary-btn" onClick={addBundleToCart}>Add bundle</button>
          </div>
        </div>
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

      {checkoutOpen ? (
        <div className="checkout-sheet" onClick={() => setCheckoutOpen(false)}>
          <div className="checkout-card" onClick={(event) => event.stopPropagation()}>
            <div className="panel-header">
              <h3>Checkout</h3>
              <button className="close-btn" onClick={() => setCheckoutOpen(false)}>×</button>
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
                      <strong>{getProductById(item.productId).name}</strong>
                      <small>
                        {item.flavor} • {item.size}
                        {item.addBoba ? " • Boba" : ""}
                      </small>
                    </div>
                    <span>{formatMoney(item.basePrice * item.quantity)}</span>
                  </div>
                ))
              )}
            </div>
            <div className="totals-box summary-box">
              <div><span>Subtotal</span><strong>{formatMoney(cartSubtotal)}</strong></div>
              <div><span>Promo</span><strong>-{formatMoney(promoDiscount)}</strong></div>
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
