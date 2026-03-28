export type UserRole = "mum" | "dad";

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  avatar?: string;
  color: string;
}

export interface FamilyEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  userId: string;
  userRole: UserRole;
  category: EventCategory;
  location?: string;
  isTravel: boolean;
  color: string;
  createdAt: Date;
}

export type EventCategory =
  | "personal"
  | "travel"
  | "social"
  | "hobby"
  | "family"
  | "medical"
  | "work";

export interface Task {
  id: string;
  title: string;
  description?: string;
  userId: string;
  userRole: UserRole;
  dueDate?: Date;
  priority: TaskPriority;
  completed: boolean;
  type: "daily" | "weekly";
  category?: string;
  createdAt: Date;
  completedAt?: Date;
}

export type TaskPriority = "low" | "medium" | "high";

export interface EnduroRide {
  id: string;
  date: Date;
  location: string;
  trailName?: string;
  distance?: number;
  duration?: number;
  difficulty: "easy" | "moderate" | "hard" | "extreme";
  notes?: string;
  weather?: string;
  companions?: string[];
  createdAt: Date;
}

export interface ClassicCar {
  id: string;
  name: string;
  year: number;
  make: string;
  model: string;
  color?: string;
  registrationPlate?: string;
  notes?: string;
  status: "running" | "project" | "restoration" | "show";
  imageUrl?: string;
  createdAt: Date;
}

export interface CarService {
  id: string;
  carId: string;
  date: Date;
  description: string;
  type:
    | "service"
    | "repair"
    | "restoration"
    | "inspection"
    | "purchase"
    | "other";
  cost?: number;
  mileage?: number;
  garage?: string;
  notes?: string;
  createdAt: Date;
}

export interface Trip {
  id: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  traveler: "mum" | "dad" | "both";
  description?: string;
  accommodation?: string;
  flightDetails?: string;
  packingList: PackingItem[];
  notes?: string;
  status: "planning" | "booked" | "upcoming" | "completed";
  createdAt: Date;
}

export interface PackingItem {
  id: string;
  item: string;
  packed: boolean;
  category?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  userId?: string;
}

export interface AIBriefing {
  greeting: string;
  summary: string;
  mumHighlights: string[];
  dadHighlights: string[];
  sharedNotes: string;
  generatedAt: Date;
}
