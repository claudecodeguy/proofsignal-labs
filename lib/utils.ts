import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function confidenceBand(score: number): "high" | "medium" | "low" {
  if (score >= 90) return "high";
  if (score >= 75) return "medium";
  return "low";
}

export function confidenceBandLabel(score: number): string {
  if (score >= 90) return "High";
  if (score >= 75) return "Moderate";
  return "Low";
}

export function confidenceColor(score: number): string {
  if (score >= 90) return "#1A6B45";
  if (score >= 75) return "#B07A10";
  return "#8B1E2F";
}

export function statusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case "approved": return "badge-approved";
    case "borderline": return "badge-borderline";
    case "rejected": return "badge-rejected";
    default: return "badge-neutral";
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}
