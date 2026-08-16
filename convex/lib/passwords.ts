const PASSWORD_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

export function generatePassword(length = 12): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => {
    const index = byte % PASSWORD_CHARS.length;
    return PASSWORD_CHARS[index] ?? "A";
  }).join("");
}
