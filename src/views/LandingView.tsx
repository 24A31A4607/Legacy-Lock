import React from 'react';
import {
  ShieldCheck,
  Lock,
  Users2,
  HeartHandshake,
  GitPullRequest,
  ArrowRight,
  Sparkles,
  FileText,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

interface LandingViewProps {
  onNavigate: (view: string) => void;
  onQuickLogin: (role: 'owner' | 'reviewer' | 'beneficiary') => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate, onQuickLogin }) => {
  return (
    <div className="w-full bg-slate-50 text-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white pt-16 pb-24 px-4 sm:px-6">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1b4b15_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headline and CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 text-xs font-medium">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Next-Generation Digital Legacy Management</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.15] text-balance">
                Your Digital Legacy, <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-indigo-400 to-indigo-100">
                  Protected Forever.
                </span>
              </h1>

              <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl">
                Safeguard critical documents, cryptographic directives, estate instructions, and family
                memories. Designed with autonomous check-in cadences and a multi-party controlled
                inheritance review workflow.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onQuickLogin('owner')}
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-900/40 flex items-center gap-2"
                >
                  <span>Explore Demo Vault (Owner)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onQuickLogin('reviewer')}
                  className="px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium text-sm transition-colors flex items-center gap-2"
                >
                  <KeyRound className="w-4 h-4 text-indigo-400" />
                  <span>Review Officer View</span>
                </button>

                <button
                  onClick={() => onNavigate('auth')}
                  className="px-4 py-3 rounded-xl hover:bg-slate-800/50 text-slate-300 hover:text-white font-medium text-sm transition-colors"
                >
                  Create New Account
                </button>
              </div>

              {/* Clean metadata strip */}
              <div className="pt-4 flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  Zero-Knowledge File Sandboxing
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  Local Persistent or Supabase Cloud
                </span>
              </div>
            </div>

            {/* Right Column: Hero Visual Asset */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border border-indigo-700/40 shadow-2xl bg-indigo-950/40 aspect-[16/9] lg:aspect-square flex items-center justify-center">
                <img
                  src="/src/assets/images/hero_vault_shield_1791724284826.jpg"
                  alt="LegacyLock Digital Vault Shield"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 text-xs text-slate-200">
                  <div className="font-semibold text-white">Cryptographic Vault Architecture</div>
                  <div className="text-[11px] text-slate-300">
                    Dual-custody verification · Autonomous safety cadences
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            A Thoughtful, Multi-Layered Architecture
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            LegacyLock removes the fragility of single-point failure by combining encrypted vaults,
            trusted beneficiaries, and controlled human review.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-300 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Encrypted Digital Vault</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Store sensitive deeds, financial maps, password manager recovery kits, and personal letters.
              Files are stored in private server storage with verified ownership checks.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-300 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Safety Cadence & Check-Ins</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Configure a 30, 60, or 90-day pulse. Check in with one click. Missing a check-in triggers
              grace period alerts without prematurely releasing private records.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-300 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GitPullRequest className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Controlled Succession Review</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Beneficiaries cannot unilaterally claim files. Requests require review by designated trustees,
              preventing unauthorized inheritance attempts.
            </p>
          </div>
        </div>
      </section>

      {/* Controlled Workflow Demonstration Section */}
      <section className="py-16 bg-slate-100/70 border-y border-slate-200 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                Controlled Access Workflow
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                7-Stage Inheritance Protection
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Inheritance is a sensitive, high-stakes transition. LegacyLock tracks every request
                through a tamper-evident audit trail with dual-authorization boundaries.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onQuickLogin('reviewer')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
                >
                  <span>Experience Reviewer Queue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              {[
                { stage: '1. No request', desc: 'Vault remains entirely private to the owner.' },
                { stage: '2. Request submitted', desc: 'Beneficiary submits simulated declaration.' },
                { stage: '3. Awaiting review', desc: 'Placed in authorized trustee review queue.' },
                { stage: '4. Approved / Rejected', desc: 'Review officer records rationale and logs decision.' },
                { stage: '5. Access granted', desc: 'Encrypted assets are released only to verified beneficiary.' },
              ].map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">{step.stage}</div>
                    <div className="text-[11px] text-slate-500">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Prototype Boundary & Legal Notice */}
      <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="p-6 rounded-2xl bg-indigo-50/60 border border-indigo-200/60 space-y-3">
          <div className="flex items-center gap-2 text-indigo-900 font-semibold text-sm">
            <ShieldCheck className="w-4 h-4 text-indigo-700" />
            <span>Prototype Scope & Educational Architecture Notice</span>
          </div>
          <p className="text-xs text-indigo-950 leading-relaxed">
            LegacyLock is an interactive, fully functional software prototype demonstrating digital
            asset custody and controlled succession workflows. It does not replace a licensed estate attorney,
            execute statutory probate proceedings, or interface with real government vital records registries.
            All demo personas (Eleanor Vance, Arthur Sterling, Marcus Vance) and documents are fictional.
          </p>
        </div>
      </section>
    </div>
  );
};
