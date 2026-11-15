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
  GraduationCap,
  Briefcase,
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
  // Role & Form State
  const [role, setRole] = useState<"student" | "teacher_staff">("student");
  const [fullName, setFullName] = useState("");
  const [lrn, setLrn] = useState("");
  const [gradeSection, setGradeSection] = useState("");
  const [department, setDepartment] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null);
  const [selfiePhotoPreview, setSelfiePhotoPreview] = useState<string | null>(null);
  const [privacyConsent, setPrivacyConsent] = useState(false);

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState<"gcash_downpayment" | "gcash_full" | "counter_cash">("gcash_downpayment");
  const [gcashRef, setGcashRef] = useState("");
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  // UI state
  const [step, setStep] = useState<1 | 2>(1); // 1: Customer Verification, 2: Payment & Review
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");

  React.useEffect(() => {
    if (isOpen && !idempotencyKey) {
      setIdempotencyKey(`idem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
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

    if (role === "student") {
      const cleanLrn = lrn.replace(/\D/g, "");
      if (cleanLrn.length !== 12) {
        setErrorMessage("Student LRN must be exactly 12 digits (DepEd Philippine standard).");
        return false;
      }

      if (!gradeSection.trim()) {
        setErrorMessage("Please indicate your Grade & Section.");
        return false;
      }
    } else {
      if (!department.trim()) {
        setErrorMessage("Please indicate your Faculty Department or Staff Designation.");
        return false;
      }
    }

    if (!contactNumber.trim() || contactNumber.length < 7) {
      setErrorMessage("Please provide a valid Contact Number.");
      return false;
    }

    if (!idPhotoPreview) {
      setErrorMessage(
        role === "student"
          ? "Please upload a photo of your Student School ID."
          : "Please upload a photo of your Faculty / Employee ID.",
      );
      return false;
    }

    if (!privacyConsent) {
      setErrorMessage(
        "Please read and consent to the Data Privacy Notice (RA 10173) to proceed.",
      );
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
    if (isSubmitting) return;

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
          role,
          fullName: fullName.trim(),
          lrn: role === "student" ? lrn.replace(/\D/g, "") : undefined,
          gradeSection: role === "student" ? gradeSection.trim() : undefined,
          department: role === "teacher_staff" ? department.trim() : undefined,
          contactNumber: contactNumber.trim(),
          idPhotoUrl: idPhotoPreview,
          selfiePhotoUrl: selfiePhotoPreview || undefined,
          privacyConsent: true,
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

      // Persist active verification credential for instant tracking
      if (typeof window !== "undefined") {
        window.localStorage.setItem("home-heart-active-verify", fullName.trim());
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
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#fffefc] border border-[#E9DCD3] shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#B51F57] to-[#941743] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight text-white">
                Campus Order Verification
              </h2>
              <p className="text-xs text-white/90">
                Order ahead & pick up smoothly at Counter 1
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close checkout"
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex border-b border-[#E9DCD3] bg-stone-50/70 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              step === 1
                ? "text-[#B51F57] border-b-2 border-[#B51F57] bg-white font-bold"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-[#FCE8EF] text-[#B51F57] flex items-center justify-center font-bold text-[11px]">
              1
            </span>
            <span>Identity & Pickup Details</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (validateStep1()) setStep(2);
            }}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              step === 2
                ? "text-[#B51F57] border-b-2 border-[#B51F57] bg-white font-bold"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-[#FCE8EF] text-[#B51F57] flex items-center justify-center font-bold text-[11px]">
              2
            </span>
            <span>Payment & Review</span>
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
            /* STEP 1: Customer Role & Identity Details */
            <div className="space-y-5">
              {/* Role Switcher Tab (Student vs Teacher/Staff) */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  I am ordering as:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRole("student");
                      setErrorMessage(null);
                    }}
                    className={`py-2.5 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      role === "student"
                        ? "border-[#B51F57] bg-[#FCE8EF] text-[#B51F57] ring-2 ring-[#B51F57]/20 shadow-xs"
                        : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Student (LRN Required)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRole("teacher_staff");
                      setErrorMessage(null);
                    }}
                    className={`py-2.5 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      role === "teacher_staff"
                        ? "border-[#B51F57] bg-[#FCE8EF] text-[#B51F57] ring-2 ring-[#B51F57]/20 shadow-xs"
                        : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Teacher / Faculty / Staff</span>
                  </button>
                </div>
              </div>

              {/* Informative Hospitality Note */}
              <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#E9DCD3] text-stone-700 text-xs leading-relaxed flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#B51F57] shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block text-[#30231F] mb-0.5">
                    Order Security & Quick Pickup
                  </strong>
                  To ensure your freshly made drinks are prepared and handed only to you during busy break times, we verify your campus identity.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {role === "student" ? "Student Full Name" : "Faculty / Staff Full Name"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maria Santos"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm focus:border-[#B51F57] focus:ring-2 focus:ring-[#B51F57]/20 outline-none"
                  />
                </div>

                {/* 12-digit LRN (Only for students) */}
                {role === "student" ? (
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      12-Digit LRN (Learner Reference No.) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      required
                      placeholder="e.g. 109823456712"
                      value={lrn}
                      onChange={(e) => setLrn(e.target.value.replace(/\D/g, ""))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm font-mono tracking-wider focus:border-[#B51F57] focus:ring-2 focus:ring-[#B51F57]/20 outline-none"
                    />
                    <span className="text-[10px] text-stone-500 mt-0.5 block">
                      {lrn.length}/12 digits entered
                    </span>
                  </div>
                ) : (
                  /* Department / Faculty Designation (For Teachers) */
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Department / Faculty Designation <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior High Faculty / Math Dept"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm focus:border-[#B51F57] focus:ring-2 focus:ring-[#B51F57]/20 outline-none"
                    />
                  </div>
                )}

                {/* Grade & Section (Students only) */}
                {role === "student" && (
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Grade & Section <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Grade 11 - STEM A"
                      value={gradeSection}
                      onChange={(e) => setGradeSection(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm focus:border-[#B51F57] focus:ring-2 focus:ring-[#B51F57]/20 outline-none"
                    />
                  </div>
                )}

                {/* Contact Number */}
                <div className={role === "teacher_staff" ? "sm:col-span-2" : ""}>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Contact / Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0917-123-4567"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm focus:border-[#B51F57] focus:ring-2 focus:ring-[#B51F57]/20 outline-none"
                  />
                </div>
              </div>

              {/* Photo Uploads: ID & Selfie */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* ID Photo */}
                <div className="border border-dashed border-stone-300 rounded-2xl p-4 bg-stone-50/50 hover:bg-stone-50 transition-colors text-center relative">
                  <label className="block text-xs font-bold text-stone-800 mb-2">
                    {role === "student" ? "1. Student School ID Photo" : "1. Faculty / Staff ID Photo"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  {idPhotoPreview ? (
                    <div className="relative h-32 w-full rounded-xl overflow-hidden border border-emerald-300 shadow-sm">
                      <Image
                        src={idPhotoPreview}
                        alt="ID Photo Preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setIdPhotoPreview(null)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-stone-900/70 text-white hover:bg-stone-900 text-xs cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="absolute bottom-1 inset-x-1 py-0.5 rounded bg-emerald-600/90 text-[10px] text-white font-medium">
                        ID Photo Attached ✓
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center h-32 rounded-xl border border-stone-200 bg-white hover:border-[#B51F57] transition-colors p-3">
                      <Upload className="w-6 h-6 text-[#B51F57] mb-1.5" />
                      <span className="text-xs font-semibold text-stone-700">
                        {role === "student" ? "Upload School ID" : "Upload Faculty ID"}
                      </span>
                      <span className="text-[10px] text-stone-500 mt-0.5">
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

                {/* Face Photo / Selfie (Optional for Counter Claim) */}
                <div className="border border-dashed border-stone-300 rounded-2xl p-4 bg-stone-50/50 hover:bg-stone-50 transition-colors text-center relative">
                  <label className="block text-xs font-bold text-stone-800 mb-2">
                    2. Face Photo / Selfie <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  {selfiePhotoPreview ? (
                    <div className="relative h-32 w-full rounded-xl overflow-hidden border border-emerald-300 shadow-sm">
                      <Image
                        src={selfiePhotoPreview}
                        alt="Selfie Preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setSelfiePhotoPreview(null)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-stone-900/70 text-white hover:bg-stone-900 text-xs cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="absolute bottom-1 inset-x-1 py-0.5 rounded bg-emerald-600/90 text-[10px] text-white font-medium">
                        Selfie Attached ✓
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center h-32 rounded-xl border border-stone-200 bg-white hover:border-[#B51F57] transition-colors p-3">
                      <Camera className="w-6 h-6 text-[#B51F57] mb-1.5" />
                      <span className="text-xs font-semibold text-stone-700">
                        Take or Upload Selfie
                      </span>
                      <span className="text-[10px] text-stone-500 mt-0.5">
                        Verifies your pickup identity
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

              {/* Data Privacy Act Notice (RA 10173) */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-stone-700 text-xs space-y-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <strong className="font-bold text-amber-950">
                    Data Privacy Notice (RA 10173 Compliance)
                  </strong>
                </div>
                <p className="text-[11px] leading-relaxed text-stone-600">
                  Home ❤️ Cafe collects your name, student/faculty ID, and verification photo strictly for counter claim identification and fraud prevention during break rushes. Your data is stored securely in encrypted transit, never shared or used for commercial marketing, and automatically purged from our records after 30 days.
                </p>
                <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={privacyConsent}
                    onChange={(e) => {
                      setPrivacyConsent(e.target.checked);
                      if (e.target.checked) setErrorMessage(null);
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-stone-300 text-[#B51F57] focus:ring-[#B51F57] cursor-pointer"
                  />
                  <span className="text-[11px] font-semibold text-stone-800 leading-snug">
                    I have read and consent to the collection and verification of my school credentials pursuant to Republic Act No. 10173 (Data Privacy Act of 2012). <span className="text-red-500">*</span>
                  </span>
                </label>
              </div>
            </div>
          ) : (
            /* STEP 2: Payment & Order Confirmation */
            <div className="space-y-5">
              {/* Cart Review Pill */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-[#E9DCD3]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-stone-700 uppercase">
                    Order Items ({cart.length})
                  </span>
                  <span className="text-xs font-bold text-[#B51F57]">
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
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
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
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
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
                      Fastest counter claim
                    </span>
                  </button>

                  {/* Cash upon Counter Pickup */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("counter_cash")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      paymentMethod === "counter_cash"
                        ? "border-[#B51F57] bg-[#FCE8EF] ring-2 ring-[#B51F57]/20"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-[#B51F57]">
                        Counter Cash
                      </span>
                      <DollarSign className="w-4 h-4 text-[#B51F57]" />
                    </div>
                    <p className="text-[11px] text-stone-600 font-medium">
                      Pay <strong>₱{totalAmount}</strong>
                    </p>
                    <span className="text-[10px] text-stone-400 block mt-0.5">
                      Pay upon pickup
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
        <div className="px-6 py-4 bg-stone-50 border-t border-[#E9DCD3] flex items-center justify-between gap-3">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-full border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Back to Details
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full text-stone-600 text-xs font-semibold hover:text-stone-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}

          {step === 1 ? (
            <button
              type="button"
              onClick={handleProceedToPayment}
              className="px-6 py-2.5 rounded-full bg-[#B51F57] hover:bg-[#941743] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Next: Payment & GCash</span>
              <CheckCircle2 className="w-4 h-4 text-white" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitOrder}
              className="px-8 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-white" />
                  <span>Submitting Order...</span>
                </>
              ) : (
                <>
                  <span>Send Order to Cafe</span>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
