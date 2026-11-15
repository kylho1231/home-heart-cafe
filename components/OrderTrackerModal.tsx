"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Search,
  Clock,
  ChefHat,
  BellRing,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Copy,
  ShieldCheck,
  Check,
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
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("Just now");

  const handleCopyOrderCode = () => {
    if (!order?.orderCode) return;
    try {
      navigator.clipboard.writeText(order.orderCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // Hydrate stored verify key if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedVerify = window.localStorage.getItem("home-heart-active-verify");
      if (savedVerify && !verifyInput) {
        setVerifyInput(savedVerify);
      }
    }
  }, [verifyInput]);

  const fetchOrder = useCallback(
    async (code: string, verifyKey?: string) => {
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
          setError("We couldn't find that order. Check the number and try again.");
          return;
        }

        setOrder(data.order);
        setLastUpdated(
          new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        );

        // Play chime if status just changed to ready_for_pickup
        if (
          data.order.status === "ready_for_pickup" &&
          lastNotifiedStatus !== "ready_for_pickup"
        ) {
          playChime("ready");
          setLastNotifiedStatus("ready_for_pickup");
        }
      } catch {
        setError("Network error while tracking order. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [verifyInput, lastNotifiedStatus],
  );

  useEffect(() => {
    if (initialOrderCode) {
      setSearchCode(initialOrderCode);
      const verify =
        initialCustomerVerify ||
        (typeof window !== "undefined"
          ? window.localStorage.getItem("home-heart-active-verify") || ""
          : "");
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

  // Stepper: Received -> Verified -> Preparing -> Ready for pickup
  const getStatusStepIndex = (ord: CafeOrder): number => {
    switch (ord.status) {
      case "pending_verification":
        if (
          ord.payment?.paymentStatus === "verified_downpayment" ||
          ord.payment?.paymentStatus === "paid_in_full"
        ) {
          return 2; // Verified
        }
        return 1; // Received
      case "preparing":
        return 3; // Preparing (Verified step 2 passed)
      case "ready_for_pickup":
        return 4; // Ready for pickup
      case "completed":
        return 5;
      default:
        return 1;
    }
  };

  const currentStep: number = order ? getStatusStepIndex(order) : 0;
  const isReady = order?.status === "ready_for_pickup";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-base leading-tight">Track Your Order</h2>
              <p className="text-[11px] text-slate-400">
                Live campus counter pickup status
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close tracking modal"
            className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions & Search Box */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/70 space-y-3">
          <p className="text-xs font-semibold text-slate-600 leading-relaxed">
            Enter your order number and phone number:
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchOrder(searchCode, verifyInput);
            }}
            className="space-y-2.5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Order No. (e.g. HHC-0042)"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-mono font-bold focus:border-blue-600 outline-none"
                />
              </div>

              <input
                type="text"
                required
                placeholder="Phone or Student Name"
                value={verifyInput}
                onChange={(e) => setVerifyInput(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:border-blue-600 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Checking Status..." : "Check Live Status"}</span>
            </button>
          </form>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Live Order Status Body */}
        {order ? (
          <div className="p-5 sm:p-6 space-y-5">
            {/* Prominent Ready For Pickup Banner */}
            {isReady && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg animate-bounce duration-1000 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <BellRing className="w-6 h-6 text-white" />
                </div>
                <div>
                  <strong className="text-sm sm:text-base font-black block">
                    READY FOR PICKUP!
                  </strong>
                  <span className="text-xs text-white/90">
                    Your drink is ready at the counter. Show order <strong>#{order.orderCode}</strong>.
                  </span>
                </div>
              </div>
            )}

            {/* Stepper Progress Bar: Received -> Verified -> Preparing -> Ready for pickup */}
            <div className="py-2">
              <div className="flex items-center justify-between text-xs relative">
                {/* Connecting Line */}
                <div className="absolute top-4 inset-x-6 h-1 bg-slate-200 z-0">
                  <div
                    className="h-full bg-blue-600 transition-all duration-500 rounded-full"
                    style={{
                      width:
                        currentStep === 1
                          ? "15%"
                          : currentStep === 2
                            ? "40%"
                            : currentStep === 3
                              ? "70%"
                              : currentStep >= 4
                                ? "100%"
                                : "0%",
                    }}
                  />
                </div>

                {/* 1: Received */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep >= 1
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="mt-1.5 text-[10px] font-bold text-slate-700">
                    Received
                  </span>
                </div>

                {/* 2: Verified */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep >= 2
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="mt-1.5 text-[10px] font-bold text-slate-700">
                    Verified
                  </span>
                </div>

                {/* 3: Preparing */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep >= 3
                        ? "bg-blue-600 text-white shadow-xs animate-pulse"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    <ChefHat className="w-4 h-4" />
                  </div>
                  <span className="mt-1.5 text-[10px] font-bold text-slate-700">
                    Preparing
                  </span>
                </div>

                {/* 4: Ready */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep >= 4
                        ? "bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="mt-1.5 text-[10px] font-bold text-slate-700">
                    Ready
                  </span>
                </div>
              </div>
            </div>

            {/* Order Card Info */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Order Number
                  </span>
                  <strong className="text-base font-black font-mono text-slate-900">
                    {order.orderCode}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={handleCopyOrderCode}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[11px] font-bold text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-slate-500">Customer:</span>
                <strong className="text-slate-800">{order.customer.fullName}</strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Items:</span>
                <span className="text-slate-700 font-semibold">
                  {order.items.reduce((s, i) => s + i.quantity, 0)} drinks/snacks
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total:</span>
                <strong className="text-sm font-black text-blue-600">
                  ₱{order.payment.totalAmount}
                </strong>
              </div>

              {/* Polling Last Updated Indicator */}
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Polling updates every 12s</span>
                </div>
                <span>Last updated: {lastUpdated}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <Clock className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-xs font-semibold text-slate-500">
              Awaiting your order number to display live tracking.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
