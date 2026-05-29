/**
 * bidSignals.ts
 *
 * Analyses extracted bid document text and produces:
 *   - signal scores (adjustments to Prototype / Vision Film / Slide Deck)
 *   - a list of detected themes for display
 *   - a short summary paragraph
 *
 * This is lightweight NLP — keyword frequency + pattern matching.
 * No external AI/ML dependencies required.
 */

import type { ArtefactScores, Artefact } from "./decisionEngine";

export interface BidSignals {
  /** Score adjustments to blend with questionnaire scoring (−20 to +20 per artefact) */
  scoreAdjustments: ArtefactScores;
  /** Human-readable themes detected in the doc */
  detectedThemes: DetectedTheme[];
  /** One-paragraph machine-generated summary */
  summary: string;
  /** Word count of the document */
  wordCount: number;
}

export interface DetectedTheme {
  label: string;
  description: string;
  artefact: Artefact;
  strength: "strong" | "moderate";
  icon: string;
}

// ── Keyword sets ──────────────────────────────────────────────────────────

const PROTOTYPE_SIGNALS = {
  strong: [
    "proof of concept", "poc", "prototype", "demo", "working demo",
    "feasibility", "pilot", "de-risk", "technical risk", "mvp",
    "hands-on", "interactive", "experience the solution", "see it work",
    "uncertainty", "unknown", "unproven",
  ],
  moderate: [
    "build", "develop", "test", "validate", "experiment",
    "solution", "platform", "technology", "engineering", "technical",
    "integration", "architecture", "system",
  ],
};

const VISION_FILM_SIGNALS = {
  strong: [
    "vision", "inspire", "transformation", "transform", "future state",
    "imagine", "storytelling", "narrative", "emotional", "belief",
    "change the way", "reimagine", "revolutionary", "bold",
    "cultural change", "mindset", "aspiration", "ambition",
    "journey", "possibilities", "game-changing",
  ],
  moderate: [
    "future", "opportunity", "potential", "disrupt", "innovation",
    "strategic", "leadership", "partnership", "growth", "impact",
    "sustainable", "long-term", "commitment", "engagement",
  ],
};

const SLIDE_DECK_SIGNALS = {
  strong: [
    "rfp", "rfq", "request for proposal", "tender", "procurement",
    "compliance", "requirements", "criteria", "evaluation",
    "scoring", "cost", "price", "commercial", "budget", "roi",
    "return on investment", "kpi", "sla", "deliverable",
    "milestone", "timeline", "governance", "due diligence",
  ],
  moderate: [
    "proposal", "plan", "approach", "methodology", "framework",
    "process", "reporting", "data", "analysis", "metrics",
    "performance", "efficiency", "risk", "assurance",
  ],
};

// ── Scoring ────────────────────────────────────────────────────────────────

function countMatches(text: string, terms: string[]): number {
  const lower = text.toLowerCase();
  return terms.reduce((acc, term) => {
    // count occurrences (not just presence)
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const matches = lower.match(regex);
    return acc + (matches ? matches.length : 0);
  }, 0);
}

function clampAdjustment(raw: number): number {
  // Map raw hit count to an adjustment in the range −20 to +20
  if (raw === 0) return 0;
  if (raw <= 2) return 5;
  if (raw <= 5) return 10;
  if (raw <= 10) return 15;
  return 20;
}

// ── Theme detection ────────────────────────────────────────────────────────

function detectThemes(text: string): DetectedTheme[] {
  const themes: DetectedTheme[] = [];
  const lower = text.toLowerCase();

  // Prototype themes
  if (countMatches(lower, PROTOTYPE_SIGNALS.strong) >= 2) {
    themes.push({
      label: "Technical Uncertainty",
      description: "The document signals unresolved technical risk or feasibility concerns.",
      artefact: "prototype",
      strength: "strong",
      icon: "🛠️",
    });
  }
  if (lower.includes("proof of concept") || lower.includes("poc") || lower.includes("demo")) {
    themes.push({
      label: "Proof of Concept Language",
      description: "The bid explicitly mentions POC, prototype, or demo outputs.",
      artefact: "prototype",
      strength: "strong",
      icon: "🔬",
    });
  }

  // Vision Film themes
  if (countMatches(lower, VISION_FILM_SIGNALS.strong) >= 3) {
    themes.push({
      label: "Transformation Narrative",
      description: "The document is rich with vision, transformation, and future-state language.",
      artefact: "visionFilm",
      strength: "strong",
      icon: "🎬",
    });
  }
  if (lower.includes("cultural change") || lower.includes("mindset") || lower.includes("belief")) {
    themes.push({
      label: "Behavioural Change",
      description: "The bid involves changing how people think, feel, or behave — not just technology.",
      artefact: "visionFilm",
      strength: "strong",
      icon: "🧠",
    });
  }

  // Slide Deck themes
  if (countMatches(lower, SLIDE_DECK_SIGNALS.strong) >= 3) {
    themes.push({
      label: "Procurement / RFP Context",
      description: "Formal procurement language detected — compliance, criteria, scoring, cost.",
      artefact: "slideDeck",
      strength: "strong",
      icon: "📋",
    });
  }
  if (lower.includes("roi") || lower.includes("return on investment") || lower.includes("business case")) {
    themes.push({
      label: "ROI / Business Case Focus",
      description: "The decision will be driven by financial justification and measurable returns.",
      artefact: "slideDeck",
      strength: "moderate",
      icon: "💰",
    });
  }
  if (lower.includes("timeline") || lower.includes("milestone") || lower.includes("deadline")) {
    themes.push({
      label: "Time-Driven Constraints",
      description: "Deadlines and milestones are prominent — time pressure may limit what can be built.",
      artefact: "slideDeck",
      strength: "moderate",
      icon: "⏱️",
    });
  }

  return themes;
}

// ── Summary generation ─────────────────────────────────────────────────────

function generateSummary(text: string, themes: DetectedTheme[], wordCount: number): string {
  const lower = text.toLowerCase();

  const artefactCounts = themes.reduce(
    (acc, t) => ({ ...acc, [t.artefact]: (acc[t.artefact] ?? 0) + 1 }),
    {} as Record<Artefact, number>
  );

  const dominant = (Object.entries(artefactCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null) as Artefact | null;

  const artefactNames: Record<Artefact, string> = {
    prototype: "a Prototype",
    visionFilm: "a Vision Film",
    slideDeck: "a Slide Deck",
  };

  const parts: string[] = [];
  parts.push(`Your ${wordCount.toLocaleString()}-word bid document has been analysed.`);

  if (themes.length === 0) {
    parts.push("No strong signals were detected — the questionnaire will drive the recommendation.");
  } else {
    parts.push(`${themes.length} signal${themes.length > 1 ? "s" : ""} were identified.`);
    if (dominant) {
      parts.push(`The document leans toward ${artefactNames[dominant]}.`);
    }
  }

  // Contextual hints
  if (lower.includes("rfp") || lower.includes("tender")) {
    parts.push("This appears to be a formal procurement — structured logic will matter.");
  } else if (lower.includes("pilot") || lower.includes("proof of concept")) {
    parts.push("The brief mentions exploratory or proof-of-concept work.");
  } else if (lower.includes("transform") || lower.includes("vision")) {
    parts.push("The language suggests a transformational ambition.");
  }

  return parts.join(" ");
}

// ── Main export ────────────────────────────────────────────────────────────

export function analyseBidDocument(text: string): BidSignals {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  const protoStrong = countMatches(text, PROTOTYPE_SIGNALS.strong);
  const protoMod = countMatches(text, PROTOTYPE_SIGNALS.moderate);
  const visionStrong = countMatches(text, VISION_FILM_SIGNALS.strong);
  const visionMod = countMatches(text, VISION_FILM_SIGNALS.moderate);
  const deckStrong = countMatches(text, SLIDE_DECK_SIGNALS.strong);
  const deckMod = countMatches(text, SLIDE_DECK_SIGNALS.moderate);

  const scoreAdjustments: ArtefactScores = {
    prototype: clampAdjustment(protoStrong * 2 + protoMod),
    visionFilm: clampAdjustment(visionStrong * 2 + visionMod),
    slideDeck: clampAdjustment(deckStrong * 2 + deckMod),
  };

  const detectedThemes = detectThemes(text);
  const summary = generateSummary(text, detectedThemes, wordCount);

  return { scoreAdjustments, detectedThemes, summary, wordCount };
}
