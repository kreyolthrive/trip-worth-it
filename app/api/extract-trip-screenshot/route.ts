import {
  getDemoTripExtraction,
  isDemoTripScenario,
} from "@/lib/demoTripExtraction";
import { TripScreenshotExtractionResponse } from "@/types/trip";

export const runtime = "nodejs";

const MAX_DATA_URL_LENGTH = 8_000_000;

const extractionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    payout: { type: ["number", "null"] },
    pickupDistanceMiles: { type: ["number", "null"] },
    tripDistanceMiles: { type: ["number", "null"] },
    estimatedTimeMinutes: { type: ["number", "null"] },
    destinationCue: { type: ["string", "null"] },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    missingFields: { type: "array", items: { type: "string" } },
    warnings: { type: "array", items: { type: "string" } },
    rawSummary: { type: "string" },
  },
  required: [
    "payout",
    "pickupDistanceMiles",
    "tripDistanceMiles",
    "estimatedTimeMinutes",
    "destinationCue",
    "confidence",
    "missingFields",
    "warnings",
    "rawSummary",
  ],
} as const;

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

function extractOutputText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const direct = (payload as { output_text?: unknown }).output_text;
  if (typeof direct === "string") return direct;

  const output = (payload as { output?: unknown }).output;
  if (!Array.isArray(output)) return null;

  for (const item of output) {
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;

    for (const part of content) {
      const text = (part as { text?: unknown }).text;
      if (typeof text === "string") return text;
    }
  }

  return null;
}

function normalizeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.round(value * 100) / 100
    : null;
}

function normalizeExtraction(value: unknown): TripScreenshotExtractionResponse {
  const raw = value && typeof value === "object" ? value : {};
  const confidence = (raw as { confidence?: unknown }).confidence;

  return {
    extraction: {
      payout: normalizeNumber((raw as { payout?: unknown }).payout),
      pickupDistanceMiles: normalizeNumber(
        (raw as { pickupDistanceMiles?: unknown }).pickupDistanceMiles
      ),
      tripDistanceMiles: normalizeNumber(
        (raw as { tripDistanceMiles?: unknown }).tripDistanceMiles
      ),
      estimatedTimeMinutes: normalizeNumber(
        (raw as { estimatedTimeMinutes?: unknown }).estimatedTimeMinutes
      ),
      destinationCue:
        typeof (raw as { destinationCue?: unknown }).destinationCue === "string"
          ? (raw as { destinationCue: string }).destinationCue.trim() || null
          : null,
      confidence:
        confidence === "high" || confidence === "medium" || confidence === "low"
          ? confidence
          : "low",
      missingFields: Array.isArray((raw as { missingFields?: unknown }).missingFields)
        ? (raw as { missingFields: unknown[] }).missingFields.filter(
            (item): item is string => typeof item === "string"
          )
        : [],
      warnings: Array.isArray((raw as { warnings?: unknown }).warnings)
        ? (raw as { warnings: unknown[] }).warnings.filter(
            (item): item is string => typeof item === "string"
          )
        : [],
      rawSummary:
        typeof (raw as { rawSummary?: unknown }).rawSummary === "string"
          ? (raw as { rawSummary: string }).rawSummary
          : "Review the extracted values before calculating.",
    },
  };
}

export async function POST(request: Request) {
  let imageDataUrl: unknown;
  let demoMode = process.env.TRIP_SCREENSHOT_DEMO_MODE === "true";
  let demoScenario: unknown;

  try {
    const body = (await request.json()) as {
      imageDataUrl?: unknown;
      demoMode?: unknown;
      demoScenario?: unknown;
    };
    imageDataUrl = body.imageDataUrl;
    demoMode = demoMode || body.demoMode === true;
    demoScenario = body.demoScenario;
  } catch {
    return jsonError("Send a valid image upload request.");
  }

  const selectedScenario = isDemoTripScenario(demoScenario)
    ? demoScenario
    : "steady-mid-distance";

  if (demoMode) {
    return Response.json(getDemoTripExtraction(selectedScenario));
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      getDemoTripExtraction(
        selectedScenario,
        "OpenAI vision is not configured, so Trip Worth-It used a demo-safe sample extraction."
      )
    );
  }

  if (
    typeof imageDataUrl !== "string" ||
    !/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(imageDataUrl)
  ) {
    return jsonError("Upload a PNG, JPG, WEBP, or GIF screenshot.");
  }

  if (imageDataUrl.length > MAX_DATA_URL_LENGTH) {
    return jsonError("This screenshot is too large. Try a smaller image.", 413);
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Extract trip offer details from this rideshare or delivery screenshot. Return JSON only. " +
                "Use null for values you cannot read confidently. Payout is the offered gross payout in dollars. " +
                "Pickup distance is unpaid distance to pickup in miles. Trip distance is passenger/order trip distance in miles. " +
                "Estimated time is total estimated minutes shown by the offer; if the screenshot separates pickup and trip time, add them. " +
                "Destination cues can include visible neighborhood, city, airport, store, or drop-off text. Do not guess hidden values.",
            },
            {
              type: "input_image",
              image_url: imageDataUrl,
              detail: "high",
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "trip_offer_extraction",
          strict: true,
          schema: extractionSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    return Response.json(
      getDemoTripExtraction(
        selectedScenario,
        "OpenAI vision was unavailable, so Trip Worth-It used a demo-safe sample extraction."
      )
    );
  }

  const payload = (await response.json()) as unknown;
  const outputText = extractOutputText(payload);

  if (!outputText) {
    return jsonError("No readable extraction came back. Try another screenshot or enter manually.", 502);
  }

  try {
    return Response.json({
      ...normalizeExtraction(JSON.parse(outputText)),
      mode: "openai",
    });
  } catch {
    return Response.json(
      getDemoTripExtraction(
        selectedScenario,
        "The live extraction response was unreadable, so Trip Worth-It used a demo-safe sample extraction."
      )
    );
  }
}
