"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  ShieldCheck,
  Upload,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clock,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  QrCode,
  Check,
} from "lucide-react";
import { OrderItem } from "@/lib/types";
import { playChime } from "@/lib/sound";

interface CheckoutVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: OrderItem[];
  cartSubtotal: number;
  onOrderSuccess: (orderCode: string, orderId: string) => void;
}

interface ConfirmedOrderInfo {
  orderCode: string;
  orderId: string;
  pickupEstimatedMinutes: number;
  totalAmount: number;
  paymentMethod: string;
}

export function CheckoutVerificationModal({
  isOpen,
  onClose,
  cart,
  cartSubtotal,
  onOrderSuccess,
}: CheckoutVerificationModalProps) {
  // Role & Form State
  const [role, setRole] = useState<"student" | "teacher_staff">("student");
  const [fullName, setFullName] = useState("");
  const [lrn, setLrn] = useState("");
  const [gradeSection, setGradeSection] = useState("");
  const [department, setDepartment] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [pickupNotes, setPickupNotes] = useState("");
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null);
  const [privacyConsent, setPrivacyConsent] = useState(false);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<"gcash_downpayment" | "gcash_full" | "counter_cash">("counter_cash");
  const [gcashRef, setGcashRef] = useState("");

  // Submission & Confirmation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrderInfo | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setConfirmedOrder(null);
      setErrorMessage(null);
      setCopiedCode(false);
      if (!idempotencyKey) {
        setIdempotencyKey(`idem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
      }
      try {
        const saved = window.localStorage.getItem("home-heart-saved-student");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.fullName && !fullName) setFullName(parsed.fullName);
          if (parsed.lrn && !lrn) setLrn(parsed.lrn);
          if (parsed.gradeSection && !gradeSection) setGradeSection(parsed.gradeSection);
          if (parsed.department && !department) setDepartment(parsed.department);
          if (parsed.contactNumber && !contactNumber) setContactNumber(parsed.contactNumber);
        }
      } catch {}
    }
  }, [isOpen, idempotencyKey]);

  if (!isOpen) return null;

  const totalAmount = cartSubtotal;
  const downPaymentAmount =
    paymentMethod === "gcash_full"
      ? totalAmount
      : paymentMethod === "gcash_downpayment"
        ? Math.ceil(totalAmount * 0.5)
        : 0;

  // Handle image upload & convert to Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Photo size is too large. Please upload an image under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setIdPhotoPreview(reader.result as string);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleCopyCode = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Inline Validations
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage("Please enter your complete full name.");
      return;
    }

    if (role === "student") {
      const cleanLrn = lrn.replace(/\D/g, "");
      if (cleanLrn.length !== 12) {
        setErrorMessage("Student LRN must be exactly 12 digits (DepEd standard).");
        return;
      }
      if (!gradeSection.trim()) {
        setErrorMessage("Please indicate your Grade & Section.");
        return;
      }
    } else {
      if (!department.trim()) {
        setErrorMessage("Please indicate your Faculty Department or Staff Designation.");
        return;
      }
    }

    if (!contactNumber.trim() || contactNumber.length < 7) {
      setErrorMessage("Please provide a contact number for pickup verification.");
      return;
    }

    if (!idPhotoPreview) {
      setErrorMessage(
        role === "student"
          ? "Please upload a photo of your School ID to verify guest student pricing."
          : "Please upload a photo of your Faculty / Employee ID.",
      );
      return;
    }

    if (!privacyConsent) {
      setErrorMessage("Please check the consent box to agree to the student verification privacy notice.");
      return;
    }

    if (paymentMethod !== "counter_cash") {
      const cleanRef = gcashRef.replace(/\s/g, "");
      if (cleanRef.length < 8) {
        setErrorMessage("Please enter a valid GCash Reference Number (min 8 digits).");
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        customer: {
          role,
          fullName: fullName.trim(),
          lrn: role === "student" ? lrn.replace(/\D/g, "") : undefined,
          gradeSection: role === "student" ? gradeSection.trim() : undefined,
          department: role === "teacher_staff" ? department.trim() : undefined,
          contactNumber: contactNumber.trim(),
          idPhotoUrl: idPhotoPreview,
          privacyConsent: true,
        },
        items: cart.map((item) => ({
          ...item,
          notes: pickupNotes.trim() ? (item.notes ? `${item.notes} | ${pickupNotes.trim()}` : pickupNotes.trim()) : item.notes,
        })),
        payment: {
          method: paymentMethod,
          downPaymentAmount,
          totalAmount,
          gcashReferenceNumber: gcashRef.trim() || undefined,
        },
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit order. Please try again.");
      }

      // Persist verification name for instant lookup in order tracker
      if (typeof window !== "undefined") {
        window.localStorage.setItem("home-heart-active-verify", fullName.trim());
        try {
          window.localStorage.setItem(
            "home-heart-saved-student",
            JSON.stringify({
              fullName: fullName.trim(),
              lrn: lrn.trim(),
              gradeSection: gradeSection.trim(),
              department: department.trim(),
              contactNumber: contactNumber.trim(),
            }),
          );
        } catch {}
      }

      playChime("notification");
      setConfirmedOrder({
        orderCode: data.order.orderCode,
        orderId: data.order.id,
        pickupEstimatedMinutes: data.order.pickupEstimatedMinutes || 12,
        totalAmount: data.order.payment?.totalAmount || totalAmount,
        paymentMethod,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 my-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h2 className="font-extrabold text-base">
              {confirmedOrder ? "Order Confirmed!" : "Campus Checkout"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 max-h-[80vh] overflow-y-auto">
          {confirmedOrder ? (
            /* Confirmation Screen */
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Your Order Number
                </span>
                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1 font-mono">
                  {confirmedOrder.orderCode}
                </div>
              </div>

              {/* Copy Order Code Button */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => handleCopyCode(confirmedOrder.orderCode)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-600" />
                      <span>Save Order Number</span>
                    </>
                  )}
                </button>
              </div>

              {/* Estimated Pickup Time & Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Estimated Pickup:</span>
                  </div>
                  <strong className="text-slate-900 font-bold">
                    ~{confirmedOrder.pickupEstimatedMinutes} mins (at counter)
                  </strong>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                  <span className="text-slate-600">Total to Pay:</span>
                  <strong className="text-slate-900 text-sm font-black">
                    ₱{confirmedOrder.totalAmount}
                  </strong>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Payment Status:</span>
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    {confirmedOrder.paymentMethod === "counter_cash"
                      ? "Pay at Counter on Pickup"
                      : "GCash Reference Submitted"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => onOrderSuccess(confirmedOrder.orderCode, confirmedOrder.orderId)}
                  className="flex-1 py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>Track This Order</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Back to Menu
                </button>
              </div>
            </div>
          ) : (
            /* Single-Page Checkout Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Role Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  I am ordering as:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      role === "student"
                        ? "border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-600/20"
                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    🎓 Student (with LRN)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("teacher_staff")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      role === "teacher_staff"
                        ? "border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-600/20"
                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    💼 Faculty / Staff
                  </button>
                </div>
              </div>

              {/* Full Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Maria Santos"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    required
                    autoComplete="tel"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="e.g. 0917-123-4567"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none"
                  />
                </div>
              </div>

              {/* Role Specific Fields */}
              {role === "student" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      12-Digit LRN *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      maxLength={12}
                      value={lrn}
                      onChange={(e) => setLrn(e.target.value.replace(/\D/g, ""))}
                      placeholder="12-digit Learner Reference No."
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Grade &amp; Section *
                    </label>
                    <input
                      type="text"
                      required
                      value={gradeSection}
                      onChange={(e) => setGradeSection(e.target.value)}
                      placeholder="e.g. Grade 11 - STEM A"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Department / Faculty *
                  </label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. High School Science Dept"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none"
                  />
                </div>
              )}

              {/* School ID Upload & Privacy Note */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                      Upload School ID Photo *
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Used only to verify you&apos;re part of the campus. Stored securely for 30 days under RA 10173.
                    </p>
                  </div>
                  {idPhotoPreview && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                      ✓ Uploaded
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 h-11 px-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white text-xs font-bold text-slate-700 hover:text-blue-600 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>{idPhotoPreview ? "Change ID Photo" : "Select ID Photo"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {idPhotoPreview && (
                    <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                      <Image
                        src={idPhotoPreview}
                        alt="ID Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Consent Checkbox */}
                <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={privacyConsent}
                    onChange={(e) => setPrivacyConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-600 leading-snug">
                    I agree to verify my school ID for campus ordering. Photos are purged automatically after 30 days.
                  </span>
                </label>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Payment Method:
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("counter_cash")}
                    className={`py-3 px-3 rounded-xl border text-left transition-all cursor-pointer ${
                      paymentMethod === "counter_cash"
                        ? "border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-600/20 font-bold"
                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <span className="text-xs block font-bold">💵 Cash at Counter</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Pay when you pick up</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("gcash_full")}
                    className={`py-3 px-3 rounded-xl border text-left transition-all cursor-pointer ${
                      paymentMethod !== "counter_cash"
                        ? "border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-600/20 font-bold"
                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <span className="text-xs block font-bold">📱 GCash E-Wallet</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Instant verification</span>
                  </button>
                </div>

                {/* GCash Details when selected */}
                {paymentMethod !== "counter_cash" && (
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-blue-950 block">Home Cafe GCash:</span>
                        <strong className="text-sm font-mono text-blue-800">0917-888-HOME (Home Cafe)</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">Amount to Pay</span>
                        <strong className="text-sm font-black text-blue-600">₱{totalAmount}</strong>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        GCash Reference Number *
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={gcashRef}
                        onChange={(e) => setGcashRef(e.target.value)}
                        placeholder="e.g. 1002 9384 1928"
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-xs font-mono text-slate-800 focus:border-blue-600 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Pickup Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Pickup Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={pickupNotes}
                  onChange={(e) => setPickupNotes(e.target.value)}
                  placeholder="e.g. Pick up at 10:15 recess, separate straws"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-blue-600 outline-none"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting Order...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Place Order · ₱{totalAmount}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
