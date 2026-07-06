import {
  appendLocalDiscoveryLead,
  normalizeLocalDiscoveryLead,
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
    return jsonError("Send a valid local discovery lead.");
  }

  const lead = normalizeLocalDiscoveryLead(body);

  if (!lead) {
    return jsonError("Enter your name, phone number, and the business you want help with.");
  }

  try {
    const result = await appendLocalDiscoveryLead(lead);
    return Response.json({ ok: true, mode: result.mode });
  } catch (error) {
    console.info("[local-discovery:lead:demo-mode]", lead, error);
    return Response.json({
      ok: true,
      mode: "demo",
      message: "Lead endpoint accepted the request. Persistent storage needs to be connected.",
    });
  }
}
