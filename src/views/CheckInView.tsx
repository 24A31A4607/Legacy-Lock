import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { CheckInSettings, CheckInEvent } from '../types/index.js';
import {
  HeartHandshake,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Bell,
  Settings,
  ShieldCheck,
  RefreshCw,
  Info,
  Calendar,
} from 'lucide-react';

interface CheckInViewProps {
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', message: string) => void;
}

export const CheckInView: React.FC<CheckInViewProps> = ({ onNotify }) => {
  const [settings, setSettings] = useState<CheckInSettings | null>(null);
  const [events, setEvents] = useState<CheckInEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Edit settings form
  const [frequencyDays, setFrequencyDays] = useState(30);
  const [gracePeriodDays, setGracePeriodDays] = useState(7);
  const [reminderEmail, setReminderEmail] = useState('');
  const [notifyBeneficiaries, setNotifyBeneficiaries] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getCheckIn();
      if (res.settings) {
        setSettings(res.settings);
        setFrequencyDays(res.settings.frequencyDays);
        setGracePeriodDays(res.settings.gracePeriodDays);
        setReminderEmail(res.settings.reminderEmail);
        setNotifyBeneficiaries(res.settings.notifyBeneficiariesOnMissed);
      }
      setEvents(res.events || []);
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to load safety cadence settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmOK = async () => {
    setConfirming(true);
    try {
      const res = await api.confirmCheckIn();
      setSettings(res.settings);
      onNotify('success', "Check-in verified! Cadence reset for next cycle.");
      loadData();
    } catch (err: any) {
      onNotify('error', err.message || 'Check-in failed');
    } finally {
      setConfirming(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await api.updateCheckInSettings({
        frequencyDays: Number(frequencyDays),
        gracePeriodDays: Number(gracePeriodDays),
        reminderEmail,
        notifyBeneficiariesOnMissed: notifyBeneficiaries,
      });
      setSettings(res.settings);
      onNotify('success', 'Cadence settings updated successfully.');
      loadData();
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSimulateMissed = async () => {
    try {
      const res = await api.simulateMissedCheckIn();
      setSettings(res.settings);
      onNotify('warning', `Simulated state toggle: Status is now ${res.settings.status.toUpperCase()}`);
      loadData();
    } catch (err: any) {
      onNotify('error', err.message || 'Simulation failed');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Safety Cadence & Check-Ins
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Establish automated proof-of-life intervals to ensure continuous personal protection.
          </p>
        </div>

        <button
          onClick={handleConfirmOK}
          disabled={confirming}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2 shrink-0 disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{confirming ? 'Recording...' : "Confirm I'm OK"}</span>
        </button>
      </div>

      {/* Safety Guardrail Callout */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950 space-y-1">
          <div className="font-semibold text-amber-900">
            Critical Legal & Safety Guardrail: Missed Check-Ins Do Not Equal Proof of Death
          </div>
          <p className="leading-relaxed">
            A missed check-in merely enters an extended warning stage and alerts your designated trustees.
            It <strong>never triggers automatic release of private files</strong> or substitutes for statutory
            death certificates. This prevents accidental disclosures during travel, hospitalization, or temporary internet loss.
          </p>
        </div>
      </div>

      {/* Two-Column Status and Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Status Card */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Current Cadence State</h3>
              {/* Zero-pill status text */}
              <div className="text-xs font-semibold capitalize flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    settings?.status === 'active'
                      ? 'bg-emerald-500'
                      : settings?.status === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                />
                <span
                  className={
                    settings?.status === 'active'
                      ? 'text-emerald-700'
                      : settings?.status === 'warning'
                      ? 'text-amber-700'
                      : 'text-rose-700'
                  }
                >
                  {settings?.status || 'Active'} State
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Check-in Cadence:</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  Every {settings?.frequencyDays || 30} days
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Grace Period:</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {settings?.gracePeriodDays || 7} days
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Last Verified Check-In:</span>
                <span className="text-slate-900 tabular-nums">
                  {settings?.lastCheckInAt
                    ? new Date(settings.lastCheckInAt).toLocaleString()
                    : 'Not yet recorded'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Next Check-In Due:</span>
                <span className="font-semibold text-indigo-700 tabular-nums">
                  {settings?.nextCheckInDue
                    ? new Date(settings.nextCheckInDue).toLocaleString()
                    : 'Pending'}
                </span>
              </div>
            </div>

            {/* Test Simulation Button */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Test Simulator:</span>
              <button
                type="button"
                onClick={handleSimulateMissed}
                className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
              >
                Toggle Missed State (Demo)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Settings Form */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Configure Cadence Parameters</h3>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Check-in Interval (Days)
              </label>
              <select
                value={frequencyDays}
                onChange={(e) => setFrequencyDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value={15}>Every 15 Days (High Security)</option>
                <option value={30}>Every 30 Days (Standard Recommended)</option>
                <option value={60}>Every 60 Days</option>
                <option value={90}>Every 90 Days (Quarterly)</option>
                <option value={180}>Every 180 Days (Semi-Annual)</option>
                <option value={365}>Every 365 Days (Annual)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Grace Period Before Escalation (Days)
              </label>
              <input
                type="number"
                min={1}
                max={90}
                value={gracePeriodDays}
                onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Time allotted for secondary reminder notices before alerting designated trustees.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Primary Notification Email
              </label>
              <input
                type="email"
                required
                value={reminderEmail}
                onChange={(e) => setReminderEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={notifyBeneficiaries}
                  onChange={(e) => setNotifyBeneficiaries(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Alert designated trustees if grace period expires</span>
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50"
              >
                {savingSettings ? 'Saving...' : 'Update Cadence'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Cadence Event History */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">Safety Event History & Proof of Life Log</h3>

        {events.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">No events logged yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {events.map((evt) => (
              <div key={evt.id} className="py-3 flex items-start justify-between text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 font-mono">{evt.eventType}</span>
                    <span className="text-[11px] text-slate-400">via {evt.ipOrOrigin}</span>
                  </div>
                  {evt.notes && <p className="text-slate-600 text-[11px]">{evt.notes}</p>}
                </div>
                <span className="text-[11px] text-slate-400 tabular-nums">
                  {new Date(evt.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
