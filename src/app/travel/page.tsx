"use client";

import React, { useEffect, useState } from "react";
import {
  Plane,
  Plus,
  Trash2,
  MapPin,
  Calendar,
  CheckSquare,
  Square,
  Sparkles,
  Hotel,
  Clock,
  Globe,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import {
  subscribeToTrips,
  addTrip,
  updateTrip,
  deleteTrip,
} from "@/lib/firestore";
import type { Trip, PackingItem } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { cn, generateId } from "@/lib/utils";
import toast from "react-hot-toast";

const TRAVELER_OPTIONS = [
  { value: "both", label: "Both together" },
  { value: "mum", label: "Mum's trip" },
  { value: "dad", label: "Dad's trip" },
];

const STATUS_OPTIONS = [
  { value: "planning", label: "Planning" },
  { value: "booked", label: "Booked" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
];

export default function TravelPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [aiPlanning, setAiPlanning] = useState(false);
  const [aiAdvice, setAiAdvice] = useState("");
  const [aiDestination, setAiDestination] = useState("");

  const [form, setForm] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    traveler: "both" as Trip["traveler"],
    description: "",
    accommodation: "",
    flightDetails: "",
    notes: "",
    status: "planning" as Trip["status"],
  });

  useEffect(() => {
    const unsub = subscribeToTrips(setTrips);
    return unsub;
  }, []);

  function openAdd() {
    setForm({
      destination: "",
      startDate: "",
      endDate: "",
      traveler: "both",
      description: "",
      accommodation: "",
      flightDetails: "",
      notes: "",
      status: "planning",
    });
    setSelectedTrip(null);
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.destination.trim() || !form.startDate || !form.endDate) {
      toast.error("Please fill in destination and dates");
      return;
    }
    setSaving(true);
    try {
      const tripData = {
        destination: form.destination,
        startDate: new Date(form.startDate),
        endDate: new Date(form.endDate),
        traveler: form.traveler,
        description: form.description,
        accommodation: form.accommodation,
        flightDetails: form.flightDetails,
        notes: form.notes,
        status: form.status,
        packingList: selectedTrip?.packingList || [],
        createdAt: new Date(),
      };

      if (selectedTrip) {
        await updateTrip(selectedTrip.id, tripData);
        toast.success("Trip updated");
      } else {
        await addTrip(tripData);
        toast.success("Trip added!");
      }
      setShowModal(false);
    } catch {
      toast.error("Failed to save trip");
    } finally {
      setSaving(false);
    }
  }

  async function togglePackingItem(trip: Trip, itemId: string) {
    const updatedList = trip.packingList.map((item) =>
      item.id === itemId ? { ...item, packed: !item.packed } : item
    );
    await updateTrip(trip.id, { packingList: updatedList });
  }

  async function addPackingItem(trip: Trip, itemText: string) {
    const newItem: PackingItem = {
      id: generateId(),
      item: itemText,
      packed: false,
    };
    const updatedList = [...trip.packingList, newItem];
    await updateTrip(trip.id, { packingList: updatedList });
  }

  async function removePackingItem(trip: Trip, itemId: string) {
    const updatedList = trip.packingList.filter((item) => item.id !== itemId);
    await updateTrip(trip.id, { packingList: updatedList });
  }

  async function getAiPackingList(trip: Trip) {
    setAiPlanning(true);
    try {
      const nights = differenceInDays(trip.endDate, trip.startDate);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Create a practical packing list for a ${nights}-night trip to ${trip.destination} for ${trip.traveler === "both" ? "a couple in their 60s" : `a ${trip.traveler === "mum" ? "woman" : "man"} in their 60s`}. Return ONLY a plain numbered list of items, one per line, no categories or extra text. About 15-20 items.`,
            },
          ],
          context: "travel",
        }),
      });
      const data = await res.json();
      const items = data.response
        .split("\n")
        .filter((l: string) => l.trim())
        .map((l: string) => l.replace(/^\d+\.\s*[-•]?\s*/, "").trim())
        .filter((l: string) => l.length > 0);

      for (const item of items) {
        await addPackingItem(trip, item);
      }
      toast.success(`Added ${items.length} packing items!`);
    } catch {
      toast.error("Could not generate packing list");
    } finally {
      setAiPlanning(false);
    }
  }

  async function getTravelAdvice() {
    if (!aiDestination.trim()) return;
    setAiPlanning(true);
    setAiAdvice("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Give me practical travel advice for visiting ${aiDestination}. Include: best time to visit, top 3 things to do, local tips, and any important things to know. Keep it concise and friendly, for a couple in their 60s.`,
            },
          ],
          context: "travel",
        }),
      });
      const data = await res.json();
      setAiAdvice(data.response);
    } catch {
      toast.error("Could not get travel advice");
    } finally {
      setAiPlanning(false);
    }
  }

  const upcoming = trips.filter(
    (t) => t.status !== "completed" && t.startDate >= new Date()
  );
  const past = trips.filter(
    (t) => t.status === "completed" || t.endDate < new Date()
  );

  const statusColors: Record<Trip["status"], string> = {
    planning: "#6366f1",
    booked: "#f59e0b",
    upcoming: "#10b981",
    completed: "#94a3b8",
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Travel Planner"
        subtitle="Family trips, holidays & adventures"
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={16} />}
            onClick={openAdd}
          >
            Add Trip
          </Button>
        }
      />

      {/* AI Travel Planner */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
            <Globe size={14} className="text-white" />
          </div>
          <div>
            <span className="font-semibold text-slate-900 text-sm">
              AI Travel Advisor
            </span>
            <p className="text-xs text-slate-400">Get destination advice powered by Claude</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
            placeholder="e.g. Portugal, Tuscany, the Scottish Highlands..."
            value={aiDestination}
            onChange={(e) => setAiDestination(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && getTravelAdvice()}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={getTravelAdvice}
            loading={aiPlanning && !aiAdvice}
            icon={<Sparkles size={14} />}
          >
            Inspire me
          </Button>
        </div>
        {aiAdvice && (
          <div className="mt-3 p-4 bg-amber-50/50 rounded-xl text-sm text-slate-700 leading-relaxed border border-amber-100/50 whitespace-pre-wrap">
            {aiAdvice}
          </div>
        )}
      </div>

      {/* Upcoming Trips */}
      <div className="mb-8">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Plane size={18} className="text-amber-500" />
          Upcoming Trips ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card py-12 text-center text-slate-400">
            <Plane size={28} className="mx-auto mb-3 opacity-30" />
            <p>No upcoming trips — time to plan an adventure! ✈️</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={openAdd}
            >
              Add a trip
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                statusColors={statusColors}
                onEdit={() => {
                  setSelectedTrip(trip);
                  setForm({
                    destination: trip.destination,
                    startDate: format(trip.startDate, "yyyy-MM-dd"),
                    endDate: format(trip.endDate, "yyyy-MM-dd"),
                    traveler: trip.traveler,
                    description: trip.description || "",
                    accommodation: trip.accommodation || "",
                    flightDetails: trip.flightDetails || "",
                    notes: trip.notes || "",
                    status: trip.status,
                  });
                  setShowModal(true);
                }}
                onDelete={() => deleteTrip(trip.id)}
                onTogglePacking={(itemId) => togglePackingItem(trip, itemId)}
                onAddPacking={(item) => addPackingItem(trip, item)}
                onRemovePacking={(itemId) => removePackingItem(trip, itemId)}
                onAiPacking={() => getAiPackingList(trip)}
                aiLoading={aiPlanning}
              />
            ))}
          </div>
        )}
      </div>

      {/* Past Trips */}
      {past.length > 0 && (
        <div>
          <h2 className="font-semibold text-slate-400 mb-3 text-sm uppercase tracking-wide">
            Past Trips
          </h2>
          <div className="space-y-3 opacity-70">
            {past.slice(0, 5).map((trip) => (
              <div
                key={trip.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 flex items-center gap-4"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Plane size={16} className="text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-600">{trip.destination}</p>
                  <p className="text-xs text-slate-400">
                    {format(trip.startDate, "d MMM")} – {format(trip.endDate, "d MMM yyyy")}
                  </p>
                </div>
                <button
                  onClick={() => deleteTrip(trip.id)}
                  className="p-1 text-slate-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Trip Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={selectedTrip ? "Edit Trip" : "Add Trip"}
        size="md"
      >
        <div className="px-6 py-5 space-y-4">
          <Input
            label="Destination"
            placeholder="e.g. Lisbon, Portugal"
            value={form.destination}
            onChange={(e) => setForm({ ...form, destination: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Departure date"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
            <Input
              label="Return date"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Who's travelling?"
              value={form.traveler}
              onChange={(e) => setForm({ ...form, traveler: e.target.value as Trip["traveler"] })}
              options={TRAVELER_OPTIONS}
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Trip["status"] })}
              options={STATUS_OPTIONS}
            />
          </div>
          <Input
            label="Accommodation (optional)"
            placeholder="Hotel name or address"
            value={form.accommodation}
            onChange={(e) => setForm({ ...form, accommodation: e.target.value })}
          />
          <Input
            label="Flight details (optional)"
            placeholder="e.g. BA256 LHR-LIS 09:30"
            value={form.flightDetails}
            onChange={(e) => setForm({ ...form, flightDetails: e.target.value })}
          />
          <Textarea
            label="Notes (optional)"
            placeholder="Anything else to remember..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
          />
        </div>
        <div className="px-6 pb-5 flex items-center justify-between gap-3">
          {selectedTrip ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                deleteTrip(selectedTrip.id);
                setShowModal(false);
              }}
            >
              Delete
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              {selectedTrip ? "Save Changes" : "Add Trip"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function TripCard({
  trip,
  statusColors,
  onEdit,
  onDelete,
  onTogglePacking,
  onAddPacking,
  onRemovePacking,
  onAiPacking,
  aiLoading,
}: {
  trip: Trip;
  statusColors: Record<Trip["status"], string>;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePacking: (id: string) => void;
  onAddPacking: (item: string) => void;
  onRemovePacking: (id: string) => void;
  onAiPacking: () => void;
  aiLoading: boolean;
}) {
  const [newItem, setNewItem] = useState("");
  const daysUntil = differenceInDays(trip.startDate, new Date());
  const nights = differenceInDays(trip.endDate, trip.startDate);
  const packedCount = trip.packingList.filter((i) => i.packed).length;

  const travelerEmoji =
    trip.traveler === "both" ? "👫" : trip.traveler === "mum" ? "💜" : "💙";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
      {/* Trip Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Plane size={22} className="text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">{trip.destination}</h3>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-sm text-slate-500 flex items-center gap-1">
                  <Calendar size={12} />
                  {format(trip.startDate, "d MMM")} – {format(trip.endDate, "d MMM yyyy")}
                </span>
                <span className="text-sm text-slate-400">
                  {nights} night{nights !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge color={statusColors[trip.status]} className="capitalize">
              {trip.status}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm text-slate-500">
            {travelerEmoji}{" "}
            {trip.traveler === "both"
              ? "Together"
              : trip.traveler === "mum"
              ? "Mum's trip"
              : "Dad's trip"}
          </span>
          {daysUntil > 0 && (
            <span className="text-sm font-semibold text-amber-600">
              {daysUntil} day{daysUntil !== 1 ? "s" : ""} to go
            </span>
          )}
          {trip.accommodation && (
            <span className="text-sm text-slate-400 flex items-center gap-1">
              <Hotel size={12} />
              {trip.accommodation}
            </span>
          )}
          {trip.flightDetails && (
            <span className="text-sm text-slate-400 flex items-center gap-1">
              <Clock size={12} />
              {trip.flightDetails}
            </span>
          )}
        </div>

        {trip.notes && (
          <p className="text-sm text-slate-500 mt-2">{trip.notes}</p>
        )}
      </div>

      {/* Packing List */}
      <div className="border-t border-slate-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-slate-700 text-sm">Packing List</h4>
            {trip.packingList.length > 0 && (
              <span className="text-xs text-slate-400">
                {packedCount}/{trip.packingList.length} packed
              </span>
            )}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={onAiPacking}
            loading={aiLoading}
            icon={<Sparkles size={12} />}
          >
            AI List
          </Button>
        </div>

        {trip.packingList.length > 0 && (
          <div className="space-y-1.5 mb-3 max-h-40 overflow-y-auto">
            {trip.packingList.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2.5 group"
              >
                <button
                  onClick={() => onTogglePacking(item.id)}
                  className="text-slate-300 hover:text-emerald-500 transition-colors flex-shrink-0"
                >
                  {item.packed ? (
                    <CheckSquare size={16} className="text-emerald-500" />
                  ) : (
                    <Square size={16} />
                  )}
                </button>
                <span
                  className={cn(
                    "text-sm flex-1",
                    item.packed ? "line-through text-slate-400" : "text-slate-700"
                  )}
                >
                  {item.item}
                </span>
                <button
                  onClick={() => onRemovePacking(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-300 hover:text-red-400 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="Add packing item..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newItem.trim()) {
                onAddPacking(newItem.trim());
                setNewItem("");
              }
            }}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (newItem.trim()) {
                onAddPacking(newItem.trim());
                setNewItem("");
              }
            }}
          >
            <Plus size={14} />
          </Button>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between bg-slate-50/50">
        <button
          onClick={onDelete}
          className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
        >
          <Trash2 size={12} />
          Remove trip
        </button>
        <button
          onClick={onEdit}
          className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          Edit details →
        </button>
      </div>
    </div>
  );
}
