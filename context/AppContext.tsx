"use client";

import React, { createContext, useContext, useState } from "react";
import type { UserAnswers } from "@/lib/decisionEngine";
import type { DecisionResult } from "@/lib/decisionEngine";
import type { BidSignals } from "@/lib/bidSignals";

interface AppState {
  answers: Partial<UserAnswers>;
  result: DecisionResult | null;
  bidText: string;
  bidFileName: string;
  bidSignals: BidSignals | null;
  setAnswers: (answers: Partial<UserAnswers>) => void;
  setResult: (result: DecisionResult) => void;
  setBidDocument: (text: string, fileName: string, signals: BidSignals) => void;
  reset: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [answers, setAnswers] = useState<Partial<UserAnswers>>({});
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [bidText, setBidText] = useState("");
  const [bidFileName, setBidFileName] = useState("");
  const [bidSignals, setBidSignals] = useState<BidSignals | null>(null);

  function setBidDocument(text: string, fileName: string, signals: BidSignals) {
    setBidText(text);
    setBidFileName(fileName);
    setBidSignals(signals);
  }

  function reset() {
    setAnswers({});
    setResult(null);
    setBidText("");
    setBidFileName("");
    setBidSignals(null);
  }

  return (
    <AppContext.Provider
      value={{ answers, result, bidText, bidFileName, bidSignals, setAnswers, setResult, setBidDocument, reset }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used inside AppProvider");
  return ctx;
}
