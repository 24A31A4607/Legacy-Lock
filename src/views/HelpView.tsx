import React from 'react';
import { HelpCircle, ShieldCheck, AlertTriangle, BookOpen, Lock, Users } from 'lucide-react';

export const HelpView: React.FC = () => {
  const faqs = [
    {
      q: 'Does LegacyLock integrate with government death registries?',
      a: 'No. This application is an educational prototype and technology demonstrator. It does not interface with state or national vital records databases, and does not claim legal certification under probate law.',
    },
    {
      q: 'What happens if I miss a safety check-in?',
      a: 'Missing a check-in NEVER automatically releases private assets or assumes death. Instead, the application triggers a configurable grace period (e.g. 7 days) and notifies designated trustees. A formal review must still be initiated and approved before access can ever be granted.',
    },
    {
      q: 'Can a beneficiary approve their own succession claim?',
      a: 'No. The backend enforces strict role authorization. Only users with the "reviewer" role can approve requests in the succession queue. Beneficiaries cannot approve their own requests, and attempts to bypass this are rejected on the server.',
    },
    {
      q: 'How does private file storage work in local mode?',
      a: 'In local development mode, uploaded files are stored in a dedicated, isolated server directory (data/uploads/) that is never publicly mounted. Downloads are served exclusively through an authenticated Express endpoint with strict user ownership and path traversal verification.',
    },
    {
      q: 'How do I switch from Local mode to real Supabase Cloud?',
      a: 'LegacyLock uses a repository abstraction. Simply run the migration script in supabase/migrations/20261011_initial_schema.sql in your Supabase SQL editor and provide your Supabase URL and keys in the .env file. The frontend continues working without any code modifications.',
    },
    {
      q: 'Can other users see my private files?',
      a: 'No. Every request validates session ownership on the server side. User B cannot read or download User A\'s assets, even by guessing asset IDs (IDOR protection).',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Help & Architectural Transparency
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Frequently asked questions, security guarantees, and prototype boundaries.
        </p>
      </div>

      {/* Prominent Legal Disclaimer Banner */}
      <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-700" />
          <span>Notice on Prototype Limitations & Legal Boundaries</span>
        </div>
        <p className="leading-relaxed">
          LegacyLock is a software demonstration built for educational and prototyping purposes.
          It does not provide legal advice, execute binding last wills and testaments, or integrate with
          governmental death records. All demo personas (Eleanor Vance, Arthur Sterling, Marcus Vance)
          and documents are fictional. Never store production financial master keys or real sensitive
          credentials in prototype environments.
        </p>
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {faqs.map((faq, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="text-indigo-600">Q:</span>
              <span>{faq.q}</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed pl-5">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
