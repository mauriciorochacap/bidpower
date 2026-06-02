"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserAnswers } from "@/lib/decisionEngine";
import { evaluate } from "@/lib/decisionEngine";
import { selectQuestions } from "@/lib/questionSelector";
import { useAppState } from "@/context/AppContext";
import type { BidAnalysis } from "@/lib/bidSignals";
import { defaultSignals } from "@/lib/bidSignals";
import type { Question } from "@/lib/questions";
import ProgressBar from "@/components/ProgressBar";
import QuestionCard from "@/components/QuestionCard";
import UploadStep from "@/components/UploadStep";
import Link from "next/link";

type Phase = "upload" | "questions";

export default function QuestionnairePage() {
  const router = useRouter();
  const { setAnswers, setResult, setBidDocument, setWhyUs } = useAppState();

  const [phase, setPhase] = useState<Phase>("upload");
  const [step, setStep] = useState(0);
  const [answers, setLocalAnswers] = useState<Partial<UserAnswers>>({});
  const [bidAnalysis, setBidAnalysis] = useState<BidAnalysis | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  // ── Upload handlers ──────────────────────────────────────────────────────

  function handleUploadComplete(text: string, fileName: string, analysis: BidAnalysis, whyUs: string) {
    setBidDocument(text, fileName, analysis);
    setWhyUs(whyUs);
    setBidAnalysis(analysis);
    const selected = selectQuestions(analysis.signals, analysis.interpretation);
    setQuestions(selected);
    setPhase("questions");
  }

  function handleUploadSkip() {
    const fallbackAnalysis: BidAnalysis = {
      signals: defaultSignals(),
      interpretation: {
        decisionType: "Unknown — no document provided",
        uncertainty: "Unknown",
        confidence: "low",
        assumptions: ["No bid document was uploaded — all signals are set to medium defaults."],
        signalSummaries: [],
      },
    };
    setBidDocument("", "", fallbackAnalysis);
    setWhyUs("");
    setBidAnalysis(fallbackAnalysis);
    const selected = selectQuestions(fallbackAnalysis.signals, fallbackAnalysis.interpretation);
    setQuestions(selected);
    setPhase("questions");
  }

  // ── Question handlers ────────────────────────────────────────────────────

  const question = questions[step];
  const totalSteps = questions.length;
  const selectedValue = question ? answers[question.id] : undefined;
  const isLast = step === totalSteps - 1;

  function handleSelect(value: string | number) {
    if (!question) return;
    setLocalAnswers((prev) => ({ ...prev, [question.id]: value }));
  }

  function handleNext() {
    if (selectedValue === undefined) return;
    if (isLast) {
      const finalAnswers = { ...answers } as UserAnswers;
      setAnswers(finalAnswers);
      const signals = bidAnalysis?.signals;
      const result = evaluate(finalAnswers, signals ?? defaultSignals());
      setResult(result);
      router.push("/results");
    } else {
      setStep((s) => s + 1);
    }
  }

  function handleBack() {
    if (step > 0) setStep((s) => s - 1);
    else setPhase("upload");
  }

  // ── Render: Upload phase ─────────────────────────────────────────────────

  if (phase === "upload") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 text-sm text-cap-muted">
          <Link href="/" className="hover:text-cap-blue transition-colors">Home</Link>
          <span>›</span>
          <span className="text-cap-navy font-medium">Assessment</span>
        </div>
        <UploadStep onComplete={handleUploadComplete} onSkip={handleUploadSkip} />
      </div>
    );
  }

  // ── Render: Questions phase ──────────────────────────────────────────────

  if (!question) return null;

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-cap-muted">
        <Link href="/" className="hover:text-cap-blue transition-colors">Home</Link>
        <span>›</span>
        <button onClick={() => setPhase("upload")} className="hover:text-cap-blue transition-colors">
          Assessment
        </button>
        <span>›</span>
        <span className="text-cap-navy font-medium">Questions</span>
      </div>

      {/* Document badge */}
      {bidAnalysis && bidAnalysis.interpretation.confidence !== "low" && (
        <div className="flex items-center gap-2 bg-cap-light border border-blue-200 rounded-lg px-4 py-2.5">
          <svg className="w-4 h-4 text-cap-blue shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-cap-blue text-xs font-semibold">
            Bid document analysed — {questions.length} tailored questions selected
          </span>
        </div>
      )}

      <ProgressBar current={step + 1} total={totalSteps} />

      <QuestionCard
        question={question}
        selectedValue={selectedValue as string | number | undefined}
        onSelect={handleSelect}
      />

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleBack}
          className="rounded border border-gray-300 px-5 py-3 font-medium text-cap-muted text-sm hover:border-cap-blue hover:text-cap-blue transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          disabled={selectedValue === undefined}
          className={`rounded px-6 py-3 font-semibold text-sm transition-colors shadow-card inline-flex items-center gap-2
            ${selectedValue !== undefined
              ? "bg-cap-blue text-white hover:bg-cap-navy"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
        >
          {isLast ? "See results" : "Next"}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

    </div>
  );
}
