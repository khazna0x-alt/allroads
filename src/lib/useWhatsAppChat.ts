"use client";

import { useQuery } from "convex/react";
import { api } from "@/lib/convex";
import { brand } from "@/lib/brand";

export function useWhatsAppChatUrl(): string {
  const contact = useQuery(api.site.getContact);
  return contact?.whatsappHref ?? brand.whatsapp;
}
