import {
  readFileSync,
} from "node:fs";
import path from "node:path";
import {
  describe,
  expect,
  it,
} from "vitest";

const server = readFileSync(
  path.resolve(
    process.cwd(),
    "lib/rlgStripeServer.ts"
  ),
  "utf8"
);

const executionRoute =
  readFileSync(
    path.resolve(
      process.cwd(),
      "app/api/internal/rlg/stripe/settlements/route.ts"
    ),
    "utf8"
  );

const webhookRoute =
  readFileSync(
    path.resolve(
      process.cwd(),
      "app/api/stripe/webhooks/rlg/route.ts"
    ),
    "utf8"
  );

describe(
  "RLG Patch 7 Stripe test execution contract",
  () => {
    it(
      "fails closed unless Stripe execution is explicitly in test mode",
      () => {
        expect(server).toContain(
          '"RLG_STRIPE_EXECUTION_MODE"'
        );

        expect(server).toContain(
          'mode !== "test"'
        );

        expect(server).toContain(
          '"STRIPE_API_KEY"'
        );

        expect(server).toContain(
          'apiKey.startsWith("rk_test_")'
        );
      }
    );

    it(
      "protects the internal settlement executor with a strong bearer secret",
      () => {
        expect(server).toContain(
          '"RLG_STRIPE_INTERNAL_SECRET"'
        );

        expect(server).toContain(
          "timingSafeEqual"
        );

        expect(server).toContain(
          "expected.length < 32"
        );

        expect(
          executionRoute
        ).toContain(
          "isAuthorizedRlgStripeInternalRequest"
        );
      }
    );

    it(
      "allows the caller to supply only transaction identity, not financial authority",
      () => {
        expect(
          executionRoute
        ).toContain(
          "FORBIDDEN_FINANCIAL_FIELDS"
        );

        expect(
          executionRoute
        ).toContain(
          "Financial field is server-controlled"
        );

        expect(
          executionRoute
        ).toContain(
          "prepareQualifiedLeadSettlement"
        );

        expect(
          executionRoute
        ).toContain(
          "record.transaction_id"
        );
      }
    );

    it(
      "creates one off-session PaymentIntent from Patch 6 settlement data",
      () => {
        expect(
          executionRoute
        ).toContain(
          "stripe.paymentIntents.create"
        );

        expect(
          executionRoute
        ).toContain(
          "prepared.amount_cents"
        );

        expect(
          executionRoute
        ).toContain(
          "prepared.currency"
        );

        expect(
          executionRoute
        ).toContain(
          "prepared.stripe_customer_id"
        );

        expect(
          executionRoute
        ).toContain(
          "prepared.stripe_payment_method_id"
        );

        expect(
          executionRoute
        ).toContain(
          "confirm: true"
        );

        expect(
          executionRoute
        ).toContain(
          "off_session: true"
        );

        expect(
          executionRoute
        ).toContain(
          "idempotencyKey:"
        );

        expect(
          executionRoute
        ).toContain(
          "prepared.idempotency_key"
        );
      }
    );

    it(
      "records PaymentIntent identity but does not mark payment final synchronously",
      () => {
        expect(
          executionRoute
        ).toContain(
          "recordStripeSettlementSubmission"
        );

        expect(
          executionRoute
        ).toContain(
          "awaiting_webhook: true"
        );

        expect(
          executionRoute
        ).not.toContain(
          'status: "paid"'
        );

        expect(
          executionRoute
        ).not.toContain(
          "client_secret"
        );
      }
    );

    it(
      "preserves PaymentIntent identity from Stripe errors and separately records request failures",
      () => {
        expect(
          executionRoute
        ).toContain(
          "stripePaymentIntentFromError"
        );

        expect(
          executionRoute
        ).toContain(
          "recordStripeSettlementSubmission"
        );

        expect(
          executionRoute
        ).toContain(
          "recordStripeSettlementRequestFailure"
        );
      }
    );

    it(
      "keeps a successful Stripe attempt recoverable if provider-state persistence temporarily fails",
      () => {
        expect(
          executionRoute
        ).toContain(
          "[rlg-stripe:record-submission]"
        );

        expect(
          executionRoute
        ).toContain(
          "Stripe accepted the payment attempt, but RLG could not persist its provider state."
        );

        expect(
          executionRoute
        ).toContain(
          "retry_safe: true"
        );

        expect(
          executionRoute
        ).toContain(
          "awaiting_webhook: true"
        );
      }
    );

    it(
      "verifies the Stripe signature against the raw unmodified request body",
      () => {
        expect(
          webhookRoute
        ).toContain(
          'request.headers.get('
        );

        expect(
          webhookRoute
        ).toContain(
          '"stripe-signature"'
        );

        expect(
          webhookRoute
        ).toContain(
          "await request.text()"
        );

        expect(
          webhookRoute
        ).toContain(
          "stripe.webhooks.constructEvent"
        );

        expect(
          webhookRoute
        ).not.toContain(
          "request.json()"
        );
      }
    );

    it(
      "rejects live webhook events and hashes verified payloads before Patch 6 processing",
      () => {
        expect(
          webhookRoute
        ).toContain(
          "if (event.livemode)"
        );

        expect(
          webhookRoute
        ).toContain(
          'createHash("sha256")'
        );

        expect(
          webhookRoute
        ).toContain(
          "applyStripeSettlementWebhook"
        );
      }
    );

    it(
      "supports only the PaymentIntent events governed by the Patch 6 state machine",
      () => {
        expect(
          webhookRoute
        ).toContain(
          '"payment_intent.succeeded"'
        );

        expect(
          webhookRoute
        ).toContain(
          '"payment_intent.payment_failed"'
        );

        expect(
          webhookRoute
        ).toContain(
          '"payment_intent.processing"'
        );

        expect(
          webhookRoute
        ).toContain(
          '"payment_intent.requires_action"'
        );

        expect(
          webhookRoute
        ).toContain(
          '"payment_intent.canceled"'
        );
      }
    );
  }
);
