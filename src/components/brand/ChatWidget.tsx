"use client";

import { useEffect } from "react";

const ENDPOINT = "https://api.youraiconnector.com/v1";
const CONFIG_ID = "Sp0FoEsSzvA6CAHeWIiB";
const CAMPAIGN_ID = "lT0EYgziGgYokg1tkUXS";
const SILENT_WAV =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

type ChatWidgetConstructor = new (options: {
  configId: string;
  campaign_id: string;
  endpoint: string;
}) => unknown;

declare global {
  interface Window {
    AIChatWidget?: ChatWidgetConstructor;
  }
}

function patchWidgetAudio() {
  if (document.documentElement.dataset.chatAudioPatched === "true") {
    return;
  }
  document.documentElement.dataset.chatAudioPatched = "true";

  const descriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "src");
  if (!descriptor?.set || !descriptor.get) {
    return;
  }

  Object.defineProperty(HTMLMediaElement.prototype, "src", {
    configurable: true,
    enumerable: descriptor.enumerable,
    get() {
      return descriptor.get?.call(this) as string;
    },
    set(value: string) {
      const next =
        typeof value === "string" && value.includes("notification.mp3") ? SILENT_WAV : value;
      descriptor.set?.call(this, next);
    },
  });
}

/** Homepage only — not site-wide. */
export function ChatWidget() {
  useEffect(() => {
    document.body.dataset.allroadsChat = "on";
    patchWidgetAudio();

    if (!document.querySelector("script[data-allroads-chat]")) {
      const script = document.createElement("script");
      script.src = `${ENDPOINT}/scripts/chat-widget.js`;
      script.async = true;
      script.dataset.allroadsChat = "true";
      script.onload = () => {
        if (!window.AIChatWidget) {
          return;
        }
        new window.AIChatWidget({
          configId: CONFIG_ID,
          campaign_id: CAMPAIGN_ID,
          endpoint: ENDPOINT,
        });
      };
      document.body.appendChild(script);
    }

    return () => {
      delete document.body.dataset.allroadsChat;
    };
  }, []);

  return null;
}
