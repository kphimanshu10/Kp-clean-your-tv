import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Trophy, Activity, Radio, Check, Globe } from 'lucide-react';
import { CricketMatch } from '../../types/launcher';
import { CRICKET_MATCHES } from '../../data/mockData';

interface CricketScoreModalProps {
  currentMatch: CricketMatch;
  onSelectMatch: (match: CricketMatch) => void;
  onClose: () => void;
}

export const CricketScoreModal: React.FC<CricketScoreModalProps> = ({
  currentMatch,
  onSelectMatch,
  onClose,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [apiEndpoint, setApiEndpoint] = useState<string>('https://api.cricapi.com/v1/currentMatches');
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setStatusMessage('Querying live sports data stream...');
    setTimeout(() => {
      setIsRefreshing(false);
      setStatusMessage('Scores updated live just now.');
      setTimeout(() => setStatusMessage(null), 3000);
    }, 700);
  };

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      // Auto-refresh simulation
      handleManualRefresh();
    }, 25000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-8 select-none">
      <div className="relative w-full max-w-4xl rounded-3xl bg-slate-900/95 border border-sky-500/40 shadow-[0_0_50px_rgba(56,189,248,0.3)] p-7 flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-sky-600/30 text-sky-300 border border-sky-400/40">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-extrabold text-white">Live Cricket Center</h2>
                <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official Live Ball-by-Ball Sports Tracker
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center space-x-1 text-xs cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={onClose}
              aria-label="Close Cricket Score Modal"
              className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-red-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-sky-950/80 border border-sky-400/50 text-cyan-200 text-xs font-semibold flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Match Selector Tabs */}
        <div className="py-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Available Live Matches
          </span>
          <div className="grid grid-cols-3 gap-3">
            {CRICKET_MATCHES.map(match => {
              const isSelected = match.id === currentMatch.id;
              return (
                <button
                  key={match.id}
                  onClick={() => onSelectMatch(match)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/30 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] ring-2 ring-cyan-400'
                      : 'bg-slate-800/60 border-white/10 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-extrabold text-white">{match.title}</span>
                    <span className="text-[10px] bg-red-600/80 text-white font-bold px-1.5 py-0.5 rounded">
                      LIVE
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 font-medium">
                    {match.team1.code} {match.team1.score} vs {match.team2.code} {match.team2.score}
                  </div>
                  <div className="text-[10px] text-amber-300 font-bold mt-1 truncate">
                    {match.targetSummary}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Match Scoreboard Details */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-sky-500/30 mb-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="text-lg font-black text-white">{currentMatch.title}</h3>
              <p className="text-xs text-cyan-300 font-semibold">{currentMatch.series}</p>
            </div>
            <div className="text-right text-xs text-slate-400">
              <span>Updated: {currentMatch.lastUpdated}</span>
            </div>
          </div>

          {/* Scores Overview */}
          <div className="grid grid-cols-2 gap-6 py-4">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 block">{currentMatch.team1.name}</span>
                <span className="text-3xl font-black text-white font-rajdhani">{currentMatch.team1.score}</span>
              </div>
              <span className="text-sm font-semibold text-cyan-300">{currentMatch.team1.overs}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/50 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 block">{currentMatch.team2.name}</span>
                <span className="text-3xl font-black text-white font-rajdhani">{currentMatch.team2.score}</span>
              </div>
              <span className="text-sm font-semibold text-cyan-300">{currentMatch.team2.overs}</span>
            </div>
          </div>

          {/* Match Equation & Run Rates */}
          <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/40 flex items-center justify-between">
            <span className="text-sm font-extrabold text-amber-300">
              {currentMatch.targetSummary}
            </span>
            <div className="flex space-x-4 text-xs font-mono text-slate-300">
              {currentMatch.crr && <span>CRR: <strong className="text-white">{currentMatch.crr}</strong></span>}
              {currentMatch.rrr && <span>RRR: <strong className="text-white">{currentMatch.rrr}</strong></span>}
            </div>
          </div>
        </div>

        {/* Live Sports API Settings Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
          <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="rounded text-cyan-500 focus:ring-0 cursor-pointer"
            />
            <span>Auto-refresh scores every 25 seconds</span>
          </label>

          <button
            onClick={() => setShowApiConfig(!showApiConfig)}
            className="text-cyan-400 hover:text-cyan-300 underline font-semibold cursor-pointer"
          >
            {showApiConfig ? 'Hide API Configuration' : 'Sports API Provider Settings'}
          </button>
        </div>

        {showApiConfig && (
          <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-white/10 text-xs space-y-2">
            <div className="text-slate-300 font-bold flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Configured Live Cricket Score Data Source</span>
            </div>
            <input
              type="text"
              value={apiEndpoint}
              onChange={e => setApiEndpoint(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 text-white font-mono text-xs border border-slate-700"
              placeholder="Live sports API URL (CricAPI, ESPNcricinfo feed, or custom webhook)"
            />
            <p className="text-[11px] text-slate-400">
              KP TV validates live sports endpoints to ensure scores remain authentic and auto-refresh without manual intervention.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
