/**
 * questionSelector.ts — Layer 2 helper
 *
 * Selects 5–6 questions from the pool based on:
 *   - which signals are missing or low-confidence from LLM interpretation
 *   - priority ordering (core questions always first)
 *   - deduplication (same id can appear once only)
 */

import { QUESTION_POOL, type Question } from "./questions";
import type { DocumentSignals } from "./bidSignals";
import type { Interpretation } from "./bidSignals";

const MAX_QUESTIONS = 6;

/**
 * Determine which trigger conditions are active given current signals
 * and interpretation confidence.
 */
function activeTriggersFor(
  signals: DocumentSignals,
  interpretation: Interpretation
): Set<string> {
  const triggers = new Set<string>();
  triggers.add("always");

  if (signals.uncertainty === "medium" || signals.uncertainty === "high") {
    triggers.add("uncertainty_medium_high");
  }
  if (signals.beliefGap === "medium" || signals.beliefGap === "high") {
    triggers.add("belief_gap_medium_high");
  }
  if (signals.decisionType === "persuasion") {
    triggers.add("persuasion_required");
    triggers.add("narrative_needed");
  }
  if (signals.differentiationNeed === "high") {
    triggers.add("differentiation_high");
  }
  if (signals.timeFeasibility === "low" || signals.timeFeasibility === "medium") {
    triggers.add("feasibility_uncertain");
  }
  if (signals.stakeholderType === "mixed") {
    triggers.add("stakeholder_unknown");
  }
  if (signals.complexity === "high" || signals.beliefGap === "high") {
    triggers.add("narrative_needed");
  }
  if (
    signals.uncertainty === "high" ||
    signals.decisionType === "proof"
  ) {
    triggers.add("proof_needed");
  }
  // If confidence is low, activate more clarifying questions
  if (interpretation.confidence === "low") {
    triggers.add("belief_gap_medium_high");
    triggers.add("persuasion_required");
    triggers.add("proof_needed");
  }

  return triggers;
}

/**
 * Select up to MAX_QUESTIONS questions for this session.
 * Priority 1 always first, then priority 2, then 3.
 * Each UserAnswers key can only appear once.
 */
export function selectQuestions(
  signals: DocumentSignals,
  interpretation: Interpretation
): Question[] {
  const activeTriggers = activeTriggersFor(signals, interpretation);
  const seenIds = new Set<string>();
  const selected: Question[] = [];

  // Sort pool: priority 1 first, then 2, then 3
  const sorted = [...QUESTION_POOL].sort((a, b) => a.priority - b.priority);

  for (const question of sorted) {
    if (selected.length >= MAX_QUESTIONS) break;
    if (seenIds.has(question.id)) continue;
    if (!activeTriggers.has(question.trigger)) continue;

    selected.push(question);
    seenIds.add(question.id);
  }

  return selected;
}
