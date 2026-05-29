interface ScoreBarProps {
  label: string;
  score: number;
  highlighted?: boolean;
}

export default function ScoreBar({ label, score, highlighted = false }: ScoreBarProps) {
  return (
    <div className="flex items-center gap-4">
      <span className={`w-36 text-sm shrink-0 ${
        highlighted ? "font-bold text-cap-navy" : "font-medium text-cap-muted"
      }`}>
        {label}
      </span>
      <div className="flex-1 h-2.5 rounded-full bg-gray-100">
        <div
          className={`h-2.5 rounded-full transition-all duration-700 ease-out ${
            highlighted ? "bg-cap-blue" : "bg-gray-300"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`w-10 text-right text-sm font-bold shrink-0 ${
        highlighted ? "text-cap-blue" : "text-gray-400"
      }`}>
        {score}
      </span>
    </div>
  );
}
