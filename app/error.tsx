"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Coffee, RotateCw, ArrowLeft } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected errors securely without leaking sensitive info
    console.error("Runtime application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#0f172a] flex items-center justify-center p-6 selection:bg-[#dbeafe] selection:text-[#2563eb]">
      <div className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl bg-white border border-stone-200 shadow-xl">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-md">
          <Coffee className="w-8 h-8 text-amber-700" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Counter Interruption
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight pt-1">
            Something spilled along the way.
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            We ran into an unexpected hiccup loading this page. Don&apos;t worry, your cart and order status are safe.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-stone-200 bg-white hover:bg-stone-50 text-xs font-bold text-stone-700 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Menu</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
