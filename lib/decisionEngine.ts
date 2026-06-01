/**
 * decisionEngine.ts — Layer 1: Core Decision Logic
 *
 * QUALIFICATION-BASED. No scoring. No averages.
 *
 * Each artefact is evaluated against strict qualification criteria.
 * An artefact is VALID only if it meets the required number of criteria.
 * The engine makes a recommendation only when criteria are clearly met
 * and confidence is sufficient.
 *
 * Layers (kept strictly separate):
 *   1. decisionEngine.ts  — qualification rules → VALID / NOT VALID
 *   2. /api/interpret      — LLM signal extraction from documents
 *   3. Guidance layer      — reasoning + next steps (results page)
 */

import type { DocumentSignals } from "./bidSignals";

export type Artefact = "prototype" | "visionFilm" | "slideDeck";
export type DecisionState = "recommend" | "do_not_build" | "need_more_information";
export type AnswerValue = 1 | 2 | 3; // 1=low, 2=medium, 3=high

// ── User answers (from adaptive question flow) ────────────────────────────

export interface UserAnswers {
  /** Will this artefact materially influence the client's decision? */
  decisionInfluence: AnswerValue;
  /** What is the biggest uncertainty — technical, commercial, or belief? */
  uncertaintyType: "technical" | "commercial" | "belief" | "none";
  /** Does the client need to believe something new to say yes? */
  beliefShiftRequired: AnswerValue;
  /** Is the decision primarily logical/analytical or persuasive/emotional? */
  decisionNature: "logical" | "mixed" | "persuasive";
  /** Is it realistic to build something credible in the available time? */
  feasibility: AnswerValue;
  // Optional — populated only when selected by the question selector
  emotionalImpact?: AnswerValue;
  narrativeStrength?: AnswerValue;
  futureStateClarity?: AnswerValue;
  proofOfOutcome?: AnswerValue;
  differentiationClarity?: AnswerValue;
  stakeholderType?: "executive" | "operational" | "mixed";
}

// ── Qualification criteria evaluation ────────────────────────────────────

export interface CriteriaResult {
  isValid: boolean;
  met: string[];
  notMet: string[];
  metCount: number;
  requiredCount: number;
}

export interface DecisionResult {
  decisionState: DecisionState;
  recommendedArtefact: Artefact | "none";
  confidence: "low" | "medium" | "high";
  criteriaEvaluation: {
    prototype: CriteriaResult;
    visionFilm: CriteriaResult;
  };
  reasoning: string;
  whyNotOthers: string;
  alternative: Artefact | null;
  whatToDoNext: string[];
  // Legacy fields kept for UI compatibility
  scores: { prototype: number; visionFilm: number; slideDeck: number };
}

// ── Prototype qualification (valid if ≥ 4 of 5) ──────────────────────────

function evaluatePrototype(
  answers: UserAnswers,
  signals: DocumentSignals
): CriteriaResult {
  const met: string[] = [];
  const notMet: string[] = [];

  // 1. Influences the buying decision
  if (answers.decisionInfluence >= 2) {
    met.push("Will materially influence the buying decision");
  } else {
    notMet.push("Artefact unlikely to influence the buying decision");
  }

  // 2. Proves a business outcome (requires technical/commercial uncertainty)
  const provesOutcome =
    answers.uncertaintyType === "technical" ||
    answers.uncertaintyType === "commercial" ||
    answers.proofOfOutcome === 3;
  if (provesOutcome) {
    met.push("Can prove a business outcome or reduce delivery uncertainty");
  } else {
    notMet.push("No clear outcome to prove — uncertainty is belief-based, not technical");
  }

  // 3. Reduces client uncertainty
  if (signals.uncertainty === "high" || signals.uncertainty === "medium") {
    met.push("Client uncertainty is high enough to justify a prototype");
  } else {
    notMet.push("Uncertainty is low — a prototype would not add significant value");
  }

  // 4. Feasible within bid timeline
  if (answers.feasibility >= 2) {
    met.push("Feasible to build something credible in the available time");
  } else {
    notMet.push("Timeline is too tight to build a credible prototype");
  }

  // 5. Differentiates clearly
  const differentiates =
    signals.differentiationNeed === "high" ||
    answers.differentiationClarity === 3;
  if (differentiates) {
    met.push("A prototype would create clear differentiation from competitors");
  } else {
    notMet.push("Differentiation need is not strong enough to justify a prototype");
  }

  const REQUIRED = 4;
  return {
    isValid: met.length >= REQUIRED,
    met,
    notMet,
    metCount: met.length,
    requiredCount: REQUIRED,
  };
}

// ── Vision Film qualification (valid if ≥ 4 of 5) ────────────────────────

function evaluateVisionFilm(
  answers: UserAnswers,
  signals: DocumentSignals
): CriteriaResult {
  const met: string[] = [];
  const notMet: string[] = [];

  // 1. Emotionally powerful future state
  const emotionallyPowerful =
    answers.decisionNature === "persuasive" ||
    answers.emotionalImpact === 3;
  if (emotionallyPowerful) {
    met.push("Decision requires emotional impact — a film can deliver this");
  } else {
    notMet.push("Decision is primarily logical — emotional impact not required");
  }

  // 2. Belief shift required
  if (answers.beliefShiftRequired >= 2 || answers.uncertaintyType === "belief") {
    met.push("Client needs to believe something new before they can say yes");
  } else {
    notMet.push("No significant belief shift required — evidence alone may suffice");
  }

  // 3. Strong narrative exists
  const hasNarrative =
    signals.complexity === "high" ||
    answers.narrativeStrength === 3;
  if (hasNarrative) {
    met.push("A strong narrative exists — the transformation story is compelling");
  } else {
    notMet.push("No strong narrative identified — a film would lack story substance");
  }

  // 4. Future state is credible and specific
  const futureStateCredible =
    answers.futureStateClarity === 3 ||
    signals.strategicValue === "high";
  if (futureStateCredible) {
    met.push("Future state is specific and credible enough to film");
  } else {
    notMet.push("Future state is too vague or generic to make a compelling film");
  }

  // 5. Creates memorable advantage
  const memorableAdvantage =
    signals.differentiationNeed === "high" ||
    signals.beliefGap === "high";
  if (memorableAdvantage) {
    met.push("A film would create a memorable, differentiating impression");
  } else {
    notMet.push("Differentiation and belief gap are insufficient to justify a film");
  }

  const REQUIRED = 4;
  return {
    isValid: met.length >= REQUIRED,
    met,
    notMet,
    metCount: met.length,
    requiredCount: REQUIRED,
  };
}

// ── Slide Deck conditions ─────────────────────────────────────────────────

function shouldRecommendSlideDeck(
  answers: UserAnswers,
  signals: DocumentSignals
): boolean {
  return (
    signals.decisionType === "compliance" ||
    (signals.uncertainty === "low" && signals.beliefGap === "low") ||
    answers.decisionNature === "logical"
  );
}

// ── Confidence derivation ─────────────────────────────────────────────────

function deriveConfidence(
  prototype: CriteriaResult,
  visionFilm: CriteriaResult,
  signals: DocumentSignals
): "low" | "medium" | "high" {
  const maxMet = Math.max(prototype.metCount, visionFilm.metCount);
  // Low if signals themselves are low-confidence or only barely qualify
  if (signals.decisionType === "compliance") return "high"; // clear case
  if (maxMet >= 5) return "high";
  if (maxMet >= 4) return "medium";
  return "low";
}

// ── Convert qualification results to legacy scores for UI bars ────────────

function toScores(prototype: CriteriaResult, visionFilm: CriteriaResult) {
  return {
    prototype: Math.round((prototype.metCount / prototype.requiredCount) * 100),
    visionFilm: Math.round((visionFilm.metCount / visionFilm.requiredCount) * 100),
    slideDeck: 0, // set by caller if recommended
  };
}

// ── Main evaluation entry point ───────────────────────────────────────────

export function evaluate(
  answers: UserAnswers,
  signals: DocumentSignals
): DecisionResult {
  const protoResult = evaluatePrototype(answers, signals);
  const filmResult = evaluateVisionFilm(answers, signals);
  const confidence = deriveConfidence(protoResult, filmResult, signals);
  const scores = toScores(protoResult, filmResult);

  // ── Both valid → tiebreak by decision driver ──────────────────────────
  if (protoResult.isValid && filmResult.isValid) {
    const preferPrototype =
      answers.uncertaintyType === "technical" ||
      answers.uncertaintyType === "commercial";
    const recommended: Artefact = preferPrototype ? "prototype" : "visionFilm";
    const alternative: Artefact = preferPrototype ? "visionFilm" : "prototype";
    scores.prototype = Math.round((protoResult.metCount / 5) * 100);
    scores.visionFilm = Math.round((filmResult.metCount / 5) * 100);

    return {
      decisionState: "recommend",
      recommendedArtefact: recommended,
      confidence,
      criteriaEvaluation: { prototype: protoResult, visionFilm: filmResult },
      reasoning: preferPrototype
        ? "Both artefact types qualify, but the primary uncertainty is technical or commercial — a prototype will reduce risk more effectively than a film."
        : "Both artefact types qualify, but the primary driver is a belief gap — a vision film will shift thinking more effectively than a prototype.",
      whyNotOthers: `${alternative === "prototype" ? "Prototype" : "Vision Film"} also qualifies and should be considered if priorities change.`,
      alternative,
      whatToDoNext: [
        `Begin scoping the ${recommended === "prototype" ? "prototype" : "vision film"} immediately.`,
        "Align internally on the single outcome this artefact must achieve.",
        "Validate the approach with a senior stakeholder before committing resource.",
      ],
      scores: { ...scores, slideDeck: 0 },
    };
  }

  // ── Prototype only ────────────────────────────────────────────────────
  if (protoResult.isValid) {
    return {
      decisionState: "recommend",
      recommendedArtefact: "prototype",
      confidence,
      criteriaEvaluation: { prototype: protoResult, visionFilm: filmResult },
      reasoning:
        "A prototype is the right choice. The bid has sufficient uncertainty, the artefact will influence the decision, differentiation is needed, and the timeline is feasible.",
      whyNotOthers:
        "A vision film did not qualify — the belief gap and emotional persuasion need are not strong enough to justify one.",
      alternative: null,
      whatToDoNext: [
        "Define the single user journey or outcome the prototype must demonstrate.",
        "Scope the build to what can be done credibly in the available time.",
        "Run a short validation session with a stakeholder before the presentation.",
      ],
      scores: { ...scores, slideDeck: 0 },
    };
  }

  // ── Vision Film only ──────────────────────────────────────────────────
  if (filmResult.isValid) {
    return {
      decisionState: "recommend",
      recommendedArtefact: "visionFilm",
      confidence,
      criteriaEvaluation: { prototype: protoResult, visionFilm: filmResult },
      reasoning:
        "A vision film is the right choice. The client needs a belief shift, the future state is compelling, and emotional persuasion is required to win.",
      whyNotOthers:
        "A prototype did not qualify — there is no strong technical uncertainty to reduce, and the decision is belief-led rather than proof-led.",
      alternative: null,
      whatToDoNext: [
        "Define the transformation narrative: from current pain to future state.",
        "Identify a real protagonist your client will recognise.",
        "Keep the film under 90 seconds — brevity increases impact.",
        "Pair the film with a clear 'how we get there' summary.",
      ],
      scores: { ...scores, slideDeck: 0 },
    };
  }

  // ── Neither valid — check for Slide Deck ─────────────────────────────
  if (shouldRecommendSlideDeck(answers, signals)) {
    return {
      decisionState: "recommend",
      recommendedArtefact: "slideDeck",
      confidence: "high",
      criteriaEvaluation: { prototype: protoResult, visionFilm: filmResult },
      reasoning:
        "This bid does not require an advanced artefact. The decision is compliance-led or logic-driven with low uncertainty — a well-structured slide deck is the most effective response.",
      whyNotOthers:
        "Neither a prototype nor a vision film qualifies. Building one would waste resource and may appear misaligned with what the client is actually evaluating.",
      alternative: null,
      whatToDoNext: [
        "Lead with the insight, not your company credentials.",
        "Use the Pyramid Principle: recommendation first, evidence second.",
        "Include specific proof points, not generic claims.",
        "Add a clear commercial model and delivery timeline.",
      ],
      scores: { prototype: scores.prototype, visionFilm: scores.visionFilm, slideDeck: 80 },
    };
  }

  // ── Do not build ──────────────────────────────────────────────────────
  return {
    decisionState: "do_not_build",
    recommendedArtefact: "none",
    confidence: "low",
    criteriaEvaluation: { prototype: protoResult, visionFilm: filmResult },
    reasoning:
      "Neither a prototype nor a vision film is justified by the current bid signals. Building an advanced artefact without sufficient justification risks wasting resource and creating a misaligned impression.",
    whyNotOthers:
      "Prototype and vision film both failed qualification. A slide deck may be appropriate — but only once the decision criteria are better understood.",
    alternative: null,
    whatToDoNext: [
      "Clarify the primary decision criterion: is the client evaluating on proof, belief, or compliance?",
      "Speak directly to the decision-maker to understand what would change their mind.",
      "Reassess once you have clearer signals — do not guess.",
      "Consider a well-crafted slide deck as a safe default while you gather more information.",
    ],
    scores: { prototype: scores.prototype, visionFilm: scores.visionFilm, slideDeck: 0 },
  };
}

