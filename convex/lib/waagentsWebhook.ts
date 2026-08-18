export type WaAgentsWebhookPayload = {
  name: string;
  phone: string;
  email?: string;
  subject?: string;
  message?: string;
  stockCode?: string;
  vehicleId?: string;
  locale: "ar" | "en";
  preferredContact?: "phone" | "whatsapp" | "email";
  viewingRequested: boolean;
  inquiryType?: string;
  contactTime?: string;
  handoffReason?: string;
  isHandoff: boolean;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function readString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value !== "string") {
      continue;
    }
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return undefined;
}

function readBoolean(record: Record<string, unknown>, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") {
      return value;
    }
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }
  }
  return undefined;
}

export function secretsEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

export function readWebhookSecret(request: Request): string | null {
  const bearer = request.headers.get("authorization");
  if (bearer?.toLowerCase().startsWith("bearer ")) {
    const token = bearer.slice(7).trim();
    if (token.length > 0) {
      return token;
    }
  }
  const headerSecret =
    request.headers.get("x-webhook-secret")?.trim() ||
    request.headers.get("x-waagents-secret")?.trim();
  return headerSecret && headerSecret.length > 0 ? headerSecret : null;
}

export function parseWaAgentsWebhook(body: unknown):
  | { ok: true; payload: WaAgentsWebhookPayload }
  | { ok: false; error: string } {
  const record = asRecord(body);
  if (!record) {
    return { ok: false, error: "JSON object body required" };
  }

  const name = readString(record, ["name", "customerName", "customer_name"]);
  const phone = readString(record, ["phone", "mobile", "customerPhone", "customer_phone"]);
  if (!name || name.length < 2) {
    return { ok: false, error: "name is required" };
  }
  if (!phone) {
    return { ok: false, error: "phone is required" };
  }

  const localeRaw = readString(record, ["locale", "lang", "language"]);
  const locale = localeRaw === "en" ? "en" : "ar";
  const preferredRaw = readString(record, ["preferredContact", "preferred_contact"]);
  const preferredContact =
    preferredRaw === "email" || preferredRaw === "whatsapp" || preferredRaw === "phone"
      ? preferredRaw
      : undefined;

  return {
    ok: true,
    payload: {
      name,
      phone,
      email: readString(record, ["email"]),
      subject: readString(record, ["subject", "title"]),
      message: readString(record, ["message", "notes", "text"]),
      stockCode: readString(record, ["stockCode", "stock_code", "stock"]),
      vehicleId: readString(record, ["vehicleId", "vehicle_id"]),
      locale,
      preferredContact,
      viewingRequested: readBoolean(record, ["viewingRequested", "viewing_requested"]) === true,
      inquiryType: readString(record, ["inquiryType", "inquiry_type", "intent"]),
      contactTime: readString(record, ["contactTime", "contact_time", "preferredTime"]),
      handoffReason: readString(record, ["handoffReason", "handoff_reason", "escalationReason"]),
      isHandoff:
        readBoolean(record, ["isHandoff", "is_handoff", "handoff", "escalate"]) === true ||
        Boolean(readString(record, ["handoffReason", "handoff_reason", "escalationReason"])),
    },
  };
}

export function buildWaAgentsMessage(payload: WaAgentsWebhookPayload): string {
  const lines: string[] = [];
  if (payload.isHandoff) {
    lines.push(`Handoff: ${payload.handoffReason ?? "unspecified"}`);
  }
  if (payload.inquiryType) {
    lines.push(`Inquiry type: ${payload.inquiryType}`);
  }
  if (payload.contactTime) {
    lines.push(`Contact time: ${payload.contactTime}`);
  }
  if (payload.stockCode) {
    lines.push(`Stock: ${payload.stockCode}`);
  }
  if (payload.message) {
    lines.push(payload.message);
  }
  const text = lines.join("\n");
  return text.length >= 4 ? text : "Website chat inquiry";
}

export function buildWaAgentsSubject(payload: WaAgentsWebhookPayload): string {
  if (payload.subject) {
    return payload.subject;
  }
  const stock = payload.stockCode ? ` · ${payload.stockCode}` : "";
  if (payload.isHandoff) {
    return `Bot handoff${stock}`;
  }
  if (payload.inquiryType) {
    return `${payload.inquiryType}${stock}`;
  }
  return `Website chat${stock}`;
}
