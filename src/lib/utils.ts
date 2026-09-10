import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amount: number | string) {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return `৳${n.toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
}

export const formatCurrency = formatMoney;

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function sumBy<T>(items: T[], key: keyof T): number {
  return items.reduce((total, item) => total + Number(item[key] ?? 0), 0);
}
