export const SITE_SETTINGS_KEY = "site";
export const DEFAULT_WHATSAPP_LOCAL = "97544534";

export function whatsappChatUrl(localPhone: string): string {
  return `https://api.whatsapp.com/send?phone=968${localPhone}`;
}

export function whatsappDisplay(localPhone: string): string {
  return `+968 ${localPhone}`;
}
