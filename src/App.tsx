import React, { useState, useEffect } from 'react';
import { api, getStoredToken, setStoredToken } from './lib/api.js';
import { User } from './types/index.js';
import { Navbar } from './components/layout/Navbar.js';
import { Sidebar } from './components/layout/Sidebar.js';
import { ToastContainer, ToastMessage } from './components/ui/Toast.js';

// Views
import { LandingView } from './views/LandingView.js';
import { AuthView } from './views/AuthView.js';
import { DashboardView } from './views/DashboardView.js';
import { VaultView } from './views/VaultView.js';
import { BeneficiariesView } from './views/BeneficiariesView.js';
import { InstructionsView } from './views/InstructionsView.js';
import { CheckInView } from './views/CheckInView.js';
import { WorkflowView } from './views/WorkflowView.js';
import { AuditView } from './views/AuditView.js';
import { SettingsView } from './views/SettingsView.js';
import { HelpView } from './views/HelpView.js';
import { Menu, ShieldCheck } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('landing');
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [storageMode, setStorageMode] = useState<string>('local');

  const addToast = (type: 'success' | 'warning' | 'error' | 'info', message: string, title?: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const checkCurrentUser = async () => {
    const token = getStoredToken();
    if (!token) {
      setIsInitializing(false);
      return;
    }

    try {
      const res = await api.getMe();
      setCurrentUser(res.user);
      if (currentView === 'landing' || currentView === 'auth') {
        setCurrentView('dashboard');
      }
    } catch {
      setStoredToken(null);
      setCurrentUser(null);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    checkCurrentUser();
    api.getSystemMode().then((mode) => setStorageMode(mode.mode)).catch(() => {});
  }, []);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
    addToast('success', `Welcome back, ${user.fullName}!`, 'Signed In');
  };

  const handleLogout = async () => {
    await api.logout().catch(() => {});
    setCurrentUser(null);
    setCurrentView('landing');
    addToast('info', 'You have been safely signed out.');
  };

  const handleQuickLogin = async (role: 'owner' | 'reviewer' | 'beneficiary') => {
    const creds = {
      owner: { email: 'eleanor@example.com', pass: 'LegacyPass123!' },
      reviewer: { email: 'reviewer@example.com', pass: 'ReviewerPass123!' },
      beneficiary: { email: 'marcus@example.com', pass: 'MarcusPass123!' },
    }[role];

    try {
      const res = await api.login({ email: creds.email, password: creds.pass });
      handleAuthSuccess(res.user);
    } catch (err: any) {
      addToast('error', err.message || 'Quick login failed');
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium text-slate-400">Initializing LegacyLock...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Toast Notifications Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        onNavigate={setCurrentView}
        currentView={currentView}
        onLogout={handleLogout}
      />

      {/* App Workspace Body */}
      {!currentUser || currentView === 'landing' || currentView === 'auth' ? (
        <main className="flex-1">
          {currentView === 'landing' && (
            <LandingView onNavigate={setCurrentView} onQuickLogin={handleQuickLogin} />
          )}
          {currentView === 'auth' && (
            <AuthView onAuthSuccess={handleAuthSuccess} onNavigate={setCurrentView} />
          )}
          {currentView === 'help' && (
            <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6">
              <HelpView />
            </div>
          )}
        </main>
      ) : (
        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          {/* Sidebar */}
          <Sidebar
            currentView={currentView}
            onNavigate={setCurrentView}
            currentUser={currentUser}
            onLogout={handleLogout}
            isMobileOpen={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
            storageMode={storageMode}
          />

          {/* Main View Area */}
          <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {/* Mobile Header Toggle */}
            <div className="lg:hidden flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white"
              >
                <Menu className="w-4 h-4" />
                <span>Vault Menu</span>
              </button>

              <span className="text-xs font-semibold text-slate-600 capitalize">
                {currentView.replace('_', ' ')}
              </span>
            </div>

            {/* Dynamic View Router */}
            {currentView === 'dashboard' && (
              <DashboardView
                currentUser={currentUser}
                onNavigate={setCurrentView}
                storageMode={storageMode}
              />
            )}
            {currentView === 'vault' && <VaultView onNotify={addToast} />}
            {currentView === 'beneficiaries' && <BeneficiariesView onNotify={addToast} />}
            {currentView === 'instructions' && <InstructionsView onNotify={addToast} />}
            {currentView === 'checkin' && <CheckInView onNotify={addToast} />}
            {currentView === 'workflow' && (
              <WorkflowView currentUser={currentUser} onNotify={addToast} />
            )}
            {currentView === 'audit' && <AuditView onNotify={addToast} />}
            {currentView === 'settings' && (
              <SettingsView
                currentUser={currentUser}
                storageMode={storageMode}
                onNotify={addToast}
                onReloadUser={checkCurrentUser}
              />
            )}
            {currentView === 'help' && <HelpView />}
          </main>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white text-slate-500 text-xs py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <span>LegacyLock · Your Digital Legacy, Protected</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-400 font-normal">Interactive Software Prototype</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <button
              onClick={() => setCurrentView('help')}
              className="hover:text-slate-700 transition-colors"
            >
              Legal & Safety Disclaimers
            </button>
            <span aria-hidden="true">·</span>
            <span>Local Engine + Supabase Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
