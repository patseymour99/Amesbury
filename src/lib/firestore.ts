import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  setDoc,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  FamilyEvent,
  Task,
  EnduroRide,
  ClassicCar,
  CarService,
  Trip,
  UserProfile,
} from "./types";

// ─── Converters ──────────────────────────────────────────────────────────────

function toDate(val: unknown): Date {
  if (!val) return new Date();
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  return new Date(val as string);
}

function eventFromDoc(id: string, data: Record<string, unknown>): FamilyEvent {
  return {
    ...(data as Omit<FamilyEvent, "id" | "startDate" | "endDate" | "createdAt">),
    id,
    startDate: toDate(data.startDate),
    endDate: toDate(data.endDate),
    createdAt: toDate(data.createdAt),
  } as FamilyEvent;
}

function taskFromDoc(id: string, data: Record<string, unknown>): Task {
  return {
    ...(data as Omit<Task, "id" | "dueDate" | "createdAt" | "completedAt">),
    id,
    dueDate: data.dueDate ? toDate(data.dueDate) : undefined,
    createdAt: toDate(data.createdAt),
    completedAt: data.completedAt ? toDate(data.completedAt) : undefined,
  } as Task;
}

function rideFromDoc(id: string, data: Record<string, unknown>): EnduroRide {
  return {
    ...(data as Omit<EnduroRide, "id" | "date" | "createdAt">),
    id,
    date: toDate(data.date),
    createdAt: toDate(data.createdAt),
  } as EnduroRide;
}

function carFromDoc(id: string, data: Record<string, unknown>): ClassicCar {
  return {
    ...(data as Omit<ClassicCar, "id" | "createdAt">),
    id,
    createdAt: toDate(data.createdAt),
  } as ClassicCar;
}

function serviceFromDoc(id: string, data: Record<string, unknown>): CarService {
  return {
    ...(data as Omit<CarService, "id" | "date" | "createdAt">),
    id,
    date: toDate(data.date),
    createdAt: toDate(data.createdAt),
  } as CarService;
}

function tripFromDoc(id: string, data: Record<string, unknown>): Trip {
  return {
    ...(data as Omit<Trip, "id" | "startDate" | "endDate" | "createdAt">),
    id,
    startDate: toDate(data.startDate),
    endDate: toDate(data.endDate),
    createdAt: toDate(data.createdAt),
    packingList: (data.packingList as Trip["packingList"]) || [],
  } as Trip;
}

// ─── Events ──────────────────────────────────────────────────────────────────

export async function getEvents(): Promise<FamilyEvent[]> {
  const q = query(collection(db, "events"), orderBy("startDate", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => eventFromDoc(d.id, d.data() as Record<string, unknown>));
}

export function subscribeToEvents(cb: (events: FamilyEvent[]) => void) {
  const q = query(collection(db, "events"), orderBy("startDate", "asc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => eventFromDoc(d.id, d.data() as Record<string, unknown>)));
  });
}

export async function addEvent(event: Omit<FamilyEvent, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "events"), {
    ...event,
    startDate: Timestamp.fromDate(event.startDate),
    endDate: Timestamp.fromDate(event.endDate),
    createdAt: Timestamp.fromDate(event.createdAt),
  });
  return ref.id;
}

export async function updateEvent(id: string, event: Partial<FamilyEvent>): Promise<void> {
  const data: Record<string, unknown> = { ...event };
  if (event.startDate) data.startDate = Timestamp.fromDate(event.startDate);
  if (event.endDate) data.endDate = Timestamp.fromDate(event.endDate);
  await updateDoc(doc(db, "events", id), data);
}

export async function deleteEvent(id: string): Promise<void> {
  await deleteDoc(doc(db, "events", id));
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export function subscribeToTasks(cb: (tasks: Task[]) => void) {
  const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => taskFromDoc(d.id, d.data() as Record<string, unknown>)));
  });
}

export async function addTask(task: Omit<Task, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "tasks"), {
    ...task,
    dueDate: task.dueDate ? Timestamp.fromDate(task.dueDate) : null,
    createdAt: Timestamp.fromDate(task.createdAt),
    completedAt: task.completedAt ? Timestamp.fromDate(task.completedAt) : null,
  });
  return ref.id;
}

export async function updateTask(id: string, task: Partial<Task>): Promise<void> {
  const data: Record<string, unknown> = { ...task };
  if (task.dueDate) data.dueDate = Timestamp.fromDate(task.dueDate);
  if (task.completedAt) data.completedAt = Timestamp.fromDate(task.completedAt);
  await updateDoc(doc(db, "tasks", id), data);
}

export async function deleteTask(id: string): Promise<void> {
  await deleteDoc(doc(db, "tasks", id));
}

// ─── Enduro Rides ────────────────────────────────────────────────────────────

export function subscribeToRides(cb: (rides: EnduroRide[]) => void) {
  const q = query(collection(db, "rides"), orderBy("date", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => rideFromDoc(d.id, d.data() as Record<string, unknown>)));
  });
}

export async function addRide(ride: Omit<EnduroRide, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "rides"), {
    ...ride,
    date: Timestamp.fromDate(ride.date),
    createdAt: Timestamp.fromDate(ride.createdAt),
  });
  return ref.id;
}

export async function updateRide(id: string, ride: Partial<EnduroRide>): Promise<void> {
  const data: Record<string, unknown> = { ...ride };
  if (ride.date) data.date = Timestamp.fromDate(ride.date);
  await updateDoc(doc(db, "rides", id), data);
}

export async function deleteRide(id: string): Promise<void> {
  await deleteDoc(doc(db, "rides", id));
}

// ─── Classic Cars ────────────────────────────────────────────────────────────

export function subscribeToCars(cb: (cars: ClassicCar[]) => void) {
  const q = query(collection(db, "cars"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => carFromDoc(d.id, d.data() as Record<string, unknown>)));
  });
}

export async function addCar(car: Omit<ClassicCar, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "cars"), {
    ...car,
    createdAt: Timestamp.fromDate(car.createdAt),
  });
  return ref.id;
}

export async function updateCar(id: string, car: Partial<ClassicCar>): Promise<void> {
  await updateDoc(doc(db, "cars", id), car as Record<string, unknown>);
}

export async function deleteCar(id: string): Promise<void> {
  await deleteDoc(doc(db, "cars", id));
}

export function subscribeToCarServices(
  carId: string,
  cb: (services: CarService[]) => void
) {
  const q = query(
    collection(db, "carServices"),
    where("carId", "==", carId),
    orderBy("date", "desc")
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => serviceFromDoc(d.id, d.data() as Record<string, unknown>)));
  });
}

export async function addCarService(service: Omit<CarService, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "carServices"), {
    ...service,
    date: Timestamp.fromDate(service.date),
    createdAt: Timestamp.fromDate(service.createdAt),
  });
  return ref.id;
}

export async function deleteCarService(id: string): Promise<void> {
  await deleteDoc(doc(db, "carServices", id));
}

// ─── Trips ───────────────────────────────────────────────────────────────────

export function subscribeToTrips(cb: (trips: Trip[]) => void) {
  const q = query(collection(db, "trips"), orderBy("startDate", "asc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => tripFromDoc(d.id, d.data() as Record<string, unknown>)));
  });
}

export async function addTrip(trip: Omit<Trip, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "trips"), {
    ...trip,
    startDate: Timestamp.fromDate(trip.startDate),
    endDate: Timestamp.fromDate(trip.endDate),
    createdAt: Timestamp.fromDate(trip.createdAt),
  });
  return ref.id;
}

export async function updateTrip(id: string, trip: Partial<Trip>): Promise<void> {
  const data: Record<string, unknown> = { ...trip };
  if (trip.startDate) data.startDate = Timestamp.fromDate(trip.startDate);
  if (trip.endDate) data.endDate = Timestamp.fromDate(trip.endDate);
  await updateDoc(doc(db, "trips", id), data);
}

export async function deleteTrip(id: string): Promise<void> {
  await deleteDoc(doc(db, "trips", id));
}

// ─── User Profiles ───────────────────────────────────────────────────────────

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as UserProfile;
}

export async function setUserProfile(
  userId: string,
  profile: Omit<UserProfile, "id">
): Promise<void> {
  await setDoc(doc(db, "users", userId), profile, { merge: true });
}
