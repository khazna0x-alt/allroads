export const MAX_CONTRACT_BYTES = 15 * 1024 * 1024;

export function isAllowedContractFile(file: File): boolean {
  const type = file.type.toLowerCase();
  if (
    type === "application/pdf" ||
    type === "image/jpeg" ||
    type === "image/png" ||
    type === "image/webp" ||
    type === "image/heic" ||
    type === "image/heif"
  ) {
    return true;
  }
  return /\.(pdf|jpe?g|png|webp|heic|heif)$/i.test(file.name);
}

export function contentTypeForFile(file: File): string {
  if (file.type) {
    return file.type;
  }
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) {
    return "application/pdf";
  }
  if (name.endsWith(".png")) {
    return "image/png";
  }
  if (name.endsWith(".webp")) {
    return "image/webp";
  }
  if (name.endsWith(".heic")) {
    return "image/heic";
  }
  if (name.endsWith(".heif")) {
    return "image/heif";
  }
  return "image/jpeg";
}
