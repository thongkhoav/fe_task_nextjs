import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const timeBeforeDeadline = 30 * 60 * 1000; // 30 minutes in milliseconds
