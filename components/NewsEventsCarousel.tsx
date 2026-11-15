"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Music,
  BookOpen,
  Coffee,
  Gift,
  Flame,
  Play,
  Pause,
  Calendar,
} from "lucide-react";

export interface NewsItem {
  id: string;
  title: string;
  schedule: string;
  description: string;
  icon: string;
  badgeColor: string;
  image: string;
}

interface NewsEventsCarouselProps {
  items: NewsItem[];
  title?: string;
  subtitle?: string;
  badgeText?: string;
}

export function NewsEventsCarousel({
  items,
  title = "Campus News, Events & Atmosphere",
  subtitle = "All announcements, weekly acoustic sessions, and student perks in one place.",
  badgeText = "Campus Life & News",
}: NewsEventsCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollCarousel = (direction: "left" | "right") => {
    if (!carouselRef.current) return;
    const offset = direction === "left" ? -300 : 300;
    carouselRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  const scrollToIndex = (index: number) => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollTo({ left: index * 280, behavior: "smooth" });
    setActiveIndex(index);
  };

  useEffect(() => {
    if (!isAutoplay || isHovered) return;
    const interval = setInterval(() => {
      if (!carouselRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        carouselRef.current.scrollTo({ left: 0, behavior: "smooth" });
        setActiveIndex(0);
      } else {
        carouselRef.current.scrollBy({ left: 300, behavior: "smooth" });
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [isAutoplay, isHovered]);

  const handleScroll = () => {
    if (!carouselRef.current) return;
    const scrollPos = carouselRef.current.scrollLeft;
    const idx = Math.round(scrollPos / 280);
    setActiveIndex(Math.min(Math.max(0, idx), items.length - 1));
  };

  const renderIcon = (icon: string) => {
    switch (icon) {
      case "music":
        return <Music className="w-4 h-4 text-rose-600" />;
      case "book":
        return <BookOpen className="w-4 h-4 text-sky-600" />;
      case "coffee":
        return <Coffee className="w-4 h-4 text-amber-600" />;
      case "gift":
        return <Gift className="w-4 h-4 text-emerald-600" />;
      case "flame":
        return <Flame className="w-4 h-4 text-indigo-600" />;
      default:
        return <Calendar className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Title & Navigation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{badgeText}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            {title}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
            {subtitle}
          </p>
        </div>

        {/* Carousel Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setIsAutoplay(!isAutoplay)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
              isAutoplay
                ? "border-blue-200 bg-blue-50 text-blue-700 shadow-2xs"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
            title={isAutoplay ? "Pause auto-scroll" : "Start auto-scroll"}
          >
            {isAutoplay ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping inline-block" />
                <Pause className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Auto</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-slate-500 fill-slate-500" />
                <span className="hidden sm:inline">Play</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scrollCarousel("left")}
              className="p-2 rounded-full border border-slate-200 bg-white hover:border-blue-600 text-slate-700 shadow-2xs cursor-pointer hover:bg-slate-50 active:scale-95 transition-all"
              aria-label="Previous news item"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollCarousel("right")}
              className="p-2 rounded-full border border-slate-200 bg-white hover:border-blue-600 text-slate-700 shadow-2xs cursor-pointer hover:bg-slate-50 active:scale-95 transition-all"
              aria-label="Next news item"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Single Unified Carousel Track */}
      <div
        className="relative group/news"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="flex gap-3.5 sm:gap-4 overflow-x-auto pb-3 pt-1 px-0.5 snap-x snap-mandatory scroll-smooth no-scrollbar touch-pan-x"
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="shrink-0 w-[260px] sm:w-[300px] snap-start rounded-2xl sm:rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group/card"
            >
              {/* Image Preview with Schedule Badge */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover/card:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 260px, 300px"
                />
                <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-xs text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1.5 border border-slate-200/80">
                  {renderIcon(item.icon)}
                  <span>{item.schedule}</span>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md">
                  Home ❤️ Cafe
                </div>
              </div>

              {/* Card Body - Concise, Compact, Student Friendly */}
              <div className="p-3.5 space-y-1 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug group-hover/card:text-blue-600 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Pagination Dots */}
        <div className="flex items-center justify-center gap-1.5 pt-2">
          {items.map((it, idx) => (
            <button
              key={it.id}
              type="button"
              onClick={() => scrollToIndex(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                activeIndex === idx
                  ? "w-6 bg-blue-600"
                  : "w-2 bg-slate-200 hover:bg-slate-300"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
