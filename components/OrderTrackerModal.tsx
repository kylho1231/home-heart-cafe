"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  X,
  Search,
  Clock,
  ChefHat,
  BellRing,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  QrCode,
  ShieldCheck,
  Receipt,
} from "lucide-react";
import { CafeOrder } from "@/lib/types";
import { playChime } from "@/lib/sound";

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderCode?: string;
  initialCustomerVerify?: string;
}

export function OrderTrackerModal({
  isOpen,
  onClose,
  initialOrderCode,
  initialCustomerVerify,
}: OrderTrackerModalProps) {
  const [searchCode, setSearchCode] = useState(initialOrderCode || "");
  const [verifyInput, setVerifyInput] = useState(initialCustomerVerify || "");
  const [order, setOrder] = useState<CafeOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastNotifiedStatus, setLastNotifiedStatus] = useState<string>("");

  // Hydrate stored verify key if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedVerify = window.localStorage.getItem("home-heart-active-verify");
      if (savedVerify && !verifyInput) {
        setVerifyInput(savedVerify);
      }
    }
  }, [verifyInput]);

  const fetchOrder = useCallback(async (code: string, verifyKey?: string) => {
    if (!code.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const verifyParam = (verifyKey || verifyInput || "").trim();
      const url = `/api/orders/${encodeURIComponent(code.trim())}${
        verifyParam ? `?verify=${encodeURIComponent(verifyParam)}` : ""
      }`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.success || !data.order) {
        setOrder(null);
        setError(data.error || "Order not found. Please verify your Order Code and Customer Name/Phone.");
        return;
      }

      setOrder(data.order);

      // Play chime if status just changed to ready_for_pickup
      if (
        data.order.status === "ready_for_pickup" &&
        lastNotifiedStatus !== "ready_for_pickup"
      ) {
        playChime("ready");
        setLastNotifiedStatus("ready_for_pickup");
      }
    } catch {
      setError("Network error while tracking order.");
    } finally {
      setLoading(false);
    }
  }, [verifyInput, lastNotifiedStatus]);

  useEffect(() => {
    if (initialOrderCode) {
      setSearchCode(initialOrderCode);
      const verify = initialCustomerVerify || (typeof window !== "undefined" ? window.localStorage.getItem("home-heart-active-verify") || "" : "");
      if (verify) setVerifyInput(verify);
      fetchOrder(initialOrderCode, verify);
    }
  }, [initialOrderCode, initialCustomerVerify, fetchOrder]);

  // Real-time polling every 12 seconds while modal is open and order is active
  useEffect(() => {
    if (!isOpen || !order || order.status === "completed" || order.status === "rejected") {
      return;
    }

    const interval = setInterval(() => {
      fetchOrder(order.orderCode, verifyInput);
    }, 12000);

    return () => clearInterval(interval);
  }, [isOpen, order, verifyInput, fetchOrder]);

  if (!isOpen) return null;

  const getStatusStepIndex = (status: string) => {
    switch (status) {
      case "pending_verification":
        return 1;
      case "preparing":
        return 2;
      case "ready_for_pickup":
        return 3;
      case "completed":
        return 4;
      default:
        return 0;
    }
  };

  const currentStep = order ? getStatusStepIndex(order.status) : 0;
  const balanceToPay = order
    ? order.payment.totalAmount - order.payment.downPaymentAmount
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#fffefc] border border-stone-200/80 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#382323] to-[#5a3838] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10">
              <Receipt className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Live Order Tracker</h2>
              <p className="text-xs text-white/70">
                Track your drinks & skip the waiting line outside
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-stone-100 bg-stone-50/50 space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchOrder(searchCode, verifyInput);
            }}
            className="space-y-2.5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Order Code (e.g. HC-0042)"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-800 text-xs font-mono tracking-wider focus:border-[#b42356] outline-none"
                />
              </div>

              <input
                type="text"
                required
                placeholder="Full Name or Phone"
                value={verifyInput}
                onChange={(e) => setVerifyInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-800 text-xs focus:border-[#b42356] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#b42356] hover:bg-[#921a44] text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Checking Status..." : "Track Live Order"}</span>
            </button>
          </form>

          {/* One-line required hint */}
          <p className="text-[11px] text-stone-500 leading-tight">
            💡 Enter your Order Number and Full Name or Phone Number used during checkout to protect student privacy.
          </p>

          {error && (
            <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Order Tracking Body */}
        {order ? (
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Status Banner */}
            {order.status === "ready_for_pickup" ? (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg animate-bounce duration-1000">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/20">
                    <BellRing className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <strong className="text-base font-black block">
                      YOUR ORDER IS READY FOR PICKUP!
                    </strong>
                    <span className="text-xs text-white/90">
                      Please head to Counter 1 to claim your order. Show your Order Code <strong>#{order.orderCode}</strong>.
                    </span>
                  </div>
                </div>
              </div>
            ) : order.status === "rejected" ? (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs">
                <strong className="font-bold text-sm block mb-1">
                  Order Cancelled / Rejected
                </strong>
                <span>Reason: {order.rejectionReason || "Verification failed."}</span>
              </div>
            ) : null}

            {/* Stepper Progress Bar */}
            <div className="py-2">
              <div className="flex items-center justify-between text-xs relative">
                {/* Connecting Line */}
                <div className="absolute top-4 inset-x-8 h-1 bg-stone-200 z-0">
                  <div
                    className="h-full bg-[#b42356] transition-all duration-500"
                    style={{
                      width:
                        currentStep === 1
                          ? "10%"
                          : currentStep === 2
                            ? "50%"
                            : currentStep >= 3
                              ? "100%"
                              : "0%",
                    }}
                  />
                </div>

                {/* Step 1: Pending */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      currentStep >= 1
                        ? "bg-[#b42356] text-white shadow-md"
                        : "bg-stone-200 text-stone-500"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="mt-2 text-[11px] font-medium text-stone-600 text-center">
                    Verification
                  </span>
                </div>

                {/* Step 2: Preparing */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      currentStep >= 2
                        ? "bg-[#b42356] text-white shadow-md animate-pulse"
                        : "bg-stone-200 text-stone-500"
                    }`}
                  >
                    <ChefHat className="w-4 h-4" />
                  </div>
                  <span className="mt-2 text-[11px] font-medium text-stone-600 text-center">
                    Brewing & Frying
                  </span>
                </div>

                {/* Step 3: Ready for Pickup */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      currentStep >= 3
                        ? "bg-emerald-600 text-white shadow-lg ring-4 ring-emerald-200"
                        : "bg-stone-200 text-stone-500"
                    }`}
                  >
                    <BellRing className="w-4 h-4" />
                  </div>
                  <span className="mt-2 text-[11px] font-bold text-emerald-700 text-center">
                    Ready to Claim
                  </span>
                </div>

                {/* Step 4: Completed */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      currentStep === 4
                        ? "bg-stone-800 text-white shadow-md"
                        : "bg-stone-200 text-stone-500"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="mt-2 text-[11px] font-medium text-stone-600 text-center">
                    Completed
                  </span>
                </div>
              </div>
            </div>

            {/* Order Claim Slip */}
            <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">
                    Order Reference
                  </span>
                  <strong className="text-xl font-black text-[#b42356] tracking-wider font-mono">
                    #{order.orderCode}
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">
                    Estimated Wait
                  </span>
                  <span className="text-xs font-semibold text-stone-700">
                    ~{order.pickupEstimatedMinutes} mins
                  </span>
                </div>
              </div>

              {/* Student Verified Info */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-stone-400 block text-[10px]">Student / Customer</span>
                  <strong className="text-stone-800">{order.customer.fullName}</strong>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">LRN Verified</span>
                  <strong className="font-mono text-stone-800">
                    {order.customer.lrn}
                  </strong>
                </div>
              </div>

              {/* Items List */}
              <div className="border-t border-stone-200 pt-2 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">
                  Items to Claim
                </span>
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-1">
                    <div>
                      <strong className="text-stone-800">
                        {item.quantity}x {item.bundleName || item.productName}
                      </strong>
                      <span className="text-stone-500 text-[11px] block">
                        {item.flavor} · {item.size} · Sugar: {item.sugarLevel} · Ice: {item.iceLevel}
                        {item.addBoba ? " · Boba" : ""}
                      </span>
                    </div>
                    <span className="font-semibold text-stone-800">₱{item.subtotal}</span>
                  </div>
                ))}
              </div>

              {/* Payment Summary */}
              <div className="border-t border-stone-200 pt-2.5 space-y-1 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Total Bill:</span>
                  <strong className="text-stone-800">₱{order.payment.totalAmount}</strong>
                </div>
                {order.payment.downPaymentAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Downpayment Paid (GCash):</span>
                    <strong>-₱{order.payment.downPaymentAmount}</strong>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black pt-1 border-t border-stone-200 text-[#382323]">
                  <span>Balance to Pay at Counter:</span>
                  <span className="text-[#b42356]">₱{balanceToPay}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-10 text-center text-stone-500 space-y-2">
            <Receipt className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-sm font-medium">Enter your Order Code above to track live status.</p>
            <p className="text-xs text-stone-400">
              Your Order Code was provided upon checkout (e.g. HHC-3104).
            </p>
          </div>
        )}

        {/* Footer Note */}
        <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Live auto-updating every 4s</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
