import "server-only";

import { timingSafeEqual } from "node:crypto";
import Stripe from "stripe";

type RpcRow = Record<string, unknown>;

type RlgRpcName =
  | "rlg_prepare_qualified_lead_settlement"
  | "rlg_record_stripe_settlement_submission"
  | "rlg_record_stripe_settlement_request_failure"
  | "rlg_apply_stripe_settlement_webhook";

export type PreparedRlgSettlement = {
  settlement_id: string;
  transaction_id: string;
  settlement_status: string;
  amount_cents: number;
  currency: string;
  stripe_customer_id: string;
  stripe_payment_method_id: string;
  livemode: boolean;
  idempotency_key: string;
  replayed: boolean;
};

export type RlgWebhookApplyResult = {
  webhook_event_id: string;
  processing_status: string;
  settlement_id: string | null;
  transaction_id: string | null;
  decision_code: string | null;
  replayed: boolean;
};

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getSupabaseConfig() {
  const url = requiredEnv("SUPABASE_URL").replace(/\/$/, "");
  const serviceRoleKey = requiredEnv(
    "SUPABASE_SERVICE_ROLE_KEY"
  );

  return {
    url,
    serviceRoleKey,
  };
}

async function callRlgRpc<T extends RpcRow>(
  rpcName: RlgRpcName,
  body: Record<string, unknown>
): Promise<T[]> {
  const { url, serviceRoleKey } = getSupabaseConfig();

  const response = await fetch(
    `${url}/rest/v1/rpc/${rpcName}`,
    {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    console.error(
      `[rlg-stripe:rpc:${rpcName}]`,
      response.status
    );

    throw new Error(
      `RLG settlement RPC failed: ${rpcName}`
    );
  }

  const payload = (await response.json()) as unknown;

  if (!Array.isArray(payload)) {
    throw new Error(
      `RLG settlement RPC returned an invalid payload: ${rpcName}`
    );
  }

  return payload as T[];
}

function requiredString(
  row: RpcRow,
  key: string
): string {
  const value = row[key];

  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `Invalid settlement field: ${key}`
    );
  }

  return value.trim();
}

function requiredBoolean(
  row: RpcRow,
  key: string
): boolean {
  const value = row[key];

  if (typeof value !== "boolean") {
    throw new Error(
      `Invalid settlement field: ${key}`
    );
  }

  return value;
}

function requiredUuid(
  row: RpcRow,
  key: string
): string {
  const value = requiredString(row, key);

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  ) {
    throw new Error(
      `Invalid UUID settlement field: ${key}`
    );
  }

  return value;
}

function requiredAmountCents(
  row: RpcRow
): number {
  const raw = row.amount_cents;

  const amount =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number(raw)
        : Number.NaN;

  if (
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    amount > 99_999_999
  ) {
    throw new Error(
      "Invalid settlement amount_cents"
    );
  }

  return amount;
}

export function getRlgStripeTestClient(): Stripe {
  const mode = requiredEnv(
    "RLG_STRIPE_EXECUTION_MODE"
  );

  if (mode !== "test") {
    throw new Error(
      "RLG Stripe execution is locked to test mode."
    );
  }

  const apiKey = requiredEnv(
    "STRIPE_API_KEY"
  );

  if (!apiKey.startsWith("rk_test_")) {
    throw new Error(
      "RLG Stripe execution requires a Stripe test restricted API key."
    );
  }

  return new Stripe(apiKey);
}

export function getRlgStripeWebhookSecret(): string {
  const secret = requiredEnv(
    "STRIPE_WEBHOOK_SECRET"
  );

  if (!secret.startsWith("whsec_")) {
    throw new Error(
      "Invalid Stripe webhook secret."
    );
  }

  return secret;
}

export function isAuthorizedRlgStripeInternalRequest(
  request: Request
): boolean {
  const expected = requiredEnv(
    "RLG_STRIPE_INTERNAL_SECRET"
  );

  if (expected.length < 32) {
    throw new Error(
      "RLG_STRIPE_INTERNAL_SECRET must contain at least 32 characters."
    );
  }

  const authorization =
    request.headers.get("authorization");

  if (!authorization) return false;

  const match =
    /^Bearer\s+(.+)$/i.exec(authorization);

  if (!match) return false;

  const supplied = Buffer.from(
    match[1].trim(),
    "utf8"
  );

  const configured = Buffer.from(
    expected,
    "utf8"
  );

  if (supplied.length !== configured.length) {
    return false;
  }

  return timingSafeEqual(
    supplied,
    configured
  );
}

export function cleanUuid(
  value: unknown
): string | null {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  ) {
    return null;
  }

  return value;
}

export async function prepareQualifiedLeadSettlement(
  transactionId: string
): Promise<PreparedRlgSettlement> {
  const rows = await callRlgRpc<RpcRow>(
    "rlg_prepare_qualified_lead_settlement",
    {
      p_transaction_id: transactionId,
    }
  );

  if (rows.length !== 1) {
    throw new Error(
      "Settlement preparation did not return exactly one row."
    );
  }

  const row = rows[0];

  const settlementId =
    requiredUuid(row, "settlement_id");

  const preparedTransactionId =
    requiredUuid(row, "transaction_id");

  if (
    preparedTransactionId !== transactionId
  ) {
    throw new Error(
      "Prepared settlement transaction identity mismatch."
    );
  }

  const currency =
    requiredString(row, "currency");

  if (!/^[a-z]{3}$/.test(currency)) {
    throw new Error(
      "Invalid settlement currency."
    );
  }

  const customerId =
    requiredString(
      row,
      "stripe_customer_id"
    );

  if (!customerId.startsWith("cus_")) {
    throw new Error(
      "Prepared settlement does not contain a Stripe Customer."
    );
  }

  const paymentMethodId =
    requiredString(
      row,
      "stripe_payment_method_id"
    );

  if (!paymentMethodId.startsWith("pm_")) {
    throw new Error(
      "Prepared settlement does not contain a Stripe PaymentMethod."
    );
  }

  const idempotencyKey =
    requiredString(
      row,
      "idempotency_key"
    );

  if (
    idempotencyKey !==
    `rlg:settlement:${transactionId}`
  ) {
    throw new Error(
      "Prepared settlement idempotency identity mismatch."
    );
  }

  return {
    settlement_id: settlementId,
    transaction_id:
      preparedTransactionId,
    settlement_status:
      requiredString(
        row,
        "settlement_status"
      ),
    amount_cents:
      requiredAmountCents(row),
    currency,
    stripe_customer_id:
      customerId,
    stripe_payment_method_id:
      paymentMethodId,
    livemode:
      requiredBoolean(
        row,
        "livemode"
      ),
    idempotency_key:
      idempotencyKey,
    replayed:
      requiredBoolean(
        row,
        "replayed"
      ),
  };
}

export async function recordStripeSettlementSubmission(
  settlementId: string,
  paymentIntentId: string,
  providerStatus: string
) {
  return callRlgRpc<RpcRow>(
    "rlg_record_stripe_settlement_submission",
    {
      p_settlement_id: settlementId,
      p_payment_intent_id:
        paymentIntentId,
      p_provider_status:
        providerStatus,
    }
  );
}

export async function recordStripeSettlementRequestFailure(
  settlementId: string,
  errorCode: string,
  errorMessage: string
) {
  return callRlgRpc<RpcRow>(
    "rlg_record_stripe_settlement_request_failure",
    {
      p_settlement_id: settlementId,
      p_error_code:
        errorCode.slice(0, 160),
      p_error_message:
        errorMessage.slice(0, 800),
    }
  );
}

export async function applyStripeSettlementWebhook(
  args: {
    stripeEventId: string;
    eventType: string;
    stripeObjectId: string;
    livemode: boolean;
    payloadSha256: string;
    settlementId: string | null;
    transactionId: string | null;
    paymentIntentId: string;
    chargeId: string | null;
    providerStatus: string;
    failureCode: string | null;
    failureMessage: string | null;
  }
): Promise<RlgWebhookApplyResult> {
  const rows =
    await callRlgRpc<RlgWebhookApplyResult>(
      "rlg_apply_stripe_settlement_webhook",
      {
        p_stripe_event_id:
          args.stripeEventId,
        p_event_type:
          args.eventType,
        p_stripe_object_id:
          args.stripeObjectId,
        p_livemode:
          args.livemode,
        p_payload_sha256:
          args.payloadSha256,
        p_settlement_id:
          args.settlementId,
        p_transaction_id:
          args.transactionId,
        p_payment_intent_id:
          args.paymentIntentId,
        p_charge_id:
          args.chargeId,
        p_provider_status:
          args.providerStatus,
        p_failure_code:
          args.failureCode,
        p_failure_message:
          args.failureMessage,
      }
    );

  if (rows.length !== 1) {
    throw new Error(
      "Stripe webhook RPC did not return exactly one row."
    );
  }

  return rows[0];
}
