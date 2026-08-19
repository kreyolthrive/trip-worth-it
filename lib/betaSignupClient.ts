import { BetaSignup } from "@/types/trip";

export async function submitBetaSignup(signup: BetaSignup) {
  const response = await fetch("/api/beta-signups", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(signup),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || "Could not save your beta signup.");
  }

  return (await response.json()) as { ok: true };
}

export async function updateBetaSignupFrustration(email: string, frustration: string) {
  const response = await fetch("/api/beta-signups", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, frustration }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || "Could not save your feedback.");
  }

  return (await response.json()) as { ok: true };
}
