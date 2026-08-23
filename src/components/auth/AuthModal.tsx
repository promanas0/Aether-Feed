import React, { useState } from 'react';
import { X, Lock, Mail, ArrowRight, Layers, AlertCircle, Info, Wallet, Sparkles } from 'lucide-react';
import type { Profile } from '../../types';
import { checkEmailExists, authenticateWithWeb3Wallet } from '../../lib/storage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: (email: string, pass: string) => void;
  onSignUpStart: (email: string, pass: string) => void;
  onQuickSelectDemo: (userId: string) => void;
  demoProfiles: Profile[];
  isSupabaseLive?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSignIn,
  onSignUpStart,
  onQuickSelectDemo,
  demoProfiles,
  isSupabaseLive = false,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);

  if (!isOpen) return null;

  const handleWalletAuth = async () => {
    setIsConnectingWallet(true);
    setValidationError(null);
    try {
      const res = await authenticateWithWeb3Wallet();
      setIsConnectingWallet(false);
      if (res.success && res.user) {
        onClose();
      } else {
        setValidationError(res.message);
      }
    } catch (err: any) {
      setIsConnectingWallet(false);
      setValidationError(err?.message || 'Could not connect Web3 Wallet.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setValidationError('Please fill in both email and password.');
      return;
    }

    if (cleanPassword.length < 6) {
      setValidationError('Password must be at least 6 characters.');
      return;
    }

    if (isSignUp) {
      const exists = await checkEmailExists(cleanEmail);
      if (exists) {
        setValidationError('An account already exists with this email address. Please switch to Sign In.');
        return;
      }
      onSignUpStart(cleanEmail, cleanPassword);
    } else {
      onSignIn(cleanEmail, cleanPassword);
    }
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B132B]/90 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-[#1C2541] border border-[#334155] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header Bar */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-[#334155]/60 bg-[#1E293B]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-glow-sm">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Aether Gatekeeper
              </h2>
              <p className="text-[11px] text-slate-400">
                {isSignUp ? 'Create your creator account' : 'Sign in to your account'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#334155] transition-colors cursor-pointer"
            aria-label="Close auth modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: Sign In vs Create Account */}
        <div className="p-6 pt-5">
          
          {/* 1-Click Native Web3 Wallet Button */}
          <div className="mb-4">
            <button
              type="button"
              onClick={handleWalletAuth}
              disabled={isConnectingWallet}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-xl text-xs shadow-[0_0_15px_rgba(245,158,11,0.35)] transition-all active:scale-95 cursor-pointer border border-amber-300/60"
            >
              <Wallet className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>{isConnectingWallet ? 'Connecting Wallet...' : 'Connect Web3 Wallet (1-Click Login)'}</span>
              <Sparkles className="w-3 h-3 text-amber-900" />
            </button>

            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-slate-700/50" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                Or with Email
              </span>
              <div className="flex-1 h-px bg-slate-700/50" />
            </div>
          </div>

          <div className="grid grid-cols-2 p-1 bg-[#0B132B] border border-[#334155] rounded-xl mb-4">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setValidationError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                !isSignUp
                  ? 'bg-blue-600 text-white shadow-glow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setValidationError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                isSignUp
                  ? 'bg-blue-600 text-white shadow-glow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Validation Notice */}
          {validationError && (
            <div className="mb-3 p-2.5 bg-rose-950/50 border border-rose-600/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="creator@aetherfeed.io"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-glow transition-all active:scale-95"
            >
              <span>{isSignUp ? 'Proceed to Profile Setup' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Login Option */}
          <div className="mt-5 pt-4 border-t border-[#334155]/60">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Quick Sign In with Seeded Curators
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoProfiles.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onQuickSelectDemo(p.id)}
                  className="flex items-center gap-2 p-2 bg-[#0B132B] hover:bg-[#2A3756] border border-[#334155] hover:border-blue-500/50 rounded-xl text-left transition-all group"
                >
                  <img src={p.avatar_url} alt="" className="w-6 h-6 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate group-hover:text-blue-300">
                      {p.display_name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono truncate">
                      @{p.username}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
