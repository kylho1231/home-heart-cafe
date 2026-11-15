"use client";

import React from "react";
import Image from "next/image";
import { Plus, Coffee, Ban } from "lucide-react";

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
      className={`group relative flex flex-col justify-between rounded-2xl sm:rounded-3xl p-3 sm:p-4 bg-white border text-left cursor-pointer transition-all duration-200 select-none ${
        !isAvailable
          ? "opacity-60 bg-stone-50 border-stone-200 cursor-not-allowed"
          : isSelected
            ? "border-[#2563eb] ring-2 ring-[#2563eb]/20 shadow-md"
            : "border-stone-200/90 hover:border-[#2563eb]/50 hover:shadow-lg hover:-translate-y-0.5 shadow-xs"
      }`}
    >
      <div>
        {/* Top Header: Category & Badges */}
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate max-w-[110px]">
            {category}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
              {sizeCountLabel}
            </span>
            {badge && isAvailable && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                {badge}
              </span>
            )}
            {!isAvailable && (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-slate-800 text-white">
                Sold Out
              </span>
            )}
          </div>
        </div>

        {/* Product Image Stage with Fixed Aspect Ratio */}
        <div className="relative h-36 sm:h-40 w-full rounded-2xl overflow-hidden mb-2.5 bg-gradient-to-b from-blue-50/50 to-slate-50/30 border border-slate-100 flex items-center justify-center p-2 group-hover:scale-[1.02] transition-transform duration-300">
          {image ? (
            <div className="relative w-full h-full">
              <Image
                src={image}
                alt={name}
                fill
                loading="lazy"
                sizes="(max-width: 640px) 200px, 260px"
                className="object-contain drop-shadow-xs transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          ) : (
            /* Branded Placeholder (Never Raw Text) */
            <div className="flex flex-col items-center justify-center text-slate-400 p-3 text-center">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563eb] shadow-2xs mb-1">
                <Coffee className="w-5 h-5 text-[#2563eb]" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 truncate max-w-[130px]">{name}</span>
              <span className="text-[9px] text-slate-400 font-medium">Home ❤️ Cafe</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug group-hover:text-[#2563eb] transition-colors truncate">
          {name}
        </h3>
        {description && (
          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Footer: Price & Add Button */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <div>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 block">
            Starts at
          </span>
          <div className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
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
              className="flex items-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          ) : (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
              <Ban className="w-3 h-3" />
              <span>Sold out</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
