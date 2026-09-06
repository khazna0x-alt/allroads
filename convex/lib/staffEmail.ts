const DEFAULT_STAFF_INBOX = "contact@allroads.om";
const DEFAULT_FROM = "All Roads <beth.t@example.com>";
const RESEND_API = "https://api.resend.com/emails";

/**
 * Relays a staff alert through Resend.
 *
 * Email always needs a From header, but All Roads does not need a sending
 * mailbox. With only RESEND_API_KEY set, mail goes out as
 * `All Roads <beth.t@example.com>` to contact@allroads.om.
 *
 * Until allroads.om is verified in Resend, Resend only delivers to the
 * address used to create the Resend account — sign up with the inbox that
 * should receive these alerts.
 *
 * Optional env:
 * - STAFF_NOTIFY_EMAIL — destination (defaults to contact@allroads.om)
 * - RESEND_FROM_EMAIL — From header after a domain is verified
 */
export async function sendStaffEmail(args: {
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.log("[STAFF NOTIFY] Email skipped: RESEND_API_KEY is not set");
    return false;
  }

  const to = process.env.STAFF_NOTIFY_EMAIL?.trim() || DEFAULT_STAFF_INBOX;
  const from = process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM;
  const payload: {
    from: string;
    to: string[];
    subject: string;
    text: string;
    reply_to?: string;
  } = {
    from,
    to: [to],
    subject: args.subject,
    text: args.text,
  };
  if (args.replyTo) {
    payload.reply_to = args.replyTo;
  }

  try {
    const response = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error("Staff email failed", response.status, detail);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Staff email error", error);
    return false;
  }
}

export function staffEmailLines(
  rows: Array<[string, string | number | boolean | undefined | null]>,
): string {
  return rows
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([label, value]) => `${label}: ${String(value)}`)
    .join("\n");
}
