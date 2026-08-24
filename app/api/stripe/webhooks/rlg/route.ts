import { createHash } from "node:crypto";
import Stripe from "stripe";

import {
  applyStripeSettlementWebhook,
  cleanUuid,
  getRlgStripeTestClient,
  getRlgStripeWebhookSecret,
} from "@/lib/rlgStripeServer";

export const runtime = "nodejs";

const SUPPORTED_EVENT_TYPES =
  new Set<string>([
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
    "payment_intent.processing",
    "payment_intent.requires_action",
    "payment_intent.canceled",
  ]);

function jsonError(
  message: string,
  status: number
) {
  return Response.json(
    {
      ok: false,
      error: message,
    },
    {
      status,
    }
  );
}

function expandableId(
  value:
    | string
    | { id: string }
    | null
    | undefined
): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (
    value &&
    typeof value.id === "string"
  ) {
    return value.id;
  }

  return null;
}

export async function POST(
  request: Request
) {
  const signature =
    request.headers.get(
      "stripe-signature"
    );

  if (!signature) {
    return jsonError(
      "Missing Stripe signature.",
      400
    );
  }

  const rawBody =
    await request.text();

  let stripe: Stripe;
  let webhookSecret: string;

  try {
    stripe =
      getRlgStripeTestClient();

    webhookSecret =
      getRlgStripeWebhookSecret();
  } catch (error) {
    console.error(
      "[rlg-stripe:webhook-config]",
      error
    );

    return jsonError(
      "Stripe webhook is not configured.",
      503
    );
  }

  let event: Stripe.Event;

  try {
    event =
      stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
  } catch {
    return jsonError(
      "Invalid Stripe signature.",
      400
    );
  }

  if (event.livemode) {
    console.error(
      "[rlg-stripe:webhook-live-event]",
      event.id
    );

    return jsonError(
      "Live Stripe events are disabled.",
      400
    );
  }

  if (
    !SUPPORTED_EVENT_TYPES.has(
      event.type
    )
  ) {
    return Response.json({
      ok: true,
      ignored: true,
      event_id: event.id,
      event_type: event.type,
    });
  }

  const object =
    event.data.object;

  if (
    !object ||
    typeof object !== "object" ||
    !("object" in object) ||
    object.object !==
      "payment_intent" ||
    !("id" in object) ||
    typeof object.id !== "string"
  ) {
    return jsonError(
      "Invalid PaymentIntent event payload.",
      400
    );
  }

  const paymentIntent =
    object as Stripe.PaymentIntent;

  const settlementId =
    cleanUuid(
      paymentIntent.metadata
        .rlg_settlement_id
    );

  const transactionId =
    cleanUuid(
      paymentIntent.metadata
        .rlg_transaction_id
    );

  const chargeId =
    expandableId(
      paymentIntent.latest_charge
    ) ??
    (
      typeof paymentIntent
        .last_payment_error
        ?.charge === "string"
        ? paymentIntent
            .last_payment_error
            .charge
        : null
    );

  const failureCode =
    paymentIntent
      .last_payment_error
      ?.code ??
    paymentIntent
      .last_payment_error
      ?.decline_code ??
    paymentIntent
      .last_payment_error
      ?.type ??
    null;

  const failureMessage =
    paymentIntent
      .last_payment_error
      ?.message ??
    null;

  const payloadSha256 =
    createHash("sha256")
      .update(rawBody, "utf8")
      .digest("hex");

  try {
    const result =
      await applyStripeSettlementWebhook(
        {
          stripeEventId:
            event.id,
          eventType:
            event.type,
          stripeObjectId:
            paymentIntent.id,
          livemode:
            event.livemode,
          payloadSha256,
          settlementId,
          transactionId,
          paymentIntentId:
            paymentIntent.id,
          chargeId,
          providerStatus:
            paymentIntent.status,
          failureCode,
          failureMessage,
        }
      );

    return Response.json({
      ok: true,
      event_id:
        result.webhook_event_id,
      processing_status:
        result.processing_status,
      settlement_id:
        result.settlement_id,
      transaction_id:
        result.transaction_id,
      decision_code:
        result.decision_code,
      replayed:
        result.replayed,
    });
  } catch (error) {
    console.error(
      "[rlg-stripe:webhook-rpc]",
      event.id,
      error
    );

    // Return 5xx so Stripe retries the
    // already signature-verified event.
    return jsonError(
      "Stripe webhook processing failed.",
      500
    );
  }
}
