import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-16">

      {/* ── Hero ── */}
      <div className="flex flex-col gap-6">
        <div className="inline-flex items-center gap-2 bg-cap-light border border-blue-200 rounded-full px-4 py-1.5 w-fit">
          <span className="w-2 h-2 rounded-full bg-cap-blue animate-pulse"></span>
          <span className="text-cap-blue text-xs font-semibold uppercase tracking-widest">Bid Intelligence Tool</span>
        </div>

        <div className="flex flex-col gap-4 max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-cap-navy leading-tight tracking-tight">
            Choose the right artefact.<br />
            <span className="text-cap-blue">Win the bid.</span>
          </h1>
          <p className="text-lg text-cap-muted leading-relaxed">
            Answer 8 structured questions and receive an expert recommendation — Prototype, Vision Film, or Slide Deck — with full reasoning, confidence score, and next steps.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Link
            href="/questionnaire"
            className="inline-flex items-center gap-2 bg-cap-blue hover:bg-cap-navy text-white font-semibold px-8 py-3.5 rounded transition-colors duration-200 text-sm tracking-wide shadow-card"
          >
            Start Assessment
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <span className="text-cap-muted text-sm flex items-center gap-1.5">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Takes under 3 minutes
          </span>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-gray-200" />

      {/* ── Artefact cards ── */}
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-cap-navy font-bold text-xl">Three artefacts. One right answer.</h2>
          <p className="text-cap-muted text-sm mt-1">The tool evaluates your bid context and recommends the format most likely to win.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <ArtefactCard icon="🛠️" label="Prototype" badge="Evidence-led"
            description="Reduce uncertainty and let the client experience your solution before committing."
            tag="High uncertainty bids" topBorder="border-cap-blue" tagStyle="bg-cap-light text-cap-blue" />
          <ArtefactCard icon="🎬" label="Vision Film" badge="Emotion-led"
            description="Shift belief and inspire. Make the future state vivid and real for the buyer."
            tag="Complex transformation" topBorder="border-purple-500" tagStyle="bg-purple-50 text-purple-700" />
          <ArtefactCard icon="📊" label="Slide Deck" badge="Logic-led"
            description="Structure the argument for rational, data-driven, compliance-focused decision makers."
            tag="Rational buyer" topBorder="border-teal-500" tagStyle="bg-teal-50 text-teal-700" />
        </div>
      </div>

      {/* ── How it works ── */}
      <div className="bg-cap-navy rounded-2xl p-8 sm:p-10 flex flex-col gap-8">
        <div>
          <h2 className="text-white font-bold text-xl">How it works</h2>
          <p className="text-blue-300 text-sm mt-1">A structured decision engine, not a guess.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Answer 8 questions", desc: "Strategic importance, stakeholder type, emotional need, time constraints, and more." },
            { step: "02", title: "Engine scores each artefact", desc: "A weighted model evaluates every answer against Prototype, Vision Film, and Slide Deck." },
            { step: "03", title: "Receive your recommendation", desc: "Clear reasoning, confidence score, alternative option, consultant next steps, and key risks." },
          ].map((item) => (
            <div key={item.step} className="flex flex-col gap-2 border-t border-blue-700 pt-5">
              <span className="text-cap-bright font-extrabold text-3xl leading-none">{item.step}</span>
              <h3 className="text-white font-semibold text-sm mt-1">{item.title}</h3>
              <p className="text-blue-300 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <Link
          href="/questionnaire"
          className="inline-flex items-center gap-2 bg-white text-cap-navy font-semibold px-7 py-3 rounded text-sm hover:bg-cap-light transition-colors duration-200 w-fit"
        >
          Begin Assessment →
        </Link>
      </div>

    </div>
  );

}

function ArtefactCard({
  icon, label, badge, description, tag, topBorder, tagStyle
}: {
  icon: string; label: string; badge: string; description: string;
  tag: string; topBorder: string; tagStyle: string;
}) {
  return (
    <div className={`bg-white rounded-xl border-t-4 ${topBorder} p-6 shadow-card flex flex-col gap-4 hover:shadow-card-hover transition-shadow duration-200`}>
      <div className="flex items-start justify-between">
        <span className="text-3xl">{icon}</span>
        <span className="text-xs font-medium text-cap-muted bg-gray-100 px-2 py-0.5 rounded-full">{badge}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="font-bold text-cap-navy text-base">{label}</h3>
        <p className="text-cap-muted text-sm leading-relaxed">{description}</p>
      </div>
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${tagStyle}`}>{tag}</span>
    </div>
  );
}
