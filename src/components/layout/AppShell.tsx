"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "./Sidebar";
import { LoginPage } from "@/app/login/LoginPage";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-mum-500 to-dad-500 rounded-2xl animate-pulse" />
          <p className="text-slate-400 text-sm">Loading Amesbury…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 lg:ml-60 min-h-screen">
        <div className="pt-0 lg:pt-0 mt-14 lg:mt-0 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
