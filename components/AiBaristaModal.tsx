"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Send,
  Coffee,
  RotateCw,
  Sparkles,
} from "lucide-react";
import { playChime } from "@/lib/sound";

interface Message {
  id: string;
  sender: "user" | "home";
  text: string;
  actions?: { label: string; action: string }[];
  timestamp: string;
  isError?: boolean;
  failedPrompt?: string;
}

interface AiBaristaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerAction?: (action: string) => void;
}

const INITIAL_GREETING: Message = {
  id: "greeting",
  sender: "home",
  text: "Hi! I'm Hearty, your Home ❤️ Cafe barista. Looking for a recommendation, sweetness advice, or info about our Barkada bundles? Just ask!",
  timestamp: "Just now",
};

const SUGGESTION_CHIPS = [
  "What's your best coffee?",
  "Something not too sweet?",
  "What's in the Barkada bundle?",
  "Is the fries promo active?",
];

function parseFormattedSpans(text: string): React.ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return tokens.map((tok, idx) => {
    if (tok.startsWith("**") && tok.endsWith("**") && tok.length >= 4) {
      return (
        <strong key={idx} className="font-bold text-slate-900">
          {tok.slice(2, -2)}
        </strong>
      );
    }
    if (tok.startsWith("*") && tok.endsWith("*") && tok.length >= 2) {
      return (
        <em key={idx} className="italic text-slate-600">
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

        const isBullet =
          trimmed.startsWith("•") ||
          trimmed.startsWith("* ") ||
          trimmed.startsWith("- ");
        const bulletText = isBullet
          ? trimmed.replace(/^[•*-]\s*/, "")
          : trimmed;
        const renderedContent = parseFormattedSpans(bulletText);

        if (isBullet) {
          return (
            <div key={lineIdx} className="flex items-start gap-1.5 pl-1">
              <span className="text-blue-600 font-bold text-xs select-none leading-normal">
                •
              </span>
              <span className="flex-1 text-slate-700">{renderedContent}</span>
            </div>
          );
        }

        return (
          <p key={lineIdx} className="text-slate-700">
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
  const [messages, setMessages] = useState<Message[]>([INITIAL_GREETING]);
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
  }, [isOpen, messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsLoading(true);
    playChime("add");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.error || "Failed to reach barista");
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: "home",
        text:
          data.reply ||
          "Sorry, I didn't quite catch that. Try asking about promos, events, or our bestsellers!",
        actions: data.suggestedActions,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      playChime("notification");
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: "home",
          text: "Oops, Hearty took a coffee break! Tap to retry.",
          timestamp: "Just now",
          isError: true,
          failedPrompt: text,
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
      handleSendMessage("Why is school ID verification required?");
    } else if (onTriggerAction) {
      onTriggerAction(action);
      onClose();
    } else {
      handleSendMessage(label);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-end p-0 sm:p-6 bg-slate-900/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:w-[410px] h-[100dvh] sm:h-[600px] sm:rounded-3xl bg-white border border-slate-200/90 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
      >
        {/* Header: Hearty · AI Barista */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center">
              <Coffee className="w-5 h-5 text-amber-300" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm leading-tight text-white">
                  Hearty · AI Barista
                </h3>
              </div>
              <p className="text-[11px] text-slate-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span>Online · Usually replies instantly</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Chips Bar */}
        <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-50 border-b border-slate-200/60 overflow-x-auto text-[11px] font-semibold text-slate-600 no-scrollbar shrink-0">
          {SUGGESTION_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(chip)}
              className="shrink-0 px-3 py-1.5 rounded-full bg-white hover:bg-blue-600 hover:text-white border border-slate-200 text-slate-700 transition-all flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              <span>{chip}</span>
            </button>
          ))}
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/30">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                  msg.sender === "user"
                    ? "bg-blue-600 text-white rounded-tr-xs"
                    : msg.isError
                      ? "bg-red-50 border border-red-200 text-red-700 rounded-tl-xs"
                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-xs"
                }`}
              >
                {msg.sender === "user" ? (
                  <p className="whitespace-pre-line">{msg.text}</p>
                ) : (
                  <div>
                    <FormattedMessageText text={msg.text} />
                    {msg.isError && msg.failedPrompt && (
                      <button
                        type="button"
                        onClick={() => handleSendMessage(msg.failedPrompt)}
                        className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] shadow-xs cursor-pointer active:scale-95"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Tap to retry</span>
                      </button>
                    )}
                  </div>
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
                      className="px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200 text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              )}

              <span className="text-[9px] text-slate-400 mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          ))}

          {/* Typing Indicator: 3 bouncing dots */}
          {isLoading && (
            <div className="flex items-center gap-2 py-1 px-2">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Coffee className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                maxLength={200}
                placeholder="Ask Hearty anything about the menu..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full pl-3.5 pr-14 py-2.5 rounded-full border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 outline-none"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none font-mono">
                {input.length}/200
              </span>
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className="p-2.5 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white shadow-xs transition-colors shrink-0 cursor-pointer active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
