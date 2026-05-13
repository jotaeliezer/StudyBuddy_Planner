import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Prefer `crypto.randomUUID()`; fallback for non-secure contexts or older runtimes. */
export function createId(): string {
  try {
    const g = globalThis as Record<string, unknown>;
    const c = g.crypto as { randomUUID?: () => string } | undefined;
    if (c?.randomUUID) return c.randomUUID();
  } catch {
    /* ignore */
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
