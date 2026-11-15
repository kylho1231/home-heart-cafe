"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Coffee } from "lucide-react";
import { AdminPortalModal } from "@/components/AdminPortalModal";

export default function AdminPage() {
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#382323] flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-md space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#2563eb] text-white flex items-center justify-center mx-auto shadow-lg">
          <Coffee className="w-8 h-8 text-amber-200" />
        </div>
        <h1 className="text-2xl font-black">Home ❤️ Cafe Admin Portal</h1>
        <p className="text-sm text-stone-600">
          Kitchen Queue, Campus Order Verification Desk & Sales Reporting
        </p>

        <div className="pt-4 flex gap-3 justify-center">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="px-6 py-2.5 rounded-full bg-[#2563eb] text-white font-bold text-xs shadow-md hover:bg-[#1d4ed8] transition-all"
          >
            Open Admin Dashboard
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-full bg-white border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-stone-50 transition-all flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Customer Menu</span>
          </Link>
        </div>
      </div>

      <AdminPortalModal isOpen={open} onClose={() => setOpen(false)} />
    </div>
  );
}
