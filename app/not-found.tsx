import Link from "next/link";
import { Coffee, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fff8ef] text-[#382323] flex items-center justify-center p-6 selection:bg-[#f7dce5] selection:text-[#b42356]">
      <div className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl bg-white border border-stone-200 shadow-xl">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#b42356] to-[#d03a6e] text-white flex items-center justify-center mx-auto shadow-md">
          <Coffee className="w-8 h-8 text-amber-200" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#b42356] bg-[#fce8ef] px-3 py-1 rounded-full">
            404 · Page Not Found
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight pt-1">
            This cup seems empty.
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            The page, recipe, or drink you are looking for has been moved or does not exist on our campus menu.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#b42356] hover:bg-[#941743] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Cafe Menu</span>
        </Link>
      </div>
    </div>
  );
}
