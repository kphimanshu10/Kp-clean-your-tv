import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  Trophy,
  Globe,
  WifiOff,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { CricketApiConfig, CricketMatch, CricketServiceStatus } from '../../types/launcher';
import { getCricketApiConfig, saveCricketApiConfig } from '../../services/cricketService';

interface CricketScoreModalProps {
  matches: CricketMatch[];
  currentMatch: CricketMatch | null;
  serviceStatus: CricketServiceStatus;
  errorMessage: string | null;
  lastUpdated: string | null;
  onSelectMatch: (match: CricketMatch) => void;
  onRefresh: (configOverride?: CricketApiConfig) => Promise<void>;
  onClose: () => void;
}

export const CricketScoreModal: React.FC<CricketScoreModalProps> = ({
  matches,
  currentMatch,
  serviceStatus,
  errorMessage,
  lastUpdated,
  onSelectMatch,
  onRefresh,
  onClose,
}) => {
  const initialConfig = getCricketApiConfig();
  const [endpointUrl, setEndpointUrl] = useState<string>(initialConfig.endpointUrl);
  const [apiKey, setApiKey] = useState<string>(initialConfig.apiKey);
  const [showApiConfig, setShowApiConfig] = useState<boolean>(serviceStatus === 'unconfigured');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const handleSaveAndFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig: CricketApiConfig = {
      endpointUrl: endpointUrl.trim() || 'https://api.cricapi.com/v1/currentMatches',
      apiKey: apiKey.trim(),
    };
    await saveCricketApiConfig(newConfig);
    setSavedNotice('API credentials sent securely to backend proxy.');
    setTimeout(() => setSavedNotice(null), 3000);
    await onRefresh();
  };

  const handleClearConfig = async () => {
    const emptyConfig: CricketApiConfig = {
      endpointUrl: 'https://api.cricapi.com/v1/currentMatches',
      apiKey: '',
    };
    setEndpointUrl(emptyConfig.endpointUrl);
    setApiKey('');
    await saveCricketApiConfig(emptyConfig);
    await onRefresh(emptyConfig);
  };

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
                {serviceStatus === 'live' ? (
                  <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    LIVE API
                  </span>
                ) : (
                  <span className="bg-slate-800 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-amber-400/30">
                    {serviceStatus}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Secure server-side proxy integration (Zero hardcoded demo scores)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => onRefresh()}
              disabled={serviceStatus === 'loading'}
              className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors flex items-center space-x-1.5 text-xs font-bold cursor-pointer"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  serviceStatus === 'loading' ? 'animate-spin text-cyan-400' : ''
                }`}
              />
              <span>Refresh Now</span>
            </button>

            <button
              onClick={() => setShowApiConfig(!showApiConfig)}
              className="px-3 py-2 rounded-xl bg-blue-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-blue-900 text-xs font-bold transition-colors cursor-pointer"
            >
              {showApiConfig ? 'Hide API Settings' : 'Configure API'}
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

        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Unconfigured State Banner */}
          {serviceStatus === 'unconfigured' && (
            <div className="p-5 rounded-2xl bg-slate-950/90 border border-amber-500/40 flex flex-col items-center text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-400" />
              <h3 className="text-base font-black text-white">
                Live score service not configured.
              </h3>
              <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                KP TV never displays fake or sample scores as real-time scores, and never embeds private keys in frontend JavaScript bundles. Configure <code className="text-cyan-300">CRICKET_API_KEY</code> on the server or enter your key below to configure the backend proxy.
              </p>
            </div>
          )}

          {/* Offline State Banner */}
          {serviceStatus === 'offline' && (
            <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/40 flex items-center space-x-3 text-amber-200 text-xs">
              <WifiOff className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold block text-white">TV Network Offline</span>
                <span>{errorMessage || 'Check Wi-Fi connection and press Refresh.'}</span>
              </div>
            </div>
          )}

          {/* Error State Banner */}
          {serviceStatus === 'error' && (
            <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/40 flex items-center space-x-3 text-red-200 text-xs">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <span className="font-bold block text-white">Live Score Request Failed</span>
                <span>{errorMessage || 'Unable to fetch live match data.'}</span>
              </div>
            </div>
          )}

          {/* Loading State */}
          {serviceStatus === 'loading' && (
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-cyan-500/30 flex items-center justify-center space-x-3 text-cyan-300 text-xs font-bold">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Connecting to configured live cricket API...</span>
            </div>
          )}

          {/* Live Match Selector & Active Scoreboard */}
          {serviceStatus === 'live' && currentMatch && (
            <>
              {matches.length > 1 && (
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Active Matches ({matches.length})
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    {matches.map(match => {
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
                            <span className="text-sm font-extrabold text-white truncate">
                              {match.title}
                            </span>
                            {match.isLive && (
                              <span className="text-[10px] bg-red-600/80 text-white font-bold px-1.5 py-0.5 rounded">
                                LIVE
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-300 font-medium truncate">
                            {match.team1.code} {match.team1.score} vs {match.team2.code}{' '}
                            {match.team2.score}
                          </div>
                          <div className="text-[10px] text-amber-300 font-bold mt-1 truncate">
                            {match.targetSummary}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-sky-500/30">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div>
                    <h3 className="text-lg font-black text-white">{currentMatch.title}</h3>
                    <p className="text-xs text-cyan-300 font-semibold">{currentMatch.series}</p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <span>Last updated: {lastUpdated || currentMatch.lastUpdated}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 py-4">
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-400 block">
                        {currentMatch.team1.name} ({currentMatch.team1.code})
                      </span>
                      <span className="text-3xl font-black text-white font-rajdhani">
                        {currentMatch.team1.score}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-cyan-300">
                      {currentMatch.team1.overs}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/50 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-400 block">
                        {currentMatch.team2.name} ({currentMatch.team2.code})
                      </span>
                      <span className="text-3xl font-black text-white font-rajdhani">
                        {currentMatch.team2.score}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-cyan-300">
                      {currentMatch.team2.overs}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/40 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-amber-300">
                    {currentMatch.targetSummary}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {currentMatch.matchType}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* API Configuration Form (kept out of source code, stored locally) */}
          {showApiConfig && (
            <form
              onSubmit={handleSaveAndFetch}
              className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 text-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="text-white font-bold flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>Live Cricket Score API Configuration</span>
                </div>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Stored locally only • Never in source code
                </span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">API Endpoint URL</label>
                <input
                  type="url"
                  value={endpointUrl}
                  onChange={e => setEndpointUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 text-white font-mono text-xs border border-slate-700 focus:outline-none focus:border-cyan-400"
                  placeholder="https://api.cricapi.com/v1/currentMatches"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  <span>API Key (CricAPI or custom provider key)</span>
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 text-white font-mono text-xs border border-slate-700 focus:outline-none focus:border-cyan-400"
                  placeholder="Enter your API key..."
                />
              </div>

              {savedNotice && (
                <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{savedNotice}</span>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={handleClearConfig}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                >
                  Clear Key
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                >
                  Save & Connect Live Feed
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
