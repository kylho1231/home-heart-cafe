"use client";

import React, { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Plus, Sparkles, Check } from "lucide-react";
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
  accent,
  image,
  badge,
  isSelected,
  onSelect,
  onQuickAdd,
}: Product3DCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [addedAnimation, setAddedAnimation] = useState(false);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -9; // Max 9 deg
    const rotateY = ((x - centerX) / centerX) * 9;

    setTransform(
      `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.025, 1.025, 1.025)`,
    );

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setGlarePos({ x: glareX, y: glareY, opacity: 0.25 });
  }, []);

  const handlePointerLeave = () => {
    setTransform("perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  const handleQuickAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playChime("add");
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 800);
    onQuickAdd(sizes[0].label);
  };

  const startingPrice = sizes[0]?.price ?? 0;

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={onSelect}
      style={{
        transform,
        transition: "transform 0.15s ease-out, box-shadow 0.2s ease-out, border-color 0.2s",
      }}
      className={`group relative flex flex-col justify-between rounded-3xl p-4 bg-white/95 border text-left cursor-pointer transition-shadow shadow-sm hover:shadow-xl select-none ${
        isSelected
          ? "border-[#b42356] ring-2 ring-[#b42356]/20 bg-[#fffafd]"
          : "border-stone-200/80 hover:border-[#b42356]/40"
      }`}
    >
      {/* 3D Dynamic Glare Light Reflection */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 65%)`,
          opacity: glarePos.opacity,
        }}
      />

      {/* Top Card Badge / Category */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
          {category}
        </span>
        {badge ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#f7dce5] text-[#b42356] shadow-xs">
            <Sparkles className="w-3 h-3" />
            {badge}
          </span>
        ) : (
          <span className="text-[11px] text-stone-400 font-medium">
            {sizes.length > 1 ? `${sizes.length} sizes` : sizes[0]?.label}
          </span>
        )}
      </div>

      {/* 3D Visual Drink Stage */}
      <div
        className="relative h-44 w-full rounded-2xl overflow-hidden mb-3.5 flex items-center justify-center transition-transform group-hover:scale-[1.02]"
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
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        ) : (
          /* Stylized 3D Cup Illustration if no image file */
          <div className="relative flex flex-col items-center justify-center">
            <div
              className="w-20 h-28 rounded-b-2xl rounded-t-sm shadow-lg border border-white/70 relative overflow-hidden"
              style={{
                background: `linear-gradient(180deg, ${colors[1]}, ${colors[0]})`,
              }}
            >
              <div className="absolute top-0 inset-x-0 h-2 bg-white/50" />
              <div className="absolute inset-x-0 bottom-0 h-10 bg-black/15 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white/90 drop-shadow-sm">
                  {sizes[0]?.label}
                </span>
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
            <button
              type="button"
              onClick={handleQuickAddClick}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-all ${
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
          </div>
        </div>
      </div>
    </div>
  );
}
