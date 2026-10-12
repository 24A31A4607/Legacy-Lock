import React from 'react';
import { Logo } from '../ui/Logo.js';
import { User } from '../../types/index.js';
import { ShieldCheck, LogIn, LogOut, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onNavigate: (view: string) => void;
  currentView: string;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onNavigate,
  currentView,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 h-16">
        {/* Zone 1: Brand wordmark / single element */}
        <div
          onClick={() => onNavigate(currentUser ? 'dashboard' : 'landing')}
          className="cursor-pointer whitespace-nowrap shrink-0"
        >
          <Logo size="md" />
        </div>

        {/* Zone 2: 4-5 clean single-line nav links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          {!currentUser ? (
            <>
              <button
                onClick={() => onNavigate('landing')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
                  currentView === 'landing' ? 'text-indigo-600 font-semibold' : ''
                }`}
              >
                Product Tour
              </button>
              <button
                onClick={() => onNavigate('landing')}
                className="transition-colors whitespace-nowrap shrink-0 hover:text-slate-900"
              >
                Security Model
              </button>
              <button
                onClick={() => onNavigate('help')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
                  currentView === 'help' ? 'text-indigo-600 font-semibold' : ''
                }`}
              >
                Legal Transparency
              </button>
              <button
                onClick={() => onNavigate('help')}
                className="transition-colors whitespace-nowrap shrink-0 hover:text-slate-900"
              >
                FAQs
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onNavigate('dashboard')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
                  currentView === 'dashboard' ? 'text-indigo-600 font-semibold' : ''
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => onNavigate('vault')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
                  currentView === 'vault' ? 'text-indigo-600 font-semibold' : ''
                }`}
              >
                Digital Vault
              </button>
              <button
                onClick={() => onNavigate('beneficiaries')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
                  currentView === 'beneficiaries' ? 'text-indigo-600 font-semibold' : ''
                }`}
              >
                Beneficiaries
              </button>
              <button
                onClick={() => onNavigate('checkin')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
                  currentView === 'checkin' ? 'text-indigo-600 font-semibold' : ''
                }`}
              >
                Safety Cadence
              </button>
              <button
                onClick={() => onNavigate('workflow')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
                  currentView === 'workflow' ? 'text-indigo-600 font-semibold' : ''
                }`}
              >
                Inheritance Protocol
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {!currentUser ? (
            <button
              onClick={() => onNavigate('auth')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Access Vault</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div
                onClick={() => onNavigate('settings')}
                className="cursor-pointer flex items-center gap-2 py-1 px-2.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.fullName}
                    className="w-7 h-7 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center justify-center">
                    {currentUser.fullName.charAt(0)}
                  </div>
                )}
                <div className="hidden lg:block text-left text-xs">
                  <div className="font-semibold text-slate-800 truncate max-w-[120px]">
                    {currentUser.fullName}
                  </div>
                  <div className="text-slate-400 text-[10px] capitalize">{currentUser.role}</div>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Sign out"
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
