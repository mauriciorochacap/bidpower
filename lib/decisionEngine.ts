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

export interface CriterionItem {
  label: string;
  because: string;
}

export interface CriteriaResult {
  isValid: boolean;
  met: CriterionItem[];
  notMet: CriterionItem[];
  metCount: number;
  requiredCount: number;
}

export interface ConfidenceDetail {
  reason: string;
  increasers: string[];
  reducers: string[];
}

export interface ArtefactRationale {
  qualified: boolean;
  reason: string;
  whenBetter: string;
}

export interface DecisionResult {
  decisionState: DecisionState;
  recommendedArtefact: Artefact | "none";
  confidence: "low" | "medium" | "high";
  confidenceScore: number;
  confidenceDetail: ConfidenceDetail;
  criteriaEvaluation: {
    prototype: CriteriaResult;
    visionFilm: CriteriaResult;
  };
  artefactComparison: {
    prototype: ArtefactRationale;
    visionFilm: ArtefactRationale;
    slideDeck: ArtefactRationale;
    none: ArtefactRationale;
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
  const met: CriterionItem[] = [];
  const notMet: CriterionItem[] = [];

  // 1. Influences the buying decision
  if (answers.decisionInfluence >= 2) {
    met.push({
      label: "Will materially influence the buying decision",
      because: "The client's evaluation is likely to be influenced by what they can see and interact with — experiencing the solution builds confidence that written proposals cannot.",
    });
  } else {
    notMet.push({
      label: "Artefact unlikely to influence the buying decision",
      because: "Based on your answers, the client can evaluate this bid from written material alone — investing in an interactive prototype is unlikely to change the outcome.",
    });
  }

  // 2. Proves a business outcome (requires technical/commercial uncertainty)
  const provesOutcome =
    answers.uncertaintyType === "technical" ||
    answers.uncertaintyType === "commercial" ||
    answers.proofOfOutcome === 3;
  if (provesOutcome) {
    met.push({
      label: "Can prove a business outcome or reduce delivery uncertainty",
      because: "Technical or commercial uncertainty is present — a prototype can demonstrate that the solution works in practice, reducing perceived delivery risk.",
    });
  } else {
    notMet.push({
      label: "No clear outcome to prove — uncertainty is belief-based, not technical",
      because: "The primary uncertainty here is whether the client believes in the vision, not whether the solution can be built. A vision film addresses belief gaps more directly than a prototype.",
    });
  }

  // 3. Reduces client uncertainty
  if (signals.uncertainty === "high" || signals.uncertainty === "medium") {
    met.push({
      label: "Client uncertainty is high enough to justify a prototype",
      because: "When clients are uncertain, a working demonstration reduces perceived risk more effectively than written assurance — it answers 'can this actually be done?' in real time.",
    });
  } else {
    notMet.push({
      label: "Uncertainty is low — a prototype would not add significant value",
      because: "The client already has a reasonably clear picture of what is being proposed. A prototype would demonstrate something they've already accepted, adding cost without changing the outcome.",
    });
  }

  // 4. Feasible within bid timeline
  if (answers.feasibility >= 2) {
    met.push({
      label: "Feasible to build something credible in the available time",
      because: "A prototype that is incomplete or visibly rushed can damage credibility rather than build it. The timeline here is realistic enough to produce something genuinely impressive.",
    });
  } else {
    notMet.push({
      label: "Timeline is too tight to build a credible prototype",
      because: "An underwhelming or unfinished prototype signals poor planning and can actively hurt the bid. It is better not to build one than to submit something that raises doubts about delivery capability.",
    });
  }

  // 5. Differentiates clearly
  const differentiates =
    signals.differentiationNeed === "high" ||
    answers.differentiationClarity === 3;
  if (differentiates) {
    met.push({
      label: "A prototype would create clear differentiation from competitors",
      because: "If competitors are likely to respond with slides or written proposals, a working demonstration creates a tangible, memorable advantage that is difficult to match.",
    });
  } else {
    notMet.push({
      label: "Differentiation need is not strong enough to justify a prototype",
      because: "The signals suggest a prototype would not significantly separate this bid from competitors — either because differentiation need is low, or because your written approach is already distinctive.",
    });
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
  const met: CriterionItem[] = [];
  const notMet: CriterionItem[] = [];

  // 1. Emotionally powerful future state
  const emotionallyPowerful =
    answers.decisionNature === "persuasive" ||
    answers.emotionalImpact === 3;
  if (emotionallyPowerful) {
    met.push({
      label: "Decision requires emotional impact — a film can deliver this",
      because: "The client needs to feel inspired, not just informed. A film creates an emotional response that builds belief before the analytical evaluation begins — something slides rarely achieve.",
    });
  } else {
    notMet.push({
      label: "Decision is primarily logical — emotional impact not required",
      because: "The client is evaluating this bid on evidence, structure, and compliance with criteria. An emotional film is unlikely to influence a scoring-based decision and may appear misaligned with what they're asking for.",
    });
  }

  // 2. Belief shift required
  if (answers.beliefShiftRequired >= 2 || answers.uncertaintyType === "belief") {
    met.push({
      label: "Client needs to believe something new before they can say yes",
      because: "When clients need a belief shift, logical argument alone rarely works. A film can make the future feel real and attainable — shifting from scepticism to conviction in a way that data cannot.",
    });
  } else {
    notMet.push({
      label: "No significant belief shift required — evidence alone may suffice",
      because: "The client already accepts the concept. The remaining work is to evidence and structure the case — a film would not address the actual barriers to a yes.",
    });
  }

  // 3. Strong narrative exists
  const hasNarrative =
    signals.complexity === "high" ||
    answers.narrativeStrength === 3;
  if (hasNarrative) {
    met.push({
      label: "A strong narrative exists — the transformation story is compelling",
      because: "A film is only as good as its story. The complexity of this transformation and the strength of the narrative identified suggest there is a compelling 'from here to there' story worth telling on film.",
    });
  } else {
    notMet.push({
      label: "No strong narrative identified — a film would lack story substance",
      because: "A film without a clear, specific narrative is just production cost. Without a compelling transformation story, the film risks feeling generic and failing to move its audience.",
    });
  }

  // 4. Future state is credible and specific
  const futureStateCredible =
    answers.futureStateClarity === 3 ||
    signals.strategicValue === "high";
  if (futureStateCredible) {
    met.push({
      label: "Future state is specific and credible enough to film",
      because: "The destination needs to be concrete for a film to feel real. The signals suggest the future state here is specific enough that a viewer will recognise and believe it.",
    });
  } else {
    notMet.push({
      label: "Future state is too vague or generic to make a compelling film",
      because: "Filming a vague or aspirational future state produces an unconvincing result. The future state needs to be grounded in specific, recognisable detail before it can be filmed credibly.",
    });
  }

  // 5. Creates memorable advantage
  const memorableAdvantage =
    signals.differentiationNeed === "high" ||
    signals.beliefGap === "high";
  if (memorableAdvantage) {
    met.push({
      label: "A film would create a memorable, differentiating impression",
      because: "High differentiation need or a significant belief gap means this bid needs something that sticks. A well-executed film creates a lasting impression that written material rarely achieves.",
    });
  } else {
    notMet.push({
      label: "Differentiation and belief gap are insufficient to justify a film",
      because: "A vision film needs to work hard to justify its cost. Where differentiation and belief gap are not high, a film is unlikely to be the deciding factor — and a well-structured deck may serve just as well.",
    });
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

function deriveConfidenceFull(
  prototype: CriteriaResult,
  visionFilm: CriteriaResult,
  signals: DocumentSignals,
  answers: UserAnswers
): { level: "low" | "medium" | "high"; score: number; detail: ConfidenceDetail } {
  const maxMet = Math.max(prototype.metCount, visionFilm.metCount);

  // Compliance bids are clear-cut
  if (signals.decisionType === "compliance") {
    return {
      level: "high",
      score: 85,
      detail: {
        reason: "High confidence — this is a compliance-led evaluation with clear, scoreable criteria. The decision logic is well-defined and the recommendation is straightforward.",
        increasers: ["Confirm the exact scoring criteria from the tender documents", "Ensure all mandatory requirements are addressed before investing in additional artefacts"],
        reducers: ["If criteria are ambiguous or the evaluation panel has discretion, confidence would be lower"],
      },
    };
  }

  if (maxMet >= 5) {
    return {
      level: "high",
      score: 90,
      detail: {
        reason: "High confidence — all qualification criteria are met. The signals strongly align with the recommended artefact and the investment is well justified.",
        increasers: ["Confirm timeline with the build team before committing", "Validate the approach with a senior client stakeholder if possible"],
        reducers: ["A very tight timeline or unexpected competitor strength could reduce confidence", "If the decision-maker changes, assumptions about buyer motivation may no longer hold"],
      },
    };
  }

  if (maxMet >= 4) {
    const reducers: string[] = [];
    if (answers.feasibility === 2) reducers.push("Timeline is feasible but not comfortable — any delays reduce this to low confidence");
    if (signals.uncertainty === "medium") reducers.push("Client uncertainty is medium, not high — signals are present but not definitive");
    if (!answers.stakeholderType) reducers.push("Decision-maker type is unknown — recommendation assumes a mixed or executive audience");
    if (reducers.length === 0) reducers.push("Competitor positioning is unknown — this recommendation assumes standard competitive conditions");

    return {
      level: "medium",
      score: 68,
      detail: {
        reason: "Medium confidence — the core qualification criteria are met, but one or more signals leave room for doubt. The recommendation holds under most conditions, but validate the assumptions below.",
        increasers: ["Confirm the client's evaluation format — will they see a live demonstration or presentation?", "Get direct input from the decision-maker or a trusted contact inside the client organisation"],
        reducers,
      },
    };
  }

  // low
  const reducers: string[] = [
    "Insufficient qualification criteria were met to make a strong recommendation",
    "Key signals — uncertainty type, decision-maker preference, or belief gap — are unclear or ambiguous",
  ];
  if (!answers.stakeholderType) reducers.push("The type of decision-maker was not confirmed");
  if (signals.uncertainty === "low") reducers.push("Client uncertainty appears low — there may not be enough for an artefact to address");

  return {
    level: "low",
    score: 35,
    detail: {
      reason: "Low confidence — the signals do not clearly justify any advanced artefact, or they are contradictory. Treat this as a starting point for a conversation, not a definitive answer.",
      increasers: ["Gather more information about how the client will evaluate bids", "Speak directly to the decision-maker to understand what would change their thinking", "Upload a bid document if one is available — it will significantly improve signal quality"],
      reducers,
    },
  };
}

// ── Convert qualification results to legacy scores for UI bars ────────────

function toScores(prototype: CriteriaResult, visionFilm: CriteriaResult) {
  return {
    prototype: Math.round((prototype.metCount / prototype.requiredCount) * 100),
    visionFilm: Math.round((visionFilm.metCount / visionFilm.requiredCount) * 100),
    slideDeck: 0, // set by caller if recommended
  };
}

// ── Artefact comparison rationale ────────────────────────────────────────

function buildArtefactComparison(
  proto: CriteriaResult,
  film: CriteriaResult,
  answers: UserAnswers,
  signals: DocumentSignals
): DecisionResult["artefactComparison"] {
  const deckQualifies = shouldRecommendSlideDeck(answers, signals);

  const prototype: ArtefactRationale = {
    qualified: proto.isValid,
    reason: proto.isValid
      ? `Met ${proto.metCount} of ${proto.requiredCount} qualification criteria. The bid has the uncertainty, feasibility, and differentiation need to justify building a working demonstration.`
      : `Only met ${proto.metCount} of ${proto.requiredCount} required criteria. ${proto.notMet[0]?.label ?? "Key criteria were not met"}.`,
    whenBetter:
      proto.isValid
        ? "Already the best option given current signals."
        : "Would qualify if the client's uncertainty becomes more technical or commercial, the timeline extends, or differentiation need increases significantly.",
  };

  const visionFilm: ArtefactRationale = {
    qualified: film.isValid,
    reason: film.isValid
      ? `Met ${film.metCount} of ${film.requiredCount} qualification criteria. The bid requires emotional persuasion, a belief shift, and a compelling narrative — all well-suited to a vision film.`
      : `Only met ${film.metCount} of ${film.requiredCount} required criteria. ${film.notMet[0]?.label ?? "Key criteria were not met"}.`,
    whenBetter:
      film.isValid
        ? "Already a strong option — consider as primary or close alternative."
        : "Would qualify if the bid requires more emotional persuasion, the belief gap widens, or the transformation narrative becomes clearer and more specific.",
  };

  const slideDeck: ArtefactRationale = {
    qualified: deckQualifies,
    reason: deckQualifies
      ? "The decision is compliance-led or logic-driven with low uncertainty — a well-structured deck is the most appropriate and efficient response."
      : "A slide deck may still be required as the written bid response, but it would not be the differentiating investment here. The signals suggest a more advanced artefact is needed.",
    whenBetter:
      deckQualifies
        ? "Already the right choice for this bid."
        : "Becomes the primary recommendation when the evaluation is scoring-based, uncertainty is low, and the client does not need to experience the solution before deciding.",
  };

  const none: ArtefactRationale = {
    qualified: !proto.isValid && !film.isValid && !deckQualifies,
    reason:
      !proto.isValid && !film.isValid && !deckQualifies
        ? "None of the artefact qualification criteria are met. Building anything without clearer signals risks wasting resource and may appear misaligned with what the client is actually evaluating."
        : "Building no additional artefact is not the recommended path here — the signals support investment in a specific artefact to improve win probability.",
    whenBetter:
      "Becomes the right decision when timelines are extremely tight, no artefact could be built credibly, or when gathering more information is more valuable than producing something now.",
  };

  return { prototype, visionFilm, slideDeck, none };
}

// ── Main evaluation entry point ───────────────────────────────────────────

export function evaluate(
  answers: UserAnswers,
  signals: DocumentSignals
): DecisionResult {
  const protoResult = evaluatePrototype(answers, signals);
  const filmResult = evaluateVisionFilm(answers, signals);
  const { level: confidence, score: confidenceScore, detail: confidenceDetail } =
    deriveConfidenceFull(protoResult, filmResult, signals, answers);
  const scores = toScores(protoResult, filmResult);
  const artefactComparison = buildArtefactComparison(protoResult, filmResult, answers, signals);

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
      confidenceScore,
      confidenceDetail,
      criteriaEvaluation: { prototype: protoResult, visionFilm: filmResult },
      artefactComparison,
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
      confidenceScore,
      confidenceDetail,
      criteriaEvaluation: { prototype: protoResult, visionFilm: filmResult },
      artefactComparison,
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
      confidenceScore,
      confidenceDetail,
      criteriaEvaluation: { prototype: protoResult, visionFilm: filmResult },
      artefactComparison,
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
      confidenceScore: 82,
      confidenceDetail: {
        reason: "High confidence — this is a logic-driven or compliance-based evaluation. A well-structured deck is the most effective and appropriate investment.",
        increasers: ["Lead with the insight and structure the argument clearly", "Include specific evidence and proof points, not generic claims"],
        reducers: ["If the evaluation panel has significant discretionary scoring power, a more persuasive artefact may become appropriate"],
      },
      criteriaEvaluation: { prototype: protoResult, visionFilm: filmResult },
      artefactComparison,
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
    confidenceScore: 30,
    confidenceDetail: {
      reason: "Low confidence — the signals do not clearly justify any advanced artefact investment at this stage. More information is needed before committing resource.",
      increasers: ["Speak directly to the decision-maker to understand what would change their view", "Upload the bid document if available", "Clarify the primary evaluation criterion"],
      reducers: ["Ambiguous signals across uncertainty type, decision nature, and belief gap make a firm recommendation impossible"],
    },
    criteriaEvaluation: { prototype: protoResult, visionFilm: filmResult },
    artefactComparison,
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

