import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import {
  buildWaAgentsMessage,
  buildWaAgentsSubject,
  parseWaAgentsWebhook,
  readWebhookSecret,
  secretsEqual,
} from "./lib/waagentsWebhook";

const http = httpRouter();

auth.addHttpRoutes(http);

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function clientErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return "Invalid request";
}

/**
 * Wa-Agents / chat widget handoff endpoint.
 *
 * NLP escalation rules (human request, contracts, payments, refunds, price
 * negotiation, complaints, unknown answers) live in the Wa-Agents dashboard.
 * This route only accepts a signed payload and opens a staff inquiry.
 *
 * POST {CONVEX_SITE_URL}/webhooks/waagents
 * Header: Authorization: Bearer $WAAGENTS_WEBHOOK_SECRET
 *      or X-Webhook-Secret: $WAAGENTS_WEBHOOK_SECRET
 *
 * Never put WAAGENTS_WEBHOOK_SECRET in the frontend. The widget/dashboard
 * must POST from Wa-Agents servers. Inventory answers must come from the
 * published-only GET /api/inventory feed — do not invent a second source.
 */
const waAgentsWebhook = httpAction(async (ctx, request) => {
  const expected = process.env.WAAGENTS_WEBHOOK_SECRET;
  if (!expected) {
    console.error("WAAGENTS_WEBHOOK_SECRET is not set");
    return jsonResponse({ error: "Webhook is not configured" }, 503);
  }

  const provided = readWebhookSecret(request);
  if (!provided || !secretsEqual(provided, expected)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonResponse({ error: "JSON body required" }, 400);
  }

  const parsed = parseWaAgentsWebhook(raw);
  if (!parsed.ok) {
    return jsonResponse({ error: parsed.error }, 400);
  }

  try {
    const result: { inquiryId: string } = await ctx.runMutation(
      internal.inquiries.createFromWaAgents,
      {
        name: parsed.payload.name,
        phone: parsed.payload.phone,
        ...(parsed.payload.email ? { email: parsed.payload.email } : {}),
        subject: buildWaAgentsSubject(parsed.payload),
        message: buildWaAgentsMessage(parsed.payload),
        ...(parsed.payload.stockCode ? { stockCode: parsed.payload.stockCode } : {}),
        ...(parsed.payload.vehicleId ? { vehicleId: parsed.payload.vehicleId } : {}),
        locale: parsed.payload.locale,
        ...(parsed.payload.preferredContact
          ? { preferredContact: parsed.payload.preferredContact }
          : {}),
        viewingRequested: parsed.payload.viewingRequested,
        ...(parsed.payload.isHandoff || parsed.payload.handoffReason
          ? { handoffReason: parsed.payload.handoffReason ?? "unspecified" }
          : {}),
      },
    );
    return jsonResponse({ ok: true, inquiryId: result.inquiryId }, 200);
  } catch (error) {
    console.error("Wa-Agents webhook failed", error);
    return jsonResponse({ error: clientErrorMessage(error) }, 400);
  }
});

http.route({
  path: "/webhooks/waagents",
  method: "POST",
  handler: waAgentsWebhook,
});

export default http;
