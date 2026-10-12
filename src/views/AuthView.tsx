import React, { useState } from 'react';
import { api } from '../lib/api.js';
import { User } from '../types/index.js';
import { Logo } from '../components/ui/Logo.js';
import { Lock, Mail, User as UserIcon, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';

interface AuthViewProps {
  onAuthSuccess: (user: User) => void;
  onNavigate: (view: string) => void;
  initialMode?: 'login' | 'register';
}

export const AuthView: React.FC<AuthViewProps> = ({
  onAuthSuccess,
  onNavigate,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'owner' | 'reviewer' | 'beneficiary'>('owner');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.login({ email, password });
        onAuthSuccess(res.user);
      } else {
        const res = await api.register({
          email,
          password,
          fullName,
          role,
        });
        onAuthSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = async (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({ email: presetEmail, password: presetPass });
      onAuthSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate preset persona');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 bg-slate-50">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <Logo size="lg" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {mode === 'login' ? 'Sign in to your Vault' : 'Create your LegacyLock Account'}
          </h2>
          <p className="text-xs text-slate-500">
            {mode === 'login'
              ? 'Access encrypted records, beneficiaries, and legacy directives.'
              : 'Start your protected digital legacy in less than 2 minutes.'}
          </p>
        </div>

        {/* Quick Demo Personas Strip */}
        <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/60 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>1-Click Demo Personas (Fictional Sample Accounts)</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => handleQuickFill('eleanor@example.com', 'LegacyPass123!')}
              className="py-1.5 px-2 rounded-lg bg-white border border-indigo-200 hover:border-indigo-400 font-medium text-slate-800 transition-colors shadow-xs truncate"
              title="Eleanor Vance (Primary Vault Owner)"
            >
              Eleanor (Owner)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('reviewer@example.com', 'ReviewerPass123!')}
              className="py-1.5 px-2 rounded-lg bg-white border border-indigo-200 hover:border-indigo-400 font-medium text-slate-800 transition-colors shadow-xs truncate"
              title="Arthur Sterling (Designated Review Officer)"
            >
              Reviewer
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('marcus@example.com', 'MarcusPass123!')}
              className="py-1.5 px-2 rounded-lg bg-white border border-indigo-200 hover:border-indigo-400 font-medium text-slate-800 transition-colors shadow-xs truncate"
              title="Marcus Vance (Beneficiary & Executor)"
            >
              Beneficiary
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          {/* Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Full Legal Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Account Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="owner">Vault Owner (Manage my personal legacy)</option>
                    <option value="reviewer">Review Officer (Authorized trustee/reviewer)</option>
                    <option value="beneficiary">Beneficiary (Designated successor)</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <button
            onClick={() => onNavigate('landing')}
            className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            ← Back to Product Overview
          </button>
        </div>
      </div>
    </div>
  );
};
