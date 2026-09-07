"use client";

import { useMutation } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, type Id } from "@/lib/convex";

export type FormChallenge = {
  challengeId: Id<"formChallenges">;
  a: number;
  b: number;
};

export function useFormChallenge() {
  const issue = useMutation(api.challenges.issue);
  const [challenge, setChallenge] = useState<FormChallenge | null>(null);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) {
      return;
    }
    inFlight.current = true;
    try {
      const next = await issue({});
      setChallenge(next);
      return next;
    } finally {
      inFlight.current = false;
    }
  }, [issue]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { challenge, refresh };
}
