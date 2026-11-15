"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  X,
  Lock,
  RotateCw,
  CheckCircle2,
  BellRing,
  ChefHat,
  XCircle,
  Eye,
  ShieldCheck,
  CreditCard,
  Volume2,
  VolumeX,
  LogOut,
  EyeOff,
  Trash2,
  Download,
  Coffee,
  TrendingUp,
  Sliders,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { CafeOrder, OrderStatus } from "@/lib/types";
import { playChime } from "@/lib/sound";

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItemStock {
  id: string;
  name: string;
  category: string;
  startingPrice: number;
  isAvailable: boolean;
}

export function AdminPortalModal({ isOpen, onClose }: AdminPortalModalProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState<string | null>(null);

  // Admin Top-Level Tab
  const [activeTab, setActiveTab] = useState<"queue" | "stock" | "reports">("queue");

  // Orders State
  const [orders, setOrders] = useState<CafeOrder[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    pendingCount: 0,
    readyCount: 0,
  });

  // Stock Management State
  const [menuItems, setMenuItems] = useState<MenuItemStock[]>([]);
  const [unavailableSlugs, setUnavailableSlugs] = useState<Set<string>>(new Set());
  const [stockFilterCategory, setStockFilterCategory] = useState<string>("All");
  const [stockLoading, setStockLoading] = useState(false);

  // Photo viewer modal
  const [inspectedImage, setInspectedImage] = useState<{ url: string; title: string } | null>(null);

  // Masked LRN toggle set (data privacy RA 10173)
  const [unmaskedOrderIds, setUnmaskedOrderIds] = useState<Set<string>>(new Set());

  // Sound alert on new order
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [prevOrderCount, setPrevOrderCount] = useState(0);

  // Check existing session on modal open
  useEffect(() => {
    if (isOpen) {
      fetch("/api/admin/me")
        .then((res) => res.json())
        .then((data) => {
          if (data?.authenticated) {
            setIsAuthenticated(true);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/orders?stats=true");
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
        if (data.stats) setStats(data.stats);

        // Alert sound if new orders came in
        if (data.orders.length > prevOrderCount && prevOrderCount > 0 && soundEnabled) {
          playChime("notification");
        }
        setPrevOrderCount(data.orders.length);
      }
    } catch (err) {
      console.error("Failed to fetch admin orders:", err);
    } finally {
      setLoading(false);
    }
  }, [prevOrderCount, soundEnabled]);

  const fetchStock = useCallback(async () => {
    try {
      setStockLoading(true);
      const res = await fetch("/api/admin/menu/availability");
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.menu)) {
        setMenuItems(
          data.menu.map((m: any) => ({
            id: m.id,
            name: m.name,
            category: m.category,
            startingPrice: m.startingPrice,
            isAvailable: m.isAvailable,
          })),
        );
      }
      const unavailRes = await fetch("/api/menu/availability");
      const unavailData = await unavailRes.json();
      if (unavailData.success && Array.isArray(unavailData.unavailable)) {
        setUnavailableSlugs(new Set(unavailData.unavailable));
      }
    } catch (err) {
      console.error("Failed to fetch menu stock:", err);
    } finally {
      setStockLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 8000);
      return () => clearInterval(interval);
    }
  }, [isOpen, isAuthenticated, fetchOrders]);

  useEffect(() => {
    if (isOpen && isAuthenticated && activeTab === "stock") {
      fetchStock();
    }
  }, [isOpen, isAuthenticated, activeTab, fetchStock]);

  if (!isOpen) return null;

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim() || loginLoading) return;
    setLoginLoading(true);
    setLoginErrorMessage(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setPin("");
        playChime("success");
      } else {
        setLoginErrorMessage(data.error || "Authentication failed.");
        playChime("notification");
      }
    } catch {
      setLoginErrorMessage("Network error connecting to login service.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {}
    setIsAuthenticated(false);
    setOrders([]);
    setPin("");
  };

  const toggleUnmask = (orderId: string) => {
    setUnmaskedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    reason?: string,
  ) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          rejectionReason: reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        playChime(newStatus === "ready_for_pickup" ? "ready" : "success");
        fetchOrders();
      } else {
        alert(data.error || "Failed to update order status.");
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const handleMarkPaid = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markPaid: true }),
      });
      const data = await res.json();
      if (data.success) {
        playChime("success");
        fetchOrders();
      }
    } catch (err) {
      console.error("Mark paid error:", err);
    }
  };

  const handleToggleStock = async (slug: string, currentlyAvailable: boolean) => {
    try {
      const nextAvailable = !currentlyAvailable;
      const res = await fetch("/api/admin/menu/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, available: nextAvailable }),
      });
      const data = await res.json();
      if (data.success) {
        setUnavailableSlugs(new Set(data.unavailable || []));
        playChime("add");
      }
    } catch (err) {
      console.error("Stock toggle error:", err);
    }
  };

  const handlePurgeCustomerData = async (orderId: string) => {
    if (
      !window.confirm(
        "Purge customer personal credentials (LRN, name, photos) pursuant to RA 10173? Financial totals will remain intact for sales reporting.",
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/orders/${orderId}?action=anonymize`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        playChime("success");
        fetchOrders();
      } else {
        alert(data.error || "Failed to purge customer data.");
      }
    } catch (err) {
      console.error("Purge error:", err);
    }
  };

  const exportOrdersCsv = () => {
    if (orders.length === 0) {
      alert("No orders to export.");
      return;
    }

    const headers = [
      "Order Code",
      "Date (Manila)",
      "Status",
      "Customer Role",
      "Customer Name",
      "Items Count",
      "Items Detail",
      "Payment Method",
      "Total Amount (PHP)",
      "Downpayment (PHP)",
      "Payment Status",
      "GCash Ref",
    ];

    const rows = orders.map((o) => {
      const dateFormatted = new Date(o.createdAt).toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
      });
      const itemsDetail = o.items
        .map((it) => `${it.quantity}x ${it.bundleName || it.productName} (${it.size})`)
        .join("; ");

      return [
        `"${o.orderCode}"`,
        `"${dateFormatted}"`,
        `"${o.status}"`,
        `"${o.customer.role}"`,
        `"${o.customer.fullName.replace(/"/g, '""')}"`,
        o.items.reduce((s, it) => s + it.quantity, 0),
        `"${itemsDetail.replace(/"/g, '""')}"`,
        `"${o.payment.method}"`,
        o.payment.totalAmount,
        o.payment.downPaymentAmount,
        `"${o.payment.paymentStatus}"`,
        `"${o.payment.gcashReferenceNumber || ""}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `home-heart-cafe-sales-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === "all") return true;
    return o.status === filter;
  });

  const categoriesInStock = useMemo(() => {
    const set = new Set<string>();
    menuItems.forEach((m) => set.add(m.category));
    return ["All", ...Array.from(set)];
  }, [menuItems]);

  const filteredStockItems = useMemo(() => {
    if (stockFilterCategory === "All") return menuItems;
    return menuItems.filter((m) => m.category === stockFilterCategory);
  }, [menuItems, stockFilterCategory]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-3xl bg-[#fbf9f6] border border-stone-200/90 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-4">
        {/* Top Header */}
        <div className="px-6 py-4 bg-[#382323] text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-amber-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">
                Home ❤️ Cafe · Store & Kitchen Admin
              </h2>
              <p className="text-xs text-white/70">
                Live Kitchen Queue · Stock Control · Sales Reporting
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-2 rounded-full transition-colors ${
                    soundEnabled ? "bg-white/20 text-white" : "bg-white/10 text-white/50"
                  }`}
                  title={soundEnabled ? "Mute chimes" : "Enable chimes"}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors cursor-pointer"
                  title="Sign out of store admin"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Log out</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PIN Authentication Screen */}
        {!isAuthenticated ? (
          <div className="p-10 flex flex-col items-center justify-center text-center max-w-sm mx-auto my-auto space-y-5">
            <div className="w-14 h-14 rounded-full bg-[#f7dce5] text-[#b42356] flex items-center justify-center shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-black text-xl text-stone-800">Admin PIN Access</h3>
              <p className="text-xs text-stone-500 mt-1">
                Enter authorized cashier or owner PIN to manage orders and kitchen operations.
              </p>
            </div>
            <form onSubmit={handlePinSubmit} className="w-full space-y-3">
              <input
                type="password"
                maxLength={8}
                autoFocus
                disabled={loginLoading}
                placeholder="••••••••"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setLoginErrorMessage(null);
                }}
                className="w-full text-center text-2xl font-mono tracking-widest px-4 py-3 rounded-2xl border border-stone-300 bg-white text-stone-900 focus:border-[#b42356] focus:ring-2 focus:ring-[#b42356]/20 outline-none disabled:opacity-50"
              />
              {loginErrorMessage && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {loginErrorMessage}
                </div>
              )}
              <button
                type="submit"
                disabled={!pin.trim() || loginLoading}
                className="w-full py-3 rounded-2xl bg-[#b42356] hover:bg-[#921a44] disabled:opacity-50 text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loginLoading ? <span>Verifying...</span> : <span>Unlock Operations</span>}
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Dashboard */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Navigation Tabs (Queue, Stock, Reports) */}
            <div className="px-6 py-2 bg-stone-900 text-white flex items-center justify-between text-xs font-bold border-b border-stone-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("queue")}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "queue"
                      ? "bg-[#b42356] text-white shadow-xs"
                      : "text-stone-300 hover:text-white hover:bg-stone-800"
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>Kitchen Queue ({orders.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("stock")}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "stock"
                      ? "bg-[#b42356] text-white shadow-xs"
                      : "text-stone-300 hover:text-white hover:bg-stone-800"
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Stock & Availability</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("reports")}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "reports"
                      ? "bg-[#b42356] text-white shadow-xs"
                      : "text-stone-300 hover:text-white hover:bg-stone-800"
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Sales & Reports</span>
                </button>
              </div>

              {activeTab === "queue" && (
                <button
                  type="button"
                  onClick={fetchOrders}
                  disabled={loading}
                  className="flex items-center gap-1 text-[11px] font-semibold text-stone-300 hover:text-white shrink-0 cursor-pointer"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>Refresh Queue</span>
                </button>
              )}
            </div>

            {/* TAB 1: KITCHEN QUEUE */}
            {activeTab === "queue" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* KPI Stats Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white border-b border-stone-200">
                  <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60">
                    <span className="text-[10px] uppercase font-bold text-amber-700 block">
                      Pending Verification
                    </span>
                    <strong className="text-2xl font-black text-amber-900">
                      {stats.pendingCount}
                    </strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/60">
                    <span className="text-[10px] uppercase font-bold text-blue-700 block">
                      Preparing
                    </span>
                    <strong className="text-2xl font-black text-blue-900">
                      {orders.filter((o) => o.status === "preparing").length}
                    </strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/60">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                      Ready for Pickup
                    </span>
                    <strong className="text-2xl font-black text-emerald-900">
                      {stats.readyCount}
                    </strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200/60">
                    <span className="text-[10px] uppercase font-bold text-rose-700 block">
                      Today&apos;s Revenue
                    </span>
                    <strong className="text-2xl font-black text-rose-900">
                      ₱{stats.totalSales}
                    </strong>
                  </div>
                </div>

                {/* Filter Tabs Bar */}
                <div className="px-6 py-2.5 bg-stone-100/70 border-b border-stone-200 flex items-center justify-between gap-3 overflow-x-auto text-xs font-semibold">
                  <div className="flex items-center gap-1.5 shrink-0">
                    {[
                      { key: "all", label: `All (${orders.length})` },
                      {
                        key: "pending_verification",
                        label: `Pending ID (${orders.filter((o) => o.status === "pending_verification").length})`,
                      },
                      {
                        key: "preparing",
                        label: `Preparing (${orders.filter((o) => o.status === "preparing").length})`,
                      },
                      {
                        key: "ready_for_pickup",
                        label: `Ready (${orders.filter((o) => o.status === "ready_for_pickup").length})`,
                      },
                      {
                        key: "completed",
                        label: `Completed (${orders.filter((o) => o.status === "completed").length})`,
                      },
                    ].map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setFilter(t.key)}
                        className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                          filter === t.key
                            ? "bg-[#b42356] text-white shadow-xs"
                            : "bg-white text-stone-600 hover:bg-stone-200/70"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Order Cards Queue */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {filteredOrders.length === 0 ? (
                    <div className="p-12 text-center text-stone-400">
                      <ShieldCheck className="w-12 h-12 mx-auto text-stone-300 mb-2" />
                      <p className="font-semibold text-sm">No orders matching this filter.</p>
                    </div>
                  ) : (
                    filteredOrders.map((order) => {
                      const balance =
                        order.payment.totalAmount - order.payment.downPaymentAmount;
                      const isUnpaid =
                        order.payment.paymentStatus !== "paid_in_full" && balance > 0;

                      return (
                        <div
                          key={order.id}
                          className="rounded-3xl border border-stone-200/90 bg-white p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row gap-5 justify-between"
                        >
                          {/* Left Side: Order & Anti-Scam Student Credentials */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="font-mono text-base font-black px-2.5 py-0.5 rounded-lg bg-stone-900 text-white">
                                #{order.orderCode}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  order.status === "pending_verification"
                                    ? "bg-amber-100 text-amber-800"
                                    : order.status === "preparing"
                                      ? "bg-blue-100 text-blue-800"
                                      : order.status === "ready_for_pickup"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : order.status === "completed"
                                          ? "bg-stone-100 text-stone-700"
                                          : "bg-red-100 text-red-700"
                                }`}
                              >
                                {order.status.replace(/_/g, " ").toUpperCase()}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  order.customer.role === "teacher_staff"
                                    ? "bg-indigo-100 text-indigo-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {order.customer.role === "teacher_staff" ? "Faculty / Staff" : "Student"}
                              </span>
                              {isUnpaid && (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white animate-pulse">
                                  UNPAID: ₱{balance}
                                </span>
                              )}
                              {order.customer.anonymized && (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                                  PII Purged (RA 10173)
                                </span>
                              )}
                              <span className="text-[11px] text-stone-400">
                                {new Date(order.createdAt).toLocaleTimeString("en-PH", {
                                  timeZone: "Asia/Manila",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>

                            {/* Customer Verification Details */}
                            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-[10px] text-stone-400 block font-medium">
                                  {order.customer.role === "teacher_staff"
                                    ? "Faculty/Staff Name & Contact"
                                    : "Student Name & Section"}
                                </span>
                                <strong className="text-stone-800 text-sm">
                                  {order.customer.fullName}
                                </strong>
                                <span className="text-stone-500 block text-[11px]">
                                  {order.customer.anonymized
                                    ? "Data scrubbed under RA 10173"
                                    : order.customer.role === "teacher_staff"
                                      ? `${order.customer.department || "Faculty/Staff"} · ${order.customer.contactNumber}`
                                      : `${order.customer.gradeSection} · ${order.customer.contactNumber}`}
                                </span>
                              </div>

                              <div>
                                <span className="text-[10px] text-stone-400 block font-medium">
                                  {order.customer.role === "teacher_staff"
                                    ? "Department / Designation"
                                    : "12-Digit LRN (DepEd)"}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <strong className="font-mono text-sm text-[#b42356]">
                                    {order.customer.anonymized
                                      ? "[Purged]"
                                      : order.customer.role === "teacher_staff"
                                        ? order.customer.department || "Faculty / Staff"
                                        : order.customer.lrn
                                          ? unmaskedOrderIds.has(order.id)
                                            ? order.customer.lrn
                                            : `••••••••${order.customer.lrn.slice(-4)}`
                                          : "—"}
                                  </strong>
                                  {!order.customer.anonymized &&
                                    order.customer.role === "student" &&
                                    order.customer.lrn && (
                                      <button
                                        type="button"
                                        onClick={() => toggleUnmask(order.id)}
                                        className="p-1 rounded-md hover:bg-stone-200/60 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                                        title={
                                          unmaskedOrderIds.has(order.id)
                                            ? "Mask LRN"
                                            : "Reveal full LRN for verification"
                                        }
                                      >
                                        {unmaskedOrderIds.has(order.id) ? (
                                          <EyeOff className="w-3.5 h-3.5" />
                                        ) : (
                                          <Eye className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    )}
                                </div>
                              </div>
                            </div>

                            {/* Verification Photo Previews */}
                            <div className="flex items-center gap-3">
                              {!order.customer.anonymized && order.customer.idPhotoUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setInspectedImage({
                                      url: order.customer.idPhotoUrl!,
                                      title:
                                        order.customer.role === "teacher_staff"
                                          ? `Faculty ID: ${order.customer.fullName} (${order.customer.department || "Faculty"})`
                                          : `School ID: ${order.customer.fullName} (LRN: ${order.customer.lrn})`,
                                    })
                                  }
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 transition-colors shadow-2xs cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#b42356]" />
                                  <span>
                                    {order.customer.role === "teacher_staff"
                                      ? "View Faculty ID"
                                      : "View School ID"}
                                  </span>
                                </button>
                              )}

                              {!order.customer.anonymized && order.customer.selfiePhotoUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setInspectedImage({
                                      url: order.customer.selfiePhotoUrl!,
                                      title: `Claim Verification Photo: ${order.customer.fullName}`,
                                    })
                                  }
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 transition-colors shadow-2xs cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                                  <span>View Claim Photo</span>
                                </button>
                              )}

                              {order.payment.receiptScreenshotUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setInspectedImage({
                                      url: order.payment.receiptScreenshotUrl!,
                                      title: `GCash Proof (Ref: ${order.payment.gcashReferenceNumber})`,
                                    })
                                  }
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/60 text-xs font-semibold text-blue-700 transition-colors shadow-2xs cursor-pointer"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>GCash Receipt</span>
                                </button>
                              )}
                            </div>

                            {/* Order Items */}
                            <div className="border-t border-stone-100 pt-2 space-y-1">
                              <span className="text-[10px] font-bold text-stone-400 uppercase">
                                Drinks & Fries Ordered
                              </span>
                              {order.items.map((it, idx) => (
                                <div key={idx} className="flex justify-between text-xs py-0.5">
                                  <div>
                                    <strong className="text-stone-800">
                                      {it.quantity}x {it.bundleName || it.productName}
                                    </strong>
                                    <span className="text-stone-500 text-[11px] block">
                                      {it.flavor} · {it.size} · Sugar: {it.sugarLevel} · Ice: {it.iceLevel}
                                      {it.addBoba ? " · Boba (+₱10)" : ""}
                                    </span>
                                    {it.notes && (
                                      <span className="text-amber-800 text-[11px] italic block">
                                        &ldquo;{it.notes}&rdquo;
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-semibold text-stone-800">₱{it.subtotal}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Right Side: Financials & Action Buttons */}
                          <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-stone-100 md:pl-5 flex flex-col justify-between space-y-4">
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between text-stone-600">
                                <span>Total Bill:</span>
                                <strong className="text-stone-800 text-sm">
                                  ₱{order.payment.totalAmount}
                                </strong>
                              </div>
                              <div className="flex justify-between text-blue-700">
                                <span>Downpayment:</span>
                                <strong>₱{order.payment.downPaymentAmount}</strong>
                              </div>
                              {order.payment.gcashReferenceNumber && (
                                <div className="text-[11px] text-stone-500 font-mono">
                                  Ref: {order.payment.gcashReferenceNumber}
                                </div>
                              )}
                              <div className="flex justify-between text-xs font-bold pt-1 border-t border-stone-100">
                                <span>Status:</span>
                                {order.payment.paymentStatus === "paid_in_full" ? (
                                  <span className="text-emerald-700 font-bold">PAID IN FULL</span>
                                ) : (
                                  <span className="text-rose-700 font-black">
                                    COLLECT ₱{balance}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Operational Action Controls */}
                            <div className="space-y-2">
                              {/* Mark Paid Button if balance remains */}
                              {isUnpaid && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkPaid(order.id)}
                                  className="w-full py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span>Mark ₱{balance} Paid</span>
                                </button>
                              )}

                              {order.status === "pending_verification" && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(order.id, "preparing")}
                                  className="w-full py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <ChefHat className="w-4 h-4" />
                                  <span>Verify & Start Preparing</span>
                                </button>
                              )}

                              {order.status === "preparing" && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(order.id, "ready_for_pickup")}
                                  className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 animate-pulse cursor-pointer"
                                >
                                  <BellRing className="w-4 h-4" />
                                  <span>Notify Student: Order Ready!</span>
                                </button>
                              )}

                              {order.status === "ready_for_pickup" && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(order.id, "completed")}
                                  className="w-full py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Mark Paid & Claimed</span>
                                </button>
                              )}

                              {order.status !== "completed" && order.status !== "rejected" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const reason = window.prompt("Reason for rejecting/canceling this order:", "Invalid LRN or unconfirmed credentials");
                                    if (reason) handleUpdateStatus(order.id, "rejected", reason);
                                  }}
                                  className="w-full py-1.5 rounded-2xl text-red-600 hover:bg-red-50 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Reject / Flag as Scam</span>
                                </button>
                              )}

                              {!order.customer.anonymized && (
                                <button
                                  type="button"
                                  onClick={() => handlePurgeCustomerData(order.id)}
                                  className="w-full py-1 rounded-xl text-stone-500 hover:text-red-700 hover:bg-red-50 text-[10px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                  title="Permanently remove student ID & photos pursuant to RA 10173"
                                >
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                  <span>Purge Customer PII (RA 10173)</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: STOCK & AVAILABILITY */}
            {activeTab === "stock" && (
              <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="font-black text-lg text-stone-800">
                      Product Stock & Sold-Out Toggles
                    </h3>
                    <p className="text-xs text-stone-500">
                      Instantly hide or disable items on the student ordering menu when ingredients run out.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchStock}
                    disabled={stockLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${stockLoading ? "animate-spin" : ""}`} />
                    <span>Refresh Stock</span>
                  </button>
                </div>

                {/* Category Filter for Stock */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {categoriesInStock.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setStockFilterCategory(cat)}
                      className={`px-3 py-1.5 rounded-full transition-colors shrink-0 cursor-pointer ${
                        stockFilterCategory === cat
                          ? "bg-[#b42356] text-white font-bold"
                          : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Stock Table */}
                <div className="flex-1 overflow-y-auto rounded-2xl border border-stone-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100 text-stone-600 font-bold uppercase text-[10px] tracking-wider border-b border-stone-200 sticky top-0">
                      <tr>
                        <th className="px-4 py-3">Product Name</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Starting Price</th>
                        <th className="px-4 py-3 text-right">Availability Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredStockItems.map((item) => {
                        const isSoldOut = unavailableSlugs.has(item.id);
                        return (
                          <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                            <td className="px-4 py-3 font-semibold text-stone-800">
                              {item.name}
                            </td>
                            <td className="px-4 py-3 text-stone-500">{item.category}</td>
                            <td className="px-4 py-3 font-mono font-medium text-stone-700">
                              ₱{item.startingPrice}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleToggleStock(item.id, !isSoldOut)}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                  isSoldOut
                                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                                    : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                }`}
                              >
                                {isSoldOut ? "● Sold Out (Disabled)" : "✓ In Stock (Live)"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: SALES & REPORTS */}
            {activeTab === "reports" && (
              <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-6">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="font-black text-lg text-stone-800">
                      Cafe Sales & Activity Reporting
                    </h3>
                    <p className="text-xs text-stone-500">
                      Aggregated sales metrics calculated in Manila timezone (Asia/Manila).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={exportOrdersCsv}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#382323] hover:bg-black text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-amber-300" />
                    <span>Export CSV Report</span>
                  </button>
                </div>

                {/* Key Reporting Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">
                      Total Orders Placed
                    </span>
                    <strong className="text-3xl font-black text-stone-900 block">
                      {orders.length}
                    </strong>
                    <span className="text-xs text-stone-500">
                      {orders.filter((o) => o.status === "completed").length} successfully claimed
                    </span>
                  </div>

                  <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">
                      Total Gross Revenue
                    </span>
                    <strong className="text-3xl font-black text-[#b42356] block">
                      ₱{orders.reduce((sum, o) => sum + o.payment.totalAmount, 0)}
                    </strong>
                    <span className="text-xs text-stone-500">
                      ₱{orders.reduce((sum, o) => sum + o.payment.downPaymentAmount, 0)} via GCash Downpayment
                    </span>
                  </div>

                  <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">
                      Average Order Value
                    </span>
                    <strong className="text-3xl font-black text-stone-900 block">
                      ₱
                      {orders.length > 0
                        ? Math.round(
                            orders.reduce((sum, o) => sum + o.payment.totalAmount, 0) /
                              orders.length,
                          )
                        : 0}
                    </strong>
                    <span className="text-xs text-stone-500">Per student / faculty transaction</span>
                  </div>
                </div>

                {/* Top Selling Items Breakdown */}
                <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-3 flex-1 overflow-hidden flex flex-col">
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Recent Completed Orders
                  </span>
                  <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
                    {orders.slice(0, 10).map((ord) => (
                      <div key={ord.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <strong className="font-mono text-stone-900 font-bold mr-2">
                            #{ord.orderCode}
                          </strong>
                          <span className="text-stone-600">
                            {ord.customer.fullName} ({ord.customer.role})
                          </span>
                          <span className="text-stone-400 block text-[11px]">
                            {ord.items.map((it) => `${it.quantity}x ${it.productName}`).join(", ")}
                          </span>
                        </div>
                        <div className="text-right">
                          <strong className="text-stone-900 font-bold block">
                            ₱{ord.payment.totalAmount}
                          </strong>
                          <span className="text-[10px] text-stone-500 capitalize">
                            {ord.payment.method.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full Image Zoom Inspector Modal */}
        {inspectedImage && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="relative max-w-lg w-full rounded-3xl bg-white overflow-hidden shadow-2xl">
              <div className="px-4 py-3 bg-stone-900 text-white flex items-center justify-between text-xs font-bold">
                <span>{inspectedImage.title}</span>
                <button
                  type="button"
                  onClick={() => setInspectedImage(null)}
                  className="p-1 rounded-full hover:bg-white/20 text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="relative w-full h-80 bg-stone-100 flex items-center justify-center p-2">
                <Image
                  src={inspectedImage.url}
                  alt={inspectedImage.title}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
