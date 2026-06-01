import type { Question, QuestionOption } from "@/lib/questions";

interface QuestionCardProps {
  question: Question;
  selectedValue: string | number | undefined;
  onSelect: (value: string | number) => void;
}

const OPTION_LETTERS = ["A", "B", "C", "D"];

export default function QuestionCard({ question, selectedValue, onSelect }: QuestionCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-8 flex flex-col gap-7">
      {/* Question text */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-cap-navy leading-snug tracking-tight">
          {question.text}
        </h2>
        <p className="text-cap-muted text-sm leading-relaxed">{question.subtext}</p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3">
        {question.options.map((option: QuestionOption, idx: number) => {
          const isSelected = selectedValue === option.value;
          return (
            <button
              key={String(option.value)}
              onClick={() => onSelect(option.value)}
              className={`w-full text-left rounded-xl border-2 px-5 py-4 transition-all duration-150 flex items-center gap-4
                ${
                  isSelected
                    ? "border-cap-blue bg-cap-light shadow-card"
                    : "border-gray-200 bg-white hover:border-cap-blue hover:bg-cap-light"
                }`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors
                  ${
                    isSelected
                      ? "bg-cap-blue text-white"
                      : "bg-gray-100 text-cap-muted"
                  }`}
              >
                {OPTION_LETTERS[idx]}
              </span>
              <span className={`font-medium text-sm ${isSelected ? "text-cap-navy" : "text-gray-700"}`}>
                {option.label}
              </span>
              {isSelected && (
                <svg className="w-4 h-4 text-cap-blue ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
