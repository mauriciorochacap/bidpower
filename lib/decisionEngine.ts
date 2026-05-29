/**
 * BidPower Decision Engine
 *
 * Pure function: user answers → artefact recommendation
 *
 * Each question contributes weighted scores to three artefacts:
 *   - prototype
 *   - visionFilm
 *   - slideDeck
 *
 * Scores are summed, normalised to 0–100, and the highest wins.
 * Guardrails can block an artefact regardless of score.
 */

export type Artefact = "prototype" | "visionFilm" | "slideDeck";

/** One answer: value 1 (low) | 2 (medium) | 3 (high) */
export type AnswerValue = 1 | 2 | 3;

export interface UserAnswers {
  /** How strategically important is winning this bid? */
  strategicImportance: AnswerValue;
  /** How clearly is the problem defined? */
  problemClarity: AnswerValue;
  /** How much will the artefact influence the buying decision? */
  decisionInfluence: AnswerValue;
  /** How much technical/delivery uncertainty exists? */
  uncertaintyLevel: AnswerValue;
  /** How important is emotional persuasion or belief shift? */
  emotionalPersuasionNeed: AnswerValue;
  /** How complex is the solution to explain? */
  solutionComplexity: AnswerValue;
  /** How rational/analytical is the primary stakeholder? */
  stakeholderType: AnswerValue; // 1=emotional, 2=mixed, 3=rational
  /** How tight is the timeline? */
  timeConstraint: AnswerValue; // 1=very tight, 2=moderate, 3=ample
}

export interface ArtefactScores {
  prototype: number;
  visionFilm: number;
  slideDeck: number;
}

export interface DecisionResult {
  recommendedArtefact: Artefact;
  scores: ArtefactScores;       // normalised 0–100
  confidence: number;            // 0–100
  reasoning: string[];           // bullet-point explanations
  alternative: Artefact | null;  // second-best option if scores are close
  guardrailsTriggered: string[]; // any "do not build" warnings
}

// ---------------------------------------------------------------------------
// Scoring weights per question per artefact
// Each cell: how much a HIGH answer (value=3) favours that artefact.
// Low answers (value=1) score inversely for artefacts that DON'T want them.
// ---------------------------------------------------------------------------

interface WeightSet {
  prototype: number;
  visionFilm: number;
  slideDeck: number;
}

const WEIGHTS: Record<keyof UserAnswers, WeightSet> = {
  // High strategic importance → all benefit, prototype slightly more
  strategicImportance:  { prototype: 3, visionFilm: 3, slideDeck: 2 },

  // High problem clarity → prototype and slide deck; vision film needs ambiguity
  problemClarity:       { prototype: 3, visionFilm: -1, slideDeck: 3 },

  // High decision influence → prototype most (they must feel/see it)
  decisionInfluence:    { prototype: 4, visionFilm: 2, slideDeck: 1 },

  // High uncertainty → prototype (reduce risk); hurts slide deck
  uncertaintyLevel:     { prototype: 4, visionFilm: 1, slideDeck: -2 },

  // High emotional persuasion need → vision film; hurts slide deck
  emotionalPersuasionNeed: { prototype: 1, visionFilm: 4, slideDeck: -2 },

  // High complexity → prototype or vision film; hurts slide deck
  solutionComplexity:   { prototype: 2, visionFilm: 3, slideDeck: -2 },

  // Rational stakeholder (value=3) → slide deck; emotional (value=1) → vision film
  // We invert this: score visionFilm high when value is LOW
  stakeholderType:      { prototype: 0, visionFilm: -3, slideDeck: 3 },

  // Tight timeline (value=1) → slide deck; ample time (value=3) → prototype
  // We invert: high value = more time = prototype possible
  timeConstraint:       { prototype: 3, visionFilm: 1, slideDeck: -1 },
};

// ---------------------------------------------------------------------------
// Guardrail rules — these can BLOCK an artefact recommendation
// ---------------------------------------------------------------------------

function evaluateGuardrails(answers: UserAnswers): Record<Artefact, string[]> {
  const blocks: Record<Artefact, string[]> = {
    prototype: [],
    visionFilm: [],
    slideDeck: [],
  };

  // Prototype guardrails
  if (answers.problemClarity === 1) {
    blocks.prototype.push("Problem is too unclear to build a credible prototype.");
  }
  if (answers.timeConstraint === 1 && answers.solutionComplexity === 3) {
    blocks.prototype.push("Timeline is too tight for a complex prototype.");
  }

  // Vision Film guardrails
  if (answers.emotionalPersuasionNeed === 1) {
    blocks.visionFilm.push("Low emotional persuasion need — a vision film would feel unnecessary.");
  }
  if (answers.stakeholderType === 3 && answers.emotionalPersuasionNeed <= 2) {
    blocks.visionFilm.push("Rational stakeholder scoring compliance/cost — a film won't land.");
  }

  // Slide Deck is always buildable, no hard blocks
  return blocks;
}

// ---------------------------------------------------------------------------
// Raw score calculation
// ---------------------------------------------------------------------------

function calculateRawScores(answers: UserAnswers): ArtefactScores {
  const raw: ArtefactScores = { prototype: 0, visionFilm: 0, slideDeck: 0 };

  for (const key of Object.keys(WEIGHTS) as Array<keyof UserAnswers>) {
    const value = answers[key] as number; // 1 | 2 | 3
    const weights = WEIGHTS[key];

    // Map value 1→-1, 2→0, 3→1 so negative weights work correctly
    const normalised = value - 2; // -1, 0, +1

    raw.prototype  += weights.prototype  * normalised;
    raw.visionFilm += weights.visionFilm * normalised;
    raw.slideDeck  += weights.slideDeck  * normalised;
  }

  return raw;
}

// ---------------------------------------------------------------------------
// Normalise raw scores to 0–100 range
// ---------------------------------------------------------------------------

function normaliseScores(raw: ArtefactScores): ArtefactScores {
  const values = [raw.prototype, raw.visionFilm, raw.slideDeck];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1; // avoid division by zero

  return {
    prototype:  Math.round(((raw.prototype  - min) / range) * 100),
    visionFilm: Math.round(((raw.visionFilm - min) / range) * 100),
    slideDeck:  Math.round(((raw.slideDeck  - min) / range) * 100),
  };
}

// ---------------------------------------------------------------------------
// Build human-readable reasoning bullets
// ---------------------------------------------------------------------------

function buildReasoning(
  answers: UserAnswers,
  recommended: Artefact,
  guardrailsTriggered: string[]
): string[] {
  const reasons: string[] = [];

  if (recommended === "prototype") {
    if (answers.uncertaintyLevel >= 2)
      reasons.push("There is meaningful uncertainty that a working prototype can de-risk.");
    if (answers.decisionInfluence >= 2)
      reasons.push("The client needs to experience the solution for it to influence their decision.");
    if (answers.problemClarity >= 2)
      reasons.push("The problem is well-defined enough to build something credible.");
    if (answers.strategicImportance === 3)
      reasons.push("The strategic importance of this bid justifies the investment in a prototype.");
  }

  if (recommended === "visionFilm") {
    if (answers.emotionalPersuasionNeed >= 2)
      reasons.push("Emotional buy-in is critical — a film can shift belief where slides cannot.");
    if (answers.solutionComplexity >= 2)
      reasons.push("The solution is complex; a narrative film makes it tangible and inspiring.");
    if (answers.stakeholderType <= 2)
      reasons.push("The primary stakeholder responds to vision and story, not just logic.");
    if (answers.problemClarity <= 2)
      reasons.push("The future state is hard to imagine — a film bridges that gap.");
  }

  if (recommended === "slideDeck") {
    if (answers.stakeholderType === 3)
      reasons.push("The stakeholder is rational and analytical — a structured deck fits their decision style.");
    if (answers.problemClarity === 3)
      reasons.push("The idea is clear and easy to explain; a deck is sufficient.");
    if (answers.emotionalPersuasionNeed === 1)
      reasons.push("Emotional persuasion is not required — logic and data will win this.");
    if (answers.timeConstraint === 1)
      reasons.push("Tight timeline makes a slide deck the most practical choice.");
  }

  if (guardrailsTriggered.length > 0) {
    reasons.push(...guardrailsTriggered.map(g => `⚠️ ${g}`));
  }

  // Fallback
  if (reasons.filter(r => !r.startsWith("⚠️")).length === 0) {
    reasons.push("Based on the overall profile of this bid, this artefact offers the best return.");
  }

  return reasons;
}

// ---------------------------------------------------------------------------
// Main exported function
// ---------------------------------------------------------------------------

export function evaluate(
  answers: UserAnswers,
  documentAdjustments?: ArtefactScores
): DecisionResult {
  const rawScores = calculateRawScores(answers);

  // Blend document signals into raw scores before normalisation
  if (documentAdjustments) {
    rawScores.prototype  += documentAdjustments.prototype;
    rawScores.visionFilm += documentAdjustments.visionFilm;
    rawScores.slideDeck  += documentAdjustments.slideDeck;
  }

  const scores = normaliseScores(rawScores);
  const guardrailBlocks = evaluateGuardrails(answers);

  // Pick winner — apply penalty for guardrail blocks
  const penalised = { ...scores };
  for (const artefact of Object.keys(guardrailBlocks) as Artefact[]) {
    if (guardrailBlocks[artefact].length > 0) {
      penalised[artefact] = Math.max(0, penalised[artefact] - 40);
    }
  }

  const ranked = (Object.keys(penalised) as Artefact[]).sort(
    (a, b) => penalised[b] - penalised[a]
  );

  const recommended = ranked[0];
  const secondBest = ranked[1];

  // Confidence: gap between first and second as a proxy
  const gap = penalised[recommended] - penalised[secondBest];
  const confidence = Math.min(100, Math.round(50 + gap));

  // Show alternative only when scores are close (gap < 20)
  const alternative: Artefact | null = gap < 20 ? secondBest : null;

  // Collect all triggered guardrail messages
  const guardrailsTriggered = Object.values(guardrailBlocks).flat();

  const reasoning = buildReasoning(answers, recommended, guardrailsTriggered);

  return {
    recommendedArtefact: recommended,
    scores,
    confidence,
    reasoning,
    alternative,
    guardrailsTriggered,
  };
}
