"use client";

import { WhatsAppButton } from "./WhatsAppButton";
import { useWhatsAppChatUrl } from "@/lib/useWhatsAppChat";

export function SiteWhatsAppButton({
  ariaLabel,
  className,
}: {
  ariaLabel: string;
  className?: string;
}) {
  const href = useWhatsAppChatUrl();
  return <WhatsAppButton href={href} ariaLabel={ariaLabel} className={className} />;
}
