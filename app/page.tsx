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
  Menu,
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
import { CustomizationSheet } from "@/components/CustomizationSheet";

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
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
  const heroProduct = useMemo(
    () => products.find((p) => p.id === "strawberry-cream-cheese") || products[0],
    [products],
  );

  const handleSheetAddToCart = (item: OrderItem) => {
    setCart((prev) => {
      const existing = prev.find((it) => it.id === item.id);
      if (existing) {
        return prev.map((it) =>
          it.id === item.id
            ? {
                ...it,
                quantity: it.quantity + item.quantity,
                subtotal: (it.quantity + item.quantity) * it.unitPrice,
              }
            : it,
        );
      }
      return [...prev, item];
    });
    showCustomerToast(`Added ${item.productName} to your cart!`);
    setCartDrawerOpen(true);
  };

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

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((it) => it.id !== id));
    playChime("add");
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
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-8 py-3 transition-shadow">
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
              Campus Favorites
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
            {/* Audio Chime Mute Toggle (Desktop) */}
            <button
              type="button"
              onClick={() => {
                const next = toggleSound();
                setSoundMutedState(next);
              }}
              className={`hidden sm:inline-flex p-2 rounded-full border border-stone-200 bg-white hover:border-[#2563eb] transition-colors shadow-2xs cursor-pointer ${
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
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full border border-stone-200 bg-white hover:border-[#2563eb] text-xs font-bold text-stone-700 transition-colors shadow-2xs cursor-pointer"
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
              aria-label={`Shopping cart with ${cartItemCount} items`}
              className="flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="font-black">{cartItemCount}</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-stone-200 bg-white hover:border-[#2563eb] text-stone-700 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-stone-100 flex flex-col gap-2.5 pb-2 animate-in slide-in-from-top-2 duration-200">
            <a
              href="#featured"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-stone-50 text-xs font-bold text-stone-700 hover:text-[#2563eb] transition-colors"
            >
              Campus Favorites
            </a>
            <a
              href="#menu"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-stone-50 text-xs font-bold text-stone-700 hover:text-[#2563eb] transition-colors"
            >
              Complete Cafe Menu
            </a>
            <a
              href="#bundles"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-stone-50 text-xs font-bold text-stone-700 hover:text-[#2563eb] transition-colors"
            >
              Barkada Saver Bundles
            </a>
            <a
              href="#events"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-stone-50 text-xs font-bold text-stone-700 hover:text-[#2563eb] transition-colors"
            >
              Campus Life & Events
            </a>
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between px-3 text-xs text-stone-500">
              <span>Cafe Chime Sounds</span>
              <button
                type="button"
                onClick={() => {
                  const next = toggleSound();
                  setSoundMutedState(next);
                }}
                className="text-xs font-bold text-[#2563eb]"
              >
                {soundMuted ? "Unmute" : "Mute"}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Slim Free Medium Fries Promo Banner */}
      <div className="bg-amber-500/10 border-b border-amber-200/80 px-4 py-2.5 text-center text-xs font-semibold text-amber-950 flex items-center justify-center gap-2">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[11px] font-black shrink-0">
          🍟
        </span>
        <span>
          <strong>Campus Promo:</strong> Spend ₱200 on drinks, get free Medium Fries!
        </span>
        {eligibleDrinkSpend > 0 && (
          <span className="text-[11px] bg-white px-2.5 py-0.5 rounded-full text-amber-900 border border-amber-300 font-bold ml-1">
            {eligibleDrinkSpend >= 200 ? "Unlocked 🎉" : `₱${200 - eligibleDrinkSpend} more to unlock`}
          </span>
        )}
      </div>

      {/* Hero Showcase Section */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 px-4 sm:px-8 border-b border-blue-100/70 bg-gradient-to-b from-white via-blue-50/20 to-white">
        {/* Ambient background decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-100/30 via-sky-50/15 to-transparent blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Headline, Subtext, Primary Actions */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-5">
            {/* Campus Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold uppercase tracking-wider shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" style={{ animationDuration: "6s" }} />
              <span>Campus Cafe · Order Ahead</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Your next happy sip starts here.
            </h1>

            {/* One-line Subtext */}
            <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
              Order ahead before recess or break. Pick your drink, verify with your school ID, and pick up fresh at the counter.
            </p>

            {/* ONE primary button and secondary Track Order link */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-1">
              <a
                href="#menu"
                className="px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <span>Order now</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setTrackerModalOpen(true)}
                className="text-xs sm:text-sm font-bold text-slate-700 hover:text-blue-600 underline underline-offset-4 decoration-slate-300 hover:decoration-blue-600 transition-colors cursor-pointer py-2 px-1"
              >
                Track order →
              </button>
            </div>

            {/* Friendly Info Strip Under Hero */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-5 text-xs text-slate-500 font-semibold">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Student & Faculty ID Verification</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Quick Counter Pickup</span>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Featured Hero Product Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div
              onClick={() => heroProduct && setCustomizingProduct(heroProduct)}
              className="group relative w-full max-w-sm rounded-3xl bg-white border border-blue-100/90 shadow-xl hover:shadow-2xl transition-all duration-300 p-6 flex flex-col items-center cursor-pointer overflow-hidden"
            >
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                  ⭐ Campus Favorite
                </span>
              </div>

              <div className="relative w-56 h-56 sm:w-64 sm:h-64 my-2 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-100/50 via-rose-50/30 to-amber-50/20 blur-xl group-hover:scale-110 transition-transform duration-500" />
                {heroProduct?.image ? (
                  <Image
                    src={heroProduct.image}
                    alt={heroProduct.name}
                    width={260}
                    height={260}
                    priority
                    sizes="(max-width: 640px) 220px, 260px"
                    className="object-contain relative z-10 group-hover:scale-105 group-active:scale-98 transition-transform duration-300 drop-shadow-md"
                  />
                ) : (
                  <Coffee className="w-20 h-20 text-blue-400" />
                )}
              </div>

              <div className="w-full text-center mt-2 space-y-1">
                <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 group-hover:text-blue-600 transition-colors">
                  {heroProduct?.name || "Strawberry Cream Cheese"}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1">
                  {heroProduct?.description || "Fruity strawberry bliss combined with savory cream cheese"}
                </p>
                <div className="pt-3 flex items-center justify-between border-t border-slate-100 mt-3 w-full">
                  <span className="text-xs text-slate-500 font-medium">
                    Starts at <strong className="text-sm font-black text-slate-900">₱{heroProduct?.sizes[0]?.price || 49}</strong>
                  </span>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-blue-600 group-hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Customize</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Drinks & Bestsellers Row — Curved SVG Spotlight Rail */}
      <section id="featured" className="scroll-mt-20 px-4 sm:px-8 py-10 max-w-7xl mx-auto border-b border-stone-200/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dbeafe] text-[#2563eb] text-xs font-bold uppercase tracking-wider mb-1">
              <Star className="w-3.5 h-3.5 fill-[#2563eb]" />
              <span>Campus Favorites</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a]">
              Campus Favorites
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] mt-0.5">
              Most ordered by students and teachers
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
            const foundProduct = products.find((p) => p.id === item.id);
            if (foundProduct) {
              setCustomizingProduct(foundProduct);
            }
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
            <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a]">
              {activeCategory === "All" ? "Complete Cafe Menu" : activeCategory}
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              {searchTerm ? `Found ${filteredProducts.length} matching items` : `Showing ${filteredProducts.length} items`}
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
                    setCustomizingProduct(product);
                  }}
                  onQuickAdd={() => {
                    setCustomizingProduct(product);
                  }}
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

          {/* Subtle Navigation Indicator */}
          {searchTerm && (
            <div className="flex items-center justify-between text-xs text-stone-500 pt-2 px-1">
              <span className="font-semibold text-stone-500">
                Found {filteredProducts.length} results for &ldquo;{searchTerm}&rdquo;
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Barkada Bundles Interactive Builder */}
      <section id="bundles" className="scroll-mt-20 px-4 sm:px-8 py-12 bg-slate-50/70 border-t border-b border-slate-200">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              <span>Barkada Saver Bundles</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5">
              Share More, Spend Less With Your Barkada
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1">
              Freshly prepared combos made for campus groups! Pick between Fruit Soda (₱135) or Milk Tea (₱155) — each includes 3 drinks + 1 Large French Fries.
            </p>
          </div>

          {/* Stepped Interactive Builder */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-8">
            {/* Step 1: Choose Bundle Type */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                  1
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Choose Bundle Type
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bundleChoices.map((b) => {
                  const isSelected = bundleId === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setBundleId(b.id);
                        const drinks = getBundleDrinks(b.drinkCategory);
                        setBundleDrinkIds(Array.from({ length: 3 }, () => drinks[0]?.id ?? products[0].id));
                        playChime("add");
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20 shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">
                            {b.badge}
                          </span>
                          <strong className="text-base font-black text-slate-900 block mt-0.5">
                            {b.name}
                          </strong>
                        </div>
                        <span className="text-lg font-black text-blue-600">
                          ₱{b.price}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        {b.description}
                      </p>
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span>3x 12oz {b.drinkCategory === "Fruit Soda" ? "Fruit Sodas" : "Milk Teas"} + 1 Large Fries</span>
                        <span className="text-emerald-600 font-bold">{b.savingsText}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Pick 3 Drinks */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                    2
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Pick 3 Drinks (12 oz each)
                  </h3>
                </div>
                <span className="text-xs text-blue-600 font-bold">
                  {activeBundle.drinkCategory} Series
                </span>
              </div>

              {/* 3 Selected Drink Slots */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {bundleDrinkIds.map((drinkId, idx) => {
                  const selectedDrink = activeBundleDrinks.find((d) => d.id === drinkId);
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
                        <span>Drink #{idx + 1}</span>
                        <span className="text-blue-600 font-semibold">12 oz</span>
                      </div>
                      <strong className="text-sm font-bold text-slate-900 truncate">
                        {selectedDrink?.name || "Select Drink"}
                      </strong>
                      <span className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {selectedDrink?.description || "Handcrafted beverage"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Drink Selector Chips for each slot */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Select drinks from available flavors:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[0, 1, 2].map((slotIdx) => (
                    <div key={slotIdx} className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Slot #{slotIdx + 1}
                      </span>
                      <select
                        value={bundleDrinkIds[slotIdx] || ""}
                        onChange={(e) => {
                          const next = [...bundleDrinkIds];
                          next[slotIdx] = e.target.value;
                          setBundleDrinkIds(next);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-blue-600"
                      >
                        {activeBundleDrinks.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 3: Pick Your Fries */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                  3
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Pick Your Large French Fries
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {products
                  .filter((p) => p.category === "Snacks")
                  .map((fries) => {
                    const isSelected = bundleFriesId === fries.id;
                    return (
                      <button
                        key={fries.id}
                        type="button"
                        onClick={() => {
                          setBundleFriesId(fries.id);
                          playChime("add");
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-500/20 font-bold"
                            : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                        }`}
                      >
                        <div>
                          <strong className="text-xs font-bold block">{fries.name}</strong>
                          <span className="text-[10px] text-slate-500">Large Size · Included</span>
                        </div>
                        <span className="text-lg">🍟</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Step 4: Summary & Add to Cart */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-600 text-center sm:text-left">
                <strong className="text-slate-900 block sm:inline">Bundle Summary: </strong>
                3x 12oz {activeBundle.drinkCategory} + 1x Large Fries
              </div>
              <button
                type="button"
                onClick={handleAddBundle}
                disabled={bundleDrinkIds.length !== 3 || !bundleFriesId}
                className="w-full sm:w-auto px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add {activeBundle.name} · ₱{activeBundle.price}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Atmosphere & Cafe Events Section */}
      <section id="events" className="scroll-mt-20 px-4 sm:px-8 py-12 max-w-7xl mx-auto space-y-8">
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200">
          <div className="relative w-full sm:max-w-md h-[88vh] sm:h-full bg-white rounded-t-3xl sm:rounded-none shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">Your Cart ({cartItemCount})</h3>
              </div>
              <button
                type="button"
                onClick={() => setCartDrawerOpen(false)}
                aria-label="Close cart drawer"
                className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 p-5 overflow-y-auto divide-y divide-slate-100 space-y-3">
              {cart.length === 0 ? (
                <div className="p-10 text-center text-slate-400 space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
                    <ShoppingBag className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="font-bold text-base text-slate-800">Your cart is empty.</p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Add a handcrafted drink or fries from the menu to get started!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCartDrawerOpen(false);
                      document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="mt-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Coffee className="w-3.5 h-3.5" />
                    <span>Browse Menu</span>
                  </button>
                </div>
              ) : (
                <>
                  {cart.map((item) => (
                    <div key={item.id} className="pt-3 first:pt-0 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <strong className="text-slate-900 text-sm font-bold block truncate">
                          {item.bundleName || item.productName}
                        </strong>
                        <span className="text-slate-500 text-xs block mt-0.5">
                          {item.flavor} · {item.size}
                        </span>
                        <span className="text-slate-400 text-[11px] block">
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
                        <span className="font-black text-sm text-slate-900">
                          ₱{item.subtotal}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center border border-slate-200 rounded-full px-2 py-0.5 bg-slate-50">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              aria-label="Decrease quantity"
                              className="p-0.5 text-slate-600 hover:text-red-600 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold w-4 text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              aria-label="Increase quantity"
                              className="p-0.5 text-slate-600 hover:text-emerald-600 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            aria-label={`Remove ${item.bundleName || item.productName} from cart`}
                            className="p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Free Fries Promo Line Item */}
                  {eligibleDrinkSpend >= 200 && (
                    <div className="pt-3 flex items-start justify-between gap-3 bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 shadow-2xs">
                      <div className="flex items-start gap-2.5">
                        <span className="text-xl">🍟</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <strong className="text-slate-900 text-xs sm:text-sm font-bold">Free Medium Fries</strong>
                            <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-full">Reward</span>
                          </div>
                          <span className="text-slate-500 text-[11px] block mt-0.5">Cheese Flavor · Medium Size</span>
                          <span className="text-amber-800 text-[10px] block font-semibold">Unlocked with ₱200+ drink spend</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="line-through text-xs text-slate-400 block">₱40</span>
                        <span className="text-xs sm:text-sm font-black text-emerald-600">₱0</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-5 bg-slate-50/90 border-t border-slate-200 space-y-3.5">
                {/* Promo Progress Bar */}
                <div className="p-3 rounded-2xl bg-white border border-slate-200/80 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      {eligibleDrinkSpend >= 200
                        ? "Free Medium Fries added 🎉"
                        : `Add ₱${200 - eligibleDrinkSpend} more for free Medium Fries!`}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-500">
                      ₱{eligibleDrinkSpend}/₱200
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (eligibleDrinkSpend / 200) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    * Free fries unlocks at ₱200+ in ala-carte drinks. Bundles and snacks are excluded.
                  </p>
                </div>

                {/* Subtotal, Promo, Total */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-bold text-slate-800">₱{cartSubtotal}</span>
                  </div>
                  {eligibleDrinkSpend >= 200 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Promo Reward:</span>
                      <span>-₱40 (FREE Fries)</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-1.5 border-t border-slate-200">
                    <span>Total:</span>
                    <span className="text-base text-blue-600 font-black">₱{cartSubtotal}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCartDrawerOpen(false);
                    setCheckoutModalOpen(true);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
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
          aria-label="Ask Hearty AI Barista"
          className="group relative flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-200 active:scale-95 border border-white/40 cursor-pointer"
        >
          <span className="absolute -top-1 -right-1 w-3 rounded-full h-3 bg-emerald-400 ring-2 ring-white animate-pulse" />
          <Coffee className="w-4 h-4 text-amber-200" />
          <span className="text-xs font-extrabold tracking-wide">
            Ask Hearty
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
      {/* Unified Customization Sheet */}
      <CustomizationSheet
        isOpen={!!customizingProduct}
        product={customizingProduct}
        onClose={() => setCustomizingProduct(null)}
        onAddToCart={handleSheetAddToCart}
      />
    </main>
  );
}
