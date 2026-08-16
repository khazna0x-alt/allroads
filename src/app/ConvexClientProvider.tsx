"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = new ConvexReactClient(convexUrl ?? "");

const AUTH_STORAGE_PREFIXES = [
  "__convexAuthRefreshToken",
  "__convexAuthJWT",
  "__convexAuthServerStateFetchTime",
  "__convexAuthOAuthVerifier",
];

function discardPlaceholderAuthTokens() {
  if (typeof window === "undefined") {
    return;
  }
  const refreshKeys: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith("__convexAuthRefreshToken")) {
      refreshKeys.push(key);
    }
  }
  const hasPlaceholder = refreshKeys.some((key) => {
    const value = window.localStorage.getItem(key);
    return value === "dummy" || value === null || !value.includes("|");
  });
  if (!hasPlaceholder) {
    return;
  }
  const keysToRemove: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key && AUTH_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      keysToRemove.push(key);
    }
  }
  for (const key of keysToRemove) {
    window.localStorage.removeItem(key);
  }
}

discardPlaceholderAuthTokens();

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>;
}
