import { ConvexError } from "convex/values";

export function convexErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ConvexError) {
    const data = err.data;
    if (typeof data === "string" && data.trim()) {
      return data;
    }
    if (
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof data.message === "string" &&
      data.message.trim()
    ) {
      return data.message;
    }
  }
  if (err instanceof Error) {
    const convex = /ConvexError:\s*([^\n]+)/.exec(err.message);
    if (convex?.[1]) {
      return convex[1].trim();
    }
  }
  return fallback;
}
