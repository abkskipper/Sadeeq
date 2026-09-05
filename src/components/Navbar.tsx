import React from 'react';
import {
  Shield,
  Activity,
  Bookmark,
  History,
  FileText,
  User,
  LogOut,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  activeTab: 'landing' | 'terminal' | 'history' | 'watchlist' | 'admin';
  setActiveTab: (tab: 'landing' | 'terminal' | 'history' | 'watchlist' | 'admin') => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  watchlistCount: number;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenAuth,
  onSignOut,
  watchlistCount,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#0b0e14]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-2.5 text-left transition hover:opacity-90 group"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 via-slate-800 to-blue-500/20 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-950/40 group-hover:border-emerald-400 transition">
              <Shield className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white text-lg shrink-0">TradeGuard</span>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 font-mono whitespace-nowrap shrink-0">
                  AI v2
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Institutional Chart Analyst</p>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('terminal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'terminal'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              Terminal
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'history'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <History className="h-3.5 w-3.5 text-blue-400" />
              Signals
              {historyCount > 0 && (
                <span className="rounded-full bg-slate-700 px-1.5 py-0.2 text-[10px] text-slate-300 font-mono">
                  {historyCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('watchlist')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'watchlist'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Bookmark className="h-3.5 w-3.5 text-amber-400" />
              Watchlist
              {watchlistCount > 0 && (
                <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.2 text-[10px] text-amber-300 font-mono">
                  {watchlistCount}
                </span>
              )}
            </button>

            {user?.role === 'admin' || user?.role === 'super_admin' ? (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeTab === 'admin'
                    ? 'bg-purple-950/60 text-purple-200 border border-purple-800 shadow-sm'
                    : 'text-purple-400 hover:text-purple-200 hover:bg-purple-950/30'
                }`}
              >
                <FileText className="h-3.5 w-3.5 text-purple-400" />
                Admin Logs
              </button>
            ) : null}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* User Account / Auth */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-medium text-slate-200">{user.name}</span>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block"></span>
                  {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Pro Desk'}
                </span>
              </div>
              <button
                onClick={onSignOut}
                title="Sign Out"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400 hover:border-rose-900/50 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <User className="h-3.5 w-3.5 text-slate-400" />
              Sign In
            </button>
          )}

          {/* Primary Action Button */}
          {activeTab !== 'terminal' ? (
            <button
              onClick={() => setActiveTab('terminal')}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 active:scale-[0.98] transition cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-slate-950 fill-slate-950" />
              Open Terminal
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('landing')}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
            >
              Overview
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
