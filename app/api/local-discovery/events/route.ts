import {
  appendLocalDiscoveryEvent,
  normalizeLocalDiscoveryEvent,
} from "@/lib/localDiscovery";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Send a valid local discovery event.");
  }

  const event = normalizeLocalDiscoveryEvent(body, {
    userAgent: request.headers.get("user-agent") || undefined,
    referrer: request.headers.get("referer") || undefined,
  });

  if (!event) {
    return jsonError("Send a valid local discovery event.");
  }

  try {
    const result = await appendLocalDiscoveryEvent(event);
    return Response.json({ ok: true, mode: result.mode });
  } catch (error) {
    console.info("[local-discovery:event:demo-mode]", event, error);
    return Response.json({
      ok: true,
      mode: "demo",
      message: "Tracking endpoint accepted the event. Persistent storage needs to be connected.",
    });
  }
}
