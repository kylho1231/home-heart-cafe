"use client";

import React, { useState, useEffect, useId } from "react";
import Image from "next/image";
import { X, Plus, Minus, Check, Coffee, Sparkles } from "lucide-react";
import { OrderItem } from "@/lib/types";
import { playChime } from "@/lib/sound";

export interface CustomizationProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  flavors?: string[];
  sizes: { label: string; price: number }[];
  colors?: [string, string];
  accent?: string;
  image?: string;
  badge?: string;
}

interface CustomizationSheetProps {
  isOpen: boolean;
  product: CustomizationProduct | null;
  onClose: () => void;
  onAddToCart: (item: OrderItem) => void;
}

const SUGAR_OPTIONS: Array<{ value: "0%" | "25%" | "50%" | "75%" | "100%"; label: string; sub: string }> = [
  { value: "75%", label: "75%", sub: "Default" },
  { value: "100%", label: "100%", sub: "Full Sweet" },
  { value: "50%", label: "50%", sub: "Half Sweet" },
  { value: "25%", label: "25%", sub: "Gentle Sweet" },
  { value: "0%", label: "0%", sub: "No Sugar" },
];

const ICE_OPTIONS: Array<{ value: "Regular Ice" | "Less Ice" | "No Ice" | "Extra Ice"; label: string }> = [
  { value: "Regular Ice", label: "Regular" },
  { value: "Less Ice", label: "Less" },
  { value: "No Ice", label: "No Ice" },
  { value: "Extra Ice", label: "Extra" },
];

export function CustomizationSheet({
  isOpen,
  product,
  onClose,
  onAddToCart,
}: CustomizationSheetProps) {
  const titleId = useId();

  // State
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedSugar, setSelectedSugar] = useState<"0%" | "25%" | "50%" | "75%" | "100%">("75%");
  const [selectedIce, setSelectedIce] = useState<"Regular Ice" | "Less Ice" | "No Ice" | "Extra Ice">("Regular Ice");
  const [addBoba, setAddBoba] = useState<boolean>(false);
  const [addCreamCheese, setAddCreamCheese] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>("");

  // Sync state whenever product changes
  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes[0]?.label || "12 oz");
      setSelectedSugar("75%");
      setSelectedIce("Regular Ice");
      setAddBoba(false);
      setAddCreamCheese(false);
      setQuantity(1);
      setNotes("");
    }
  }, [product]);

  // Keyboard accessibility: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const isSnack = product.category.toLowerCase() === "snacks" || product.category.toLowerCase().includes("fries");
  const isCreamCheeseSeries = product.category.toLowerCase().includes("cream cheese");

  const currentSizeObj = product.sizes.find((s) => s.label === selectedSize) || product.sizes[0];
  const basePrice = currentSizeObj?.price || 0;
  const bobaCost = !isSnack && addBoba ? 10 : 0;
  const ccCost = !isSnack && !isCreamCheeseSeries && addCreamCheese ? 15 : 0;
  const unitPrice = basePrice + bobaCost + ccCost;
  const totalPrice = unitPrice * quantity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const orderItem: OrderItem = {
      id: `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productId: product.id,
      productName: product.name,
      category: product.category,
      flavor: product.flavors?.[0] || product.name,
      size: selectedSize || product.sizes[0]?.label || "12 oz",
      sugarLevel: isSnack ? "100%" : selectedSugar,
      iceLevel: isSnack ? "Regular Ice" : selectedIce,
      addBoba: !isSnack && addBoba,
      addCreamCheese: !isSnack && !isCreamCheeseSeries && addCreamCheese,
      quantity,
      unitPrice,
      subtotal: totalPrice,
      notes: notes.trim() || undefined,
    };

    playChime("add");
    onAddToCart(orderItem);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 motion-reduce:animate-none duration-200 border border-slate-200/80"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
              {product.category}
            </span>
            {product.badge && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                {product.badge}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close customization sheet"
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* Product Image & Info */}
          <div className="flex items-start gap-4">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-2xl bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-100/60 p-2 flex items-center justify-center overflow-hidden">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="120px"
                  className="object-contain p-1.5 transition-transform duration-300 hover:scale-105"
                />
              ) : (
                <Coffee className="w-10 h-10 text-blue-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 id={titleId} className="font-extrabold text-lg sm:text-xl text-slate-900 leading-tight">
                {product.name}
              </h2>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
              <div className="mt-2 text-base font-black text-blue-600">
                ₱{unitPrice}
              </div>
            </div>
          </div>

          {/* Size Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select Size
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {product.sizes.map((s) => {
                const isSelected = selectedSize === s.label;
                return (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setSelectedSize(s.label)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-600/20"
                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <span className="text-xs font-bold block">{s.label}</span>
                    <span className={`text-xs font-black mt-1 ${isSelected ? "text-blue-700" : "text-slate-600"}`}>
                      ₱{s.price}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sugar Level (Drinks only) */}
          {!isSnack && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Sugar Level
                </label>
                <span className="text-[11px] font-semibold text-blue-600">
                  {SUGAR_OPTIONS.find((opt) => opt.value === selectedSugar)?.label} ({SUGAR_OPTIONS.find((opt) => opt.value === selectedSugar)?.sub})
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {SUGAR_OPTIONS.map((opt) => {
                  const isSelected = selectedSugar === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedSugar(opt.value)}
                      className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? "border-blue-600 bg-blue-600 text-white font-bold shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-semibold"
                      }`}
                    >
                      <span className="block text-xs">{opt.label}</span>
                      <span className={`block text-[9px] truncate ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                        {opt.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ice Level (Drinks only) */}
          {!isSnack && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Ice Level
                </label>
                <span className="text-[11px] font-semibold text-blue-600">
                  {selectedIce}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {ICE_OPTIONS.map((opt) => {
                  const isSelected = selectedIce === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedIce(opt.value)}
                      className={`py-2.5 px-1 rounded-xl border text-center text-xs transition-all cursor-pointer ${
                        isSelected
                          ? "border-blue-600 bg-blue-600 text-white font-bold shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-semibold"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-ons (Drinks only) */}
          {!isSnack && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Optional Add-Ons
              </label>
              <div className="space-y-2">
                {/* Boba Pearls */}
                <button
                  type="button"
                  onClick={() => setAddBoba(!addBoba)}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-left ${
                    addBoba
                      ? "border-blue-600 bg-blue-50/70 text-blue-900"
                      : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                      addBoba ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white"
                    }`}>
                      {addBoba && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold block">Extra Chewy Boba Pearls</span>
                      <span className="text-[10px] text-slate-500">Brown sugar tapioca pearls</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-600">+₱10</span>
                </button>

                {/* Cream Cheese — only shown if not already Cream Cheese series */}
                {!isCreamCheeseSeries && (
                  <button
                    type="button"
                    onClick={() => setAddCreamCheese(!addCreamCheese)}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-left ${
                      addCreamCheese
                        ? "border-blue-600 bg-blue-50/70 text-blue-900"
                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        addCreamCheese ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white"
                      }`}>
                        {addCreamCheese && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <span className="text-xs font-bold block">Extra Cream Cheese Layer</span>
                        <span className="text-[10px] text-slate-500">Savory-sweet cream cheese walling</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-600">+₱15</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Special Instructions (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Separate straw, packed for faculty"
              maxLength={150}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
            />
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 backdrop-blur-xs flex items-center justify-between gap-3">
          {/* Quantity Stepper */}
          <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-2xs">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="p-2.5 text-slate-600 hover:text-slate-900 disabled:opacity-40 cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-xs font-black text-slate-900">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(Math.min(20, quantity + 1))}
              disabled={quantity >= 20}
              className="p-2.5 text-slate-600 hover:text-slate-900 disabled:opacity-40 cursor-pointer"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart CTA */}
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add {selectedSize} · ₱{totalPrice}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
