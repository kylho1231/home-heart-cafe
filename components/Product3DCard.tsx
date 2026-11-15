"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Plus, Sparkles, Check, Ban, Coffee } from "lucide-react";
import { playChime } from "@/lib/sound";

interface ProductSize {
  label: string;
  price: number;
}

interface Product3DCardProps {
  id: string;
  name: string;
  category: string;
  description: string;
  sizes: ProductSize[];
  colors: [string, string];
  accent: string;
  image?: string;
  badge?: string;
  isAvailable?: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onQuickAdd: (size: string) => void;
}

export function Product3DCard({
  name,
  category,
  description,
  sizes,
  colors,
  image,
  badge,
  isAvailable = true,
  isSelected,
  onSelect,
  onQuickAdd,
}: Product3DCardProps) {
  const [addedAnimation, setAddedAnimation] = useState(false);

  const handleQuickAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAvailable) return;
    playChime("add");
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 800);
    onQuickAdd(sizes[0]?.label || "12 oz");
  };

  const startingPrice = sizes[0]?.price ?? 0;
  const sizeCountLabel = sizes.length > 1 ? `${sizes.length} sizes` : sizes[0]?.label || "Regular";

  return (
    <div
      onClick={onSelect}
      className={`group relative flex flex-col justify-between rounded-3xl p-4 bg-white/95 border text-left cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl select-none ${
        !isAvailable
          ? "opacity-60 bg-stone-100/80 border-stone-300 pointer-events-none"
          : isSelected
            ? "border-[#b42356] ring-2 ring-[#b42356]/20 bg-[#fffafd] shadow-md"
            : "border-stone-200/80 hover:border-[#b42356]/40 shadow-sm"
      }`}
    >
      {/* Top Card Badge / Category */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
          {category}
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
            {sizeCountLabel}
          </span>
          {badge && isAvailable && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f7dce5] text-[#b42356] shadow-xs">
              <Sparkles className="w-2.5 h-2.5" />
              {badge}
            </span>
          )}
          {!isAvailable && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-800 text-white shadow-xs">
              Sold Out
            </span>
          )}
        </div>
      </div>

      {/* Visual Drink Stage */}
      <div
        className="relative h-44 w-full rounded-2xl overflow-hidden mb-3.5 flex items-center justify-center transition-transform duration-200 group-hover:scale-[1.02]"
        style={{
          background: `linear-gradient(135deg, ${colors[0]}40, ${colors[1]}80)`,
        }}
      >
        {image ? (
          <div className="relative w-full h-full p-2">
            <Image
              src={image}
              alt={name}
              fill
              className="object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
            />
          </div>
        ) : (
          /* Stylized Cup Illustration if no image file */
          <div className="relative flex flex-col items-center justify-center">
            <div
              className="w-20 h-28 rounded-b-2xl rounded-t-sm shadow-lg border border-white/70 relative overflow-hidden"
              style={{
                background: `linear-gradient(180deg, ${colors[1]}, ${colors[0]})`,
              }}
            >
              <div className="absolute top-0 inset-x-0 h-2 bg-white/50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Coffee className="w-6 h-6 text-white/90 drop-shadow-sm" />
              </div>
            </div>
            {/* Straw */}
            <div className="absolute -top-3 w-1.5 h-8 bg-red-400 rounded-full rotate-12 shadow-sm" />
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-stone-800 text-base leading-snug group-hover:text-[#b42356] transition-colors">
            {name}
          </h3>
          {description && (
            <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Sizes & Price footer */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] text-stone-400 block">Starts at</span>
            <div className="text-lg font-black text-[#382323] tracking-tight">
              ₱{startingPrice}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isAvailable ? (
              <button
                type="button"
                onClick={handleQuickAddClick}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                  addedAnimation
                    ? "bg-emerald-600 text-white scale-95"
                    : "bg-[#b42356] hover:bg-[#921a44] text-white active:scale-95"
                }`}
                title="Add to cart"
              >
                {addedAnimation ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Added!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Order</span>
                  </>
                )}
              </button>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-stone-200 text-stone-500">
                <Ban className="w-3.5 h-3.5" />
                <span>Unavailable</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
