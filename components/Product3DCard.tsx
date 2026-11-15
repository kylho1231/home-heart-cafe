"use client";

import React from "react";
import Image from "next/image";
import { Plus, Coffee, Ban, Sparkles } from "lucide-react";

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
  colors?: [string, string];
  accent?: string;
  image?: string;
  badge?: string;
  isAvailable?: boolean;
  isSelected?: boolean;
  onSelect: () => void;
  onQuickAdd?: (size: string) => void;
}

export function Product3DCard({
  name,
  category,
  description,
  sizes,
  image,
  badge,
  isAvailable = true,
  isSelected = false,
  onSelect,
}: Product3DCardProps) {
  const startingPrice = sizes[0]?.price ?? 0;
  const sizeCountLabel =
    sizes.length > 1 ? `${sizes.length} sizes` : sizes[0]?.label || "Regular";

  return (
    <div
      onClick={() => {
        if (isAvailable) onSelect();
      }}
      className={`group relative flex flex-col justify-between rounded-3xl p-4 bg-white border text-left cursor-pointer transition-all duration-200 select-none ${
        !isAvailable
          ? "opacity-60 bg-stone-50 border-stone-200 cursor-not-allowed"
          : isSelected
            ? "border-[#2563eb] ring-2 ring-[#2563eb]/20 shadow-md"
            : "border-stone-200/90 hover:border-[#2563eb]/50 hover:shadow-lg hover:-translate-y-0.5 shadow-xs"
      }`}
    >
      <div>
        {/* Top Header: Category & Badges */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {category}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {sizeCountLabel}
            </span>
            {badge && isAvailable && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                {badge}
              </span>
            )}
            {!isAvailable && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-800 text-white">
                Sold Out
              </span>
            )}
          </div>
        </div>

        {/* Product Image Stage with Fixed Aspect Ratio */}
        <div className="relative h-44 w-full rounded-2xl overflow-hidden mb-3 bg-gradient-to-b from-blue-50/60 to-slate-50/40 border border-slate-100 flex items-center justify-center p-2 group-hover:scale-[1.02] transition-transform duration-300">
          {image ? (
            <div className="relative w-full h-full">
              <Image
                src={image}
                alt={name}
                fill
                loading="lazy"
                sizes="(max-width: 640px) 240px, 300px"
                className="object-contain drop-shadow-xs transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          ) : (
            /* Branded Placeholder (Never Raw Text) */
            <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563eb] shadow-2xs mb-1.5">
                <Coffee className="w-6 h-6 text-[#2563eb]" />
              </div>
              <span className="text-xs font-bold text-slate-700 truncate max-w-[140px]">{name}</span>
              <span className="text-[10px] text-slate-400 font-medium">Home ❤️ Cafe</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <h3 className="font-extrabold text-slate-900 text-sm leading-snug group-hover:text-[#2563eb] transition-colors line-clamp-1">
          {name}
        </h3>
        {description && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Footer: Price & Add Button */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
            Starts at
          </span>
          <div className="text-base font-black text-slate-900 tracking-tight">
            ₱{startingPrice}
          </div>
        </div>

        <div>
          {isAvailable ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          ) : (
            <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
              <Ban className="w-3.5 h-3.5" />
              <span>Sold out</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
