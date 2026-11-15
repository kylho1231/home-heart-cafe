"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Phone,
  Calendar,
  AlertTriangle,
  Volume2,
  VolumeX,
} from "lucide-react";
import { CafeOrder, OrderStatus } from "@/lib/types";
import { playChime } from "@/lib/sound";

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminPortalModal({ isOpen, onClose }: AdminPortalModalProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const [orders, setOrders] = useState<CafeOrder[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    pendingCount: 0,
    readyCount: 0,
  });

  // Photo viewer modal
  const [inspectedImage, setInspectedImage] = useState<{ url: string; title: string } | null>(null);

  // Sound alert on new order
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [prevOrderCount, setPrevOrderCount] = useState(0);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/orders?stats=true");
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

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, isAuthenticated, fetchOrders]);

  if (!isOpen) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "1234" || pin === "cafe2026") {
      setIsAuthenticated(true);
      setPinError(false);
      playChime("success");
    } else {
      setPinError(true);
    }
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
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === "all") return true;
    return o.status === filter;
  });

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
                Live Kitchen Queue & Campus Order Verification Desk
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
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
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
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
                Enter cashier/owner PIN to manage orders and verify students. (Default PIN: <strong>1234</strong>)
              </p>
            </div>
            <form onSubmit={handlePinSubmit} className="w-full space-y-3">
              <input
                type="password"
                maxLength={8}
                autoFocus
                placeholder="Enter PIN (1234)"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setPinError(false);
                }}
                className="w-full text-center text-xl font-mono tracking-widest px-4 py-3 rounded-2xl border border-stone-300 bg-white text-stone-900 focus:border-[#b42356] focus:ring-2 focus:ring-[#b42356]/20 outline-none"
              />
              {pinError && (
                <p className="text-xs text-red-600 font-semibold">
                  Incorrect PIN. Please use 1234.
                </p>
              )}
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-[#b42356] hover:bg-[#921a44] text-white text-sm font-bold shadow-md transition-all"
              >
                Unlock Operations
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Dashboard */
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
                    label: `Pending ID Verification (${orders.filter((o) => o.status === "pending_verification").length})`,
                  },
                  {
                    key: "preparing",
                    label: `Kitchen Preparing (${orders.filter((o) => o.status === "preparing").length})`,
                  },
                  {
                    key: "ready_for_pickup",
                    label: `Ready for Pickup (${orders.filter((o) => o.status === "ready_for_pickup").length})`,
                  },
                  {
                    key: "completed",
                    label: `Completed (${orders.filter((o) => o.status === "completed").length})`,
                  },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setFilter(t.key)}
                    className={`px-3 py-1.5 rounded-full transition-all ${
                      filter === t.key
                        ? "bg-[#b42356] text-white shadow-xs"
                        : "bg-white text-stone-600 hover:bg-stone-200/70"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={fetchOrders}
                disabled={loading}
                className="flex items-center gap-1 text-[11px] font-semibold text-stone-500 hover:text-stone-800 shrink-0"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh Queue</span>
              </button>
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
                          <span className="text-[11px] text-stone-400">
                            {new Date(order.createdAt).toLocaleTimeString([], {
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
                              {order.customer.role === "teacher_staff"
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
                            <strong className="font-mono text-sm text-[#b42356]">
                              {order.customer.role === "teacher_staff"
                                ? order.customer.department || "Faculty / Staff"
                                : order.customer.lrn || "—"}
                            </strong>
                          </div>
                        </div>

                        {/* Verification Photo Previews */}
                        <div className="flex items-center gap-3">
                          {order.customer.idPhotoUrl && (
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
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 transition-colors shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#b42356]" />
                              <span>
                                {order.customer.role === "teacher_staff"
                                  ? "View Faculty ID"
                                  : "View School ID"}
                              </span>
                            </button>
                          )}

                          {order.customer.selfiePhotoUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setInspectedImage({
                                  url: order.customer.selfiePhotoUrl!,
                                  title: `Claim Verification Photo: ${order.customer.fullName}`,
                                })
                              }
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 transition-colors shadow-2xs"
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
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/60 text-xs font-semibold text-blue-700 transition-colors shadow-2xs"
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
                          <div className="flex justify-between text-xs font-bold text-rose-800 pt-1 border-t border-stone-100">
                            <span>To Collect at Counter:</span>
                            <span>₱{balance}</span>
                          </div>
                        </div>

                        {/* Operational Action Controls */}
                        <div className="space-y-2">
                          {order.status === "pending_verification" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order.id, "preparing")}
                              className="w-full py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                            >
                              <ChefHat className="w-4 h-4" />
                              <span>Verify & Start Preparing</span>
                            </button>
                          )}

                          {order.status === "preparing" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order.id, "ready_for_pickup")}
                              className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 animate-pulse"
                            >
                              <BellRing className="w-4 h-4" />
                              <span>Notify Student: Order Ready!</span>
                            </button>
                          )}

                          {order.status === "ready_for_pickup" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order.id, "completed")}
                              className="w-full py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
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
                              className="w-full py-1.5 rounded-2xl text-red-600 hover:bg-red-50 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject / Flag as Scam</span>
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

        {/* Full Image Zoom Inspector Modal */}
        {inspectedImage && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="relative max-w-lg w-full rounded-3xl bg-white overflow-hidden shadow-2xl">
              <div className="px-4 py-3 bg-stone-900 text-white flex items-center justify-between text-xs font-bold">
                <span>{inspectedImage.title}</span>
                <button
                  type="button"
                  onClick={() => setInspectedImage(null)}
                  className="p-1 rounded-full hover:bg-white/20 text-white"
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
