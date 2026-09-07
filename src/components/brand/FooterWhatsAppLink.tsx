"use client";

import { useTranslations } from "next-intl";
import { WhatsAppIcon } from "./WhatsAppButton";
import { useWhatsAppChatUrl } from "@/lib/useWhatsAppChat";

export function FooterWhatsAppLink() {
  const nav = useTranslations("Nav");
  const href = useWhatsAppChatUrl();

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={nav("whatsapp")}
      className="inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--ivory-dim)] transition-colors hover:border-[var(--crimson)] hover:bg-[var(--crimson)] hover:text-white"
    >
      <WhatsAppIcon />
      <span className="sr-only">{nav("whatsapp")}</span>
    </a>
  );
}
