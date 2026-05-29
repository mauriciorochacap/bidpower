import type { Artefact } from "./decisionEngine";

export interface ArtefactInsight {
  title: string;
  tagline: string;
  whyRecommended: string;
  problemItSolves: string;
  nextSteps: string[];
  keyRisks: string[];
  icon: string;
  colour: string; // Tailwind bg class
  accentColour: string; // Tailwind text/border class
}

export const INSIGHTS: Record<Artefact, ArtefactInsight> = {
  prototype: {
    title: "Prototype",
    tagline: "Show, don't tell.",
    icon: "🛠️",
    colour: "bg-blue-50",
    accentColour: "text-blue-700 border-blue-300",
    whyRecommended:
      "A prototype is the right call when uncertainty is high and the client needs to feel the solution, not just hear about it. It moves the conversation from 'could this work?' to 'this already works.'",
    problemItSolves:
      "Clients struggle to commit to something they cannot see or experience. A prototype reduces perceived risk, builds confidence, and makes your bid tangible in a room full of competing decks.",
    nextSteps: [
      "Define the core user journey to prototype (one flow, not the whole product).",
      "Agree on fidelity level — clickable wireframe vs. working tech spike.",
      "Run a 1–2 week prototype sprint with a small cross-functional team.",
      "Validate with a real user or stakeholder before the bid presentation.",
      "Rehearse the demo so it runs flawlessly under pressure.",
    ],
    keyRisks: [
      "Scope creep — keep it to one focused scenario or it becomes a project.",
      "Mistaken for a commitment — set clear expectations that this is exploratory.",
      "Technical debt — ensure the prototype is clearly labelled as non-production.",
      "Over-polish — a prototype that looks too finished may invite unrealistic expectations.",
    ],
  },

  visionFilm: {
    title: "Vision Film",
    tagline: "Make them believe.",
    icon: "🎬",
    colour: "bg-purple-50",
    accentColour: "text-purple-700 border-purple-300",
    whyRecommended:
      "A vision film is the right choice when the future state is hard to imagine and the client needs an emotional shift. Logic alone won't win this — they need to see and feel what success looks like.",
    problemItSolves:
      "Complex transformations are difficult to buy without a visceral sense of the destination. A film bypasses analytical resistance and creates shared belief — making the case emotionally before intellectually.",
    nextSteps: [
      "Define the transformation narrative: from current pain to future possibility.",
      "Identify the protagonist — a real person or persona your client recognises.",
      "Draft a script that is no longer than 90 seconds (attention is short).",
      "Use real locations or client environment to ground it in their world.",
      "Pair the film with a brief 'behind the film' explanation of the how.",
    ],
    keyRisks: [
      "Generic storytelling — if it could apply to any client, it will move no one.",
      "Weak narrative arc — without a clear problem and resolution, it feels like an ad.",
      "Mismatched tone — a visionary film shown to a compliance-focused committee can backfire.",
      "Production quality — poor audio or visuals undermine credibility more than no film at all.",
    ],
  },

  slideDeck: {
    title: "Slide Deck",
    tagline: "Structure the argument.",
    icon: "📊",
    colour: "bg-green-50",
    accentColour: "text-green-700 border-green-300",
    whyRecommended:
      "A slide deck is the right artefact when the decision is rational, the idea is clear, and the audience is scoring on logic, evidence, and structure. It is the most efficient way to make a rigorous case.",
    problemItSolves:
      "Analytical stakeholders need to see the thinking clearly laid out. A well-structured deck gives them the framework to say yes — covering the problem, the approach, the outcomes, and the evidence.",
    nextSteps: [
      "Lead with the insight or problem statement, not your company background.",
      "Use the Pyramid Principle: recommendation first, evidence second.",
      "Include one slide on 'why us' grounded in specific proof points.",
      "Add a clear commercial model and delivery timeline.",
      "End with a crisp call to action and next step.",
    ],
    keyRisks: [
      "Death by PowerPoint — too many slides dilutes the argument.",
      "Feature-led thinking — focus on outcomes for the client, not your capabilities.",
      "Missing the emotional hook — even analytical buyers need to trust you.",
      "No differentiation — if it reads like every other deck, you won't stand out.",
    ],
  },
};

export function getInsight(artefact: Artefact): ArtefactInsight {
  return INSIGHTS[artefact];
}
