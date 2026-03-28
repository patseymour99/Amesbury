import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isTomorrow, isYesterday, formatDistanceToNow } from "date-fns";
import type { UserRole, EventCategory, TaskPriority } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEE, d MMM");
}

export function formatDateFull(date: Date): string {
  return format(date, "EEEE, d MMMM yyyy");
}

export function formatTime(date: Date): string {
  return format(date, "h:mm a");
}

export function formatDateRange(start: Date, end: Date): string {
  if (format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd")) {
    return `${format(start, "d MMM")} · ${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;
  }
  return `${format(start, "d MMM")} - ${format(end, "d MMM yyyy")}`;
}

export function timeAgo(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

export function getUserColor(role: UserRole): string {
  return role === "mum" ? "#d946ef" : "#0ea5e9";
}

export function getUserGradient(role: UserRole): string {
  return role === "mum"
    ? "from-mum-500 to-purple-500"
    : "from-dad-500 to-cyan-500";
}

export function getUserBg(role: UserRole): string {
  return role === "mum" ? "bg-mum-50" : "bg-dad-50";
}

export function getUserBorder(role: UserRole): string {
  return role === "mum" ? "border-mum-200" : "border-dad-200";
}

export function getUserText(role: UserRole): string {
  return role === "mum" ? "text-mum-600" : "text-dad-600";
}

export function getCategoryColor(category: EventCategory): string {
  const colors: Record<EventCategory, string> = {
    personal: "#6366f1",
    travel: "#f59e0b",
    social: "#10b981",
    hobby: "#f97316",
    family: "#ec4899",
    medical: "#ef4444",
    work: "#8b5cf6",
  };
  return colors[category] || "#6b7280";
}

export function getCategoryLabel(category: EventCategory): string {
  const labels: Record<EventCategory, string> = {
    personal: "Personal",
    travel: "Travel",
    social: "Social",
    hobby: "Hobby",
    family: "Family",
    medical: "Medical",
    work: "Work",
  };
  return labels[category] || category;
}

export function getPriorityColor(priority: TaskPriority): string {
  const colors: Record<TaskPriority, string> = {
    low: "text-emerald-600 bg-emerald-50",
    medium: "text-amber-600 bg-amber-50",
    high: "text-red-600 bg-red-50",
  };
  return colors[priority];
}

export function getDaysUntil(date: Date): number {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}
