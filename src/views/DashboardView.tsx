import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { User, Asset, Beneficiary, LegacyInstruction, CheckInSettings, AuditLog } from '../types/index.js';
import {
  FolderLock,
  Users2,
  ScrollText,
  HeartHandshake,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Plus,
  RefreshCw,
} from 'lucide-react';

interface DashboardViewProps {
  currentUser: User;
  onNavigate: (view: string) => void;
  storageMode: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  onNavigate,
  storageMode,
}) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [instructions, setInstructions] = useState<LegacyInstruction[]>([]);
  const [checkInSettings, setCheckInSettings] = useState<CheckInSettings | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assetsRes, benRes, insRes, chkRes, logsRes] = await Promise.all([
        api.getAssets().catch(() => ({ assets: [] })),
        api.getBeneficiaries().catch(() => ({ beneficiaries: [] })),
        api.getInstructions().catch(() => ({ instructions: [] })),
        api.getCheckIn().catch(() => ({ settings: null, events: [] })),
        api.getAuditLogs().catch(() => ({ logs: [] })),
      ]);

      setAssets(assetsRes.assets || []);
      setBeneficiaries(benRes.beneficiaries || []);
      setInstructions(insRes.instructions || []);
      setCheckInSettings(chkRes.settings || null);
      setRecentLogs((logsRes.logs || []).slice(0, 5));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmOK = async () => {
    try {
      setCheckingIn(true);
      const res = await api.confirmCheckIn();
      setCheckInSettings(res.settings);
      setSuccessToast("Check-in verified! Your safety cadence has been reset.");
      setTimeout(() => setSuccessToast(null), 4000);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  };

  const totalBytes = assets.reduce((acc, a) => acc + (a.fileSize || 0), 0);
  const storageFormatted =
    totalBytes > 1024 * 1024
      ? `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`
      : `${(totalBytes / 1024).toFixed(1)} KB`;

  const nextDueFormatted = checkInSettings?.nextCheckInDue
    ? new Date(checkInSettings.nextCheckInDue).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Not scheduled';

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Toast banner */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-950 border border-emerald-500/30 text-white text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-slate-400 hover:text-white text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Welcome & Mode Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {currentUser.fullName}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Vault Status: Active · Storage Engine:{' '}
            <span className="font-semibold text-slate-700 capitalize">{storageMode} Persistent Mode</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            title="Refresh Vault Data"
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => onNavigate('vault')}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Assets */}
        <div
          onClick={() => onNavigate('vault')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 shadow-xs cursor-pointer transition-all space-y-3"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Vault Assets</span>
            <FolderLock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900 tabular-nums">
              {assets.length}
            </span>
            <span className="text-[11px] text-slate-400 tabular-nums">{storageFormatted} stored</span>
          </div>
        </div>

        {/* KPI 2: Beneficiaries */}
        <div
          onClick={() => onNavigate('beneficiaries')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 shadow-xs cursor-pointer transition-all space-y-3"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Designated Beneficiaries</span>
            <Users2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900 tabular-nums">
              {beneficiaries.length}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">Configured</span>
          </div>
        </div>

        {/* KPI 3: Legacy Directives */}
        <div
          onClick={() => onNavigate('instructions')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 shadow-xs cursor-pointer transition-all space-y-3"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Legacy Directives</span>
            <ScrollText className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900 tabular-nums">
              {instructions.length}
            </span>
            <span className="text-[11px] text-slate-400">Locked until review</span>
          </div>
        </div>

        {/* KPI 4: Cadence Status */}
        <div
          onClick={() => onNavigate('checkin')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 shadow-xs cursor-pointer transition-all space-y-3"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Safety Cadence</span>
            <HeartHandshake className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-slate-900 capitalize">
              {checkInSettings?.status || 'Active'}
            </span>
            <span className="text-[11px] text-indigo-600 font-medium tabular-nums">
              Due {nextDueFormatted}
            </span>
          </div>
        </div>
      </div>

      {/* Safety Cadence Action Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-md border border-indigo-800/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
            <HeartHandshake className="w-4 h-4" />
            <span>Autonomous Safety Cadence</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Confirm your presence and safety pulse
          </h2>
          <p className="text-xs text-indigo-200/80 leading-relaxed">
            Your regular check-in resets the succession countdown timer. If you ever miss a cycle,
            LegacyLock enters a designated grace period before initiating verified reviewer triage.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleConfirmOK}
            disabled={checkingIn}
            className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{checkingIn ? 'Verifying...' : "Confirm I'm OK"}</span>
          </button>
          <button
            onClick={() => onNavigate('checkin')}
            className="px-4 py-3 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 text-xs font-medium transition-colors"
          >
            Cadence Settings
          </button>
        </div>
      </div>

      {/* Two Column Layout: Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Quick Actions & Vault Summary */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Recommended Next Steps</h3>
            <div className="space-y-2.5">
              <div
                onClick={() => onNavigate('vault')}
                className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50/60 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">Add an Estate Document</div>
                    <div className="text-[11px] text-slate-500">
                      Upload title deeds, trusts, or insurance policy files
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>

              <div
                onClick={() => onNavigate('beneficiaries')}
                className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50/60 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Users2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">Assign a Beneficiary</div>
                    <div className="text-[11px] text-slate-500">
                      Select trusted successors and configure asset access scopes
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>

              <div
                onClick={() => onNavigate('workflow')}
                className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50/60 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">Review Inheritance Protocol</div>
                    <div className="text-[11px] text-slate-500">
                      Examine the 7-stage dual-authorization succession pipeline
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Recent Activity Log */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Recent Security Audit Logs</h3>
            <button
              onClick={() => onNavigate('audit')}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
            >
              View Full Log
            </button>
          </div>

          <div className="space-y-3">
            {recentLogs.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">No activity recorded yet</div>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="text-xs pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono text-slate-700 font-medium">{log.action}</span>
                    <span className="tabular-nums">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="text-slate-600 text-[11px] mt-1 leading-relaxed">{log.details}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
