"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { useMemo, type ReactNode } from "react";
import { createConvexAuthStorage, discardPlaceholderAuthTokens } from "@/lib/convexAuthStorage";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = new ConvexReactClient(convexUrl ?? "");

discardPlaceholderAuthTokens();

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const storage = useMemo(() => createConvexAuthStorage(), []);
  return (
    <ConvexAuthProvider client={convex} storage={storage} shouldHandleCode={false}>
      {children}
    </ConvexAuthProvider>
  );
}
