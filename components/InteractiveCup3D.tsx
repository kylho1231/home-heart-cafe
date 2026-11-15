"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Sparkles, RefreshCw, Volume2, Heart } from "lucide-react";
import { playChime } from "@/lib/sound";

interface InteractiveCup3DProps {
  productName: string;
  category: string;
  flavor: string;
  size: string;
  colors: [string, string];
  accent: string;
  image?: string;
  sugarLevel: "0%" | "25%" | "50%" | "75%" | "100%";
  iceLevel: "No Ice" | "Less Ice" | "Regular Ice" | "Extra Ice";
  hasBoba: boolean;
  hasCreamCheese?: boolean;
  interactive?: boolean;
}

export function InteractiveCup3D({
  productName,
  category,
  flavor,
  size,
  colors,
  accent,
  image,
  sugarLevel,
  iceLevel,
  hasBoba,
  hasCreamCheese,
  interactive = true,
}: InteractiveCup3DProps) {
  const [rotateX, setRotateX] = useState(-5);
  const [rotateY, setRotateY] = useState(10);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Height multiplier based on size
  const sizeHeight = size === "22 oz" ? 340 : size === "16 oz" ? 300 : 260;
  const isFloat = category === "Float Series" || productName.toLowerCase().includes("float");
  const isCreamCheese =
    hasCreamCheese ||
    category === "Cream Cheese Series" ||
    productName.toLowerCase().includes("cream cheese");

  // Number of ice cubes to render
  const iceCount =
    iceLevel === "No Ice"
      ? 0
      : iceLevel === "Less Ice"
        ? 3
        : iceLevel === "Regular Ice"
          ? 6
          : 9;

  // Liquid opacity based on sugar level
  const liquidOpacity =
    sugarLevel === "0%"
      ? 0.75
      : sugarLevel === "25%"
        ? 0.82
        : sugarLevel === "50%"
          ? 0.88
          : sugarLevel === "75%"
            ? 0.94
            : 1.0;

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!interactive || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // Limit rotation range
      const newRotateY = Math.max(-25, Math.min(25, (x / (rect.width / 2)) * 20));
      const newRotateX = Math.max(-20, Math.min(20, -(y / (rect.height / 2)) * 15));

      setRotateX(newRotateX);
      setRotateY(newRotateY);
    },
    [interactive],
  );

  const handlePointerLeave = () => {
    setIsHovered(false);
    setRotateX(-5);
    setRotateY(10);
  };

  const handlePointerEnter = () => {
    setIsHovered(true);
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      className="relative flex items-center justify-center p-6 select-none touch-none"
      style={{ perspective: "1000px" }}
    >
      {/* 3D Scene Wrapper */}
      <div
        className="relative transition-transform duration-200 ease-out"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: "preserve-3d",
          width: "240px",
          height: `${sizeHeight + 80}px`,
        }}
      >
        {/* Soft 3D Ground Shadow */}
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 w-48 h-8 rounded-full bg-stone-900/15 blur-md"
          style={{
            transform: `translateZ(-40px) scale(${1 + (rotateX + 5) * 0.02})`,
          }}
        />

        {/* 3D Realistic Cup Body */}
        <div
          className="relative mx-auto rounded-b-[40px] rounded-t-[16px] overflow-hidden border border-white/60 shadow-2xl backdrop-blur-sm transition-all duration-300"
          style={{
            width: "190px",
            height: `${sizeHeight}px`,
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0.15))",
            boxShadow: `0 20px 40px -10px rgba(56, 35, 35, 0.25), inset 0 0 20px rgba(255, 255, 255, 0.6), inset -6px 0 12px rgba(0, 0, 0, 0.05)`,
            transform: "translateZ(10px)",
          }}
        >
          {/* Top Cup Rim & Highlight */}
          <div className="absolute top-0 inset-x-0 h-4 bg-white/70 border-b border-white/80 rounded-t-[14px] z-30 shadow-sm" />

          {/* Realistic Translucent Cup Gloss Strip */}
          <div
            className="absolute top-0 bottom-0 left-4 w-6 bg-gradient-to-r from-transparent via-white/50 to-transparent z-30 pointer-events-none transform -skew-x-6"
            style={{ opacity: isHovered ? 0.7 : 0.45 }}
          />
          <div
            className="absolute top-0 bottom-0 right-4 w-3 bg-gradient-to-l from-white/30 to-transparent z-30 pointer-events-none"
          />

          {/* Liquid Fill */}
          <div
            className="absolute bottom-0 inset-x-0 rounded-b-[38px] transition-all duration-500 overflow-hidden"
            style={{
              top: isFloat ? "45px" : isCreamCheese ? "38px" : "20px",
              background: `linear-gradient(180deg, ${colors[1]}, ${colors[0]})`,
              opacity: liquidOpacity,
            }}
          >
            {/* Liquid Surface Wave / Meniscus */}
            <div
              className="absolute top-0 inset-x-0 h-4 rounded-full bg-white/20 blur-[1px]"
              style={{
                transform: `scaleX(1.1) translateY(-2px)`,
              }}
            />

            {/* Ice Cubes Simulation */}
            {iceCount > 0 && (
              <div className="absolute inset-x-0 top-3 h-28 pointer-events-none">
                {Array.from({ length: iceCount }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute rounded-lg border border-white/60 bg-white/35 backdrop-blur-[2px] shadow-inner animate-pulse"
                    style={{
                      width: `${26 + (i % 3) * 4}px`,
                      height: `${24 + (i % 2) * 4}px`,
                      left: `${18 + ((i * 35) % 130)}px`,
                      top: `${8 + Math.floor(i / 3) * 26}px`,
                      transform: `rotate(${i * 24 - 15}deg)`,
                      animationDuration: `${3 + i * 0.5}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Boba Pearls Simulation */}
            {hasBoba && (
              <div className="absolute bottom-0 inset-x-0 h-24 pointer-events-none z-20">
                <div className="relative w-full h-full">
                  {Array.from({ length: 18 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full shadow-md"
                      style={{
                        width: "16px",
                        height: "16px",
                        left: `${14 + (i % 6) * 26 + (Math.sin(i) * 6)}px`,
                        bottom: `${6 + Math.floor(i / 6) * 16}px`,
                        background:
                          "radial-gradient(circle at 35% 35%, #5a3c28, #1e130c 70%, #0d0805 100%)",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.4), inset 1px 1px 2px rgba(255,255,255,0.3)",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cream Cheese Walling Drip Effect */}
          {isCreamCheese && (
            <div className="absolute top-2 inset-x-0 z-20 pointer-events-none">
              <div className="h-10 bg-gradient-to-b from-[#fffef5] to-[#fdedcd] rounded-b-[18px] border-b-2 border-white/80 shadow-md flex justify-around px-2">
                {/* Cheese Drips */}
                <span className="w-3 h-8 bg-[#fdf5dd] rounded-b-full shadow-sm -mt-1" />
                <span className="w-4 h-12 bg-[#fdf5dd] rounded-b-full shadow-sm -mt-1" />
                <span className="w-3 h-6 bg-[#fdf5dd] rounded-b-full shadow-sm -mt-1" />
                <span className="w-4 h-10 bg-[#fdf5dd] rounded-b-full shadow-sm -mt-1" />
                <span className="w-2.5 h-7 bg-[#fdf5dd] rounded-b-full shadow-sm -mt-1" />
              </div>
            </div>
          )}

          {/* Float Scoop (Ice Cream) */}
          {isFloat && (
            <div className="absolute top-1 inset-x-0 z-20 flex justify-center pointer-events-none">
              <div
                className="relative w-20 h-16 rounded-t-full bg-gradient-to-b from-amber-50 via-yellow-100 to-amber-100 shadow-md border border-amber-200/50"
              >
                {/* Syrup Drizzle */}
                <div
                  className="absolute inset-x-3 top-2 h-10 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${accent} 40%, transparent 70%)`,
                    opacity: 0.8,
                  }}
                />
              </div>
            </div>
          )}

          {/* Home Cafe Cup Logo Label */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 py-2.5 px-2 rounded-2xl bg-white/90 backdrop-blur-md border border-white/80 text-center shadow-lg z-25 pointer-events-none"
            style={{
              transform: "translate(-50%, -50%) translateZ(15px)",
            }}
          >
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold tracking-wider text-[#b42356] uppercase">
              <span>Home</span>
              <Heart className="w-2.5 h-2.5 fill-red-500 text-red-500 inline-block" />
              <span>Café</span>
            </div>
            <div className="text-[12px] font-semibold text-[#382323] truncate max-w-[100px] mx-auto mt-0.5">
              {flavor}
            </div>
            <div className="text-[9px] font-medium text-stone-500 uppercase tracking-tight">
              {size}
            </div>
          </div>
        </div>

        {/* Straw */}
        <div
          className="absolute -top-12 left-1/2 w-4 h-24 rounded-full bg-gradient-to-r from-red-400 via-white to-red-400 shadow-lg transform -rotate-12 pointer-events-none"
          style={{
            transform: "translateZ(25px) rotate(-14deg)",
            boxShadow: "2px 4px 10px rgba(0,0,0,0.15)",
          }}
        />

        {/* Product photo overlay if available & requested */}
        {image && (
          <div
            className="absolute -bottom-2 -right-4 w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-xl bg-white/80 backdrop-blur-sm pointer-events-none"
            style={{ transform: "translateZ(30px)" }}
          >
            <Image
              src={image}
              alt={productName}
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
        )}
      </div>

      {/* Interactive Helper Indicator */}
      {interactive && (
        <div className="absolute bottom-0 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-md text-[11px] font-medium text-stone-600 border border-stone-200/60 shadow-sm pointer-events-none">
          <Sparkles className="w-3.5 h-3.5 text-[#b42356]" />
          <span>Interactive 3D Tilt</span>
        </div>
      )}
    </div>
  );
}
