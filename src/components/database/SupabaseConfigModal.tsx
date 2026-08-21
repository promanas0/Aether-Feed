import React, { useState, useEffect } from 'react';
import { X, Database, Check, AlertCircle, RefreshCw, Radio, ExternalLink } from 'lucide-react';
import { 
  getStoredSupabaseConfig, 
  saveSupabaseConfig, 
  testSupabaseConnection, 
  SupabaseConfig 
} from '../../lib/supabaseClient';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const config = getStoredSupabaseConfig();
      setUrl(config.url);
      setAnonKey(config.anonKey);
      setIsEnabled(config.isEnabled);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) return;

    setIsTesting(true);
    setTestResult(null);

    const result = await testSupabaseConnection(url.trim(), anonKey.trim());
    setTestResult(result);
    setIsTesting(false);

    if (result.success) {
      const newConfig: SupabaseConfig = {
        url: url.trim(),
        anonKey: anonKey.trim(),
        isEnabled: true,
      };
      saveSupabaseConfig(newConfig);
      setIsEnabled(true);
    }
  };

  const handleToggleMode = () => {
    const nextState = !isEnabled;
    setIsEnabled(nextState);
    saveSupabaseConfig({
      url,
      anonKey,
      isEnabled: nextState,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B132B]/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#1C2541] border border-[#334155] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[#334155] bg-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-glow-sm">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Supabase Live Connection & Debugger
              </h2>
              <p className="text-xs text-slate-400">
                Connect your real Supabase project or toggle Local Engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#334155] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleTestAndSave} className="p-6 space-y-4">
          
          {/* Mode Selector */}
          <div className="p-3 bg-[#0B132B] border border-[#334155] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Radio className={`w-4 h-4 ${isEnabled ? 'text-blue-400 animate-pulse' : 'text-slate-500'}`} />
              <div>
                <p className="text-xs font-semibold text-white">
                  {isEnabled ? 'Live Supabase Backend Active' : 'Local High-Speed Engine Active'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isEnabled ? 'Syncs with remote PostgreSQL DB' : 'Instant local persistence with 0 latency'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleMode}
              disabled={!url || !anonKey}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 ${
                isEnabled
                  ? 'bg-blue-600 text-white shadow-glow-sm'
                  : 'bg-[#1E293B] text-slate-300 hover:text-white border border-[#334155]'
              }`}
            >
              {isEnabled ? 'Live' : 'Local'}
            </button>
          </div>

          {/* Supabase URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Supabase Project URL
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full px-3.5 py-2.5 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono transition-all"
            />
          </div>

          {/* Anon Key */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Supabase Anon Public API Key
            </label>
            <input
              type="text"
              required
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3.5 py-2.5 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono transition-all text-ellipsis"
            />
          </div>

          {/* Quick Troubleshooting Guide */}
          <div className="p-3 bg-[#0F172A] border border-[#334155] rounded-xl text-[11px] text-slate-400 space-y-1.5">
            <p className="font-semibold text-slate-300">
              Supabase Auth Debug Checklist:
            </p>
            <p>
              1. <strong>Confirm Email:</strong> In Supabase Dashboard &rarr; Auth &rarr; Providers &rarr; Email, disable "Confirm email" for instant password signup.
            </p>
            <p>
              2. <strong>RLS Trigger:</strong> In SQL Editor, execute <span className="font-mono text-blue-400">supabase/schema.sql</span> to enable automatic profile creation.
            </p>
          </div>

          {/* Test Status Banner */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2 text-xs ${
                testResult.success
                  ? 'bg-blue-950/40 border-blue-600/40 text-blue-300'
                  : 'bg-rose-950/40 border-rose-600/40 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <Check className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{testResult.success ? 'Success' : 'Connection Error'}</p>
                <p className="text-[11px] opacity-90 mt-0.5">{testResult.message}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#0B132B] hover:bg-[#1E293B] text-slate-300 border border-[#334155] rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isTesting || !url.trim() || !anonKey.trim()}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-glow-sm transition-all"
            >
              {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{isTesting ? 'Testing Connection...' : 'Test & Save'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
