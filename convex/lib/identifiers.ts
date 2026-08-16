export function normalizeIdentifier(raw: string): {
  accountId: string;
  email?: string;
  phone?: string;
} {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new Error("Enter an email or Omani phone number");
  }

  if (trimmed.includes("@")) {
    const email = trimmed.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Enter a valid email address");
    }
    return { accountId: email, email };
  }

  const phone = normalizeOmaniPhone(trimmed);
  return { accountId: phone, phone };
}

export function displayStaffIdentifier(email?: string, phone?: string): string {
  const raw = (email ?? phone ?? "").trim();
  return stripOmaniCallingCode(raw);
}

export function stripOmaniCallingCode(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("+968")) {
    return trimmed.slice(4);
  }
  if (/^968\d{8}$/.test(trimmed)) {
    return trimmed.slice(3);
  }
  return trimmed;
}

export function normalizeOmaniPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  let local = digits;

  if (local.startsWith("00968")) {
    local = local.slice(5);
  } else if (local.startsWith("968") && local.length === 11) {
    local = local.slice(3);
  }

  if (local.length !== 8 || !/^[29]/.test(local)) {
    throw new Error("Enter a valid Omani phone number");
  }

  return local;
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

export function buildSearchText(parts: Array<string | undefined>): string {
  return parts
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ")
    .toLowerCase();
}
