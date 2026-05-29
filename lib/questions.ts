import type { UserAnswers } from "./decisionEngine";

export interface QuestionOption {
  label: string;
  value: 1 | 2 | 3;
}

export interface Question {
  id: keyof UserAnswers;
  text: string;
  subtext: string;
  options: [QuestionOption, QuestionOption, QuestionOption]; // always 3 options
}

export const QUESTIONS: Question[] = [
  {
    id: "strategicImportance",
    text: "How strategically important is winning this bid?",
    subtext: "Consider the revenue size, client relationship, and long-term opportunity.",
    options: [
      { value: 1, label: "Nice to win — one of many" },
      { value: 2, label: "Important — meaningful for the business" },
      { value: 3, label: "Critical — must win at all costs" },
    ],
  },
  {
    id: "problemClarity",
    text: "How clearly is the client's problem defined?",
    subtext: "Do you understand exactly what needs solving, or is the brief still vague?",
    options: [
      { value: 1, label: "Vague — the problem is still fuzzy" },
      { value: 2, label: "Partial — we have a working hypothesis" },
      { value: 3, label: "Clear — the problem is well understood" },
    ],
  },
  {
    id: "decisionInfluence",
    text: "How much will the artefact influence the buying decision?",
    subtext: "Will the client's decision hinge on seeing or experiencing your solution?",
    options: [
      { value: 1, label: "Low — they've already mostly decided" },
      { value: 2, label: "Medium — it could tip the balance" },
      { value: 3, label: "High — this artefact is the deciding factor" },
    ],
  },
  {
    id: "uncertaintyLevel",
    text: "How much uncertainty exists around your solution?",
    subtext: "Can you build and deliver what you're proposing with confidence?",
    options: [
      { value: 1, label: "Low — proven approach, low delivery risk" },
      { value: 2, label: "Medium — some unknowns but manageable" },
      { value: 3, label: "High — feasibility is genuinely uncertain" },
    ],
  },
  {
    id: "emotionalPersuasionNeed",
    text: "How much does the client need an emotional or belief shift?",
    subtext: "Do they need to imagine a future they can't currently see?",
    options: [
      { value: 1, label: "None — it's a rational, evidence-based decision" },
      { value: 2, label: "Some — a degree of inspiration would help" },
      { value: 3, label: "High — they need to feel it, not just understand it" },
    ],
  },
  {
    id: "solutionComplexity",
    text: "How complex is your solution to explain?",
    subtext: "Can a sharp person grasp your idea in 60 seconds, or does it take longer?",
    options: [
      { value: 1, label: "Simple — easy to explain in plain language" },
      { value: 2, label: "Moderate — needs some unpacking" },
      { value: 3, label: "Complex — hard to visualise without seeing it" },
    ],
  },
  {
    id: "stakeholderType",
    text: "Who is the primary decision-maker?",
    subtext: "Think about what motivates and persuades them most.",
    options: [
      { value: 1, label: "Visionary / emotional — inspired by possibility" },
      { value: 2, label: "Mixed — balances logic and vision" },
      { value: 3, label: "Analytical / rational — driven by data and evidence" },
    ],
  },
  {
    id: "timeConstraint",
    text: "How much time do you have to prepare the artefact?",
    subtext: "Be realistic about what can be built well in the available time.",
    options: [
      { value: 1, label: "Very tight — days, not weeks" },
      { value: 2, label: "Moderate — a couple of weeks" },
      { value: 3, label: "Ample — enough time to do it properly" },
    ],
  },
];
