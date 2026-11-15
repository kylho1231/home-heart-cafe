"use client";

import React, { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  Star,
  Plus,
  Sparkles,
  ArrowRight,
  Shuffle,
  Search,
  Gift,
  CheckCircle2,
  Coffee,
} from "lucide-react";
import catalogSource from "@/app/menu-data.json";
import productImagesMap from "@/app/product-images.json";

export interface ExperienceProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  sizes?: number | { label: string; price: number }[];
  isBestseller?: boolean;
}

// Canonical fallback derived from Home Heart Cafe menu
const DEFAULT_MENU_ITEMS: ExperienceProduct[] = [
  {
    id: "strawberry-cream-cheese",
    name: "Strawberry Cream Cheese",
    category: "Cream Cheese Series",
    price: 49,
    description: "Fruity strawberry bliss combined with smooth savory cream cheese walling.",
    image: "/products/strawberry-cream-cheese.webp",
    sizes: 3,
    isBestseller: true,
  },
  {
    id: "okinawa-cream-cheese",
    name: "Okinawa Cream Cheese",
    category: "Cream Cheese Series",
    price: 49,
    description: "Roasted brown sugar milk tea paired with velvety savory cream cheese.",
    image: "/products/okinawa-cream-cheese.webp",
    sizes: 3,
    isBestseller: true,
  },
  {
    id: "spanish-latte",
    name: "Spanish Latte",
    category: "Coffee Series",
    price: 69,
    description: "Sweet condensed milk layered with bold espresso and velvety fresh milk.",
    image: "/products/chocolate-milk-tea.webp",
    sizes: 3,
    isBestseller: true,
  },
  {
    id: "chuckie-float",
    name: "Chuckie Float",
    category: "Floats Series",
    price: 50,
    description: "Nostalgic chocolate malt drink crowned with creamy vanilla soft ice cream.",
    image: "/products/double-chocolate-float.webp",
    sizes: 2,
    isBestseller: true,
  },
  {
    id: "cheese-french-fries",
    name: "Cheese French Fries",
    category: "Snacks",
    price: 40,
    description: "Freshly fried hot potato fries tossed in savory cheddar cheese seasoning.",
    image: "/products/cheese-french-fries.webp",
    sizes: 2,
    isBestseller: true,
  },
];

interface CafeMenuExperienceProps {
  items?: ExperienceProduct[];
  onCustomize?: (product: ExperienceProduct) => void;
  eligibleDrinkSpend?: number;
}

/**
 * Handcrafted Campus Favorites Showcase (Clean, Bespoke Cafe Rail)
 */
export function CurvedSpotlightRail({
  bestsellers,
  onSelect,
}: {
  bestsellers: ExperienceProduct[];
  onSelect?: (product: ExperienceProduct) => void;
}) {
  return (
    <div className="relative w-full rounded-3xl bg-stone-50/80 border border-stone-200/80 p-4 sm:p-6">
      {/* Grid on Desktop & Tablet, Smooth Scroll on Mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {bestsellers.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelect?.(item)}
            className="group relative cursor-pointer rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-3.5 sm:p-4 shadow-xs hover:border-blue-600 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 select-none flex flex-col justify-between"
          >
            <div>
              {/* Header Badge & Price */}
              <div className="mb-2 flex items-center justify-between text-xs font-bold gap-1">
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-blue-700 border border-blue-200/80 truncate">
                  ⭐ Bestseller
                </span>
                <span className="font-extrabold text-slate-900 text-xs shrink-0">
                  ₱{item.price}
                </span>
              </div>

              {/* Product Image Stage */}
              <div className="relative mx-auto my-2 h-28 w-28 sm:h-32 sm:w-32 overflow-hidden rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center p-1.5">
                <Image
                  src={item.image}
                  alt={item.name}
                  width={128}
                  height={128}
                  sizes="(max-width: 640px) 112px, 128px"
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-xs"
                />
              </div>

              {/* Name & Snippet */}
              <h3 className="line-clamp-1 text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                {item.name}
              </h3>
              <p className="mt-0.5 line-clamp-1 text-[11px] leading-relaxed text-slate-500">
                {item.description}
              </p>
            </div>

            {/* Single Action CTA */}
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase">
                {item.sizes ? (typeof item.sizes === 'number' ? `${item.sizes} sizes` : `${item.sizes.length} sizes`) : "Standard"}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.(item);
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Complete Interactive Cafe Menu Experience
 * Featuring Curved SVG Spotlight Rail, Pure JS Array Shuffle, Category Navigation, & Free Fries Spend Tracker
 */
export default function CafeMenuExperience({
  items = DEFAULT_MENU_ITEMS,
  onCustomize,
  eligibleDrinkSpend = 0,
}: CafeMenuExperienceProps) {
  // Top 5 Bestsellers for the Curved SVG Rail
  const bestsellers = useMemo(() => {
    const list = items.filter((item) => item.isBestseller);
    return list.length >= 3 ? list.slice(0, 5) : items.slice(0, 5);
  }, [items]);

  // Extract Categories dynamically
  const categories = useMemo(() => {
    const set = new Set<string>(["All"]);
    for (const item of items) {
      if (item.category) set.add(item.category);
    }
    return Array.from(set);
  }, [items]);

  // Filterable & Shuffle Menu State
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [orderedItems, setOrderedItems] = useState<ExperienceProduct[]>(items);
  const [isShuffling, setIsShuffling] = useState(false);

  // Sync internal ordered items when parent items update
  React.useEffect(() => {
    setOrderedItems(items);
  }, [items]);

  // Pure JS Fisher-Yates Array Shuffle (zero third-party animation bloat)
  const handleShuffle = useCallback(() => {
    setIsShuffling(true);
    const copy = [...orderedItems];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    setOrderedItems(copy);
    setTimeout(() => setIsShuffling(false), 200);
  }, [orderedItems]);

  const filteredMenu = useMemo(() => {
    return orderedItems.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [orderedItems, selectedCategory, searchQuery]);

  const FREE_FRIES_THRESHOLD = 200;
  const friesProgress = Math.min(
    100,
    (eligibleDrinkSpend / FREE_FRIES_THRESHOLD) * 100
  );
  const remainingForFries = Math.max(0, FREE_FRIES_THRESHOLD - eligibleDrinkSpend);

  return (
    <div className="w-full space-y-16 py-8">
      {/* 1. FEATURED BESTSELLERS — CURVED SVG SPOTLIGHT RAIL */}
      <section id="featured" className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="mb-8 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#2563eb] border border-blue-200/80">
            <Star className="w-3.5 h-3.5 fill-[#2563eb]" />
            <span>Campus Favorites</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-[#0f172a] sm:text-4xl">
            Featured Drinks &amp; Bestsellers
          </h2>
          <p className="mx-auto max-w-xl text-xs sm:text-sm text-stone-600">
            Hover or tap any card along the curved rail to spotlight top student and teacher picks.
          </p>
        </div>

        {/* Curved Rail Component */}
        <CurvedSpotlightRail
          bestsellers={bestsellers}
          onSelect={(item) => onCustomize?.(item)}
        />
      </section>

      {/* 2. COMPLETE CAFE MENU BAR WITH SHUFFLE & CATEGORIES */}
      <section id="menu-experience" className="mx-auto max-w-7xl px-4 sm:px-8 space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#dbeafe] px-3 py-1 text-xs font-bold text-[#2563eb]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Menu</span>
            </div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-[#0f172a]">
              Complete Cafe Menu
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-stone-600">
              Filter by series or tap shuffle when you can&apos;t decide what to order before break.
            </p>
          </div>

          {/* Live Free Fries Spend Mini-Tracker */}
          <div className="w-full rounded-2xl border border-amber-200 bg-amber-50/90 p-3.5 shadow-2xs md:w-80">
            <div className="flex items-center justify-between text-xs font-bold text-amber-950">
              <span className="flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-amber-600" />
                <span>Free Medium Fries Goal</span>
              </span>
              <span className="font-mono">
                ₱{eligibleDrinkSpend} / ₱{FREE_FRIES_THRESHOLD}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-amber-200/70">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${friesProgress}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-amber-900">
              {remainingForFries > 0 ? (
                <>
                  Add <strong className="text-amber-950">₱{remainingForFries}</strong> more in drinks to unlock!
                </>
              ) : (
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Unlocked! Free Medium Fries in your cart.</span>
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Filter Pills, Search, & Shuffle Button */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-[#2563eb] text-white shadow-xs"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {/* Search + Vanilla JS Shuffle Button */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search drinks..."
                className="w-full rounded-full border border-stone-200 bg-white pl-8 pr-3 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:border-[#2563eb] outline-none shadow-2xs"
              />
            </div>
            <button
              type="button"
              onClick={handleShuffle}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 text-xs font-bold text-[#2563eb] transition-all active:scale-95 shadow-2xs cursor-pointer"
              title="Randomize menu order"
            >
              <Shuffle className={`w-3.5 h-3.5 ${isShuffling ? "animate-spin" : ""}`} />
              <span>Shuffle</span>
            </button>
          </div>
        </div>

        {/* Responsive Menu Grid */}
        {filteredMenu.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-200 py-12 text-center bg-stone-50/50">
            <Coffee className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-xs sm:text-sm font-semibold text-stone-600">
              No drinks matched &ldquo;{searchQuery}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="mt-2 text-xs font-bold text-[#2563eb] hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 gap-5 transition-opacity duration-200 sm:grid-cols-2 lg:grid-cols-4 ${
              isShuffling ? "opacity-50" : "opacity-100"
            }`}
          >
            {filteredMenu.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col justify-between rounded-3xl border border-stone-200 bg-white p-4 shadow-2xs transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
              >
                <div>
                  {/* Badges */}
                  <div className="flex items-center justify-between gap-2 text-[10px] font-bold">
                    <span className="rounded-md bg-stone-100 px-2 py-0.5 text-stone-600">
                      {item.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {item.isBestseller && (
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[#2563eb] border border-blue-200">
                          Bestseller
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Image */}
                  <div className="my-3 flex h-36 items-center justify-center rounded-2xl bg-stone-50/80 p-2 overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={140}
                      height={140}
                      className="h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-sm font-black text-stone-900 group-hover:text-[#2563eb] transition-colors line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-stone-500">
                    {item.description}
                  </p>
                </div>

                {/* Price & Action Button */}
                <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider font-bold text-stone-400">
                      Starts at
                    </span>
                    <span className="text-base font-black text-stone-900">
                      ₱{item.price}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onCustomize?.(item)}
                    className="rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] px-3.5 py-1.5 text-xs font-bold text-white transition-all active:scale-95 shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>+ Customize</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
