"use client";

import React, { useEffect, useState } from "react";
import {
  Bike,
  Car,
  Plus,
  Trash2,
  Wrench,
  MapPin,
  Clock,
  Activity,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Star,
} from "lucide-react";
import { format } from "date-fns";
import {
  subscribeToRides,
  addRide,
  deleteRide,
  subscribeToCars,
  addCar,
  deleteCar,
  subscribeToCarServices,
  addCarService,
  deleteCarService,
} from "@/lib/firestore";
import type { EnduroRide, ClassicCar, CarService } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

type Tab = "rides" | "garage";

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "moderate", label: "Moderate" },
  { value: "hard", label: "Hard" },
  { value: "extreme", label: "Extreme" },
];

const CAR_STATUS_OPTIONS = [
  { value: "running", label: "Running" },
  { value: "project", label: "Project" },
  { value: "restoration", label: "Restoration" },
  { value: "show", label: "Show Car" },
];

const SERVICE_TYPE_OPTIONS = [
  { value: "service", label: "Service" },
  { value: "repair", label: "Repair" },
  { value: "restoration", label: "Restoration" },
  { value: "inspection", label: "Inspection" },
  { value: "purchase", label: "Purchase" },
  { value: "other", label: "Other" },
];

export default function HobbiesPage() {
  const [tab, setTab] = useState<Tab>("rides");
  const [rides, setRides] = useState<EnduroRide[]>([]);
  const [cars, setCars] = useState<ClassicCar[]>([]);
  const [showRideModal, setShowRideModal] = useState(false);
  const [showCarModal, setShowCarModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCar, setSelectedCar] = useState<ClassicCar | null>(null);

  // Ride form
  const [rideForm, setRideForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    location: "",
    trailName: "",
    distance: "",
    duration: "",
    difficulty: "moderate" as EnduroRide["difficulty"],
    notes: "",
    weather: "",
  });

  // Car form
  const [carForm, setCarForm] = useState({
    name: "",
    year: "",
    make: "",
    model: "",
    color: "",
    registrationPlate: "",
    notes: "",
    status: "running" as ClassicCar["status"],
  });

  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const unsub1 = subscribeToRides(setRides);
    const unsub2 = subscribeToCars(setCars);
    return () => { unsub1(); unsub2(); };
  }, []);

  async function saveRide() {
    if (!rideForm.location.trim()) {
      toast.error("Please enter a location");
      return;
    }
    setSaving(true);
    try {
      await addRide({
        date: new Date(rideForm.date),
        location: rideForm.location,
        trailName: rideForm.trailName || undefined,
        distance: rideForm.distance ? parseFloat(rideForm.distance) : undefined,
        duration: rideForm.duration ? parseInt(rideForm.duration) : undefined,
        difficulty: rideForm.difficulty,
        notes: rideForm.notes || undefined,
        weather: rideForm.weather || undefined,
        createdAt: new Date(),
      });
      toast.success("Ride logged!");
      setShowRideModal(false);
      setRideForm({
        date: format(new Date(), "yyyy-MM-dd"),
        location: "",
        trailName: "",
        distance: "",
        duration: "",
        difficulty: "moderate",
        notes: "",
        weather: "",
      });
    } catch {
      toast.error("Failed to save ride");
    } finally {
      setSaving(false);
    }
  }

  async function saveCar() {
    if (!carForm.name.trim() || !carForm.make.trim()) {
      toast.error("Please fill in car name and make");
      return;
    }
    setSaving(true);
    try {
      await addCar({
        name: carForm.name,
        year: parseInt(carForm.year) || 0,
        make: carForm.make,
        model: carForm.model,
        color: carForm.color || undefined,
        registrationPlate: carForm.registrationPlate || undefined,
        notes: carForm.notes || undefined,
        status: carForm.status,
        createdAt: new Date(),
      });
      toast.success("Car added to garage!");
      setShowCarModal(false);
    } catch {
      toast.error("Failed to add car");
    } finally {
      setSaving(false);
    }
  }

  async function askAI() {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiAnswer("");
    try {
      const carContext = cars
        .map((c) => `${c.year} ${c.make} ${c.model} (${c.name})`)
        .join(", ");
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `You are an expert in classic cars and enduro/off-road motorcycling. Dad's garage contains: ${carContext || "no cars yet"}. Question: ${aiQuestion}`,
            },
          ],
          context: "hobbies",
        }),
      });
      const data = await res.json();
      setAiAnswer(data.response);
    } catch {
      toast.error("AI request failed");
    } finally {
      setAiLoading(false);
    }
  }

  const difficultyColor: Record<EnduroRide["difficulty"], string> = {
    easy: "#10b981",
    moderate: "#f59e0b",
    hard: "#ef4444",
    extreme: "#7c3aed",
  };

  const statusColor: Record<ClassicCar["status"], string> = {
    running: "#10b981",
    project: "#f59e0b",
    restoration: "#3b82f6",
    show: "#d946ef",
  };

  const totalMiles = rides.reduce((acc, r) => acc + (r.distance || 0), 0);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dad's Garage"
        subtitle="Enduro rides & classic car tracker"
        actions={
          <div className="flex gap-2">
            {tab === "rides" ? (
              <Button
                variant="dad"
                size="sm"
                icon={<Plus size={16} />}
                onClick={() => setShowRideModal(true)}
              >
                Log Ride
              </Button>
            ) : (
              <Button
                variant="dad"
                size="sm"
                icon={<Plus size={16} />}
                onClick={() => setShowCarModal(true)}
              >
                Add Car
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white rounded-2xl border border-slate-100 shadow-card mb-6 w-fit">
        <button
          onClick={() => setTab("rides")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
            tab === "rides"
              ? "bg-gradient-to-r from-dad-500 to-cyan-500 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Bike size={16} />
          Enduro Rides
        </button>
        <button
          onClick={() => setTab("garage")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
            tab === "garage"
              ? "bg-gradient-to-r from-dad-500 to-cyan-500 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Car size={16} />
          Classic Cars
        </button>
      </div>

      {tab === "rides" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Rides", value: rides.length, icon: Bike, color: "from-dad-500 to-cyan-500" },
              { label: "Total Miles", value: `${totalMiles.toFixed(0)}`, icon: MapPin, color: "from-orange-500 to-red-500" },
              {
                label: "This Month",
                value: rides.filter(
                  (r) => r.date.getMonth() === new Date().getMonth()
                ).length,
                icon: Activity,
                color: "from-emerald-500 to-teal-500",
              },
            ].map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="bg-white rounded-2xl border border-slate-100 shadow-card p-4"
              >
                <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3", color)}>
                  <Icon size={16} className="text-white" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* AI Mechanic */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <div>
                <span className="font-semibold text-slate-900 text-sm">AI Trail Advisor</span>
                <p className="text-xs text-slate-400">Ask about routes, gear, maintenance & more</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-dad-300"
                placeholder="e.g. What's the best enduro tyre for wet moorland trails?"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && askAI()}
              />
              <Button variant="dad" size="sm" onClick={askAI} loading={aiLoading}>
                Ask
              </Button>
            </div>
            {aiAnswer && (
              <div className="mt-3 p-4 bg-dad-50/50 rounded-xl text-sm text-slate-700 leading-relaxed border border-dad-100/50 whitespace-pre-wrap">
                {aiAnswer}
              </div>
            )}
          </div>

          {/* Ride Log */}
          {rides.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card py-16 text-center text-slate-400">
              <Bike size={32} className="mx-auto mb-3 opacity-30" />
              <p>No rides logged yet — get out there! 🏍️</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rides.map((ride) => (
                <div
                  key={ride.id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 flex items-start gap-4"
                >
                  <div className="w-10 h-10 bg-dad-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Bike size={18} className="text-dad-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {ride.trailName || ride.location}
                        </p>
                        {ride.trailName && (
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <MapPin size={10} />
                            {ride.location}
                          </p>
                        )}
                      </div>
                      <Badge color={difficultyColor[ride.difficulty]} className="capitalize">
                        {ride.difficulty}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-xs text-slate-400">
                        {format(ride.date, "d MMM yyyy")}
                      </span>
                      {ride.distance && (
                        <span className="text-xs text-slate-500 font-medium">
                          {ride.distance} miles
                        </span>
                      )}
                      {ride.duration && (
                        <span className="text-xs text-slate-400 flex items-center gap-0.5">
                          <Clock size={10} />
                          {ride.duration} min
                        </span>
                      )}
                      {ride.weather && (
                        <span className="text-xs text-slate-400">{ride.weather}</span>
                      )}
                    </div>
                    {ride.notes && (
                      <p className="text-sm text-slate-500 mt-2">{ride.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteRide(ride.id)}
                    className="p-1 text-slate-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "garage" && (
        <div className="space-y-6">
          {/* AI Mechanic */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <div>
                <span className="font-semibold text-slate-900 text-sm">AI Classic Car Expert</span>
                <p className="text-xs text-slate-400">Ask about maintenance, values, restoration & history</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="e.g. How do I restore chrome bumpers on a 1970s Triumph?"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && askAI()}
              />
              <Button variant="primary" size="sm" onClick={askAI} loading={aiLoading}>
                Ask
              </Button>
            </div>
            {aiAnswer && (
              <div className="mt-3 p-4 bg-slate-50 rounded-xl text-sm text-slate-700 leading-relaxed border border-slate-200 whitespace-pre-wrap">
                {aiAnswer}
              </div>
            )}
          </div>

          {/* Cars */}
          {cars.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card py-16 text-center text-slate-400">
              <Car size={32} className="mx-auto mb-3 opacity-30" />
              <p>No cars in the garage yet — add your first! 🚗</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cars.map((car) => (
                <CarCard key={car.id} car={car} onDelete={() => deleteCar(car.id)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Log Ride Modal */}
      <Modal
        open={showRideModal}
        onClose={() => setShowRideModal(false)}
        title="Log Enduro Ride"
        size="md"
      >
        <div className="px-6 py-5 space-y-4">
          <Input
            label="Date"
            type="date"
            value={rideForm.date}
            onChange={(e) => setRideForm({ ...rideForm, date: e.target.value })}
          />
          <Input
            label="Location"
            placeholder="e.g. Brecon Beacons, Wales"
            value={rideForm.location}
            onChange={(e) => setRideForm({ ...rideForm, location: e.target.value })}
          />
          <Input
            label="Trail name (optional)"
            placeholder="e.g. Black Mountain Trail"
            value={rideForm.trailName}
            onChange={(e) => setRideForm({ ...rideForm, trailName: e.target.value })}
          />
          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Difficulty"
              value={rideForm.difficulty}
              onChange={(e) =>
                setRideForm({ ...rideForm, difficulty: e.target.value as EnduroRide["difficulty"] })
              }
              options={DIFFICULTY_OPTIONS}
            />
            <Input
              label="Distance (mi)"
              type="number"
              placeholder="0"
              value={rideForm.distance}
              onChange={(e) => setRideForm({ ...rideForm, distance: e.target.value })}
            />
            <Input
              label="Duration (min)"
              type="number"
              placeholder="0"
              value={rideForm.duration}
              onChange={(e) => setRideForm({ ...rideForm, duration: e.target.value })}
            />
          </div>
          <Input
            label="Weather (optional)"
            placeholder="e.g. Sunny, 12°C"
            value={rideForm.weather}
            onChange={(e) => setRideForm({ ...rideForm, weather: e.target.value })}
          />
          <Textarea
            label="Notes (optional)"
            placeholder="How was the ride?"
            value={rideForm.notes}
            onChange={(e) => setRideForm({ ...rideForm, notes: e.target.value })}
            rows={2}
          />
        </div>
        <div className="px-6 pb-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowRideModal(false)}>Cancel</Button>
          <Button variant="dad" onClick={saveRide} loading={saving}>Log Ride</Button>
        </div>
      </Modal>

      {/* Add Car Modal */}
      <Modal
        open={showCarModal}
        onClose={() => setShowCarModal(false)}
        title="Add Car to Garage"
        size="md"
      >
        <div className="px-6 py-5 space-y-4">
          <Input
            label="Nickname"
            placeholder="e.g. The Blue Beetle"
            value={carForm.name}
            onChange={(e) => setCarForm({ ...carForm, name: e.target.value })}
          />
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Year"
              type="number"
              placeholder="1972"
              value={carForm.year}
              onChange={(e) => setCarForm({ ...carForm, year: e.target.value })}
            />
            <Input
              label="Make"
              placeholder="e.g. Triumph"
              value={carForm.make}
              onChange={(e) => setCarForm({ ...carForm, make: e.target.value })}
            />
            <Input
              label="Model"
              placeholder="e.g. TR6"
              value={carForm.model}
              onChange={(e) => setCarForm({ ...carForm, model: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Colour (optional)"
              placeholder="British Racing Green"
              value={carForm.color}
              onChange={(e) => setCarForm({ ...carForm, color: e.target.value })}
            />
            <Input
              label="Reg plate (optional)"
              placeholder="e.g. ABC 123"
              value={carForm.registrationPlate}
              onChange={(e) => setCarForm({ ...carForm, registrationPlate: e.target.value })}
            />
          </div>
          <Select
            label="Status"
            value={carForm.status}
            onChange={(e) => setCarForm({ ...carForm, status: e.target.value as ClassicCar["status"] })}
            options={CAR_STATUS_OPTIONS}
          />
          <Textarea
            label="Notes (optional)"
            placeholder="History, quirks, restoration notes..."
            value={carForm.notes}
            onChange={(e) => setCarForm({ ...carForm, notes: e.target.value })}
            rows={2}
          />
        </div>
        <div className="px-6 pb-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowCarModal(false)}>Cancel</Button>
          <Button variant="dad" onClick={saveCar} loading={saving}>Add to Garage</Button>
        </div>
      </Modal>
    </div>
  );
}

function CarCard({ car, onDelete }: { car: ClassicCar; onDelete: () => void }) {
  const [services, setServices] = useState<CarService[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    description: "",
    type: "service" as CarService["type"],
    cost: "",
    mileage: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeToCarServices(car.id, setServices);
    return unsub;
  }, [car.id]);

  async function addService() {
    if (!serviceForm.description.trim()) return;
    setSaving(true);
    try {
      await addCarService({
        carId: car.id,
        date: new Date(serviceForm.date),
        description: serviceForm.description,
        type: serviceForm.type,
        cost: serviceForm.cost ? parseFloat(serviceForm.cost) : undefined,
        mileage: serviceForm.mileage ? parseInt(serviceForm.mileage) : undefined,
        notes: serviceForm.notes || undefined,
        createdAt: new Date(),
      });
      toast.success("Service logged");
      setShowServiceModal(false);
    } catch {
      toast.error("Failed to log service");
    } finally {
      setSaving(false);
    }
  }

  const statusColors: Record<ClassicCar["status"], string> = {
    running: "#10b981",
    project: "#f59e0b",
    restoration: "#3b82f6",
    show: "#d946ef",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Car size={18} className="text-slate-600" />
            </div>
            <div>
              <p className="font-bold text-slate-900">{car.name}</p>
              <p className="text-sm text-slate-500">
                {car.year} {car.make} {car.model}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge color={statusColors[car.status]} className="capitalize">
              {car.status}
            </Badge>
            <button
              onClick={onDelete}
              className="p-1 text-slate-300 hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
          {car.color && <span>🎨 {car.color}</span>}
          {car.registrationPlate && <span>🔢 {car.registrationPlate}</span>}
          {services.length > 0 && (
            <span>🔧 {services.length} service record{services.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {car.notes && (
          <p className="text-sm text-slate-500 mt-2 line-clamp-2">{car.notes}</p>
        )}
      </div>

      <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors"
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          Service History ({services.length})
        </button>
        <Button
          variant="secondary"
          size="sm"
          icon={<Plus size={12} />}
          onClick={() => setShowServiceModal(true)}
        >
          Log
        </Button>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {services.length === 0 ? (
            <p className="px-5 py-4 text-sm text-slate-400 text-center">
              No service records yet
            </p>
          ) : (
            services.map((s) => (
              <div key={s.id} className="px-5 py-3 flex items-start gap-3">
                <Wrench size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{s.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {format(s.date, "d MMM yyyy")}
                    {s.cost && ` · £${s.cost.toFixed(2)}`}
                    {s.mileage && ` · ${s.mileage.toLocaleString()} mi`}
                  </p>
                </div>
                <button
                  onClick={() => deleteCarService(s.id)}
                  className="p-0.5 text-slate-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <Modal
        open={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        title={`Log Service — ${car.name}`}
        size="sm"
      >
        <div className="px-6 py-5 space-y-4">
          <Input
            label="Date"
            type="date"
            value={serviceForm.date}
            onChange={(e) => setServiceForm({ ...serviceForm, date: e.target.value })}
          />
          <Select
            label="Type"
            value={serviceForm.type}
            onChange={(e) => setServiceForm({ ...serviceForm, type: e.target.value as CarService["type"] })}
            options={SERVICE_TYPE_OPTIONS}
          />
          <Input
            label="Description"
            placeholder="e.g. Oil change and filter"
            value={serviceForm.description}
            onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Cost (£)"
              type="number"
              placeholder="0.00"
              value={serviceForm.cost}
              onChange={(e) => setServiceForm({ ...serviceForm, cost: e.target.value })}
            />
            <Input
              label="Mileage"
              type="number"
              placeholder="0"
              value={serviceForm.mileage}
              onChange={(e) => setServiceForm({ ...serviceForm, mileage: e.target.value })}
            />
          </div>
        </div>
        <div className="px-6 pb-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowServiceModal(false)}>Cancel</Button>
          <Button variant="dad" onClick={addService} loading={saving}>Log Service</Button>
        </div>
      </Modal>
    </div>
  );
}
