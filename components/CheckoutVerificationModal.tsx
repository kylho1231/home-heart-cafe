"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  X,
  ShieldCheck,
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  QrCode,
  DollarSign,
  Coffee,
  Sparkles,
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

export function CheckoutVerificationModal({
  isOpen,
  onClose,
  cart,
  cartSubtotal,
  onOrderSuccess,
}: CheckoutVerificationModalProps) {
  // Student Form State
  const [fullName, setFullName] = useState("");
  const [lrn, setLrn] = useState("");
  const [gradeSection, setGradeSection] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null);
  const [selfiePhotoPreview, setSelfiePhotoPreview] = useState<string | null>(null);

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState<"gcash_downpayment" | "gcash_full" | "counter_cash">("gcash_downpayment");
  const [gcashRef, setGcashRef] = useState("");
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  // UI state
  const [step, setStep] = useState<1 | 2>(1); // 1: Student Verification, 2: Payment & Review
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalAmount = cartSubtotal;
  const downPaymentAmount =
    paymentMethod === "gcash_full"
      ? totalAmount
      : paymentMethod === "gcash_downpayment"
        ? Math.ceil(totalAmount * 0.5)
        : 0;

  // Handle image upload & convert to Base64
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string | null) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please upload an image file (PNG, JPG, or WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image file must be under 5MB.");
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      setter(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validateStep1 = () => {
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage("Please enter your complete Full Name.");
      return false;
    }

    const cleanLrn = lrn.replace(/\D/g, "");
    if (cleanLrn.length !== 12) {
      setErrorMessage("LRN must be exactly 12 digits (DepEd Philippine standard).");
      return false;
    }

    if (!gradeSection.trim()) {
      setErrorMessage("Please indicate your Grade & Section or Faculty department.");
      return false;
    }

    if (!contactNumber.trim() || contactNumber.length < 7) {
      setErrorMessage("Please provide a valid Contact Number.");
      return false;
    }

    if (!idPhotoPreview) {
      setErrorMessage("Please upload a photo of your School ID to verify your order.");
      return false;
    }

    if (!selfiePhotoPreview) {
      setErrorMessage("Please take or upload a quick Selfie / Student Photo.");
      return false;
    }

    setErrorMessage(null);
    return true;
  };

  const handleProceedToPayment = () => {
    if (validateStep1()) {
      setStep(2);
      playChime("add");
    }
  };

  const handleSubmitOrder = async () => {
    if (paymentMethod !== "counter_cash") {
      if (!gcashRef.trim() || gcashRef.replace(/\s/g, "").length < 8) {
        setErrorMessage("Please provide a valid GCash Reference Number (min 8 digits).");
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        customer: {
          fullName: fullName.trim(),
          lrn: lrn.replace(/\D/g, ""),
          gradeSection: gradeSection.trim(),
          contactNumber: contactNumber.trim(),
          idPhotoUrl: idPhotoPreview,
          selfiePhotoUrl: selfiePhotoPreview,
        },
        items: cart,
        payment: {
          method: paymentMethod,
          downPaymentAmount,
          totalAmount,
          gcashReferenceNumber: gcashRef.trim() || undefined,
          receiptScreenshotUrl: receiptPreview || undefined,
        },
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit order. Please try again.");
      }

      playChime("ready");
      onOrderSuccess(data.order.orderCode, data.order.id);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Submission error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#fffefc] border border-stone-200/80 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#b42356] to-[#d03a6e] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">
                Student Verified Checkout
              </h2>
              <p className="text-xs text-white/80">
                Home ❤️ Cafe Anti-Scam Order Protection
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

        {/* Step Indicator */}
        <div className="flex border-b border-stone-200 bg-stone-50/70 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors ${
              step === 1
                ? "text-[#b42356] border-b-2 border-[#b42356] bg-white"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-[#f7dce5] text-[#b42356] flex items-center justify-center font-bold text-[11px]">
              1
            </span>
            <span>Student & Teacher ID Verification</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (validateStep1()) setStep(2);
            }}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors ${
              step === 2
                ? "text-[#b42356] border-b-2 border-[#b42356] bg-white"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-[#f7dce5] text-[#b42356] flex items-center justify-center font-bold text-[11px]">
              2
            </span>
            <span>GCash Payment & Order Summary</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 1 ? (
            /* STEP 1: Anti-Scam Identity Details */
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs leading-relaxed flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block text-amber-950">
                    Why do we verify your ID & LRN?
                  </strong>
                  To prevent bogus or prank orders that waste fresh ingredients, Home ❤️ Cafe requires your student ID and 12-digit LRN. This also ensures nobody else claims your drink!
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Student / Teacher Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Juanita Dela Cruz"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm focus:border-[#b42356] focus:ring-2 focus:ring-[#b42356]/20 outline-none"
                  />
                </div>

                {/* 12-digit LRN */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    12-Digit LRN (Learner Reference No.) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    required
                    placeholder="12 digits e.g. 109823456712"
                    value={lrn}
                    onChange={(e) => setLrn(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm font-mono tracking-wider focus:border-[#b42356] focus:ring-2 focus:ring-[#b42356]/20 outline-none"
                  />
                  <span className="text-[10px] text-stone-500 mt-0.5 block">
                    {lrn.length}/12 digits entered
                  </span>
                </div>

                {/* Grade & Section */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Grade & Section / Department <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grade 11 - STEM A or Faculty"
                    value={gradeSection}
                    onChange={(e) => setGradeSection(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm focus:border-[#b42356] focus:ring-2 focus:ring-[#b42356]/20 outline-none"
                  />
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Contact / Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0917-123-4567"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm focus:border-[#b42356] focus:ring-2 focus:ring-[#b42356]/20 outline-none"
                  />
                </div>
              </div>

              {/* Photo Uploads: Student ID & Selfie */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* School ID Upload */}
                <div className="border border-dashed border-stone-300 rounded-2xl p-4 bg-stone-50/50 hover:bg-stone-50 transition-colors text-center relative">
                  <label className="block text-xs font-bold text-stone-800 mb-2">
                    1. Upload School ID Photo <span className="text-red-500">*</span>
                  </label>
                  {idPhotoPreview ? (
                    <div className="relative h-32 w-full rounded-xl overflow-hidden border border-emerald-300 shadow-sm">
                      <Image
                        src={idPhotoPreview}
                        alt="Student ID Preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setIdPhotoPreview(null)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-stone-900/70 text-white hover:bg-stone-900 text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="absolute bottom-1 inset-x-1 py-0.5 rounded bg-emerald-600/90 text-[10px] text-white font-medium">
                        ID Photo Attached ✓
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center h-32 rounded-xl border border-stone-200 bg-white hover:border-[#b42356] transition-colors p-3">
                      <Upload className="w-6 h-6 text-[#b42356] mb-1.5" />
                      <span className="text-xs font-semibold text-stone-700">
                        Select School ID Image
                      </span>
                      <span className="text-[10px] text-stone-400 mt-0.5">
                        PNG, JPG or Camera snapshot
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setIdPhotoPreview)}
                      />
                    </label>
                  )}
                </div>

                {/* Student Selfie / Face Photo */}
                <div className="border border-dashed border-stone-300 rounded-2xl p-4 bg-stone-50/50 hover:bg-stone-50 transition-colors text-center relative">
                  <label className="block text-xs font-bold text-stone-800 mb-2">
                    2. Upload Student Face Photo / Selfie <span className="text-red-500">*</span>
                  </label>
                  {selfiePhotoPreview ? (
                    <div className="relative h-32 w-full rounded-xl overflow-hidden border border-emerald-300 shadow-sm">
                      <Image
                        src={selfiePhotoPreview}
                        alt="Student Selfie Preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setSelfiePhotoPreview(null)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-stone-900/70 text-white hover:bg-stone-900 text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="absolute bottom-1 inset-x-1 py-0.5 rounded bg-emerald-600/90 text-[10px] text-white font-medium">
                        Selfie Attached ✓
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center h-32 rounded-xl border border-stone-200 bg-white hover:border-[#b42356] transition-colors p-3">
                      <Camera className="w-6 h-6 text-[#b42356] mb-1.5" />
                      <span className="text-xs font-semibold text-stone-700">
                        Take or Upload Selfie
                      </span>
                      <span className="text-[10px] text-stone-400 mt-0.5">
                        Matches your School ID face
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setSelfiePhotoPreview)}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* STEP 2: GCash Payment & Order Confirmation */
            <div className="space-y-5">
              {/* Cart Review Pill */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-stone-700 uppercase">
                    Order Items ({cart.length})
                  </span>
                  <span className="text-xs font-bold text-[#b42356]">
                    Total: ₱{totalAmount}
                  </span>
                </div>
                <div className="divide-y divide-stone-200/60 max-h-36 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className="py-1.5 flex justify-between text-xs">
                      <div>
                        <strong className="text-stone-800">
                          {item.quantity}x {item.bundleName || item.productName}
                        </strong>
                        <span className="text-stone-500 block text-[11px]">
                          {item.flavor} · {item.size} · Sugar: {item.sugarLevel} · Ice: {item.iceLevel}
                          {item.addBoba ? " · Boba (+₱10)" : ""}
                        </span>
                      </div>
                      <span className="font-semibold text-stone-800">
                        ₱{item.subtotal}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-2">
                  Choose Payment Method
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* GCash Downpayment */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("gcash_downpayment")}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      paymentMethod === "gcash_downpayment"
                        ? "border-[#007DFE] bg-blue-50/70 ring-2 ring-blue-500/20"
                        : "border-stone-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-[#007DFE]">
                        GCash 50%
                      </span>
                      <CreditCard className="w-4 h-4 text-[#007DFE]" />
                    </div>
                    <p className="text-[11px] text-stone-600 font-medium">
                      Downpayment: <strong>₱{Math.ceil(totalAmount * 0.5)}</strong>
                    </p>
                    <span className="text-[10px] text-stone-400 block mt-0.5">
                      Pay rest at counter
                    </span>
                  </button>

                  {/* GCash Full Payment */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("gcash_full")}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      paymentMethod === "gcash_full"
                        ? "border-[#007DFE] bg-blue-50/70 ring-2 ring-blue-500/20"
                        : "border-stone-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-[#007DFE]">
                        GCash 100%
                      </span>
                      <QrCode className="w-4 h-4 text-[#007DFE]" />
                    </div>
                    <p className="text-[11px] text-stone-600 font-medium">
                      Full Payment: <strong>₱{totalAmount}</strong>
                    </p>
                    <span className="text-[10px] text-stone-400 block mt-0.5">
                      Fastest claim
                    </span>
                  </button>

                  {/* Cash upon Counter Pickup */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("counter_cash")}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      paymentMethod === "counter_cash"
                        ? "border-[#b42356] bg-[#fff4f8] ring-2 ring-[#b42356]/20"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-[#b42356]">
                        Counter Cash
                      </span>
                      <DollarSign className="w-4 h-4 text-[#b42356]" />
                    </div>
                    <p className="text-[11px] text-stone-600 font-medium">
                      Pay <strong>₱{totalAmount}</strong>
                    </p>
                    <span className="text-[10px] text-stone-400 block mt-0.5">
                      Must show School ID
                    </span>
                  </button>
                </div>
              </div>

              {/* GCash Payment Details Card */}
              {paymentMethod !== "counter_cash" && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 via-white to-sky-50 border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#007DFE] text-white flex items-center justify-center font-black text-xs">
                        G
                      </div>
                      <div>
                        <strong className="text-xs text-blue-950 block font-bold">
                          HOME HEART CAFE GCash
                        </strong>
                        <span className="text-[11px] font-mono text-blue-800">
                          0917-889-CAFE (0917-889-2233)
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-stone-500 block">Amount to Send</span>
                      <strong className="text-sm font-black text-blue-700">
                        ₱{downPaymentAmount}
                      </strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* GCash Reference Number */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        GCash Reference No. <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 9021839218491"
                        value={gcashRef}
                        onChange={(e) => setGcashRef(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white text-stone-800 text-xs font-mono focus:border-blue-500 outline-none"
                      />
                    </div>

                    {/* Receipt Screenshot */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Upload GCash Receipt Screenshot
                      </label>
                      <label className="cursor-pointer flex items-center justify-center px-3 py-2 rounded-xl border border-dashed border-blue-300 bg-white hover:bg-blue-50/50 transition-colors text-xs text-blue-700 font-medium">
                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                        <span>{receiptPreview ? "Receipt Attached ✓" : "Attach Screenshot"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, setReceiptPreview)}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-full border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100 transition-colors"
            >
              Back to ID Form
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full text-stone-500 text-xs font-semibold hover:text-stone-800 transition-colors"
            >
              Cancel
            </button>
          )}

          {step === 1 ? (
            <button
              type="button"
              onClick={handleProceedToPayment}
              className="px-6 py-2.5 rounded-full bg-[#b42356] hover:bg-[#921a44] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
            >
              <span>Next: Payment & GCash</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitOrder}
              className="px-8 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Submitting Order...</span>
                </>
              ) : (
                <>
                  <span>Send Order to Cafe</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
