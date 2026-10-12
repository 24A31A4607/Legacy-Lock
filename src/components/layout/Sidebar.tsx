import React from 'react';
import {
  LayoutDashboard,
  FolderLock,
  Users2,
  ScrollText,
  HeartHandshake,
  GitPullRequest,
  FileClock,
  Settings,
  HelpCircle,
  Database,
  Cloud,
  LogOut,
  X,
} from 'lucide-react';
import { User } from '../../types/index.js';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  currentUser: User;
  onLogout: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  storageMode: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  currentUser,
  onLogout,
  isMobileOpen,
  onCloseMobile,
  storageMode,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vault', label: 'Digital Vault', icon: FolderLock },
    { id: 'beneficiaries', label: 'Beneficiaries', icon: Users2 },
    { id: 'instructions', label: 'Legacy Instructions', icon: ScrollText },
    { id: 'checkin', label: 'Safety Cadence', icon: HeartHandshake },
    {
      id: 'workflow',
      label: 'Inheritance Protocol',
      icon: GitPullRequest,
      badge: currentUser.role === 'reviewer' ? 'Review Queue' : undefined,
    },
    { id: 'audit', label: 'Audit & Activity', icon: FileClock },
    { id: 'settings', label: 'Settings & Security', icon: Settings },
    { id: 'help', label: 'Help & Transparency', icon: HelpCircle },
  ];

  const handleItemClick = (id: string) => {
    onNavigate(id);
    onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800">
      {/* User Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          {currentUser.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.fullName}
              className="w-10 h-10 rounded-xl object-cover border border-slate-700"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-indigo-900/60 border border-indigo-700 text-indigo-300 font-bold flex items-center justify-center">
              {currentUser.fullName.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{currentUser.fullName}</div>
            <div className="text-xs text-slate-400 truncate">{currentUser.email}</div>
          </div>
        </div>

        {/* Status & Role line */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2.5">
          <span className="capitalize text-indigo-300 font-medium">Role: {currentUser.role}</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">
            {storageMode === 'supabase' ? 'Supabase Sync' : 'Local Persistent'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info & Disclaimers */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 space-y-3">
        <div className="flex items-center gap-2">
          {storageMode === 'supabase' ? (
            <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <Database className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          )}
          <span className="truncate">
            Engine: {storageMode === 'supabase' ? 'Supabase Cloud' : 'Local JSON + Server FS'}
          </span>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-[calc(100vh-4rem)] sticky top-16">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-slate-900 shadow-2xl z-10 flex flex-col">
            <div className="p-4 flex justify-between items-center border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-300">Navigation</span>
              <button
                onClick={onCloseMobile}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{content}</div>
          </div>
        </div>
      )}
    </>
  );
};
