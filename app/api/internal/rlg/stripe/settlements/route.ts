import Stripe from "stripe";

import {
  cleanUuid,
  getRlgStripeTestClient,
  isAuthorizedRlgStripeInternalRequest,
  prepareQualifiedLeadSettlement,
  recordStripeSettlementRequestFailure,
  recordStripeSettlementSubmission,
} from "@/lib/rlgStripeServer";

export const runtime = "nodejs";

const FORBIDDEN_FINANCIAL_FIELDS = [
  "amount",
  "amount_cents",
  "currency",
  "customer",
  "payment_method",
  "stripe_customer_id",
  "stripe_payment_method_id",
  "commission",
  "rlg_commission_cents",
  "driver_reward_cents",
  "idempotency_key",
] as const;

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

function asRecord(
  value: unknown
): Record<string, unknown> | null {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as Record<
    string,
    unknown
  >;
}

function stripePaymentIntentFromError(
  error: unknown
): Stripe.PaymentIntent | null {
  const root = asRecord(error);

  if (!root) return null;

  const raw = asRecord(root.raw);

  const candidate =
    root.payment_intent ??
    raw?.payment_intent;

  const record =
    asRecord(candidate);

  if (
    !record ||
    record.object !==
      "payment_intent" ||
    typeof record.id !== "string"
  ) {
    return null;
  }

  return candidate as Stripe.PaymentIntent;
}

function stripeErrorDetails(
  error: unknown
) {
  const root = asRecord(error);
  const raw =
    asRecord(root?.raw);

  const codeCandidate =
    root?.code ??
    raw?.code ??
    root?.type ??
    raw?.type;

  const messageCandidate =
    root?.message ??
    raw?.message;

  return {
    code:
      typeof codeCandidate === "string"
        ? codeCandidate.slice(0, 160)
        : "stripe_request_error",
    message:
      typeof messageCandidate === "string"
        ? messageCandidate.slice(0, 800)
        : "Stripe request failed.",
  };
}

export async function POST(
  request: Request
) {
  let authorized = false;

  try {
    authorized =
      isAuthorizedRlgStripeInternalRequest(
        request
      );
  } catch (error) {
    console.error(
      "[rlg-stripe:internal-config]",
      error
    );

    return jsonError(
      "Stripe execution is not configured.",
      503
    );
  }

  if (!authorized) {
    return jsonError(
      "Unauthorized.",
      401
    );
  }

  const body = await request
    .json()
    .catch(() => null);

  const record = asRecord(body);

  if (!record) {
    return jsonError(
      "Invalid JSON body.",
      400
    );
  }

  for (
    const field
    of FORBIDDEN_FINANCIAL_FIELDS
  ) {
    if (
      Object.prototype.hasOwnProperty.call(
        record,
        field
      )
    ) {
      return jsonError(
        `Financial field is server-controlled: ${field}`,
        400
      );
    }
  }

  const transactionId =
    cleanUuid(
      record.transaction_id
    );

  if (!transactionId) {
    return jsonError(
      "A valid transaction_id is required.",
      400
    );
  }

  let prepared;

  try {
    prepared =
      await prepareQualifiedLeadSettlement(
        transactionId
      );
  } catch (error) {
    console.error(
      "[rlg-stripe:prepare]",
      error
    );

    return jsonError(
      "Settlement is not eligible for Stripe execution.",
      409
    );
  }

  if (prepared.livemode) {
    return jsonError(
      "Live settlements are disabled.",
      409
    );
  }

  let stripe: Stripe;

  try {
    stripe =
      getRlgStripeTestClient();
  } catch (error) {
    console.error(
      "[rlg-stripe:test-config]",
      error
    );

    return jsonError(
      "Stripe test execution is not configured.",
      503
    );
  }

  let paymentIntent: Stripe.PaymentIntent;

  try {
    paymentIntent =
      await stripe.paymentIntents.create(
        {
          amount:
            prepared.amount_cents,
          currency:
            prepared.currency,
          customer:
            prepared.stripe_customer_id,
          payment_method:
            prepared.stripe_payment_method_id,
          confirm: true,
          off_session: true,
          metadata: {
            rlg_settlement_id:
              prepared.settlement_id,
            rlg_transaction_id:
              prepared.transaction_id,
            rlg_settlement_type:
              "qualified_lead_charge",
          },
        },
        {
          idempotencyKey:
            prepared.idempotency_key,
        }
      );
  } catch (error) {
    const details =
      stripeErrorDetails(error);

    const failedPaymentIntent =
      stripePaymentIntentFromError(
        error
      );

    if (failedPaymentIntent) {
      try {
        await recordStripeSettlementSubmission(
          prepared.settlement_id,
          failedPaymentIntent.id,
          failedPaymentIntent.status
        );
      } catch (recordError) {
        console.error(
          "[rlg-stripe:record-error-payment-intent]",
          failedPaymentIntent.id,
          recordError
        );
      }

      return Response.json(
        {
          ok: false,
          error:
            "Stripe payment attempt requires attention.",
          settlement_id:
            prepared.settlement_id,
          transaction_id:
            prepared.transaction_id,
          payment_intent_id:
            failedPaymentIntent.id,
          provider_status:
            failedPaymentIntent.status,
          awaiting_webhook: true,
        },
        {
          status: 409,
        }
      );
    }

    try {
      await recordStripeSettlementRequestFailure(
        prepared.settlement_id,
        details.code,
        details.message
      );
    } catch (recordError) {
      console.error(
        "[rlg-stripe:record-request-failure]",
        recordError
      );
    }

    console.error(
      "[rlg-stripe:payment-intent-request]",
      details.code
    );

    return jsonError(
      "Stripe request failed.",
      502
    );
  }

  if (paymentIntent.livemode) {
    console.error(
      "[rlg-stripe:unexpected-live-payment-intent]",
      paymentIntent.id
    );

    return jsonError(
      "Live Stripe execution is disabled.",
      502
    );
  }

  try {
    await recordStripeSettlementSubmission(
      prepared.settlement_id,
      paymentIntent.id,
      paymentIntent.status
    );
  } catch (error) {
    console.error(
      "[rlg-stripe:record-submission]",
      paymentIntent.id,
      error
    );

    return Response.json(
      {
        ok: false,
        error:
          "Stripe accepted the payment attempt, but RLG could not persist its provider state.",
        settlement_id:
          prepared.settlement_id,
        transaction_id:
          prepared.transaction_id,
        payment_intent_id:
          paymentIntent.id,
        provider_status:
          paymentIntent.status,
        awaiting_webhook: true,
        retry_safe: true,
      },
      {
        status: 503,
      }
    );
  }

  return Response.json(
    {
      ok: true,
      settlement_id:
        prepared.settlement_id,
      transaction_id:
        prepared.transaction_id,
      payment_intent_id:
        paymentIntent.id,
      provider_status:
        paymentIntent.status,
      replayed:
        prepared.replayed,
      awaiting_webhook: true,
    },
    {
      status: 202,
    }
  );
}
