"use client";

import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckSquare,
  Plane,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Clock,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { format, isToday, isTomorrow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToEvents, subscribeToTasks, subscribeToTrips } from "@/lib/firestore";
import type { FamilyEvent, Task, Trip } from "@/lib/types";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { getCategoryColor, getGreeting, formatTime, getUserGradient } from "@/lib/utils";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const { profile, activeUser } = useAuth();
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [briefing, setBriefing] = useState<string | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);

  useEffect(() => {
    const unsub1 = subscribeToEvents(setEvents);
    const unsub2 = subscribeToTasks(setTasks);
    const unsub3 = subscribeToTrips(setTrips);
    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  const todayEvents = events.filter((e) => isToday(e.startDate));
  const tomorrowEvents = events.filter((e) => isTomorrow(e.startDate));
  const pendingTasks = tasks.filter((t) => !t.completed && t.userRole === activeUser);
  const upcomingTrips = trips
    .filter((t) => t.startDate > new Date())
    .slice(0, 3);

  const mumEvents = todayEvents.filter((e) => e.userRole === "mum");
  const dadEvents = todayEvents.filter((e) => e.userRole === "dad");

  async function generateBriefing() {
    setBriefingLoading(true);
    try {
      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: todayEvents,
          tasks: pendingTasks,
          trips: upcomingTrips,
          date: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      setBriefing(data.briefing);
    } catch {
      toast.error("Could not generate briefing — check your API key.");
    } finally {
      setBriefingLoading(false);
    }
  }

  const highPriorityTasks = pendingTasks
    .filter((t) => t.priority === "high")
    .slice(0, 4);

  const todayTasksDone = tasks.filter(
    (t) => t.userRole === activeUser && t.completed && isToday(t.completedAt || t.createdAt)
  ).length;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Hero Greeting */}
      <div
        className={cn(
          "rounded-2xl p-6 bg-gradient-to-r text-white relative overflow-hidden",
          activeUser === "mum"
            ? "from-mum-500 to-purple-600"
            : "from-dad-600 to-cyan-500"
        )}
      >
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -right-4 bottom-0 w-24 h-24 rounded-full bg-white/10" />
        <div className="relative">
          <p className="text-white/80 text-sm font-medium">
            {getGreeting()}, {activeUser === "mum" ? "Mum" : "Dad"} 👋
          </p>
          <h2 className="text-2xl font-bold mt-0.5">
            {format(new Date(), "EEEE, d MMMM")}
          </h2>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <CalendarDays size={16} className="text-white/80" />
              <span className="text-sm text-white/90">
                {todayEvents.length} event{todayEvents.length !== 1 ? "s" : ""} today
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckSquare size={16} className="text-white/80" />
              <span className="text-sm text-white/90">
                {pendingTasks.length} task{pendingTasks.length !== 1 ? "s" : ""} pending
              </span>
            </div>
            {todayTasksDone > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-white/90">
                  ✓ {todayTasksDone} done today
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Briefing */}
      <Card>
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">
                  AI Morning Briefing
                </h3>
                <p className="text-xs text-slate-400">Powered by Claude</p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={generateBriefing}
              loading={briefingLoading}
              icon={<RefreshCw size={14} />}
            >
              {briefing ? "Refresh" : "Generate"}
            </Button>
          </div>
          {briefing ? (
            <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">
              {briefing}
            </div>
          ) : (
            <div className="text-sm text-slate-400 bg-slate-50 rounded-xl p-4 text-center border border-dashed border-slate-200">
              Click "Generate" to get your personalised daily briefing from Claude
            </div>
          )}
        </div>
      </Card>

      {/* Today Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mum's Today */}
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Avatar name="Mum" role="mum" size="sm" />
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Mum's Today
                  </h3>
                  <p className="text-xs text-slate-400">{mumEvents.length} events</p>
                </div>
              </div>
              <Link
                href="/calendar"
                className="text-xs text-mum-500 hover:text-mum-700 font-medium flex items-center gap-1"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {mumEvents.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                No events today — enjoy the day! 🌸
              </p>
            ) : (
              <div className="space-y-2">
                {mumEvents.slice(0, 4).map((e) => (
                  <div
                    key={e.id}
                    className="flex items-start gap-3 p-2.5 rounded-xl bg-mum-50/50 border border-mum-100/50"
                  >
                    <div
                      className="w-1 h-full min-h-[32px] rounded-full flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: getCategoryColor(e.category) }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {e.title}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock size={10} />
                        {e.allDay ? "All day" : formatTime(e.startDate)}
                        {e.location && ` · ${e.location}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Dad's Today */}
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Avatar name="Dad" role="dad" size="sm" />
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Dad's Today
                  </h3>
                  <p className="text-xs text-slate-400">{dadEvents.length} events</p>
                </div>
              </div>
              <Link
                href="/calendar"
                className="text-xs text-dad-500 hover:text-dad-700 font-medium flex items-center gap-1"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {dadEvents.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                Free day! Time for the garage? 🔧
              </p>
            ) : (
              <div className="space-y-2">
                {dadEvents.slice(0, 4).map((e) => (
                  <div
                    key={e.id}
                    className="flex items-start gap-3 p-2.5 rounded-xl bg-dad-50/50 border border-dad-100/50"
                  >
                    <div
                      className="w-1 h-full min-h-[32px] rounded-full flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: getCategoryColor(e.category) }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {e.title}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock size={10} />
                        {e.allDay ? "All day" : formatTime(e.startDate)}
                        {e.location && ` · ${e.location}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Tasks + Upcoming */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Priority Tasks */}
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Priority Tasks</h3>
              <Link
                href="/tasks"
                className="text-xs text-slate-400 hover:text-slate-700 font-medium flex items-center gap-1"
              >
                All tasks <ArrowRight size={12} />
              </Link>
            </div>
            {highPriorityTasks.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                No high-priority tasks — all clear! ✅
              </p>
            ) : (
              <div className="space-y-2">
                {highPriorityTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-red-50/50 border border-red-100/50"
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {t.title}
                      </p>
                    </div>
                    <Avatar
                      name={t.userRole === "mum" ? "Mum" : "Dad"}
                      role={t.userRole}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Upcoming Trips */}
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Upcoming Travel</h3>
              <Link
                href="/travel"
                className="text-xs text-slate-400 hover:text-slate-700 font-medium flex items-center gap-1"
              >
                All trips <ArrowRight size={12} />
              </Link>
            </div>
            {upcomingTrips.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                No trips planned yet — where to next? ✈️
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingTrips.map((trip) => {
                  const days = Math.ceil(
                    (trip.startDate.getTime() - Date.now()) / 86400000
                  );
                  return (
                    <div
                      key={trip.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-amber-50/50 border border-amber-100/50"
                    >
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Plane size={14} className="text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {trip.destination}
                        </p>
                        <p className="text-xs text-slate-400">
                          in {days} day{days !== 1 ? "s" : ""} ·{" "}
                          {trip.traveler === "both"
                            ? "Together"
                            : trip.traveler === "mum"
                            ? "Mum's trip"
                            : "Dad's trip"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            href: "/calendar",
            label: "Add Event",
            icon: CalendarDays,
            color: "from-violet-500 to-indigo-500",
          },
          {
            href: "/tasks",
            label: "New Task",
            icon: CheckSquare,
            color: "from-emerald-500 to-teal-500",
          },
          {
            href: "/ai",
            label: "Ask Claude",
            icon: Sparkles,
            color: "from-purple-500 to-violet-600",
          },
        ].map(({ href, label, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-2.5 p-4 bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
          >
            <div
              className={cn(
                "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center",
                color
              )}
            >
              <Icon size={18} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-slate-600">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
