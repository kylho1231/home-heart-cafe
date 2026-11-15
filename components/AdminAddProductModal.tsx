"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  X,
  Plus,
  Trash2,
  Coffee,
  CheckCircle2,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { playChime } from "@/lib/sound";
import { MenuItem, MenuItemSize } from "@/lib/menu";

interface AdminAddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: (product: MenuItem) => void;
}

const PRESET_CATEGORIES = [
  "Cream Cheese Series",
  "Milk Tea Series",
  "Milky Bomb Tea",
  "Fruit Soda",
  "Yakult Fruit Soda",
  "Coffee Series",
  "Float Series",
  "Snacks",
];

const PRESET_IMAGES = [
  { label: "Chocolate Milk Tea", path: "/products/chocolate-milk-tea.webp" },
  { label: "Strawberry Cream Cheese", path: "/products/strawberry-cream-cheese.webp" },
  { label: "Matcha Milk Tea", path: "/products/matcha-milk-tea.webp" },
  { label: "Blue Lemonade Fruit Soda", path: "/products/blue-lemonade-fruit-soda.webp" },
  { label: "Mango Fruit Soda", path: "/products/mango-fruit-soda.webp" },
  { label: "Cheese French Fries", path: "/products/cheese-french-fries.webp" },
  { label: "Double Chocolate Float", path: "/products/double-chocolate-float.webp" },
  { label: "Taro Cream Cheese", path: "/products/taro-cream-cheese.webp" },
  { label: "Yakult Mango", path: "/products/yakult-mango.webp" },
];

export function AdminAddProductModal({
  isOpen,
  onClose,
  onProductAdded,
}: AdminAddProductModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(PRESET_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState(PRESET_IMAGES[0].path);
  const [customImageUrl, setCustomImageUrl] = useState("");

  const [sizes, setSizes] = useState<MenuItemSize[]>([
    { label: "12 oz", price: 49 },
    { label: "16 oz", price: 59 },
    { label: "22 oz", price: 79 },
  ]);

  const [allowsBoba, setAllowsBoba] = useState(true);
  const [allowsCreamCheese, setAllowsCreamCheese] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddSizeVariant = () => {
    setSizes((prev) => [...prev, { label: "New Size", price: 50 }]);
  };

  const handleUpdateSizeVariant = (index: number, field: "label" | "price", val: any) => {
    setSizes((prev) =>
      prev.map((s, idx) => {
        if (idx === index) {
          return {
            ...s,
            [field]: field === "price" ? Math.max(1, parseInt(val, 10) || 0) : val,
          };
        }
        return s;
      }),
    );
  };

  const handleRemoveSizeVariant = (index: number) => {
    if (sizes.length <= 1) return;
    setSizes((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Product name is required.");
      return;
    }

    const finalCategory = category === "Other / Custom" ? customCategory.trim() : category;
    if (!finalCategory) {
      setErrorMsg("Please specify a valid product category.");
      return;
    }

    if (sizes.length === 0 || sizes.some((s) => !s.label.trim() || s.price <= 0)) {
      setErrorMsg("Please provide at least one valid size variant with a price > ₱0.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const finalImage = customImageUrl.trim() || selectedImage;

      const payload = {
        name: name.trim(),
        category: finalCategory,
        description: description.trim() || undefined,
        sizes,
        image: finalImage,
        allowsBoba,
        allowsCreamCheese,
      };

      const res = await fetch("/api/admin/menu/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success && data.product) {
        playChime("success");
        onProductAdded(data.product);
        onClose();
      } else {
        setErrorMsg(data.error || "Failed to add product.");
      }
    } catch {
      setErrorMsg("Network error connecting to product management service.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#f7dce5] text-[#b42356] flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-stone-900">Add New Menu Product</h3>
              <p className="text-[11px] text-stone-500">
                Create a drink, snack, or specialty item for Home Cafe.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Product Name */}
          <div>
            <label className="font-bold text-stone-700 block mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Spanish Latte Supreme"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 text-xs font-semibold focus:border-[#b42356] outline-none"
            />
          </div>

          {/* Category Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-stone-700 block mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 text-xs font-semibold focus:border-[#b42356] outline-none cursor-pointer"
              >
                {PRESET_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="Other / Custom">Other / Custom...</option>
              </select>
            </div>

            {category === "Other / Custom" && (
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Custom Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pastries"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 text-xs font-semibold focus:border-[#b42356] outline-none"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="font-bold text-stone-700 block mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Premium espresso layered with condensed milk and steamed milk..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 text-xs font-medium focus:border-[#b42356] outline-none"
            />
          </div>

          {/* Size & Pricing Variants */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-stone-700">Size & Price Variants *</label>
              <button
                type="button"
                onClick={handleAddSizeVariant}
                className="text-[11px] font-bold text-[#b42356] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Variant</span>
              </button>
            </div>

            <div className="space-y-2 bg-stone-50 p-3 rounded-2xl border border-stone-200">
              {sizes.map((s, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Size (e.g. 16 oz)"
                    value={s.label}
                    onChange={(e) => handleUpdateSizeVariant(idx, "label", e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-semibold outline-none"
                  />
                  <div className="relative w-28">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold">
                      ₱
                    </span>
                    <input
                      type="number"
                      min={1}
                      placeholder="Price"
                      value={s.price}
                      onChange={(e) => handleUpdateSizeVariant(idx, "price", e.target.value)}
                      className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-stone-300 bg-white text-right text-xs font-black outline-none"
                    />
                  </div>
                  {sizes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSizeVariant(idx)}
                      className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Image Selection */}
          <div>
            <label className="font-bold text-stone-700 block mb-1.5">
              Product Image Preview
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
              {PRESET_IMAGES.map((img) => (
                <button
                  key={img.path}
                  type="button"
                  onClick={() => {
                    setSelectedImage(img.path);
                    setCustomImageUrl("");
                  }}
                  className={`p-1 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedImage === img.path && !customImageUrl
                      ? "border-[#b42356] ring-2 ring-[#b42356]/20 bg-[#fffafd]"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  }`}
                >
                  <div className="relative w-full h-12">
                    <Image src={img.path} alt={img.label} fill className="object-contain" />
                  </div>
                  <span className="text-[9px] font-bold text-stone-600 block truncate mt-0.5">
                    {img.label.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Or enter custom image URL (/products/... or https://...)"
              value={customImageUrl}
              onChange={(e) => setCustomImageUrl(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-stone-300 bg-stone-50 text-[11px] font-mono outline-none focus:border-[#b42356]"
            />
          </div>

          {/* Add-ons Configuration */}
          <div className="flex gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-700">
              <input
                type="checkbox"
                checked={allowsBoba}
                onChange={(e) => setAllowsBoba(e.target.checked)}
                className="rounded accent-[#b42356] w-4 h-4"
              />
              <span>Allows Boba Pearls (+₱10)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-700">
              <input
                type="checkbox"
                checked={allowsCreamCheese}
                onChange={(e) => setAllowsCreamCheese(e.target.checked)}
                className="rounded accent-[#b42356] w-4 h-4"
              />
              <span>Allows Cream Cheese (+₱15)</span>
            </label>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-bold">
              {errorMsg}
            </div>
          )}

          {/* Submit Action */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-2xl bg-[#b42356] hover:bg-[#921a44] disabled:opacity-50 text-white font-black shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? "Saving..." : "Create Product"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
