"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Send,
  User,
  Bot,
  Trash2,
  Bike,
  Car,
  CalendarDays,
  Plane,
  CheckSquare,
  Heart,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = {
  mum: [
    { icon: CalendarDays, text: "Help me plan a busy week", label: "Plan my week" },
    { icon: Plane, text: "Give me travel packing tips for a city break", label: "Packing tips" },
    { icon: CheckSquare, text: "Help me prioritise my to-do list", label: "Prioritise tasks" },
    { icon: Heart, text: "Suggest a lovely family activity for the weekend", label: "Family ideas" },
  ],
  dad: [
    { icon: Bike, text: "Recommend some great enduro trails in the UK", label: "UK Trails" },
    { icon: Car, text: "Give me classic car buying advice for beginners", label: "Car buying" },
    { icon: Bike, text: "What maintenance should I do before a big enduro ride?", label: "Pre-ride check" },
    { icon: Car, text: "How do I store a classic car properly over winter?", label: "Winter storage" },
  ],
};

export default function AIPage() {
  const { activeUser, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const systemContext =
        activeUser === "mum"
          ? "You are a helpful AI assistant for a busy woman in her 60s named Mum. She has an active social life, busy schedule, and loves travel. Be warm, practical and encouraging."
          : "You are a helpful AI assistant for a retired man in his 60s named Dad. He is passionate about enduro off-road motorcycling and restoring classic cars. You can speak with expertise on these topics. Be friendly, knowledgeable and practical.";

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          systemContext,
          context: "general",
        }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      toast.error("Failed to get response — check your API key");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  const quickPrompts = QUICK_PROMPTS[activeUser];

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader
        title="AI Assistant"
        subtitle={`Claude AI, personalised for ${activeUser === "mum" ? "Mum" : "Dad"}`}
        actions={
          messages.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 size={14} />}
              onClick={() => setMessages([])}
            >
              Clear chat
            </Button>
          ) : undefined
        }
      />

      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8">
              <div
                className={cn(
                  "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg",
                  activeUser === "mum"
                    ? "from-mum-500 to-purple-500"
                    : "from-dad-500 to-cyan-500"
                )}
              >
                <Sparkles size={28} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Hi {activeUser === "mum" ? "Mum" : "Dad"}! 👋
              </h3>
              <p className="text-slate-500 text-sm text-center max-w-sm mb-8">
                I'm your personal Claude AI assistant. Ask me anything — from planning your week to{" "}
                {activeUser === "dad"
                  ? "enduro trail recommendations and classic car advice"
                  : "travel ideas and schedule management"}.
              </p>
              <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                {quickPrompts.map(({ icon: Icon, text, label }) => (
                  <button
                    key={label}
                    onClick={() => sendMessage(text)}
                    className={cn(
                      "flex items-center gap-2.5 p-3.5 rounded-xl border text-left transition-all hover:shadow-sm",
                      activeUser === "mum"
                        ? "border-mum-100 hover:bg-mum-50/50 hover:border-mum-200"
                        : "border-dad-100 hover:bg-dad-50/50 hover:border-dad-200"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                        activeUser === "mum" ? "bg-mum-50" : "bg-dad-50"
                      )}
                    >
                      <Icon
                        size={16}
                        className={
                          activeUser === "mum" ? "text-mum-500" : "text-dad-500"
                        }
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center flex-shrink-0 mt-0.5",
                        activeUser === "mum"
                          ? "from-mum-500 to-purple-500"
                          : "from-dad-500 to-cyan-500"
                      )}
                    >
                      <Sparkles size={14} className="text-white" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-3",
                      msg.role === "user"
                        ? activeUser === "mum"
                          ? "bg-gradient-to-br from-mum-500 to-purple-500 text-white rounded-tr-sm"
                          : "bg-gradient-to-br from-dad-500 to-cyan-500 text-white rounded-tr-sm"
                        : "bg-slate-100 text-slate-800 rounded-tl-sm"
                    )}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                    <p
                      className={cn(
                        "text-xs mt-1.5",
                        msg.role === "user"
                          ? "text-white/60"
                          : "text-slate-400"
                      )}
                    >
                      {format(msg.timestamp, "h:mm a")}
                    </p>
                  </div>

                  {msg.role === "user" && (
                    <Avatar
                      name={activeUser === "mum" ? "Mum" : "Dad"}
                      role={activeUser}
                      size="sm"
                      className="mt-0.5 flex-shrink-0"
                    />
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 justify-start">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                      activeUser === "mum"
                        ? "from-mum-500 to-purple-500"
                        : "from-dad-500 to-cyan-500"
                    )}
                  >
                    <Sparkles size={14} className="text-white" />
                  </div>
                  <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-slate-100 p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                activeUser === "mum"
                  ? "Ask me anything — schedule, travel, ideas..."
                  : "Ask about trails, cars, maintenance..."
              }
              disabled={loading}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:bg-slate-50 transition-colors"
            />
            <Button
              type="submit"
              variant={activeUser === "mum" ? "mum" : "dad"}
              size="md"
              disabled={!input.trim() || loading}
              icon={<Send size={16} />}
            >
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
