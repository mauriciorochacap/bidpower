/**
 * questions.ts — Question Pool
 *
 * 14 questions total. Each question is tagged with:
 *   - signal: the DocumentSignals key it resolves
 *   - trigger: when the question selector should include it
 *   - priority: 1 (core — always asked) | 2 (high) | 3 (conditional)
 *
 * The question selector (questionSelector.ts) picks 5–6 per session
 * based on missing or low-confidence signals from the LLM interpretation.
 */

import type { UserAnswers } from "./decisionEngine";
import type { DocumentSignals } from "./bidSignals";

export interface QuestionOption {
  label: string;
  value: string | number;
}

export interface Question {
  id: keyof UserAnswers;
  text: string;
  subtext: string;
  /** Signal this question resolves */
  signal: keyof DocumentSignals;
  /** Condition that triggers inclusion: "always" | signal-based rule */
  trigger: "always" | "uncertainty_medium_high" | "belief_gap_medium_high" | "persuasion_required" | "differentiation_high" | "feasibility_uncertain" | "stakeholder_unknown" | "narrative_needed" | "proof_needed";
  /** 1 = core (always), 2 = high priority, 3 = conditional */
  priority: 1 | 2 | 3;
  type: "scale" | "choice";
  options: QuestionOption[];
}

export const QUESTION_POOL: Question[] = [
  // ── Core questions (priority 1 — always included) ─────────────────────

  {
    id: "decisionInfluence",
    text: "How important is it that the client can see, experience, or understand the proposed solution before making a decision?",
    subtext: "Consider whether the client's evaluation relies on paper-based scoring, or whether experiencing or visualising the solution would materially affect their confidence in your approach.",
    signal: "differentiationNeed",
    trigger: "always",
    priority: 1,
    type: "scale",
    options: [
      { value: 1, label: "Low — a written explanation is likely enough" },
      { value: 2, label: "Medium — visualising the solution could help" },
      { value: 3, label: "High — experiencing the solution is likely critical to their confidence" },
    ],
  },

  {
    id: "beliefShiftRequired",
    text: "Does the client need to believe something new before they can say yes?",
    subtext: "Think about whether they already trust that your solution works — or whether they need convincing of something they currently doubt or can't see.",
    signal: "beliefGap",
    trigger: "always",
    priority: 1,
    type: "scale",
    options: [
      { value: 1, label: "No — they already accept the concept" },
      { value: 2, label: "Somewhat — there's some scepticism to overcome" },
      { value: 3, label: "Yes — they need to fundamentally change their thinking" },
    ],
  },

  {
    id: "decisionNature",
    text: "Is the client's decision primarily logical or emotional?",
    subtext: "Are they scoring this on evidence, cost, and compliance — or do they need to feel inspired and believe in a future they can't fully see yet?",
    signal: "decisionType",
    trigger: "always",
    priority: 1,
    type: "choice",
    options: [
      { value: "logical", label: "Logical — they need evidence, structure, and data" },
      { value: "mixed", label: "Mixed — a balance of both" },
      { value: "persuasive", label: "Emotional — they need to feel it, not just understand it" },
    ],
  },

  {
    id: "feasibility",
    text: "How realistic is it to build something genuinely impressive in the time available?",
    subtext: "Be honest about your team's capacity and the timeline. A weak artefact can do more damage than not building one at all.",
    signal: "timeFeasibility",
    trigger: "always",
    priority: 1,
    type: "scale",
    options: [
      { value: 1, label: "Not really — the timeline is too tight" },
      { value: 2, label: "Probably — with focus and discipline" },
      { value: 3, label: "Yes — we have enough time to do this properly" },
    ],
  },

  {
    id: "uncertaintyType",
    text: "Where does the biggest uncertainty in this bid lie?",
    subtext: "What is the thing the client is most unsure about — or that you're most unsure about?",
    signal: "uncertainty",
    trigger: "always",
    priority: 1,
    type: "choice",
    options: [
      { value: "technical", label: "Technical — can we actually build and deliver this?" },
      { value: "commercial", label: "Commercial — will it deliver the expected value?" },
      { value: "belief", label: "Belief — can the client imagine this future yet?" },
      { value: "none", label: "None — this is a well-understood, low-risk bid" },
    ],
  },

  // ── High-priority questions (priority 2) ─────────────────────────────

  {
    id: "proofOfOutcome",
    text: "Can we demonstrate a working outcome — not just describe it?",
    subtext: "Is there something we can actually build, show, or run that proves our solution works rather than just claims it does?",
    signal: "uncertainty",
    trigger: "proof_needed",
    priority: 2,
    type: "scale",
    options: [
      { value: 1, label: "No — we can only describe the approach" },
      { value: 2, label: "Partially — we can show something indicative" },
      { value: 3, label: "Yes — we can demonstrate a real working outcome" },
    ],
  },

  {
    id: "emotionalImpact",
    text: "How powerful is our future-state story?",
    subtext: "If we painted a vivid picture of where the client could be in 3 years, would it genuinely move them — or would it feel generic?",
    signal: "beliefGap",
    trigger: "belief_gap_medium_high",
    priority: 2,
    type: "scale",
    options: [
      { value: 1, label: "Weak — we don't have a compelling story yet" },
      { value: 2, label: "Moderate — there's a story, but it needs work" },
      { value: 3, label: "Strong — we have a genuinely powerful vision to share" },
    ],
  },

  {
    id: "narrativeStrength",
    text: "How clear and compelling is our transformation narrative?",
    subtext: "Can you articulate a clear 'from X to Y' story that your client will recognise and believe?",
    signal: "complexity",
    trigger: "narrative_needed",
    priority: 2,
    type: "scale",
    options: [
      { value: 1, label: "Not yet — the narrative is unclear or generic" },
      { value: 2, label: "Taking shape — we have the bones of a good story" },
      { value: 3, label: "Clear and specific — we know exactly what story to tell" },
    ],
  },

  {
    id: "futureStateClarity",
    text: "How specific and detailed is our picture of the client's future state?",
    subtext: "Could you describe what 'success' looks like for this client in concrete, specific terms — not just broad aspirations?",
    signal: "strategicValue",
    trigger: "persuasion_required",
    priority: 2,
    type: "scale",
    options: [
      { value: 1, label: "Vague — we know the direction but not the destination" },
      { value: 2, label: "Partial — we have a vision but it needs sharpening" },
      { value: 3, label: "Specific — we can describe the future state in detail" },
    ],
  },

  {
    id: "differentiationClarity",
    text: "How different does our proposal look from what competitors will offer?",
    subtext: "Will the client immediately see why we are the right choice, or does our offer risk blending in with the rest?",
    signal: "differentiationNeed",
    trigger: "differentiation_high",
    priority: 2,
    type: "scale",
    options: [
      { value: 1, label: "Similar — we'll look like everyone else" },
      { value: 2, label: "Somewhat different — we have a few distinctive elements" },
      { value: 3, label: "Clearly different — our approach stands out immediately" },
    ],
  },

  {
    id: "stakeholderType",
    text: "Who is the person that will ultimately make or most influence the decision?",
    subtext: "Think about who carries the most weight in the room — and what actually moves them.",
    signal: "stakeholderType",
    trigger: "stakeholder_unknown",
    priority: 2,
    type: "choice",
    options: [
      { value: "executive", label: "Senior executive — driven by vision, strategy, and transformation" },
      { value: "operational", label: "Operational lead — driven by delivery, risk, and practicality" },
      { value: "mixed", label: "A mix — multiple stakeholders with different priorities" },
    ],
  },

  // ── Conditional questions (priority 3) ───────────────────────────────

  {
    id: "decisionInfluence",
    text: "What specifically would change the client's mind in our favour?",
    subtext: "If you had to name the single thing that would tip the decision our way, what would it be?",
    signal: "differentiationNeed",
    trigger: "feasibility_uncertain",
    priority: 3,
    type: "scale",
    options: [
      { value: 1, label: "Reassurance — they need to know we can deliver" },
      { value: 2, label: "Differentiation — they need to see we're genuinely different" },
      { value: 3, label: "Inspiration — they need to believe in the future we're offering" },
    ],
  },
];
