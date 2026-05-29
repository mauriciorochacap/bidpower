"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS } from "@/lib/questions";
import type { UserAnswers, AnswerValue } from "@/lib/decisionEngine";
import { evaluate } from "@/lib/decisionEngine";
import { useAppState } from "@/context/AppContext";
import type { BidSignals } from "@/lib/bidSignals";
import ProgressBar from "@/components/ProgressBar";
import QuestionCard from "@/components/QuestionCard";
import UploadStep from "@/components/UploadStep";
import Link from "next/link";

type Phase = "upload" | "questions";

export default function QuestionnairePage() {
  const router = useRouter();
  const { setAnswers, setResult, setBidDocument } = useAppState();

  const [phase, setPhase] = useState<Phase>("upload");
  const [step, setStep] = useState(0);
  const [answers, setLocalAnswers] = useState<Partial<UserAnswers>>({});
  const [docSignals, setDocSignals] = useState<BidSignals | null>(null);

  const question = QUESTIONS[step];
  const totalSteps = QUESTIONS.length;
  const selectedValue = answers[question?.id];
  const isLast = step === totalSteps - 1;

  // ── Upload handlers ──────────────────────────────────────────────────────

  function handleUploadComplete(text: string, fileName: string, signals: BidSignals) {
    setBidDocument(text, fileName, signals);
    setDocSignals(signals);
    setPhase("questions");
  }

  function handleUploadSkip() {
    setDocSignals(null);
    setPhase("questions");
  }

  // ── Question handlers ────────────────────────────────────────────────────

  function handleSelect(value: AnswerValue) {
    setLocalAnswers((prev) => ({ ...prev, [question.id]: value }));
  }

  function handleNext() {
    if (!selectedValue) return;
    if (isLast) {
      const finalAnswers = { ...answers } as UserAnswers;
      setAnswers(finalAnswers);
      const result = evaluate(finalAnswers, docSignals?.scoreAdjustments);
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

      {/* Document badge — shown if a doc was uploaded */}
      {docSignals && (
        <div className="flex items-center gap-2 bg-cap-light border border-blue-200 rounded-lg px-4 py-2.5">
          <svg className="w-4 h-4 text-cap-blue shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-cap-blue text-xs font-semibold">
            Bid document analysed — {docSignals.detectedThemes.length} signal{docSignals.detectedThemes.length !== 1 ? "s" : ""} detected
          </span>
        </div>
      )}

      <ProgressBar current={step + 1} total={totalSteps} />

      <QuestionCard
        question={question}
        selectedValue={selectedValue}
        onSelect={handleSelect}
      />

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded border border-gray-300 text-cap-muted font-medium text-sm hover:border-cap-blue hover:text-cap-blue transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <button
          onClick={handleNext}
          disabled={!selectedValue}
          className="inline-flex items-center gap-2 px-7 py-2.5 rounded bg-cap-blue hover:bg-cap-navy text-white font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200 shadow-card"
        >
          {isLast ? "See Recommendation" : "Next"}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Step dots */}
      <div className="flex items-center justify-center gap-1.5">
        {QUESTIONS.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i < step ? "w-2 h-2 bg-cap-blue" :
              i === step ? "w-3 h-3 bg-cap-blue ring-4 ring-cap-light" :
              "w-2 h-2 bg-gray-300"
            }`}
          />
        ))}
      </div>

    </div>
  );
}
