import type { TokenStorage } from "@convex-dev/auth/react";

const AUTH_STORAGE_GENERATION = "2026-08-16-matching-jwks";
const AUTH_STORAGE_GENERATION_KEY = "__allroadsAuthStorageGeneration";

function isPlaceholderRefreshToken(value: string | null | undefined) {
  return value === "dummy" || value == null || value.length === 0 || !value.includes("|");
}

function isRefreshTokenKey(key: string) {
  return key.includes("__convexAuthRefreshToken");
}

export function discardPlaceholderAuthTokens() {
  if (typeof window === "undefined") {
    return;
  }
  if (window.localStorage.getItem(AUTH_STORAGE_GENERATION_KEY) !== AUTH_STORAGE_GENERATION) {
    clearConvexAuthStorage();
    window.localStorage.setItem(AUTH_STORAGE_GENERATION_KEY, AUTH_STORAGE_GENERATION);
    return;
  }
  const keys: string[] = [];
  let hasPlaceholder = false;
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.includes("__convexAuth")) {
      continue;
    }
    keys.push(key);
    if (isRefreshTokenKey(key) && isPlaceholderRefreshToken(window.localStorage.getItem(key))) {
      hasPlaceholder = true;
    }
  }
  if (!hasPlaceholder) {
    return;
  }
  for (const key of keys) {
    window.localStorage.removeItem(key);
  }
}

export function clearConvexAuthStorage() {
  if (typeof window === "undefined") {
    return;
  }
  const keys: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.includes("__convexAuth")) {
      keys.push(key);
    }
  }
  for (const key of keys) {
    window.localStorage.removeItem(key);
  }
}

export function createConvexAuthStorage(): TokenStorage {
  return {
    getItem(key) {
      const value = window.localStorage.getItem(key);
      if (isRefreshTokenKey(key) && isPlaceholderRefreshToken(value)) {
        if (value !== null) {
          window.localStorage.removeItem(key);
        }
        return null;
      }
      return value;
    },
    setItem(key, value) {
      if (isRefreshTokenKey(key) && isPlaceholderRefreshToken(value)) {
        window.localStorage.removeItem(key);
        return;
      }
      window.localStorage.setItem(key, value);
    },
    removeItem(key) {
      window.localStorage.removeItem(key);
    },
  };
}
