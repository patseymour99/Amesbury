"use client";

import React from "react";
import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function LoginPage() {
  const { selectUser } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-mum-500 to-dad-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Heart size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Amesbury</h1>
          <p className="text-slate-400 mt-1 text-sm">Family Hub</p>
        </div>

        <p className="text-center text-slate-500 font-medium mb-6">Who are you?</p>

        <div className="flex flex-col gap-4">
          {/* Mel */}
          <button
            onClick={() => selectUser("mum")}
            className="group relative w-full flex items-center gap-5 p-6 bg-white rounded-2xl border-2 border-mum-100 shadow-card hover:border-mum-400 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-mum-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200">
              <span className="text-2xl font-bold text-white">M</span>
            </div>
            <div className="text-left">
              <p className="text-xl font-bold text-slate-900">Mel</p>
              <p className="text-sm text-slate-400 mt-0.5">Busy schedule, travel & family</p>
            </div>
            <div className="absolute right-5 text-mum-300 group-hover:text-mum-500 transition-colors text-xl">
              →
            </div>
          </button>

          {/* Andrew */}
          <button
            onClick={() => selectUser("dad")}
            className="group relative w-full flex items-center gap-5 p-6 bg-white rounded-2xl border-2 border-dad-100 shadow-card hover:border-dad-400 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-dad-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200">
              <span className="text-2xl font-bold text-white">A</span>
            </div>
            <div className="text-left">
              <p className="text-xl font-bold text-slate-900">Andrew</p>
              <p className="text-sm text-slate-400 mt-0.5">Enduro rides & classic cars</p>
            </div>
            <div className="absolute right-5 text-dad-300 group-hover:text-dad-500 transition-colors text-xl">
              →
            </div>
          </button>
        </div>

        <p className="text-center text-xs text-slate-300 mt-8">
          Amesbury Family Hub · Powered by Claude AI
        </p>
      </div>
    </div>
  );
}
