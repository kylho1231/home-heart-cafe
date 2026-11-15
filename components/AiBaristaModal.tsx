"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Bot,
  Coffee,
  Calendar,
  Gift,
  ShieldCheck,
  ThumbsUp,
} from "lucide-react";
import { playChime } from "@/lib/sound";

interface Message {
  id: string;
  sender: "user" | "hearty";
  text: string;
  actions?: { label: string; action: string }[];
  timestamp: string;
}

interface AiBaristaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerAction?: (action: string) => void;
}

function parseFormattedSpans(text: string): React.ReactNode[] {
  // Regex to match **bold** or *italic*
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return tokens.map((tok, idx) => {
    if (tok.startsWith("**") && tok.endsWith("**") && tok.length >= 4) {
      return (
        <strong key={idx} className="font-bold text-stone-900">
          {tok.slice(2, -2)}
        </strong>
      );
    }
    if (tok.startsWith("*") && tok.endsWith("*") && tok.length >= 2) {
      return (
        <em key={idx} className="italic text-stone-600">
          {tok.slice(1, -1)}
        </em>
      );
    }
    return <span key={idx}>{tok}</span>;
  });
}

function FormattedMessageText({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lineIdx} className="h-1" />;
        }

        const isBullet = trimmed.startsWith("•") || trimmed.startsWith("* ") || trimmed.startsWith("- ");
        const bulletText = isBullet ? trimmed.replace(/^[•*-]\s*/, "") : trimmed;
        const renderedContent = parseFormattedSpans(bulletText);

        if (isBullet) {
          return (
            <div key={lineIdx} className="flex items-start gap-1.5 pl-1">
              <span className="text-[#b42356] font-bold text-xs select-none leading-normal">•</span>
              <span className="flex-1 text-stone-800">{renderedContent}</span>
            </div>
          );
        }

        return (
          <p key={lineIdx} className="text-stone-800">
            {renderedContent}
          </p>
        );
      })}
    </div>
  );
}

export function AiBaristaModal({
  isOpen,
  onClose,
  onTriggerAction,
}: AiBaristaModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      sender: "hearty",
      text:
        "Kumusta! Welcome to Home ❤️ Cafe!\n\nI'm **Hearty**, your digital barista concierge. Ask me anything about our:\n• **Promos & Barkada Bundles**\n• **Campus Cafe Events & Acoustic Fridays**\n• **Bestselling Drinks & Fries**\n• **Campus Identity & Pickup Verification**\n\nWhat can I brew for you today?",
      actions: [
        { label: "Active Promos", action: "askPromos" },
        { label: "Top Bestsellers", action: "askBestsellers" },
        { label: "Cafe Events", action: "askEvents" },
        { label: "Why ID Verification?", action: "askVerification" },
      ],
      timestamp: "Just now",
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsLoading(true);
    playChime("add");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim() }),
      });

      const data = await res.json();

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: "hearty",
        text: data.reply || "Sorry, I didn't quite catch that. Try asking about promos, events, or our bestsellers!",
        actions: data.suggestedActions,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      playChime("notification");
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: "hearty",
          text: "I'm having a little trouble connecting to the cafe counter. Please try again shortly!",
          timestamp: "Just now",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: string, label: string) => {
    if (action === "askPromos") {
      handleSendMessage("What are your current promos and barkada bundles?");
    } else if (action === "askBestsellers") {
      handleSendMessage("What are your best-selling drinks and snacks?");
    } else if (action === "askEvents") {
      handleSendMessage("What are the upcoming events and activities at the cafe?");
    } else if (action === "askVerification") {
      handleSendMessage("Why do you need my student ID, selfie, and 12-digit LRN?");
    } else if (onTriggerAction) {
      onTriggerAction(action);
      onClose();
    } else {
      handleSendMessage(label);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center p-3 sm:p-4 bg-stone-900/50 backdrop-blur-xs">
      <div className="relative w-full sm:max-w-md h-[580px] rounded-3xl bg-[#fffdfa] border border-stone-200/90 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-300">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#b42356] via-[#c7346b] to-[#d03a6e] text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30">
              <Coffee className="w-5 h-5 text-amber-200" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm leading-tight">Hearty · AI Barista</h3>
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-semibold">
                  Online
                </span>
              </div>
              <p className="text-[11px] text-white/80">Home ❤️ Cafe Assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Chips Bar */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-[#fdf5ed] border-b border-stone-200/60 overflow-x-auto text-[11px] font-semibold text-stone-600 no-scrollbar">
          <button
            type="button"
            onClick={() => handleSendMessage("What promos do you have?")}
            className="shrink-0 px-2.5 py-1 rounded-full bg-white hover:bg-[#b42356] hover:text-white border border-stone-200 transition-all flex items-center gap-1 shadow-xs"
          >
            <Gift className="w-3 h-3 text-[#b42356]" />
            <span>Promos</span>
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage("What are the best sellers?")}
            className="shrink-0 px-2.5 py-1 rounded-full bg-white hover:bg-[#b42356] hover:text-white border border-stone-200 transition-all flex items-center gap-1 shadow-xs"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Bestsellers</span>
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage("What events are happening?")}
            className="shrink-0 px-2.5 py-1 rounded-full bg-white hover:bg-[#b42356] hover:text-white border border-stone-200 transition-all flex items-center gap-1 shadow-xs"
          >
            <Calendar className="w-3 h-3 text-sky-500" />
            <span>Events</span>
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage("Why is school ID verification required?")}
            className="shrink-0 px-2.5 py-1 rounded-full bg-white hover:bg-[#b42356] hover:text-white border border-stone-200 transition-all flex items-center gap-1 shadow-xs"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>ID Verification</span>
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                  msg.sender === "user"
                    ? "bg-[#b42356] text-white rounded-tr-xs"
                    : "bg-white border border-stone-200/80 text-stone-800 rounded-tl-xs"
                }`}
              >
                {msg.sender === "user" ? (
                  <p className="whitespace-pre-line">{msg.text}</p>
                ) : (
                  <FormattedMessageText text={msg.text} />
                )}
              </div>

              {/* Action Buttons if provided */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                  {msg.actions.map((act, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleActionClick(act.action, act.label)}
                      className="px-2.5 py-1 rounded-full bg-[#f7dce5] hover:bg-[#b42356] hover:text-white text-[#b42356] text-[11px] font-bold transition-all shadow-xs"
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              )}

              <span className="text-[9px] text-stone-400 mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-stone-400 text-xs py-2">
              <Bot className="w-4 h-4 animate-bounce text-[#b42356]" />
              <span className="animate-pulse">Hearty is typing...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-stone-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask about promos, events, flavors..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-full border border-stone-200 bg-stone-50/70 text-xs text-stone-800 focus:bg-white focus:border-[#b42356] outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-full bg-[#b42356] hover:bg-[#921a44] disabled:opacity-40 text-white shadow-xs transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
