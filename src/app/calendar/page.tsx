"use client";

import React, { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  List,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToEvents,
  addEvent,
  deleteEvent,
  updateEvent,
} from "@/lib/firestore";
import type { FamilyEvent, EventCategory } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { getCategoryColor, getCategoryLabel, getUserColor, formatTime, cn } from "@/lib/utils";
import toast from "react-hot-toast";

const CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: "personal", label: "Personal" },
  { value: "travel", label: "Travel" },
  { value: "social", label: "Social" },
  { value: "hobby", label: "Hobby" },
  { value: "family", label: "Family" },
  { value: "medical", label: "Medical" },
  { value: "work", label: "Work" },
];

interface EventForm {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  allDay: boolean;
  category: EventCategory;
  location: string;
  userRole: "mum" | "dad";
  isTravel: boolean;
}

const DEFAULT_FORM: EventForm = {
  title: "",
  description: "",
  startDate: format(new Date(), "yyyy-MM-dd"),
  startTime: format(new Date(), "HH:mm"),
  endDate: format(new Date(), "yyyy-MM-dd"),
  endTime: format(new Date(Date.now() + 3600000), "HH:mm"),
  allDay: false,
  category: "personal",
  location: "",
  userRole: "mum",
  isTravel: false,
};

export default function CalendarPage() {
  const { activeUser } = useAuth();
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "list">("month");
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<FamilyEvent | null>(null);
  const [form, setForm] = useState<EventForm>({ ...DEFAULT_FORM, userRole: activeUser });
  const [saving, setSaving] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    const unsub = subscribeToEvents(setEvents);
    return unsub;
  }, []);

  function openAddModal(date?: Date) {
    const d = date || new Date();
    setForm({
      ...DEFAULT_FORM,
      userRole: activeUser,
      startDate: format(d, "yyyy-MM-dd"),
      endDate: format(d, "yyyy-MM-dd"),
    });
    setSelectedEvent(null);
    setShowModal(true);
  }

  function openEditModal(event: FamilyEvent) {
    setSelectedEvent(event);
    setForm({
      title: event.title,
      description: event.description || "",
      startDate: format(event.startDate, "yyyy-MM-dd"),
      startTime: format(event.startDate, "HH:mm"),
      endDate: format(event.endDate, "yyyy-MM-dd"),
      endTime: format(event.endDate, "HH:mm"),
      allDay: event.allDay,
      category: event.category,
      location: event.location || "",
      userRole: event.userRole,
      isTravel: event.isTravel,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error("Please enter an event title");
      return;
    }
    setSaving(true);
    try {
      const startDate = new Date(`${form.startDate}T${form.startTime || "00:00"}`);
      const endDate = new Date(`${form.endDate}T${form.endTime || "23:59"}`);
      const color = getUserColor(form.userRole);

      const eventData = {
        title: form.title.trim(),
        description: form.description,
        startDate,
        endDate,
        allDay: form.allDay,
        category: form.category,
        location: form.location,
        userRole: form.userRole,
        userId: form.userRole,
        isTravel: form.isTravel || form.category === "travel",
        color,
        createdAt: new Date(),
      };

      if (selectedEvent) {
        await updateEvent(selectedEvent.id, eventData);
        toast.success("Event updated");
      } else {
        await addEvent(eventData);
        toast.success("Event added");
      }
      setShowModal(false);
    } catch {
      toast.error("Failed to save event");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedEvent) return;
    try {
      await deleteEvent(selectedEvent.id);
      toast.success("Event deleted");
      setShowModal(false);
    } catch {
      toast.error("Failed to delete event");
    }
  }

  // Build calendar grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  function getEventsForDay(date: Date) {
    return events.filter((e) => isSameDay(e.startDate, date));
  }

  const upcomingEvents = events
    .filter((e) => e.startDate >= new Date())
    .slice(0, 20);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Family Calendar"
        subtitle="Shared events for Mum & Dad"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white">
              <button
                onClick={() => setView("month")}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5",
                  view === "month"
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <CalendarDays size={14} /> Month
              </button>
              <button
                onClick={() => setView("list")}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5",
                  view === "list"
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <List size={14} /> List
              </button>
            </div>
            <Button
              variant={activeUser === "mum" ? "mum" : "dad"}
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => openAddModal()}
            >
              Add Event
            </Button>
          </div>
        }
      />

      {view === "month" ? (
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
          {/* Month Navigation */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-lg font-bold text-slate-900">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div
                key={d}
                className="py-2.5 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {days.map((d, i) => {
              const dayEvents = getEventsForDay(d);
              const isCurrentMonth = isSameMonth(d, currentDate);
              const isSelected = selectedDay && isSameDay(d, selectedDay);
              const todayFlag = isToday(d);

              return (
                <div
                  key={i}
                  className={cn(
                    "min-h-[100px] p-2 border-b border-r border-slate-100 cursor-pointer transition-colors",
                    !isCurrentMonth && "bg-slate-50/50",
                    "hover:bg-slate-50",
                    i % 7 === 6 && "border-r-0"
                  )}
                  onClick={() => {
                    setSelectedDay(d);
                    openAddModal(d);
                  }}
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium mb-1",
                      todayFlag &&
                        "bg-slate-900 text-white",
                      !todayFlag &&
                        isCurrentMonth &&
                        "text-slate-700",
                      !isCurrentMonth && "text-slate-300"
                    )}
                  >
                    {format(d, "d")}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium truncate cursor-pointer hover:opacity-80 transition-opacity"
                        style={{
                          backgroundColor: `${getUserColor(e.userRole)}18`,
                          color: getUserColor(e.userRole),
                        }}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          openEditModal(e);
                        }}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getUserColor(e.userRole) }}
                        />
                        <span className="truncate">{e.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-slate-400 px-1">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Upcoming Events</h2>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <CalendarDays size={32} className="mx-auto mb-3 opacity-30" />
              <p>No upcoming events — add one to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcomingEvents.map((e) => (
                <div
                  key={e.id}
                  className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => openEditModal(e)}
                >
                  <div
                    className="w-1 self-stretch rounded-full flex-shrink-0"
                    style={{ backgroundColor: getUserColor(e.userRole) }}
                  />
                  <div className="w-14 flex-shrink-0">
                    <p className="text-xs font-bold text-slate-500">
                      {format(e.startDate, "MMM")}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 leading-none">
                      {format(e.startDate, "d")}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900">{e.title}</p>
                      <Badge color={getCategoryColor(e.category)}>
                        {getCategoryLabel(e.category)}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {e.allDay ? "All day" : `${formatTime(e.startDate)} – ${formatTime(e.endDate)}`}
                      {e.location && ` · ${e.location}`}
                    </p>
                    {e.description && (
                      <p className="text-sm text-slate-400 mt-1 line-clamp-1">
                        {e.description}
                      </p>
                    )}
                  </div>
                  <Avatar
                    name={e.userRole === "mum" ? "Mum" : "Dad"}
                    role={e.userRole}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Event Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={selectedEvent ? "Edit Event" : "Add Event"}
        size="md"
      >
        <div className="px-6 py-5 space-y-4">
          <Input
            label="Event title"
            placeholder="e.g. Dinner with friends"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          {/* Who */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              For
            </label>
            <div className="flex gap-2">
              {(["mum", "dad"] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setForm({ ...form, userRole: role })}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all",
                    form.userRole === role
                      ? role === "mum"
                        ? "bg-gradient-to-r from-mum-500 to-purple-500 text-white border-transparent"
                        : "bg-gradient-to-r from-dad-500 to-cyan-500 text-white border-transparent"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {role === "mum" ? "💜 Mum" : "💙 Dad"}
                </button>
              ))}
            </div>
          </div>

          <Select
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as EventCategory })}
            options={CATEGORIES}
          />

          {/* Dates */}
          <div className="flex items-center gap-3">
            <Input
              label="Start date"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="flex-1"
            />
            {!form.allDay && (
              <Input
                label="Time"
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-28"
              />
            )}
          </div>
          <div className="flex items-center gap-3">
            <Input
              label="End date"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="flex-1"
            />
            {!form.allDay && (
              <Input
                label="End time"
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-28"
              />
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.allDay}
              onChange={(e) => setForm({ ...form, allDay: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-slate-700 font-medium">All day event</span>
          </label>

          <Input
            label="Location (optional)"
            placeholder="e.g. Manchester"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />

          <Textarea
            label="Description (optional)"
            placeholder="Any notes..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
          />
        </div>

        <div className="px-6 pb-5 flex items-center justify-between gap-3">
          {selectedEvent ? (
            <Button variant="danger" size="sm" onClick={handleDelete}>
              Delete
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              variant={form.userRole === "mum" ? "mum" : "dad"}
              onClick={handleSave}
              loading={saving}
            >
              {selectedEvent ? "Save Changes" : "Add Event"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
