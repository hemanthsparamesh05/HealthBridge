import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Indian Rupees — whole rupees for claims. */
export function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Compact totals for KPIs (e.g. ₹2.1 Cr). */
export function formatCurrencyCompact(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1e7) {
    return `₹${(n / 1e7).toFixed(1)} Cr`;
  }
  if (abs >= 1e5) {
    return `₹${(n / 1e5).toFixed(1)} L`;
  }
  return formatCurrency(n);
}

function normalizeIsoTimestamp(value: string) {
  return value.replace(
    /T(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?(Z|[+-]\d{2}:\d{2})?$/,
    (_, hour, minute, second = "00", zone = "Z") =>
      `T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:${second.padStart(2, "0")}${zone}`,
  );
}

function parseDate(d: string | Date) {
  if (d instanceof Date) return d;

  const normalized = normalizeIsoTimestamp(d.trim());
  const date = new Date(normalized);
  return isNaN(date.getTime()) ? new Date(d) : date;
}

export function formatDate(d: string | Date) {
  const date = parseDate(d);
  if (isNaN(date.getTime())) {
    return String(d);
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
