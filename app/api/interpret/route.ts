/**
 * /api/interpret — Layer 2: LLM Signal Extraction
 *
 * Accepts bid document text and returns:
 *   - DocumentSignals (structured JSON)
 *   - Interpretation (plain-language explanation)
 *
 * Uses OpenAI GPT-4o with response_format: json_object for reliable parsing.
 * Falls back to medium-confidence defaults if the LLM call fails.
 */

import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { BidAnalysis, DocumentSignals, Interpretation } from "@/lib/bidSignals";
import { defaultSignals } from "@/lib/bidSignals";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

const SYSTEM_PROMPT = `You are an expert bid strategy consultant. You analyse bid response documents and extract structured decision signals.

Extract ONLY the following JSON structure — no other text:

{
  "signals": {
    "decisionType": "proof | persuasion | compliance",
    "uncertainty": "low | medium | high",
    "beliefGap": "low | medium | high",
    "complexity": "low | medium | high",
    "strategicValue": "low | medium | high",
    "stakeholderType": "executive | operational | mixed",
    "timeFeasibility": "low | medium | high",
    "differentiationNeed": "low | medium | high"
  },
  "interpretation": {
    "decisionType": "one sentence: what kind of decision is this?",
    "uncertainty": "one sentence: where is the main uncertainty?",
    "confidence": "low | medium | high",
    "assumptions": ["list any assumptions you had to make"],
    "signalSummaries": [
      { "label": "signal name", "value": "low|medium|high|...", "plain": "one plain sentence explaining this signal" }
    ]
  }
}

RULES:
- Do NOT rely only on keywords. Infer intent from context.
- Detect transformation vs incremental change.
- Detect whether proof or belief is the primary need.
- If the document is short or unclear, set confidence to "low" and list your assumptions.
- decisionType: "proof" = client needs evidence it works; "persuasion" = client needs to believe in a vision; "compliance" = client is scoring against fixed criteria
- beliefGap: how much the client needs to change their thinking to say yes
- timeFeasibility: estimate whether there is enough time to build an advanced artefact (low = tight, high = ample)
- Always include all 8 signals in signalSummaries.`;

/** Validate that the LLM returned a complete signal object */
function isValidSignals(s: unknown): s is DocumentSignals {
  if (!s || typeof s !== "object") return false;
  const required = [
    "decisionType", "uncertainty", "beliefGap", "complexity",
    "strategicValue", "stakeholderType", "timeFeasibility", "differentiationNeed",
  ];
  return required.every((k) => k in (s as Record<string, unknown>));
}

/** Build a fallback interpretation when the LLM cannot be called */
function fallbackAnalysis(): BidAnalysis {
  const signals = defaultSignals();
  return {
    signals,
    interpretation: {
      decisionType: "Unable to determine — no document provided or analysis failed.",
      uncertainty: "Assumed medium uncertainty.",
      confidence: "low",
      assumptions: [
        "No document was analysed.",
        "All signals set to medium as a conservative default.",
        "Please answer questions carefully to compensate.",
      ],
      signalSummaries: [],
    },
  };
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string" || text.trim().length < 50) {
      return NextResponse.json(fallbackAnalysis());
    }

    // If no API key configured, return fallback immediately
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(fallbackAnalysis());
    }

    // Truncate to ~12,000 chars to stay within token limits
    const truncated = text.slice(0, 12000);

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.2, // Low temperature for consistent structured output
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyse this bid document and return the JSON structure:\n\n${truncated}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return NextResponse.json(fallbackAnalysis());

    const parsed = JSON.parse(raw) as BidAnalysis;

    if (!isValidSignals(parsed.signals)) {
      console.error("LLM returned incomplete signals:", parsed);
      return NextResponse.json(fallbackAnalysis());
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("interpret API error:", err);
    return NextResponse.json(fallbackAnalysis());
  }
}
