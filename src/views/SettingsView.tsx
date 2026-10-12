import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { User } from '../types/index.js';
import {
  Settings,
  Database,
  Cloud,
  RotateCcw,
  Shield,
  Key,
  CheckCircle2,
  AlertCircle,
  FileDown,
} from 'lucide-react';

interface SettingsViewProps {
  currentUser: User;
  storageMode: string;
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', message: string) => void;
  onReloadUser: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  storageMode,
  onNotify,
  onReloadUser,
}) => {
  const [resetting, setResetting] = useState(false);
  const [systemMode, setSystemMode] = useState<{
    mode: string;
    isSupabaseConfigured: boolean;
    localUploadDirExists: boolean;
  } | null>(null);

  useEffect(() => {
    api.getSystemMode().then(setSystemMode).catch(() => {});
  }, []);

  const handleResetDemo = async () => {
    if (!confirm('Are you sure you want to reset the environment to original demo data? Any custom records added to this instance will be reinitialized.')) {
      return;
    }

    setResetting(true);
    try {
      const res = await api.resetDemo();
      onNotify('success', res.message || 'Demo dataset successfully restored.');
      onReloadUser();
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to reset demo dataset');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Settings & Architecture
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Account identity, storage architecture, and database synchronization.
        </p>
      </div>

      {/* Account Profile Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">User Identity & Role</h3>

        <div className="flex items-center gap-4">
          {currentUser.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.fullName}
              className="w-14 h-14 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 font-bold text-lg flex items-center justify-center">
              {currentUser.fullName.charAt(0)}
            </div>
          )}

          <div className="space-y-1">
            <div className="text-base font-bold text-slate-900">{currentUser.fullName}</div>
            <div className="text-xs text-slate-500">{currentUser.email}</div>
            <div className="text-xs text-indigo-600 font-medium capitalize">
              Role: {currentUser.role} · Member since {new Date(currentUser.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Backend & Persistence Mode Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {storageMode === 'supabase' ? (
              <Cloud className="w-5 h-5 text-emerald-600" />
            ) : (
              <Database className="w-5 h-5 text-indigo-600" />
            )}
            <h3 className="text-sm font-semibold text-slate-900">
              Storage Engine: {storageMode === 'supabase' ? 'Supabase Cloud Mode' : 'Local Persistent Engine'}
            </h3>
          </div>

          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
              storageMode === 'supabase'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            }`}
          >
            {storageMode === 'supabase' ? 'Cloud Connected' : 'Local Sandboxed'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 space-y-2 leading-relaxed">
          <p>
            <strong>How LegacyLock handles data:</strong> In local mode, the application utilizes a robust
            file-backed JSON repository (<code>data/legacylock.db.json</code>) and dedicated server file storage
            (<code>data/uploads/</code>). All user changes persist across page refreshes and dev server restarts.
          </p>
          <p>
            <strong>To connect your real Supabase backend:</strong>
          </p>
          <ol className="list-decimal pl-4 space-y-1 text-slate-700">
            <li>Create a new project on Supabase.</li>
            <li>Run the SQL migration in <code>supabase/migrations/20261011_initial_schema.sql</code> inside the Supabase SQL editor.</li>
            <li>Set <code>LEGACYLOCK_STORAGE_MODE="supabase"</code>, <code>VITE_SUPABASE_URL</code>, and <code>VITE_SUPABASE_ANON_KEY</code> in your <code>.env</code> file.</li>
            <li>Restart the application. The repository abstraction seamlessly directs requests to Supabase PostgreSQL!</li>
          </ol>
        </div>
      </div>

      {/* Demo Reset Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Prototype Environment Management</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Need to restore the initial test state? This action re-seeds the fictional accounts
          (Eleanor Vance, Arthur Sterling, Marcus Vance) along with demonstration files and directives.
        </p>

        <div className="pt-2">
          <button
            onClick={handleResetDemo}
            disabled={resetting}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Resetting dataset...' : 'Restore Fictional Demo Dataset'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
