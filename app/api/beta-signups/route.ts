import {
  normalizeBetaSignup,
  updateBetaSignupFeedback,
  upsertBetaSignup,
} from "@/lib/betaSignups";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Send a valid beta signup request.");
  }

  const signup = normalizeBetaSignup(body);
  if (!signup) {
    return jsonError("Enter a valid name, email, platform, and work type.");
  }

  try {
    await upsertBetaSignup(signup);
    return Response.json({ ok: true });
  } catch {
    return jsonError("Could not save your beta signup right now.", 500);
  }
}

export async function PATCH(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Send a valid beta feedback request.");
  }

  if (!body || typeof body !== "object") {
    return jsonError("Send a valid beta feedback request.");
  }

  const raw = body as Record<string, unknown>;
  const email = typeof raw.email === "string" ? raw.email : "";
  const frustration = typeof raw.frustration === "string" ? raw.frustration : "";

  try {
    const updated = await updateBetaSignupFeedback(email, frustration);

    if (!updated) {
      return jsonError("Enter a valid email and feedback before saving.");
    }

    return Response.json({ ok: true });
  } catch {
    return jsonError("Could not save your feedback right now.", 500);
  }
}
