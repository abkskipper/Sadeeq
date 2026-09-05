import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Terminal } from './components/Terminal';
import { SignalHistory } from './components/SignalHistory';
import { Watchlist } from './components/Watchlist';
import { AdminLogs } from './components/AdminLogs';
import { AuthModal } from './components/AuthModal';
import { TradeSignal, WatchlistItem, UserProfile } from './types';

export function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'landing' | 'terminal' | 'history' | 'watchlist' | 'admin'>('landing');

  // User State
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('tradeguard_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    // Default demo user
    return {
      id: 'usr_trader_demo',
      email: 'trader@tradeguard.ai',
      name: 'Prop Desk Trader',
      role: 'trader',
      created_at: new Date().toISOString(),
    };
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Signals State
  const [signals, setSignals] = useState<TradeSignal[]>([]);

  // Watchlist State
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  // Selected Signal for Inspection
  const [inspectedSignal, setInspectedSignal] = useState<TradeSignal | null>(null);

  // Fetch initial data from server API
  const fetchSignals = async () => {
    try {
      const res = await fetch('/api/signals', {
        headers: {
          Authorization: user ? `Bearer ${user.id}` : 'Bearer usr_trader_demo',
        },
      });
      const data = await res.json();
      if (data.success && data.signals) {
        setSignals(data.signals);
      }
    } catch (e) {
      console.error('Failed to load signals', e);
    }
  };

  const fetchWatchlist = async () => {
    try {
      const res = await fetch('/api/watchlist', {
        headers: {
          Authorization: user ? `Bearer ${user.id}` : 'Bearer usr_trader_demo',
        },
      });
      const data = await res.json();
      if (data.success && data.watchlist) {
        setWatchlist(data.watchlist);
      }
    } catch (e) {
      console.error('Failed to load watchlist', e);
    }
  };

  useEffect(() => {
    fetchSignals();
    fetchWatchlist();
  }, [user]);

  // Auth Handlers
  const handleAuthSuccess = (u: UserProfile) => {
    setUser(u);
    localStorage.setItem('tradeguard_user', JSON.stringify(u));
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem('tradeguard_user');
  };

  // Watchlist Handlers
  const isWatchlisted = (signalId: string) => {
    return watchlist.some(w => w.signal_id === signalId);
  };

  const handleSaveToWatchlist = async (signal: TradeSignal) => {
    if (isWatchlisted(signal.id)) return;

    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: user ? `Bearer ${user.id}` : 'Bearer usr_trader_demo',
        },
        body: JSON.stringify({
          signalId: signal.id,
          userId: user?.id || 'usr_trader_demo',
          notes: `Setup identified on ${signal.timeframe} via ${signal.strategy}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchWatchlist();
      }
    } catch (e) {
      console.error('Failed to add to watchlist', e);
    }
  };

  const handleRemoveFromWatchlist = async (id: string) => {
    try {
      const res = await fetch(`/api/watchlist/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: user ? `Bearer ${user.id}` : 'Bearer usr_trader_demo',
        },
      });
      if (res.ok) {
        setWatchlist(prev => prev.filter(w => w.id !== id));
      }
    } catch (e) {
      console.error('Failed to remove from watchlist', e);
    }
  };

  const handleUpdateWatchlistStatus = async (
    id: string,
    status: 'ACTIVE' | 'TRIGGERED' | 'INVALIDATED' | 'CLOSED'
  ) => {
    try {
      const res = await fetch(`/api/watchlist/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: user ? `Bearer ${user.id}` : 'Bearer usr_trader_demo',
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setWatchlist(prev =>
          prev.map(w => (w.id === id ? { ...w, status } : w))
        );
      }
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  const handleUpdateWatchlistNotes = async (id: string, notes: string) => {
    try {
      const res = await fetch(`/api/watchlist/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: user ? `Bearer ${user.id}` : 'Bearer usr_trader_demo',
        },
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        setWatchlist(prev =>
          prev.map(w => (w.id === id ? { ...w, notes } : w))
        );
      }
    } catch (e) {
      console.error('Failed to update notes', e);
    }
  };

  // Signal History Handlers
  const handleUpdateSignalOutcome = async (
    signalId: string,
    outcome: 'WIN' | 'LOSS' | 'BREAKEVEN' | 'PENDING',
    realizedR?: number
  ) => {
    try {
      const res = await fetch(`/api/signals/${signalId}/outcome`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: user ? `Bearer ${user.id}` : 'Bearer usr_trader_demo',
        },
        body: JSON.stringify({ outcome, realizedR }),
      });
      if (res.ok) {
        setSignals(prev =>
          prev.map(s => (s.id === signalId ? { ...s, outcome, realizedR } : s))
        );
      }
    } catch (e) {
      console.error('Failed to update outcome', e);
    }
  };

  const handleDeleteSignal = async (signalId: string) => {
    try {
      const res = await fetch(`/api/signals/${signalId}`, {
        method: 'DELETE',
        headers: {
          Authorization: user ? `Bearer ${user.id}` : 'Bearer usr_trader_demo',
        },
      });
      if (res.ok) {
        setSignals(prev => prev.filter(s => s.id !== signalId));
      }
    } catch (e) {
      console.error('Failed to delete signal', e);
    }
  };

  const handleSelectSignalToInspect = (sig: TradeSignal) => {
    setInspectedSignal(sig);
    setActiveTab('terminal');
  };

  const handleNewSignalGenerated = (sig: TradeSignal) => {
    setSignals(prev => [sig, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 font-sans flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onSignOut={handleSignOut}
        watchlistCount={watchlist.length}
        historyCount={signals.length}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {activeTab === 'landing' && (
          <LandingPage
            onOpenTerminal={() => setActiveTab('terminal')}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

        {activeTab === 'terminal' && (
          <Terminal
            user={user}
            onOpenAuth={() => setAuthModalOpen(true)}
            onSaveToWatchlist={handleSaveToWatchlist}
            isWatchlisted={isWatchlisted}
            onSignalGenerated={handleNewSignalGenerated}
          />
        )}

        {activeTab === 'history' && (
          <SignalHistory
            signals={signals}
            onSelectSignal={handleSelectSignalToInspect}
            onUpdateOutcome={handleUpdateSignalOutcome}
            onSaveToWatchlist={handleSaveToWatchlist}
            isWatchlisted={isWatchlisted}
            onDeleteSignal={handleDeleteSignal}
          />
        )}

        {activeTab === 'watchlist' && (
          <Watchlist
            items={watchlist}
            onOpenSignalInTerminal={handleSelectSignalToInspect}
            onRemoveItem={handleRemoveFromWatchlist}
            onUpdateStatus={handleUpdateWatchlistStatus}
            onUpdateNotes={handleUpdateWatchlistNotes}
          />
        )}

        {activeTab === 'admin' && <AdminLogs user={user} />}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
export default App;
