"use client";

import React, { createContext, useContext, useState } from "react";
import type { UserAnswers, DecisionResult } from "@/lib/decisionEngine";
import type { BidAnalysis } from "@/lib/bidSignals";
import type { Question } from "@/lib/questions";

interface AppState {
  // Document
  bidText: string;
  bidFileName: string;
  bidAnalysis: BidAnalysis | null;
  whyUs: string;
  // Questions
  selectedQuestions: Question[];
  answers: Partial<UserAnswers>;
  // Result
  result: DecisionResult | null;
  // Setters
  setBidDocument: (text: string, fileName: string, analysis: BidAnalysis) => void;
  setWhyUs: (s: string) => void;
  setSelectedQuestions: (questions: Question[]) => void;
  setAnswers: (answers: Partial<UserAnswers>) => void;
  setResult: (result: DecisionResult) => void;
  reset: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [bidText, setBidText] = useState("");
  const [bidFileName, setBidFileName] = useState("");
  const [bidAnalysis, setBidAnalysisState] = useState<BidAnalysis | null>(null);
  const [whyUs, setWhyUsState] = useState("");
  const [selectedQuestions, setSelectedQuestionsState] = useState<Question[]>([]);
  const [answers, setAnswersState] = useState<Partial<UserAnswers>>({});
  const [result, setResultState] = useState<DecisionResult | null>(null);

  function setBidDocument(text: string, fileName: string, analysis: BidAnalysis) {
    setBidText(text);
    setBidFileName(fileName);
    setBidAnalysisState(analysis);
  }

  function setWhyUs(s: string) {
    setWhyUsState(s);
  }

  function setSelectedQuestions(questions: Question[]) {
    setSelectedQuestionsState(questions);
  }

  function setAnswers(a: Partial<UserAnswers>) {
    setAnswersState(a);
  }

  function setResult(r: DecisionResult) {
    setResultState(r);
  }

  function reset() {
    setBidText("");
    setBidFileName("");
    setBidAnalysisState(null);
    setWhyUsState("");
    setSelectedQuestionsState([]);
    setAnswersState({});
    setResultState(null);
  }

  return (
    <AppContext.Provider value={{
      bidText, bidFileName, bidAnalysis, whyUs,
      selectedQuestions, answers, result,
      setBidDocument, setWhyUs, setSelectedQuestions, setAnswers, setResult, reset,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used inside AppProvider");
  return ctx;
}

