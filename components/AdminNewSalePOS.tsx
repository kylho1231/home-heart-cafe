"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Search,
  Sparkles,
  CreditCard,
  Banknote,
  Gift,
  Coffee,
  X,
  User,
  Phone,
} from "lucide-react";
import { playChime } from "@/lib/sound";
import { CafeOrder } from "@/lib/types";
import { MenuItem } from "@/lib/menu";

interface AdminNewSalePOSProps {
  menuItems: MenuItem[];
  onSaleCompleted: (order: CafeOrder, changeAmount: number) => void;
  onCancel?: () => void;
}

interface PosCartItem {
  cartItemId: string;
  productId: string;
  productName: string;
  category: string;
  flavor: string;
  size: string;
  sugarLevel: "0%" | "25%" | "50%" | "75%" | "100%";
  iceLevel: "No Ice" | "Less Ice" | "Regular Ice" | "Extra Ice";
  addBoba: boolean;
  addCreamCheese: boolean;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

export function AdminNewSalePOS({ menuItems, onSaleCompleted, onCancel }: AdminNewSalePOSProps) {
  // Customer Details
  const [customerName, setCustomerName] = useState("Walk-in Counter Customer");
  const [customerRole, setCustomerRole] = useState<"walk_in_customer" | "student" | "teacher_staff">("walk_in_customer");
  const [contactNumber, setContactNumber] = useState("Counter Pickup");

  // Filtering
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Product Customizer Drawer
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedSugar, setSelectedSugar] = useState<"0%" | "25%" | "50%" | "75%" | "100%">("75%");
  const [selectedIce, setSelectedIce] = useState<"No Ice" | "Less Ice" | "Regular Ice" | "Extra Ice">("Regular Ice");
  const [addBoba, setAddBoba] = useState(false);
  const [addCreamCheese, setAddCreamCheese] = useState(false);
  const [itemQty, setItemQty] = useState(1);
  const [itemNotes, setItemNotes] = useState("");

  // Cart
  const [cart, setCart] = useState<PosCartItem[]>([]);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<"counter_cash" | "gcash_full">("counter_cash");
  const [cashTendered, setCashTendered] = useState<string>("");
  const [gcashRef, setGcashRef] = useState("");
  const [initialStatus, setInitialStatus] = useState<"preparing" | "ready_for_pickup" | "completed">("preparing");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(menuItems.map((m) => m.category));
    return ["All", ...Array.from(set)];
  }, [menuItems]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat = categoryFilter === "All" || item.category === categoryFilter;
      const matchQ =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQ;
    });
  }, [menuItems, categoryFilter, searchQuery]);

  // Handle open customizer
  const openCustomizer = (item: MenuItem) => {
    setActiveItem(item);
    setSelectedSize(item.sizes[0]?.label || "12 oz");
    setSelectedSugar("75%");
    setSelectedIce("Regular Ice");
    setAddBoba(false);
    setAddCreamCheese(false);
    setItemQty(1);
    setItemNotes("");
  };

  // Add customized item to cart
  const handleAddToCart = () => {
    if (!activeItem) return;
    const variant = activeItem.sizes.find((s) => s.label === selectedSize) || activeItem.sizes[0];
    if (!variant) return;

    let unit = variant.price;
    if (addBoba) unit += 10;
    if (addCreamCheese) unit += 15;

    const newItem: PosCartItem = {
      cartItemId: `${activeItem.id}-${selectedSize}-${Date.now()}`,
      productId: activeItem.id,
      productName: activeItem.name,
      category: activeItem.category,
      flavor: activeItem.name,
      size: variant.label,
      sugarLevel: selectedSugar,
      iceLevel: selectedIce,
      addBoba,
      addCreamCheese,
      quantity: itemQty,
      unitPrice: unit,
      subtotal: unit * itemQty,
      notes: itemNotes.trim() || undefined,
    };

    setCart((prev) => [...prev, newItem]);
    playChime("add");
    setActiveItem(null);
  };

  // Cart operations
  const updateCartQty = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              subtotal: item.unitPrice * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as PosCartItem[],
    );
  };

  const removeCartItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  // Financial totals
  const subtotal = useMemo(() => cart.reduce((acc, i) => acc + i.subtotal, 0), [cart]);
  const drinkSpend = useMemo(
    () =>
      cart
        .filter((i) => i.category !== "Snacks" && i.category !== "Bundles")
        .reduce((acc, i) => acc + i.subtotal, 0),
    [cart],
  );
  const qualifiesForFreeFries = drinkSpend >= 200;

  const cashTenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = paymentMethod === "counter_cash" && cashTenderedNum >= subtotal ? cashTenderedNum - subtotal : 0;

  // Submit sale
  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      setErrorMsg("Please add at least one item to the sale.");
      return;
    }

    if (paymentMethod === "counter_cash" && cashTenderedNum < subtotal) {
      setErrorMsg(`Cash tendered (₱${cashTenderedNum}) is less than total amount (₱${subtotal}).`);
      return;
    }

    if (paymentMethod === "gcash_full" && gcashRef.trim().length < 6) {
      setErrorMsg("Please enter a valid GCash Reference Number (min 6 characters).");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const payload = {
        customerName: customerName.trim() || "Walk-in Counter Customer",
        customerRole,
        contactNumber: contactNumber.trim() || "Counter Pickup",
        items: cart.map((i, idx) => ({
          id: `pos-${idx + 1}-${Date.now()}`,
          productId: i.productId,
          productName: i.productName,
          category: i.category,
          flavor: i.flavor,
          size: i.size,
          sugarLevel: i.sugarLevel,
          iceLevel: i.iceLevel,
          addBoba: i.addBoba,
          addCreamCheese: i.addCreamCheese,
          quantity: i.quantity,
          notes: i.notes,
        })),
        paymentMethod,
        cashTendered: paymentMethod === "counter_cash" ? cashTenderedNum : undefined,
        gcashReferenceNumber: paymentMethod === "gcash_full" ? gcashRef.trim() : undefined,
        initialStatus,
      };

      const res = await fetch("/api/admin/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.order) {
        playChime("success");
        setCart([]);
        setCashTendered("");
        setGcashRef("");
        onSaleCompleted(data.order, data.changeAmount || 0);
      } else {
        setErrorMsg(data.error || "Failed to record sale.");
      }
    } catch {
      setErrorMsg("Network error connecting to sales endpoint.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-stone-100 text-stone-800">
      {/* Left: Product Catalog & Menu Grid */}
      <div className="flex-1 flex flex-col border-r border-stone-200 overflow-hidden">
        {/* Search & Category Filter Header */}
        <div className="p-4 bg-white border-b border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products by name or flavor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-semibold focus:border-[#2563eb] outline-none"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? "bg-[#2563eb] text-white shadow-2xs"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => openCustomizer(product)}
              className="p-3 rounded-2xl bg-white border border-stone-200 hover:border-[#2563eb] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group select-none"
            >
              <div>
                <div className="relative w-full h-24 mb-2 rounded-xl bg-stone-50 overflow-hidden flex items-center justify-center">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-contain p-1 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <Coffee className="w-8 h-8 text-stone-300" />
                  )}
                  {product.isCustom && (
                    <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[9px] font-black uppercase">
                      New
                    </span>
                  )}
                </div>
                <h4 className="font-extrabold text-xs text-stone-900 group-hover:text-[#2563eb] transition-colors leading-tight line-clamp-1">
                  {product.name}
                </h4>
                <span className="text-[10px] text-stone-400 font-medium block">
                  {product.category}
                </span>
              </div>

              <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between">
                <strong className="text-xs font-black text-[#2563eb]">
                  ₱{product.startingPrice}
                </strong>
                <button
                  type="button"
                  className="w-6 h-6 rounded-lg bg-stone-100 group-hover:bg-[#dbeafe] text-stone-600 group-hover:text-[#2563eb] flex items-center justify-center transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Cashier Order Ticket (POS Cart) */}
      <div className="w-full lg:w-96 flex flex-col bg-white border-l border-stone-200 overflow-hidden shrink-0">
        {/* Ticket Header & Customer Fields */}
        <div className="p-4 bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-300" />
              <h3 className="font-black text-sm uppercase tracking-wide">
                Walk-in Order Ticket
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
              {cart.length} item{cart.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-white/80 block mb-0.5">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Name or Table"
                className="w-full px-2.5 py-1.5 rounded-lg bg-white/15 border border-white/25 text-white placeholder-white/60 text-xs outline-none focus:border-white focus:bg-white/20"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/80 block mb-0.5">Role / Type</label>
              <select
                value={customerRole}
                onChange={(e) => setCustomerRole(e.target.value as any)}
                className="w-full px-2 py-1.5 rounded-lg bg-white/15 border border-white/25 text-white text-xs outline-none focus:border-white focus:bg-white/20 cursor-pointer"
              >
                <option value="walk_in_customer" className="text-slate-800">Walk-in Counter</option>
                <option value="student" className="text-slate-800">Student</option>
                <option value="teacher_staff" className="text-slate-800">Faculty / Staff</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ticket Item List */}
        <div className="flex-1 p-4 overflow-y-auto divide-y divide-stone-100 space-y-2">
          {cart.length === 0 ? (
            <div className="py-16 text-center text-stone-400 space-y-2">
              <ShoppingBag className="w-10 h-10 mx-auto text-stone-300" />
              <p className="text-xs font-semibold">No items on ticket yet.</p>
              <p className="text-[11px] text-stone-400">
                Click any product on the left to add.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.cartItemId} className="pt-2 first:pt-0 flex items-start justify-between gap-2">
                <div className="flex-1 text-xs">
                  <h5 className="font-extrabold text-stone-900 leading-tight">
                    {item.productName}
                  </h5>
                  <div className="text-[11px] text-stone-500 font-medium">
                    {item.size} · Sugar: {item.sugarLevel} · {item.iceLevel}
                  </div>
                  {(item.addBoba || item.addCreamCheese) && (
                    <div className="text-[10px] text-[#2563eb] font-bold">
                      {item.addBoba && "+ Boba (₱10) "}
                      {item.addCreamCheese && "+ Cream Cheese (₱15)"}
                    </div>
                  )}
                  {item.notes && (
                    <div className="text-[10px] text-stone-400 italic">
                      Note: {item.notes}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <strong className="text-xs font-bold text-stone-900">
                    ₱{item.subtotal}
                  </strong>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateCartQty(item.cartItemId, -1)}
                      className="w-5 h-5 rounded-md bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-black">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCartQty(item.cartItemId, 1)}
                      className="w-5 h-5 rounded-md bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCartItem(item.cartItemId)}
                      className="p-1 text-stone-400 hover:text-red-500 ml-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Free Fries Promo Callout */}
        {cart.length > 0 && (
          <div className="px-4 py-2 bg-amber-50 border-t border-b border-amber-200 text-xs text-amber-900 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 font-bold">
              <Gift className="w-4 h-4 text-amber-600" />
              <span>Free Medium Fries (₱200+ Drinks)</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full font-black text-[10px] ${
                qualifiesForFreeFries
                  ? "bg-emerald-600 text-white"
                  : "bg-amber-200 text-amber-900"
              }`}
            >
              {qualifiesForFreeFries ? "UNLOCKED!" : `₱${Math.max(0, 200 - drinkSpend)} more`}
            </span>
          </div>
        )}

        {/* Payment & Ring Up Controls */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 space-y-3 shrink-0">
          <div className="flex items-center justify-between text-base font-black text-stone-900">
            <span>Total Amount:</span>
            <span className="text-xl text-[#2563eb]">₱{subtotal}</span>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => setPaymentMethod("counter_cash")}
              className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                paymentMethod === "counter_cash"
                  ? "border-[#2563eb] bg-[#2563eb] text-white shadow-xs"
                  : "border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Counter Cash</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("gcash_full")}
              className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                paymentMethod === "gcash_full"
                  ? "border-sky-600 bg-sky-600 text-white shadow-xs"
                  : "border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>GCash</span>
            </button>
          </div>

          {/* Cash Calculation Fields */}
          {paymentMethod === "counter_cash" && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <label className="font-bold text-stone-600">Cash Received:</label>
                <div className="relative w-32">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold">
                    ₱
                  </span>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-stone-300 bg-white text-right font-black text-sm outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>

              {/* Quick Bill Buttons */}
              <div className="flex gap-1 justify-end">
                {[50, 100, 200, 500, 1000].map((bill) => (
                  <button
                    key={bill}
                    type="button"
                    onClick={() => setCashTendered(String(bill))}
                    className="px-2 py-0.5 rounded-md bg-stone-200 hover:bg-stone-300 text-[10px] font-bold text-stone-700"
                  >
                    ₱{bill}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-stone-200 text-sm">
                <span className="font-bold text-stone-600">Change Due:</span>
                <strong
                  className={`text-base font-black ${
                    changeDue > 0 ? "text-emerald-600" : "text-stone-800"
                  }`}
                >
                  ₱{changeDue.toFixed(2)}
                </strong>
              </div>
            </div>
          )}

          {/* GCash Reference Input */}
          {paymentMethod === "gcash_full" && (
            <div className="space-y-1 text-xs">
              <label className="font-bold text-stone-600 block">GCash Reference No.</label>
              <input
                type="text"
                placeholder="e.g. 9021839218491"
                value={gcashRef}
                onChange={(e) => setGcashRef(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white font-mono text-xs outline-none focus:border-sky-500"
              />
            </div>
          )}

          {/* Dispatch Status */}
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-stone-600">Send To Queue As:</label>
            <select
              value={initialStatus}
              onChange={(e) => setInitialStatus(e.target.value as any)}
              className="px-2.5 py-1 rounded-lg border border-stone-300 bg-white text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="preparing">Preparing (Kitchen)</option>
              <option value="ready_for_pickup">Ready for Pickup</option>
              <option value="completed">Completed / Handed Over</option>
            </select>
          </div>

          {errorMsg && (
            <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-700 font-bold">
              {errorMsg}
            </div>
          )}

          {/* Complete Sale Button */}
          <button
            type="button"
            disabled={submitting || cart.length === 0}
            onClick={handleCompleteSale}
            className="w-full py-3 rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-50 text-white text-sm font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>
              {submitting ? "Processing..." : `Complete Sale · ₱${subtotal}`}
            </span>
          </button>
        </div>
      </div>

      {/* Item Customizer Modal / Drawer */}
      {activeItem && (
        <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400">
                  {activeItem.category}
                </span>
                <h3 className="text-lg font-black text-stone-900">
                  {activeItem.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Size Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 block">Select Size</label>
              <div className="flex gap-2">
                {activeItem.sizes.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setSelectedSize(s.label)}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedSize === s.label
                        ? "border-[#2563eb] bg-[#dbeafe] text-[#2563eb]"
                        : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    {s.label} · ₱{s.price}
                  </button>
                ))}
              </div>
            </div>

            {/* Sugar & Ice (Drinks only) */}
            {activeItem.category !== "Snacks" && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Sugar Level</label>
                  <select
                    value={selectedSugar}
                    onChange={(e) => setSelectedSugar(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold outline-none cursor-pointer"
                  >
                    <option value="75%">75% (Default)</option>
                    <option value="100%">100% Full Sweet</option>
                    <option value="50%">50% Half Sweet</option>
                    <option value="25%">25% Gentle Sweet</option>
                    <option value="0%">0% Unsweetened</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Ice Level</label>
                  <select
                    value={selectedIce}
                    onChange={(e) => setSelectedIce(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold outline-none cursor-pointer"
                  >
                    <option value="Regular Ice">Regular Ice</option>
                    <option value="Less Ice">Less Ice</option>
                    <option value="Extra Ice">Extra Ice</option>
                    <option value="No Ice">No Ice</option>
                  </select>
                </div>
              </div>
            )}

            {/* Add-ons */}
            {activeItem.category !== "Snacks" && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAddBoba(!addBoba)}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    addBoba
                      ? "border-[#2563eb] bg-[#dbeafe] text-[#2563eb]"
                      : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  + Boba (₱10)
                </button>
                {activeItem.category !== "Cream Cheese Series" && (
                  <button
                    type="button"
                    onClick={() => setAddCreamCheese(!addCreamCheese)}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      addCreamCheese
                        ? "border-[#2563eb] bg-[#dbeafe] text-[#2563eb]"
                        : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    + Cream Cheese (₱15)
                  </button>
                )}
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-bold text-stone-700">Quantity</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={itemQty <= 1}
                  onClick={() => setItemQty(Math.max(1, itemQty - 1))}
                  className="w-7 h-7 rounded-lg bg-stone-100 disabled:opacity-40 flex items-center justify-center font-black"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-black text-sm">
                  {itemQty}
                </span>
                <button
                  type="button"
                  onClick={() => setItemQty(itemQty + 1)}
                  className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center font-black"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Add to Ticket Action */}
            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full py-3 rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-black shadow-md transition-all cursor-pointer"
            >
              Add to Ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
