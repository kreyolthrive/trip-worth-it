import { betaSignupsToCsv, readBetaSignupsFile } from "@/lib/betaSignups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const signups = await readBetaSignupsFile();
  const csv = betaSignupsToCsv(signups);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="trip-worth-it-beta-leads.csv"',
    },
  });
}
