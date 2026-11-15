"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Coffee,
  ShoppingBag,
  BellRing,
  ShieldCheck,
  Search,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  Gift,
  Calendar,
  MessageCircle,
  CheckCircle2,
  Flame,
  ArrowRight,
  Clock,
  Layers,
  X,
  Heart,
  Music,
  BookOpen,
  Lock,
  Star,
  Volume2,
  VolumeX,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  SlidersHorizontal,
  Play,
  Pause,
  Shuffle,
} from "lucide-react";

import catalogSource from "./menu-data.json";
import featuredImageSource from "./featured-images.json";
import productImages from "./product-images.json";
import eventsData from "../data/events.json";

import { OrderItem } from "@/lib/types";
import { playChime, isSoundMuted, toggleSound } from "@/lib/sound";
import { Product3DCard } from "@/components/Product3DCard";
import { CurvedSpotlightRail } from "@/components/CafeMenuExperience";
import { CheckoutVerificationModal } from "@/components/CheckoutVerificationModal";
import { OrderTrackerModal } from "@/components/OrderTrackerModal";
import { AiBaristaModal } from "@/components/AiBaristaModal";

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
};

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
const featuredImages = featuredImageSource;
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

const productPalettes: Record<string, { colors: [string, string]; accent: string }> = {
  "Cream Cheese Series": { colors: ["#f4afc8", "#f9e1e9"], accent: "#2563eb" },
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

function getProductPalette(category: string, name: string): { colors: [string, string]; accent: string } {
  const lowerName = name.toLowerCase();

  // Dark Chocolate
  if (lowerName.includes("dark chocolate")) {
    return { colors: ["#2d1b14", "#523326"], accent: "#1f120c" };
  }
  // Chocolate / Chuckie / Cocoa / Milo
  if (
    lowerName.includes("chocolate") ||
    lowerName.includes("chuckie") ||
    lowerName.includes("cocoa") ||
    lowerName.includes("milo")
  ) {
    return { colors: ["#4a2c1d", "#7a4e37"], accent: "#382015" };
  }
  // Cookies & Cream / Oreo
  if (lowerName.includes("cookies") || lowerName.includes("oreo")) {
    return { colors: ["#d9d3cb", "#4a4441"], accent: "#23201f" };
  }
  // Red Velvet
  if (lowerName.includes("red velvet")) {
    return { colors: ["#9e2a3b", "#eecad1"], accent: "#6e1523" };
  }
  // Okinawa (Roasted Brown Sugar)
  if (lowerName.includes("okinawa")) {
    return { colors: ["#b57b48", "#e3b88a"], accent: "#6e421c" };
  }
  // Wintermelon
  if (lowerName.includes("wintermelon") || lowerName.includes("winter melon")) {
    return { colors: ["#c59d5f", "#f2e4cc"], accent: "#7a5927" };
  }
  // Strawberry
  if (lowerName.includes("strawberry")) {
    return { colors: ["#f5adc4", "#fae3e7"], accent: "#2563eb" };
  }
  // Blueberry / Blue Lemonade
  if (lowerName.includes("blueberry") || lowerName.includes("blue lemonade")) {
    return { colors: ["#9cb8fa", "#e2ecff"], accent: "#3e5ba0" };
  }
  // Mango / Peach / Orange
  if (lowerName.includes("mango") || lowerName.includes("peach") || lowerName.includes("orange")) {
    return { colors: ["#f1bb73", "#fff0cb"], accent: "#a65a25" };
  }
  // Matcha / Green Apple
  if (lowerName.includes("matcha") || lowerName.includes("green apple")) {
    return { colors: ["#b1c38a", "#edf0d5"], accent: "#4e6942" };
  }
  // Taro / Ube
  if (lowerName.includes("taro") || lowerName.includes("ube")) {
    return { colors: ["#9c89be", "#e4dcf1"], accent: "#5a457c" };
  }
  // Coffee / Latte / Espresso
  if (
    category === "Coffee Series" ||
    lowerName.includes("latte") ||
    lowerName.includes("coffee") ||
    lowerName.includes("cappuccino") ||
    lowerName.includes("espresso") ||
    lowerName.includes("mocha")
  ) {
    return { colors: ["#6f4827", "#cbb092"], accent: "#422813" };
  }
  // Snacks / Fries
  if (category === "Snacks" || lowerName.includes("fries")) {
    return { colors: ["#edbd73", "#f6e1bb"], accent: "#b8782b" };
  }

  return productPalettes[category] ?? productPalettes["Coffee Series"];
}

const products: Product[] = menuData.categories.flatMap((category) =>
  category.items.map((item) => {
    const palette = getProductPalette(category.category, item.name);
    const slug = slugify(item.name);
    const isBestseller =
      slug.includes("strawberry-cream-cheese") ||
      slug.includes("okinawa-cream-cheese") ||
      slug.includes("chuckie-float") ||
      slug.includes("spanish-latte") ||
      slug.includes("cheese-french-fries");

    return {
      id: slug,
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
      image: productImageMap[slug],
      badge: isBestseller ? "Bestseller" : undefined,
    };
  }),
);

const bundleChoices = paidBundles.map((bundle) => {
  const id = slugify(bundle.name);
  const isFruitSoda = bundle.name.includes("Fruit Soda");
  return {
    ...bundle,
    id,
    image: isFruitSoda
      ? "/products/barkada-bundle-fruit-soda.webp"
      : "/products/barkada-bundle-milk-tea.webp",
    drinkCategory: isFruitSoda ? "Fruit Soda" : "Milk Tea Series",
    tagline: isFruitSoda
      ? "3x 12oz Fruit Soda + 1x Large Fries na may Home Cafe logo"
      : "3x 12oz Milk Tea + 1x Large Fries na may Home Cafe logo",
    badge: isFruitSoda ? "Sparkling Saver" : "Campus Bestseller",
    savingsText: isFruitSoda ? "Save ₱45" : "Save ₱50",
    description: isFruitSoda
      ? "3 handcrafted 12oz Fruit Sodas + 1 Large French Fries na may official Home Cafe logo."
      : "3 handcrafted 12oz Milk Teas with pearls + 1 Large French Fries na may official Home Cafe logo.",
  };
});

function getBundleDrinks(category: string) {
  return products.filter(
    (product) =>
      product.category === category &&
      product.sizes.some((size) => size.label === "12 oz"),
  );
}

export default function Page() {
  const [productList, setProductList] = useState<Product[]>(products);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [isShuffling, setIsShuffling] = useState(false);

  const handleShuffleProducts = useCallback(() => {
    setIsShuffling(true);
    playChime("add");
    setProductList((prev) => {
      const copy = [...prev];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    });
    setTimeout(() => setIsShuffling(false), 200);
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(productList.map((p) => p.category)))],
    [productList],
  );

  // Cart State (Persisted in localStorage)
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  // Active Customization State (Linked to 3D Stage)
  const [selectedProductId, setSelectedProductId] = useState(products[0].id);
  const [selectedFlavor, setSelectedFlavor] = useState(products[0].flavors[0]);
  const [selectedSize, setSelectedSize] = useState(products[0].sizes[0].label);
  const [selectedSugar, setSelectedSugar] = useState<"0%" | "25%" | "50%" | "75%" | "100%">("75%");
  const [selectedIce, setSelectedIce] = useState<"No Ice" | "Less Ice" | "Regular Ice" | "Extra Ice">("Regular Ice");
  const [selectedBoba, setSelectedBoba] = useState(false);
  const [selectedCreamCheese, setSelectedCreamCheese] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");

  // Barkada Bundle Builder State
  const [bundleId, setBundleId] = useState(bundleChoices[0].id);
  const [bundleDrinkIds, setBundleDrinkIds] = useState(() =>
    Array.from({ length: 3 }, () => getBundleDrinks(bundleChoices[0].drinkCategory)[0]?.id ?? products[0].id),
  );
  const [bundleFriesId, setBundleFriesId] = useState(
    products.find((product) => product.category === "Snacks")?.id ?? "",
  );

  // Companion Fries Flavor State in Hero
  const [heroFriesFlavor, setHeroFriesFlavor] = useState("Cheese");

  // Modals State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [trackerModalOpen, setTrackerModalOpen] = useState(false);
  const [activeOrderCode, setActiveOrderCode] = useState<string>("");
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [unavailableSlugs, setUnavailableSlugs] = useState<string[]>([]);
  const [soundMuted, setSoundMutedState] = useState(false);
  const [customerToast, setCustomerToast] = useState<string | null>(null);

  // Carousel Autoplay & Animation Controls
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);
  const menuCarouselRef = useRef<HTMLDivElement>(null);

  const scrollMenuCarousel = (direction: "left" | "right") => {
    if (menuCarouselRef.current) {
      const scrollAmount = Math.max(300, menuCarouselRef.current.clientWidth * 0.75);
      menuCarouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Carousel Autoplay & Animation Loop
  useEffect(() => {
    if (!isAutoplay || isCarouselHovered) return;
    const timer = setInterval(() => {
      if (menuCarouselRef.current) {
        const container = menuCarouselRef.current;
        const maxScroll = container.scrollWidth - container.clientWidth;
        if (container.scrollLeft >= maxScroll - 20) {
          container.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          container.scrollBy({ left: 320, behavior: "smooth" });
        }
      }
    }, 3200);
    return () => clearInterval(timer);
  }, [isAutoplay, isCarouselHovered]);

  const showCustomerToast = (message: string) => {
    setCustomerToast(message);
    setTimeout(() => setCustomerToast(null), 3500);
  };

  useEffect(() => {
    setSoundMutedState(isSoundMuted());
    const handleSoundChange = (e: any) => {
      setSoundMutedState(e.detail?.muted ?? isSoundMuted());
    };
    window.addEventListener("home-heart-sound-changed", handleSoundChange);
    return () => window.removeEventListener("home-heart-sound-changed", handleSoundChange);
  }, []);

  // Fetch live menu & stock availability
  useEffect(() => {
    fetch("/api/menu")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          if (Array.isArray(data.products) && data.products.length > 0) {
            const mapped: Product[] = data.products.map((p: any) => {
              const palette = getProductPalette(p.category, p.name);
              const slug = slugify(p.name);
              return {
                id: p.id || slug,
                name: p.name,
                category: p.category,
                description: p.description || "",
                flavors: [p.name],
                sizes: p.sizes,
                colors: palette.colors,
                accent: palette.accent,
                image: p.image || productImageMap[p.id || slug] || "/products/chocolate-milk-tea.webp",
                badge: p.isBestseller ? "Bestseller" : p.isCustom ? "New" : undefined,
              };
            });
            setProductList(mapped);
          }
          if (Array.isArray(data.unavailableSlugs)) {
            setUnavailableSlugs(data.unavailableSlugs);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Restore Cart & Last Order Code from localStorage
  useEffect(() => {
    try {
      const savedCart = window.localStorage.getItem("home-heart-cart-v3");
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) setCart(parsed);
      }
      const savedCode = window.localStorage.getItem("home-heart-active-order");
      if (savedCode) setActiveOrderCode(savedCode);
    } catch (e) {
      console.error("Cart hydration error:", e);
    }
    setCartHydrated(true);
  }, []);

  // Sync Cart to localStorage
  useEffect(() => {
    if (!cartHydrated) return;
    try {
      window.localStorage.setItem("home-heart-cart-v3", JSON.stringify(cart));
    } catch (e) {
      console.error("Cart save error:", e);
    }
  }, [cart, cartHydrated]);

  const selectedProduct = useMemo(
    () => productList.find((p) => p.id === selectedProductId) ?? productList[0] ?? products[0],
    [productList, selectedProductId],
  );

  const bobaAddonPrice = menuData.addOns.find((a) => a.name === "Extra Boba Pearls")?.price ?? 10;
  const creamCheeseAddonPrice = 15;

  const currentUnitPrice = useMemo(() => {
    const sizeObj = selectedProduct?.sizes?.find((s) => s.label === selectedSize) ?? selectedProduct?.sizes?.[0];
    let price = sizeObj?.price ?? 0;
    const isCreamCheeseCat = selectedProduct?.category === "Cream Cheese Series";
    const isSnack = selectedProduct?.category === "Snacks";
    if (selectedBoba && !isSnack) price += bobaAddonPrice;
    if (selectedCreamCheese && !isCreamCheeseCat && !isSnack) price += creamCheeseAddonPrice;
    return price;
  }, [selectedProduct, selectedSize, selectedBoba, selectedCreamCheese, bobaAddonPrice]);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return productList.filter((p) => {
      const matchCat = activeCategory === "All" || p.category === activeCategory;
      const matchQuery =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });
  }, [productList, activeCategory, searchTerm]);

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, it) => sum + it.subtotal, 0),
    [cart],
  );

  // Free Medium Fries promotion applies strictly to drink spend (excludes snacks and bundles)
  const eligibleDrinkSpend = useMemo(
    () =>
      cart
        .filter((it) => it.category !== "Snacks" && it.category !== "Bundles")
        .reduce((sum, it) => sum + it.subtotal, 0),
    [cart],
  );

  const featuredDrinks = useMemo(
    () => productList.filter((p) => p.badge === "Bestseller").slice(0, 5),
    [productList],
  );

  const cartItemCount = useMemo(
    () => cart.reduce((sum, it) => sum + it.quantity, 0),
    [cart],
  );

  const activeBundle = useMemo(
    () => bundleChoices.find((b) => b.id === bundleId) ?? bundleChoices[0],
    [bundleId],
  );
  const activeBundleDrinks = useMemo(
    () => getBundleDrinks(activeBundle.drinkCategory),
    [activeBundle],
  );

  // Add customized item from customizer
  const handleAddToCart = () => {
    const isCreamCheeseCat = selectedProduct.category === "Cream Cheese Series";
    const isSnack = selectedProduct.category === "Snacks";
    const effectiveCreamCheese = !isCreamCheeseCat && !isSnack ? selectedCreamCheese : false;
    const effectiveBoba = !isSnack ? selectedBoba : false;

    const itemKey = `${selectedProduct.id}-${selectedSize}-${isSnack ? "Snack" : selectedSugar}-${isSnack ? "Snack" : selectedIce}-${effectiveBoba ? "boba" : "noboba"}-${effectiveCreamCheese ? "cc" : "nocc"}`;

    const newItem: OrderItem = {
      id: itemKey,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      category: selectedProduct.category,
      flavor: selectedFlavor,
      size: selectedSize,
      sugarLevel: isSnack ? "100%" : selectedSugar,
      iceLevel: isSnack ? "Regular Ice" : selectedIce,
      addBoba: effectiveBoba,
      addCreamCheese: effectiveCreamCheese,
      quantity: 1,
      unitPrice: currentUnitPrice,
      subtotal: currentUnitPrice,
      notes: orderNotes.trim() || undefined,
    };

    setCart((prev) => {
      const existing = prev.find((it) => it.id === itemKey);
      if (existing) {
        return prev.map((it) =>
          it.id === itemKey
            ? {
                ...it,
                quantity: it.quantity + 1,
                subtotal: (it.quantity + 1) * it.unitPrice,
              }
            : it,
        );
      }
      return [...prev, newItem];
    });

    playChime("add");
    setCartDrawerOpen(true);
  };

  // Quick add from 3D card
  const handleQuickAdd = (product: Product, sizeLabel: string) => {
    const sizeObj = product.sizes.find((s) => s.label === sizeLabel) ?? product.sizes[0];
    const unitPrice = sizeObj.price;
    const itemKey = `${product.id}-${sizeLabel}-75-Regular-noboba-nocc`;

    const newItem: OrderItem = {
      id: itemKey,
      productId: product.id,
      productName: product.name,
      category: product.category,
      flavor: product.name,
      size: sizeLabel,
      sugarLevel: "75%",
      iceLevel: "Regular Ice",
      addBoba: false,
      quantity: 1,
      unitPrice,
      subtotal: unitPrice,
    };

    setCart((prev) => {
      const existing = prev.find((it) => it.id === itemKey);
      if (existing) {
        return prev.map((it) =>
          it.id === itemKey
            ? {
                ...it,
                quantity: it.quantity + 1,
                subtotal: (it.quantity + 1) * it.unitPrice,
              }
            : it,
        );
      }
      return [...prev, newItem];
    });

    playChime("add");
  };

  // Add Barkada Bundle
  const handleAddBundle = () => {
    const selectedDrinks = bundleDrinkIds.map((id) =>
      activeBundleDrinks.find((p) => p.id === id),
    );
    const friesProduct = products.find((p) => p.id === bundleFriesId);

    const validDrinks = selectedDrinks.filter((p): p is Product => p !== undefined);
    if (validDrinks.length !== 3 || !friesProduct) {
      showCustomerToast("Please select 3 drinks and 1 large fries to complete your bundle.");
      return;
    }

    const selections = [
      ...validDrinks.map((d) => d.name),
      `${friesProduct.name} (Large)`,
    ];

    const bundleKey = `bundle-${activeBundle.id}-${bundleDrinkIds.join("-")}-${bundleFriesId}`;

    const newBundleItem: OrderItem = {
      id: bundleKey,
      productId: activeBundle.id,
      productName: activeBundle.name,
      category: "Bundles",
      flavor: "Barkada Mix",
      size: "Bundle",
      sugarLevel: "75%",
      iceLevel: "Regular Ice",
      addBoba: false,
      quantity: 1,
      unitPrice: activeBundle.price,
      subtotal: activeBundle.price,
      bundleName: activeBundle.name,
      bundleSelections: selections,
    };

    setCart((prev) => {
      const existing = prev.find((it) => it.id === bundleKey);
      if (existing) {
        return prev.map((it) =>
          it.id === bundleKey
            ? {
                ...it,
                quantity: it.quantity + 1,
                subtotal: (it.quantity + 1) * it.unitPrice,
              }
            : it,
        );
      }
      return [...prev, newBundleItem];
    });

    playChime("add");
    setCartDrawerOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((it) => {
          if (it.id === id) {
            const nextQty = it.quantity + delta;
            return nextQty > 0
              ? { ...it, quantity: nextQty, subtotal: nextQty * it.unitPrice }
              : null;
          }
          return it;
        })
        .filter((it): it is OrderItem => it !== null),
    );
    playChime("add");
  };

  const handleOrderSuccess = (orderCode: string) => {
    setActiveOrderCode(orderCode);
    try {
      window.localStorage.setItem("home-heart-active-order", orderCode);
    } catch {}
    setCart([]);
    setCheckoutModalOpen(false);
    setCartDrawerOpen(false);
    setTrackerModalOpen(true);
  };

  const handleAiAction = (action: string) => {
    if (action === "scrollToBundles") {
      document.getElementById("bundles")?.scrollIntoView({ behavior: "smooth" });
    } else if (action === "scrollToMenu") {
      document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
    } else if (action === "openCheckout") {
      if (cart.length > 0) setCheckoutModalOpen(true);
      else setCartDrawerOpen(true);
    } else if (action.startsWith("selectProduct:")) {
      const slug = action.split(":")[1];
      const prod = products.find((p) => p.id === slug);
      if (prod) {
        setSelectedProductId(prod.id);
        setSelectedFlavor(prod.flavors[0]);
        setSelectedSize(prod.sizes[0].label);
        document.getElementById("customizer")?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#ffffff] text-[#0f172a] selection:bg-[#dbeafe] selection:text-[#2563eb] font-sans">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-[#ffffff]/90 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-8 py-3 transition-shadow">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Brand Identity */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2563eb] to-[#60a5fa] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Coffee className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl tracking-tight text-[#0f172a]">
                  Home
                </span>
                <Heart className="w-4 h-4 fill-red-500 text-red-500 inline-block mx-0.5" />
                <span className="font-black text-xl tracking-tight text-[#2563eb]">
                  Cafe
                </span>
              </div>
              <p className="text-[10px] font-semibold tracking-wider text-stone-500 uppercase">
                Sips of happiness in every cup
              </p>
            </div>
          </Link>

          {/* Desktop Quick Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-xs font-bold text-stone-600">
            <a href="#featured" className="hover:text-[#2563eb] transition-colors">
              Featured
            </a>
            <a href="#menu" className="hover:text-[#2563eb] transition-colors">
              Menu
            </a>
            <a href="#bundles" className="hover:text-[#2563eb] transition-colors">
              Barkada Bundles
            </a>
            <a href="#events" className="hover:text-[#2563eb] transition-colors">
              Campus Events
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Audio Chime Mute Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = toggleSound();
                setSoundMutedState(next);
              }}
              className={`p-2 rounded-full border border-stone-200 bg-white hover:border-[#2563eb] transition-colors shadow-2xs cursor-pointer ${
                soundMuted ? "text-stone-400" : "text-[#2563eb]"
              }`}
              aria-label={soundMuted ? "Unmute cafe chimes" : "Mute cafe chimes"}
              title={soundMuted ? "Unmute cafe chimes" : "Mute cafe chimes"}
            >
              {soundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {/* Live Order Tracker Trigger */}
            <button
              type="button"
              onClick={() => setTrackerModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full border border-stone-200 bg-white hover:border-[#2563eb] text-xs font-bold text-stone-700 transition-colors shadow-2xs"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Track Order</span>
              {activeOrderCode && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                  {activeOrderCode}
                </span>
              )}
            </button>

            {/* Cart Trigger */}
            <button
              type="button"
              onClick={() => setCartDrawerOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <ShoppingBag className="w-4 h-4 text-white" />
              <span>Cart</span>
              <span className="px-1.5 py-0.5 rounded-full bg-white text-[#2563eb] text-[10px] font-black">
                {cartItemCount}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Showcase Section with Centered Architecture & 3D Interactive Experience */}
      <section className="relative overflow-hidden pt-10 pb-16 px-4 sm:px-8 border-b border-blue-100/80 bg-gradient-to-b from-white via-blue-50/30 to-white">
        {/* Ambient background decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-100/40 via-sky-50/20 to-transparent blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6">
          {/* Centered Campus Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/80 text-blue-700 text-xs font-bold uppercase tracking-wider shadow-2xs backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" style={{ animationDuration: "6s" }} />
            <span>Campus Cafe · Order Ahead for Break</span>
          </div>

          {/* Centered Headline */}
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.08] max-w-4xl mx-auto">
            Sips of Happiness,{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
              Zero Waiting Time.
            </span>
          </h1>

          {/* Centered Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
            Order ahead before recess or break. Pick your drink, verify with your school ID, and pick up freshly prepared at the counter with zero line.
          </p>

          {/* Centered Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="#menu"
              className="px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <span>Explore 3D Menu</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={() => setAiModalOpen(true)}
              className="px-6 py-3.5 rounded-full bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 text-slate-800 text-sm font-bold shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Coffee className="w-4 h-4 text-blue-600" />
              <span>Ask Home (AI Barista)</span>
            </button>
            <button
              type="button"
              onClick={() => setTrackerModalOpen(true)}
              className="px-5 py-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <BellRing className="w-4 h-4 text-amber-600" />
              <span>Track Order</span>
            </button>
          </div>

          {/* Trust and Policy Micro-Bar */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-3 text-xs text-slate-500 font-semibold">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>School ID Verification (Anti-Scam)</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Free Fries at ₱200+ Drink Spend</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Instant Counter Ready</span>
            </div>
          </div>
        </div>

        {/* Centered Glassmorphism 3D Showcase & Customizer Stage */}
        <div id="customizer" className="mt-12 max-w-4xl mx-auto rounded-3xl bg-white/95 border border-blue-100/90 shadow-2xl p-6 sm:p-8 backdrop-blur-md">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left Column: 3D Product Image Display */}
            <div className="md:col-span-6 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-3 px-1">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                    {selectedProduct.category}
                  </span>
                  <h3 className="font-extrabold text-xl text-slate-900 leading-tight">
                    {selectedProduct.name}
                  </h3>
                </div>
                <span className="text-2xl font-black text-blue-600">
                  ₱{currentUnitPrice}
                </span>
              </div>

              {/* Product Stage */}
              <div
                className="relative h-72 sm:h-80 w-full rounded-2xl overflow-hidden flex items-center justify-center p-4 border border-blue-100/80 shadow-inner group transition-all"
                style={{
                  background: `radial-gradient(circle at center, #eff6ff 0%, #dbeafe60 60%, #ffffff 100%)`,
                }}
              >
                <div
                  className="absolute inset-0 animate-glow-pulse pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, ${selectedProduct.colors[0]}25 0%, transparent 65%)`,
                  }}
                />

                {selectedProduct.image ? (
                  <div className="relative w-full h-full max-h-64 transition-transform duration-300 group-hover:scale-105 animate-float">
                    <Image
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      fill
                      unoptimized={selectedProduct.image.startsWith("http")}
                      className="object-contain drop-shadow-2xl"
                      priority
                      sizes="(max-width: 768px) 100vw, 380px"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-stone-400">
                    <Coffee className="w-16 h-16 text-blue-600/60 mb-2" />
                    <span className="text-xs font-bold">{selectedProduct.name}</span>
                  </div>
                )}

                {/* Floating Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/95 text-slate-700 shadow-xs border border-white">
                    {selectedProduct.category}
                  </span>
                  {selectedProduct.badge && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-blue-600 bg-blue-100/90 shadow-xs border border-blue-200">
                      {selectedProduct.badge}
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-white/95 text-blue-600 text-xs font-black shadow-xs border border-white z-10">
                  {selectedSize} · ₱{currentUnitPrice}
                </div>
              </div>

              {/* Quick Carousel Swiper right under image */}
              <div className="w-full pt-3">
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Quick Pick (Swipe left to right)
                  </span>
                  <span className="text-[10px] text-blue-600 font-bold">
                    {productList.length} drinks
                  </span>
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                  {productList.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedProductId(item.id);
                        setSelectedFlavor(item.flavors[0]);
                        setSelectedSize(item.sizes[0].label);
                        playChime("add");
                      }}
                      className={`shrink-0 w-16 h-16 rounded-xl border p-1 transition-all flex flex-col items-center justify-center cursor-pointer ${
                        selectedProductId === item.id
                          ? "border-blue-600 ring-2 ring-blue-500/30 bg-blue-50/90 shadow-xs scale-105"
                          : "border-slate-200 bg-white hover:border-blue-300"
                      }`}
                      title={item.name}
                    >
                      {item.image && (
                        <div className="relative w-9 h-9">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            unoptimized={item.image.startsWith("http")}
                            className="object-contain"
                            sizes="36px"
                          />
                        </div>
                      )}
                      <span className="text-[8px] font-bold text-slate-700 truncate w-full text-center mt-0.5">
                        {item.name.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Customization Controls & Add To Order */}
            <div className="md:col-span-6 space-y-4">
              <div>
                <h4 className="text-sm font-black text-slate-900 mb-1">Customize Your Drink</h4>
                <p className="text-xs text-slate-500">Pick your size, sweetness, and favorite add-ons.</p>
              </div>

              {/* Size Chips */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Select Size
                </label>
                <div className="flex gap-2">
                  {selectedProduct.sizes.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => {
                        setSelectedSize(s.label);
                        playChime("add");
                      }}
                      className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedSize === s.label
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {s.label} · ₱{s.price}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sugar & Ice Level Pickers (Drinks only) */}
              {selectedProduct.category !== "Snacks" && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Sugar Level: {selectedSugar}
                    </label>
                    <select
                      value={selectedSugar}
                      onChange={(e) => setSelectedSugar(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium outline-none cursor-pointer focus:border-blue-600"
                    >
                      <option value="75%">75% (Barista Default)</option>
                      <option value="100%">100% Full Sweet</option>
                      <option value="50%">50% Half Sweet</option>
                      <option value="25%">25% Gentle Sweet</option>
                      <option value="0%">0% Unsweetened</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Ice Level: {selectedIce}
                    </label>
                    <select
                      value={selectedIce}
                      onChange={(e) => setSelectedIce(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium outline-none cursor-pointer focus:border-blue-600"
                    >
                      <option value="Regular Ice">Regular Ice</option>
                      <option value="Less Ice">Less Ice</option>
                      <option value="Extra Ice">Extra Ice</option>
                      <option value="No Ice">No Ice</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Add-on Toggles (Drinks only) */}
              {selectedProduct.category !== "Snacks" && (
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Add-ons & Toppings
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBoba(!selectedBoba);
                        playChime("add");
                      }}
                      className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        selectedBoba
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      + Boba Pearls (₱10)
                    </button>

                    {selectedProduct.category !== "Cream Cheese Series" && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCreamCheese(!selectedCreamCheese);
                          playChime("add");
                        }}
                        className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          selectedCreamCheese
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        + Cream Cheese (₱15)
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Special Note */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Barista Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. less ice, extra straw..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              {/* Add To Cart CTA */}
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add to Order · ₱{currentUnitPrice}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Free Medium Fries Spend Promo Spotlight Card */}
      {freeFriesPromotion && (
        <section className="px-4 sm:px-8 py-8 bg-gradient-to-b from-blue-50/50 via-white to-white">
          <div className="max-w-7xl mx-auto">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-[2px] shadow-xl">
              <div className="rounded-[22px] bg-white p-6 sm:p-8 flex flex-col lg:flex-row items-center gap-8">
                {/* Photo showcase with Home Cafe logo */}
                <div className="relative w-full lg:w-1/2 aspect-video sm:aspect-[16/10] rounded-2xl overflow-hidden shadow-lg border border-amber-200/60 bg-amber-50 group">
                  <Image
                    src="/products/free-medium-fries-promo.webp"
                    alt="Spend at least ₱200 and get FREE Medium Fries at Home Cafe"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute top-3 left-3 bg-amber-500 text-stone-900 text-xs font-black px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-1.5 uppercase tracking-wider">
                    <Gift className="w-4 h-4 text-white" />
                    <span>Promo Offer</span>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                    Real Photo · Home Cafe Logo
                  </div>
                </div>

                {/* Offer Details & Cart Tracker */}
                <div className="w-full lg:w-1/2 space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Campus Reward Perk</span>
                  </div>

                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black text-[#0f172a] leading-tight">
                      Spend at least <span className="text-amber-600">₱200</span> & get <span className="text-[#2563eb]">FREE Medium Fries</span>!
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
                      Treat yourself and your classmates! Buy drinks worth at least ₱200 at Home Cafe, and we'll automatically reward your cart with a hot, crispy serving of Medium French Fries with our authentic Home Cafe cup logo!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-stone-700">
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Auto-calculated in cart</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Valid on all handcrafted drinks</span>
                    </div>
                  </div>

                  {/* Live Spend Progress Bar */}
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-700 flex items-center gap-1.5">
                        <Coffee className="w-4 h-4 text-[#2563eb]" />
                        <span>Drink Spend Progress</span>
                      </span>
                      <span className="font-mono font-bold text-stone-900">
                        ₱{eligibleDrinkSpend} / ₱200
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-stone-200 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, (eligibleDrinkSpend / 200) * 100)}%` }}
                      />
                    </div>
                    {eligibleDrinkSpend >= 200 ? (
                      <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>🎉 FREE Medium Fries unlocked for your order!</span>
                      </p>
                    ) : (
                      <p className="text-xs text-stone-500">
                        Add <strong className="text-amber-700 font-semibold">₱{Math.max(0, 200 - eligibleDrinkSpend)}</strong> more in drinks to claim your free fries!
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <a
                      href="#menu"
                      className="px-5 py-2.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Coffee className="w-3.5 h-3.5" />
                      <span>Explore Drinks to Qualify</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setCartDrawerOpen(true)}
                      className="px-4 py-2.5 rounded-full bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      View Cart ({cartItemCount})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Drinks & Bestsellers Row — Curved SVG Spotlight Rail */}
      <section id="featured" className="px-4 sm:px-8 py-10 max-w-7xl mx-auto border-b border-stone-200/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dbeafe] text-[#2563eb] text-xs font-bold uppercase tracking-wider mb-1">
              <Star className="w-3.5 h-3.5 fill-[#2563eb]" />
              <span>Campus Favorites</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a]">
              Featured Drinks &amp; Bestsellers
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] mt-0.5">
              Hover or tap any card along the curved spotlight rail to explore top campus picks.
            </p>
          </div>
        </div>

        {/* Curved SVG Spotlight Rail Component */}
        <CurvedSpotlightRail
          bestsellers={featuredDrinks.map((product) => ({
            id: product.id,
            name: product.name,
            category: product.category,
            price: product.sizes[0]?.price ?? 49,
            description: product.description || `${product.category} specialty`,
            image: product.image || "/products/chocolate-milk-tea.webp",
            sizes: product.sizes.length,
            isBestseller: true,
          }))}
          onSelect={(item) => {
            setSelectedProductId(item.id);
            const foundProduct = products.find((p) => p.id === item.id);
            if (foundProduct) {
              setSelectedFlavor(foundProduct.flavors[0]);
              setSelectedSize(foundProduct.sizes[0].label);
            }
            document.getElementById("customizer")?.scrollIntoView({ behavior: "smooth" });
          }}
        />
      </section>

      {/* Category Navigation Bar */}
      <section
        id="menu"
        className="sticky top-[65px] z-30 bg-[#ffffff]/95 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-8 py-3 shadow-2xs"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Scrollable Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setActiveCategory(cat);
                  playChime("add");
                }}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeCategory === cat
                    ? "bg-[#2563eb] text-white shadow-xs"
                    : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              placeholder="Search drinks & snacks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-full border border-stone-200 bg-white text-xs font-medium focus:border-[#2563eb] outline-none shadow-2xs"
            />
          </div>
        </div>
      </section>

      {/* Menu Carousel Section with 3D Artwork (Carousel Only) */}
      <section className="px-4 sm:px-8 py-10 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#2563eb] text-xs font-bold mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>3D Product Collection</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a]">
              {activeCategory === "All" ? "Complete Cafe Menu" : activeCategory}
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Scroll left to right to explore all {filteredProducts.length} handcrafted drinks and snacks.
            </p>
          </div>

          {/* Carousel Controls & Animation Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShuffleProducts}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs font-bold text-[#2563eb] transition-all active:scale-95 shadow-2xs cursor-pointer"
              title="Shuffle menu items randomly"
            >
              <Shuffle className={`w-3.5 h-3.5 ${isShuffling ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Shuffle</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAutoplay(!isAutoplay)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                isAutoplay
                  ? "border-blue-200 bg-blue-50 text-blue-700 shadow-2xs"
                  : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
              }`}
              title={isAutoplay ? "Pause auto-scroll animation" : "Start auto-scroll animation"}
            >
              {isAutoplay ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping inline-block" />
                  <Pause className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Auto-scroll</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-stone-500 fill-stone-500" />
                  <span className="hidden sm:inline">Play</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollMenuCarousel("left")}
                className="p-2 rounded-full border border-stone-200 bg-white hover:border-[#2563eb] text-stone-700 shadow-2xs cursor-pointer hover:bg-stone-50 active:scale-95 transition-all"
                aria-label="Scroll left"
                title="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollMenuCarousel("right")}
                className="p-2 rounded-full border border-stone-200 bg-white hover:border-[#2563eb] text-stone-700 shadow-2xs cursor-pointer hover:bg-stone-50 active:scale-95 transition-all"
                aria-label="Scroll right"
                title="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel View (Scroll Left to Right) */}
        <div
          className="relative group/carousel"
          onMouseEnter={() => setIsCarouselHovered(true)}
          onMouseLeave={() => setIsCarouselHovered(false)}
        >
          {/* Left Floating Arrow on Desktop */}
          <button
            type="button"
            onClick={() => scrollMenuCarousel("left")}
            className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 border border-stone-200 shadow-xl items-center justify-center text-stone-700 hover:text-[#2563eb] hover:scale-110 active:scale-95 transition-all cursor-pointer opacity-0 group-hover/carousel:opacity-100"
            aria-label="Previous items"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Horizontal Scroll Track */}
          <div
            ref={menuCarouselRef}
            className={`flex gap-5 overflow-x-auto pb-6 pt-2 px-1 snap-x snap-mandatory scroll-smooth no-scrollbar touch-pan-x transition-opacity duration-200 ${
              isShuffling ? "opacity-50" : "opacity-100"
            }`}
          >
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="shrink-0 w-[275px] sm:w-[310px] snap-start"
              >
                <Product3DCard
                  id={product.id}
                  name={product.name}
                  category={product.category}
                  description={product.description}
                  sizes={product.sizes}
                  colors={product.colors}
                  accent={product.accent}
                  image={product.image}
                  badge={product.badge}
                  isAvailable={!unavailableSlugs.includes(product.id)}
                  isSelected={selectedProductId === product.id}
                  onSelect={() => {
                    setSelectedProductId(product.id);
                    setSelectedFlavor(product.flavors[0]);
                    setSelectedSize(product.sizes[0].label);
                    document.getElementById("customizer")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  onQuickAdd={(sizeLabel) => handleQuickAdd(product, sizeLabel)}
                />
              </div>
            ))}
          </div>

          {/* Right Floating Arrow on Desktop */}
          <button
            type="button"
            onClick={() => scrollMenuCarousel("right")}
            className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 border border-stone-200 shadow-xl items-center justify-center text-stone-700 hover:text-[#2563eb] hover:scale-110 active:scale-95 transition-all cursor-pointer opacity-0 group-hover/carousel:opacity-100"
            aria-label="Next items"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Carousel Navigation Hint */}
          <div className="flex items-center justify-between text-xs text-stone-500 pt-2 px-1">
            <span className="flex items-center gap-1.5 font-medium">
              <ArrowRight className="w-3.5 h-3.5 text-[#2563eb]" />
              Swipe or click arrows to scroll left and right
            </span>
            <span className="font-semibold text-stone-400">
              {filteredProducts.length} items
            </span>
          </div>
        </div>
      </section>

      {/* Barkada Bundles Interactive Builder */}
      <section id="bundles" className="px-4 sm:px-8 py-12 bg-stone-50/60 border-t border-b border-stone-200">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black uppercase">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                <span>Barkada Saver Bundles</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a] mt-1.5">
                Share More, Spend Less With Your Barkada
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 max-w-2xl mt-1">
                Freshly prepared combos made for campus groups! Pick between our Fruit Soda or Milk Tea bundles — each includes 3 drinks of your choice + 1 Large French Fries na may official Home Cafe logo.
              </p>
            </div>
          </div>

          {/* Two Promotional Bundle Hero Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bundleChoices.map((b) => {
              const isSelected = bundleId === b.id;
              return (
                <div
                  key={b.id}
                  className={`relative rounded-3xl overflow-hidden border-2 transition-all duration-300 flex flex-col bg-white shadow-md hover:shadow-xl ${
                    isSelected
                      ? "border-[#2563eb] ring-4 ring-[#2563eb]/10"
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  {/* Real Bundle Photo */}
                  <div className="relative aspect-[16/9] w-full bg-stone-100 overflow-hidden">
                    <Image
                      src={b.image}
                      alt={b.name}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute top-3 left-3 bg-[#2563eb] text-white text-xs font-black px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
                      {b.badge}
                    </div>
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-[#0f172a] text-sm font-black px-3.5 py-1 rounded-full shadow-md">
                      ₱{b.price}
                    </div>
                    <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                      Home Cafe Cup Logo
                    </div>
                  </div>

                  {/* Bundle Content & Action */}
                  <div className="p-6 flex flex-col flex-1 justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-[#0f172a]">{b.name}</h3>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          {b.savingsText}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {b.description}
                      </p>
                      <div className="pt-2 flex flex-wrap gap-2 text-xs font-medium text-stone-700">
                        <span className="px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200/80">
                          🥤 3x 12oz {b.drinkCategory === "Fruit Soda" ? "Fruit Sodas" : "Milk Teas"}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200/80">
                          🍟 1x Large Seasoned Fries
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setBundleId(b.id);
                        const drinks = getBundleDrinks(b.drinkCategory);
                        setBundleDrinkIds(Array.from({ length: 3 }, () => drinks[0]?.id ?? products[0].id));
                        playChime("add");
                        document.getElementById("bundle-tray-builder")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`w-full py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isSelected
                          ? "bg-[#2563eb] text-white shadow-md hover:bg-[#1d4ed8]"
                          : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Selected · Customize Flavors Below ↓</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span>Select & Customize · ₱{b.price}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 4-Slot Tray Builder */}
          <div id="bundle-tray-builder" className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <span className="text-[11px] uppercase font-bold text-[#2563eb] tracking-wider block">
                  Interactive Mix & Match Tray
                </span>
                <h3 className="text-xl font-black text-[#0f172a]">
                  Customize Your {activeBundle.name}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-stone-500 block">Bundle Total</span>
                <span className="text-2xl font-black text-[#2563eb]">₱{activeBundle.price}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 3 Drink Slots */}
              {bundleDrinkIds.map((drinkId, idx) => {
                const selectedDrink = activeBundleDrinks.find((d) => d.id === drinkId);
                return (
                  <div key={idx} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 hover:border-blue-300 transition-colors shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-black text-[#2563eb] tracking-wider">
                        Drink #{idx + 1} (12 oz)
                      </span>
                      <span className="text-[10px] text-stone-400">Included</span>
                    </div>
                    <select
                      value={drinkId}
                      onChange={(e) => {
                        const next = [...bundleDrinkIds];
                        next[idx] = e.target.value;
                        setBundleDrinkIds(next);
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-800 bg-white outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                    >
                      {activeBundleDrinks.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    {selectedDrink && (
                      <p className="text-[11px] text-stone-500 truncate">
                        Selected: <strong className="text-stone-700">{selectedDrink.name}</strong>
                      </p>
                    )}
                  </div>
                );
              })}

              {/* 1 Large Fries Slot */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 hover:border-amber-300 transition-colors shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black text-amber-700 tracking-wider">
                    Snack Companion (Large Fries)
                  </span>
                  <span className="text-[10px] text-amber-600 font-bold">Included</span>
                </div>
                <select
                  value={bundleFriesId}
                  onChange={(e) => setBundleFriesId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-amber-200 text-xs font-semibold text-stone-800 bg-white outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  {products
                    .filter((p) => p.category === "Snacks")
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-amber-800">
                  Crispy fries served in Home Cafe cup
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-stone-600">
                <span className="font-semibold text-stone-800">Tray Summary:</span>{" "}
                3x {activeBundle.name.includes("Fruit Soda") ? "Fruit Sodas" : "Milk Teas"} + 1x Large Fries na may Home Cafe logo
              </div>
              <button
                type="button"
                onClick={handleAddBundle}
                className="w-full sm:w-auto px-8 py-3 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add {activeBundle.name} to Cart · ₱{activeBundle.price}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Atmosphere & Cafe Events Section */}
      <section id="events" className="px-4 sm:px-8 py-12 max-w-7xl mx-auto space-y-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dbeafe] text-[#2563eb] text-xs font-bold uppercase">
            <Calendar className="w-3.5 h-3.5" />
            <span>Campus Cafe Life & Events</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a] mt-1">
            Good things are better shared.
          </h2>
          <p className="text-xs text-[#475569]">
            Join the campus events and activities happening at Home ❤️ Cafe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {eventsData.map((ev) => (
            <div
              key={ev.id}
              className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-3 hover:shadow-md transition-shadow"
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                  ev.badgeColor === "rose"
                    ? "bg-rose-100 text-[#2563eb]"
                    : ev.badgeColor === "sky"
                      ? "bg-sky-100 text-sky-700"
                      : "bg-amber-100 text-amber-700"
                }`}
              >
                {ev.icon === "music" ? (
                  <Music className="w-5 h-5" />
                ) : ev.icon === "book" ? (
                  <BookOpen className="w-5 h-5" />
                ) : (
                  <Coffee className="w-5 h-5" />
                )}
              </div>
              <h3 className="font-extrabold text-stone-800 text-base">{ev.title}</h3>
              <div className="text-[11px] font-bold text-[#2563eb] bg-[#dbeafe] px-2.5 py-1 rounded-lg inline-block">
                {ev.schedule}
              </div>
              <p className="text-xs text-stone-500 leading-relaxed">{ev.description}</p>
            </div>
          ))}
        </div>

        {/* Real Cafe Photography Showcase */}
        <div className="pt-6 border-t border-stone-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xl font-black text-[#0f172a]">
                Real Servings, Fresh Campus Moments
              </h3>
              <p className="text-xs text-[#475569]">
                Capturing the real Home ❤️ Cafe experience: fresh boba, sparkling sodas, and golden fries.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#2563eb] bg-[#dbeafe] px-3 py-1 rounded-full w-fit">
              100% Authentic Cafe Photos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {featuredImages.map((img, i) => (
              <div
                key={i}
                className="group relative rounded-3xl overflow-hidden border border-stone-200 bg-white shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100">
                  <Image
                    src={img.src}
                    alt={img.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute bottom-2.5 right-2.5 bg-black/75 backdrop-blur-xs text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg">
                    Home Cafe Logo
                  </div>
                </div>
                <div className="p-5 space-y-1.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-stone-900 text-sm">{img.title}</h4>
                    <p className="text-xs text-stone-500 leading-relaxed mt-1">{img.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Useful & Hospitable Cafe Footer */}
      <footer className="border-t border-stone-200/80 bg-white py-12 px-4 sm:px-8 text-[#0f172a]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
          <div className="space-y-3 max-w-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2563eb] to-[#60a5fa] text-white flex items-center justify-center shadow-xs">
                <Coffee className="w-4 h-4 text-amber-200" />
              </div>
              <div className="flex items-center gap-1 font-black text-lg">
                <span>Home</span>
                <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                <span className="text-[#2563eb]">Cafe</span>
              </div>
            </div>
            <p className="text-xs text-[#475569] leading-relaxed">
              Campus cafe serving handcrafted milk tea, fruit sodas, rich coffee, and crispy golden fries. Order ahead for quick pickup during campus breaks.
            </p>
            <div className="text-[11px] text-stone-400">
              © 2026 Home Heart Cafe. All rights reserved.
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs">
            <div>
              <span className="font-bold text-[#0f172a] block mb-2.5 uppercase tracking-wider text-[11px]">
                Quick Menu
              </span>
              <ul className="space-y-2 text-[#475569]">
                <li>
                  <a href="#featured" className="hover:text-[#2563eb] transition-colors">
                    Featured Bestsellers
                  </a>
                </li>
                <li>
                  <a href="#menu" className="hover:text-[#2563eb] transition-colors">
                    Full Drink Menu
                  </a>
                </li>
                <li>
                  <a href="#bundles" className="hover:text-[#2563eb] transition-colors">
                    Barkada Bundles
                  </a>
                </li>
                <li>
                  <a href="#events" className="hover:text-[#2563eb] transition-colors">
                    Campus Events
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <span className="font-bold text-[#0f172a] block mb-2.5 uppercase tracking-wider text-[11px]">
                Customer Care
              </span>
              <ul className="space-y-2 text-[#475569]">
                <li>
                  <button
                    type="button"
                    onClick={() => setTrackerModalOpen(true)}
                    className="hover:text-[#2563eb] transition-colors text-left"
                  >
                    Track Active Order
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setAiModalOpen(true)}
                    className="hover:text-[#2563eb] transition-colors text-left"
                  >
                    Ask Home (AI Barista)
                  </button>
                </li>
                <li>
                  <span className="text-stone-400">GCash & Counter Cash</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

      {/* Cart Slide-Over Drawer */}
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md h-full bg-[#fffefc] shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="px-6 py-4 bg-[#0f172a] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">Your Cart ({cartItemCount})</h3>
              </div>
              <button
                type="button"
                onClick={() => setCartDrawerOpen(false)}
                className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 p-6 overflow-y-auto divide-y divide-stone-100 space-y-3">
              {cart.length === 0 ? (
                <div className="p-12 text-center text-stone-400 space-y-2">
                  <ShoppingBag className="w-12 h-12 mx-auto text-stone-300" />
                  <p className="font-semibold text-sm">Your cart is empty.</p>
                  <p className="text-xs text-stone-400">Add a drink or fries from the menu to get started!</p>
                  <button
                    type="button"
                    onClick={() => {
                      setCartDrawerOpen(false);
                      document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="mt-4 px-4 py-2 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Explore Bestsellers</span>
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="pt-3 first:pt-0 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <strong className="text-stone-800 text-sm block">
                        {item.bundleName || item.productName}
                      </strong>
                      <span className="text-stone-500 text-xs block mt-0.5">
                        {item.flavor} · {item.size}
                      </span>
                      <span className="text-stone-400 text-[11px] block">
                        Sugar: {item.sugarLevel} · Ice: {item.iceLevel}
                        {item.addBoba ? " · Boba" : ""}
                        {item.addCreamCheese ? " · Cream Cheese" : ""}
                      </span>
                      {item.notes && (
                        <span className="text-amber-800 text-[11px] italic block">
                          &ldquo;{item.notes}&rdquo;
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="font-bold text-sm text-stone-900">
                        ₱{item.subtotal}
                      </span>
                      <div className="flex items-center gap-1 border border-stone-200 rounded-full px-2 py-0.5 bg-stone-50">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-0.5 text-stone-600 hover:text-red-600"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-0.5 text-stone-600 hover:text-emerald-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-6 bg-[#fffdfa] border-t border-stone-200 space-y-3">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal:</span>
                    <strong className="text-stone-900 text-sm">₱{cartSubtotal}</strong>
                  </div>

                  {/* Drink-only ₱200 promotion check */}
                  {eligibleDrinkSpend >= 200 ? (
                    <div className="p-2.5 rounded-xl bg-amber-100/90 border border-amber-300 text-amber-900 text-[11px] font-bold flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5 text-amber-700" />
                        <span>Unlocked: Free Medium Fries!</span>
                      </div>
                      <span className="text-[10px] bg-white px-2 py-0.5 rounded-full text-amber-800 font-mono font-black">
                        ₱{eligibleDrinkSpend} drinks
                      </span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-stone-700 text-[11px] flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5 text-amber-600" />
                        <span>Add <strong>₱{200 - eligibleDrinkSpend}</strong> more in drinks for Free Fries</span>
                      </div>
                      <span className="text-[10px] text-stone-500 font-mono">
                        ₱{eligibleDrinkSpend}/₱200
                      </span>
                    </div>
                  )}
                  <p className="text-[10px] text-stone-400 italic pt-0.5">
                    * Free Medium Fries promo unlocks at ₱200+ in ala-carte drinks. Bundles and fries do not count toward threshold.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCartDrawerOpen(false);
                    setCheckoutModalOpen(true);
                  }}
                  className="w-full py-3.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span>Verified Campus Checkout · ₱{cartSubtotal}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating AI Barista Widget Button in Bottom Right */}
      <div className={`fixed ${cart.length > 0 ? "bottom-20 sm:bottom-5" : "bottom-5"} right-4 sm:right-5 z-40 transition-all`}>
        <button
          type="button"
          onClick={() => {
            setAiModalOpen(true);
            playChime("notification");
          }}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-95 border-2 border-white/60 cursor-pointer"
        >
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
          <Coffee className="w-5 h-5 text-amber-200" />
          <span className="text-xs font-black tracking-wide">
            Ask Home
          </span>
        </button>
      </div>

      {/* Mobile Sticky Bottom Cart Bar */}
      {cart.length > 0 && !cartDrawerOpen && (
        <div className="fixed bottom-0 inset-x-0 z-30 sm:hidden bg-[#0f172a] text-white px-4 py-3 shadow-2xl flex items-center justify-between border-t border-white/10 animate-in slide-in-from-bottom duration-200">
          <div>
            <span className="text-[10px] text-white/70 block uppercase font-bold tracking-wider">
              Your Order ({cartItemCount} {cartItemCount === 1 ? "item" : "items"})
            </span>
            <strong className="text-base font-black text-amber-300 font-mono">
              ₱{cartSubtotal}
            </strong>
          </div>
          <button
            type="button"
            onClick={() => setCartDrawerOpen(true)}
            className="px-4 py-2 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-white" />
            <span>View Cart</span>
          </button>
        </div>
      )}

      {/* In-App Customer Toast Banner */}
      {customerToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-3.5 rounded-2xl bg-stone-900 text-white text-xs font-bold shadow-2xl flex items-center justify-between border border-white/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{customerToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setCustomerToast(null)}
              className="p-1 text-white/70 hover:text-white rounded-full cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* All Modal Integrations */}
      <CheckoutVerificationModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        cart={cart}
        cartSubtotal={cartSubtotal}
        onOrderSuccess={handleOrderSuccess}
      />

      <OrderTrackerModal
        isOpen={trackerModalOpen}
        onClose={() => setTrackerModalOpen(false)}
        initialOrderCode={activeOrderCode}
      />

      <AiBaristaModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onTriggerAction={handleAiAction}
      />
    </main>
  );
}
