"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  Wrench,
  Plane,
  Sparkles,
  LogOut,
  Menu,
  X,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/ui/Avatar";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/hobbies", label: "Dad's Garage", icon: Wrench },
  { href: "/travel", label: "Travel", icon: Plane },
  { href: "/ai", label: "AI Assistant", icon: Sparkles },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut, activeUser, setActiveUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-mum-500 to-dad-500 rounded-lg flex items-center justify-center">
            <Heart size={16} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-base leading-none">Amesbury</h1>
            <p className="text-xs text-slate-400 mt-0.5">Family Hub</p>
          </div>
        </div>
      </div>

      {/* User Switcher */}
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-xs text-slate-400 font-medium mb-2 px-1">Viewing as</p>
        <div className="flex gap-2">
          {(["mum", "dad"] as const).map((role) => (
            <button
              key={role}
              onClick={() => setActiveUser(role)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
                activeUser === role
                  ? role === "mum"
                    ? "bg-gradient-to-r from-mum-500 to-purple-500 text-white shadow-sm"
                    : "bg-gradient-to-r from-dad-500 to-cyan-500 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100"
              )}
            >
              <span>{role === "mum" ? "💜" : "💙"}</span>
              {role === "mum" ? "Mel" : "Andrew"}
            </button>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                active
                  ? activeUser === "mum"
                    ? "bg-mum-50 text-mum-700"
                    : "bg-dad-50 text-dad-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon
                size={18}
                className={cn(
                  active
                    ? activeUser === "mum"
                      ? "text-mum-500"
                      : "text-dad-500"
                    : "text-slate-400"
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User & Sign Out */}
      <div className="px-4 py-4 border-t border-slate-100">
        {profile && (
          <div className="flex items-center gap-3 mb-3">
            <Avatar name={profile.name} role={profile.role} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {profile.name}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={16} />
          Switch user
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col bg-white border-r border-slate-100 fixed inset-y-0 left-0 z-30">
        {content}
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-mum-500 to-dad-500 rounded-lg flex items-center justify-center">
            <Heart size={14} className="text-white" />
          </div>
          <span className="font-bold text-slate-900">Amesbury</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
