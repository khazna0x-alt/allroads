"use client";

import { useEffect } from "react";

/** WhatsApp launcher. Handoffs POST to Convex `/webhooks/waagents` from Wa-Agents servers — never put WAAGENTS_WEBHOOK_SECRET in this widget. */
export function WaAgentsSlot() {
  const widgetId = process.env.NEXT_PUBLIC_WAAGENTS_WIDGET_ID;

  useEffect(() => {
    if (!widgetId) {
      return;
    }
    const existing = document.querySelector("script[data-allroads-waagents]");
    if (existing) {
      return;
    }
    const script = document.createElement("script");
    script.src = "https://app.waagents.ai/widget.js";
    script.async = true;
    script.dataset.allroadsWaagents = "true";
    script.dataset.widgetId = widgetId;
    document.body.appendChild(script);
  }, [widgetId]);

  return null;
}
