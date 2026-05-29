import type { ArtefactInsight } from "@/lib/artefactInsights";

interface InsightPanelProps {
  insight: ArtefactInsight;
}

export default function InsightPanel({ insight }: InsightPanelProps) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 rounded-full bg-cap-blue" />
        <h2 className="text-cap-navy font-bold text-lg">Consultant Perspective</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        {/* Header band */}
        <div className="bg-cap-navy px-7 py-5 flex items-center gap-3">
          <span className="text-3xl">{insight.icon}</span>
          <div>
            <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest">Recommended artefact</p>
            <h3 className="text-white font-bold text-lg">{insight.title}</h3>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {/* Problem it solves */}
          <div className="px-7 py-5 flex flex-col gap-2">
            <h4 className="text-cap-navy font-semibold text-sm flex items-center gap-2">
              <span className="text-cap-blue">◆</span> What problem does this solve?
            </h4>
            <p className="text-cap-muted text-sm leading-relaxed pl-5">{insight.problemItSolves}</p>
          </div>

          {/* Next steps */}
          <div className="px-7 py-5 flex flex-col gap-3">
            <h4 className="text-cap-navy font-semibold text-sm flex items-center gap-2">
              <span className="text-cap-blue">◆</span> Suggested next steps
            </h4>
            <ol className="flex flex-col gap-2.5 pl-5">
              {insight.nextSteps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="font-bold text-cap-blue shrink-0 w-4">{i + 1}.</span>
                  <span className="text-cap-muted leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Key risks */}
          <div className="px-7 py-5 flex flex-col gap-3">
            <h4 className="text-cap-navy font-semibold text-sm flex items-center gap-2">
              <span className="text-amber-500">◆</span> Key risks to consider
            </h4>
            <ul className="flex flex-col gap-2.5 pl-5">
              {insight.keyRisks.map((risk, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="text-amber-500 shrink-0 mt-0.5">⚠</span>
                  <span className="text-cap-muted leading-relaxed">{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
