import { ArrowRight, BellRing, Globe2, Radar, Sparkles, ShieldHalf } from 'lucide-react';
import { Link } from 'react-router-dom';

const pillars = [
  {
    title: 'Ground truth signals',
    copy: 'Scrape local news, labor bulletins, and court dockets before they reach mainstream wires.',
    icon: <Radar size={18} />,
  },
  {
    title: 'Entity graph aware',
    copy: 'Map mines → smelters → Tier-1 → OEM to surface propagation risk, not just headlines.',
    icon: <Globe2 size={18} />,
  },
  {
    title: 'Actionable alerts',
    copy: 'Get notified on strike votes, permit suspensions, and outages with time-to-impact windows.',
    icon: <BellRing size={18} />,
  },
];

const steps = [
  { title: 'Ingest', detail: 'Multilingual scrape from Peru, Mexico, Vietnam.', pill: 'Signals' },
  { title: 'Classify', detail: 'Event type, severity, confidence, geo tag.', pill: 'NLP' },
  { title: 'Propagate', detail: 'Risk scores across Tier-N graph with time-to-impact.', pill: 'Exposure' },
];

export default function Landing() {
  return (
    <main className="flex-1 bg-surface">
      <section className="relative overflow-hidden pb-16 pt-12 sm:pt-16">
        <div className="absolute inset-0 opacity-60">
          <div className="absolute -left-20 top-10 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2 lg:px-6">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(148,163,184,0.2)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-xs font-semibold text-slate-200">
              <ShieldHalf size={14} />
              Tier-N Supply Chain Risk Radar
            </div>
            <h1 className="text-4xl font-display font-semibold text-white sm:text-5xl">
              Early-warning for <span className="text-brand-400">copper</span> exposure in automotive supply chains.
            </h1>
            <p className="text-lg text-slate-300">
              Detect localized labor unrest, regulatory shocks, and infrastructure outages before they halt Tier-2 and Tier-3 suppliers. Built for procurement and resilience leaders.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/dashboard" className="btn-primary">
                Launch dashboard
                <ArrowRight size={16} />
              </Link>
              <a className="btn-ghost" href="#docs">
                View API contract
              </a>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-400">
              <span className="pill bg-[rgba(148,163,184,0.12)]">Peru · Mexico · Vietnam</span>
              <span className="pill bg-[rgba(148,163,184,0.12)]">Copper · Automotive</span>
              <span className="pill bg-[rgba(148,163,184,0.12)]">Strike votes ≠ strikes</span>
            </div>
          </div>

          <div className="card relative overflow-hidden border border-[rgba(148,163,184,0.2)] p-6">
            <div className="absolute right-6 top-6 rounded-full bg-[rgba(16,185,129,0.15)] px-3 py-1 text-xs font-semibold text-emerald-300">
              Live mock data
            </div>
            <div className="mb-4 flex items-center gap-2 text-sm text-slate-300">
              <Sparkles size={16} className="text-brand-300" />
              Pre-shock detection: strike vote scheduled next week
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {steps.map((step) => (
                <div key={step.title} className="rounded-xl border border-[rgba(148,163,184,0.2)] bg-[rgba(255,255,255,0.03)] p-4">
                  <div className="pill mb-2 w-fit bg-[rgba(148,163,184,0.08)] text-xs text-slate-200">{step.pill}</div>
                  <p className="text-base font-semibold text-white">{step.title}</p>
                  <p className="text-sm text-slate-300">{step.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="why" className="relative border-t border-[rgba(148,163,184,0.15)] bg-[rgba(255,255,255,0.02)] py-12">
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <div className="mb-6 flex items-center gap-2">
            <Radar size={18} className="text-brand-300" />
            <h2 className="text-2xl font-display font-semibold text-white">Why this wins</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {pillars.map((pillar) => (
              <div key={pillar.title} className="card space-y-2 p-4">
                <div className="pill w-fit bg-[rgba(148,163,184,0.1)] text-slate-200">{pillar.icon}</div>
                <p className="text-lg font-semibold text-white">{pillar.title}</p>
                <p className="text-sm text-slate-300">{pillar.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
