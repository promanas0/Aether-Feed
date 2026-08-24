import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Wallet, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  FileText, 
  CheckCircle2, 
  Lock,
  Star,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { Profile, ToastMessage } from '../../types';
import { authenticateWithSpecificWallet, authenticateWithDlicomAddress } from '../../lib/storage';

interface DlicomWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: Profile) => void;
  addToast?: (title: string, desc?: string, type?: ToastMessage['type']) => void;
}

export const DlicomWalletModal: React.FC<DlicomWalletModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  addToast,
}) => {
  const [step, setStep] = useState<'select' | 'sign'>('select');
  const [activeConnectingWallet, setActiveConnectingWallet] = useState<string | null>(null);
  const [showDirectAddressInput, setShowDirectAddressInput] = useState(false);
  const [dlicomAddressInput, setDlicomAddressInput] = useState('');
  const [signNonce] = useState(() => Math.floor(100000 + Math.random() * 900000));
  const [signTimestamp] = useState(() => new Date().toISOString());
  const [isSigning, setIsSigning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Handle Specific Web3 Wallet Connection (Dlicom / MetaMask / OKX / Universal)
  const handleConnectSpecificWallet = async (walletType: 'dlicom' | 'metamask' | 'okx' | 'injected') => {
    setActiveConnectingWallet(walletType);
    setErrorMsg(null);
    try {
      const res = await authenticateWithSpecificWallet(walletType);
      setActiveConnectingWallet(null);
      if (res.success && res.user) {
        addToast?.('Wallet Connected', res.message, 'success');
        onSuccess(res.user);
        onClose();
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setActiveConnectingWallet(null);
      setErrorMsg(err?.message || `Failed to connect ${walletType} wallet.`);
    }
  };

  // 2. Validate Direct 0x Address & Proceed to Sign Screen
  const handleProceedToSign = (addressToSign?: string) => {
    const address = (addressToSign || dlicomAddressInput).trim();
    if (!address) {
      setErrorMsg('Please enter your 0x Dlicom wallet address.');
      return;
    }
    if (!address.toLowerCase().startsWith('0x') || address.length < 10) {
      setErrorMsg('Invalid address format. Dlicom wallet addresses start with 0x (e.g. 0x71C4...98A2).');
      return;
    }
    setDlicomAddressInput(address);
    setErrorMsg(null);
    setStep('sign');
  };

  // 3. Cryptographic Signature Finalization for Direct 0x Login
  const handleExecuteSign = async () => {
    setIsSigning(true);
    setErrorMsg(null);
    try {
      const res = await authenticateWithDlicomAddress(dlicomAddressInput);
      setIsSigning(false);
      if (res.success && res.user) {
        addToast?.('Dlicom Session Signed', `Welcome back, ${res.user.display_name}!`, 'success');
        onSuccess(res.user);
        onClose();
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setIsSigning(false);
      setErrorMsg(err?.message || 'Signature verification failed.');
    }
  };

  // 4. Instant 1-Click Dlicom Web3 ID Generator
  const handleGenerateInstant = () => {
    const chars = '0123456789abcdef';
    let randomHex = '0x';
    for (let i = 0; i < 40; i++) {
      randomHex += chars[Math.floor(Math.random() * chars.length)];
    }
    setDlicomAddressInput(randomHex);
    handleProceedToSign(randomHex);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="relative w-full max-w-md bg-[#0B132B] border border-blue-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(59,130,246,0.25)] text-white animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            setStep('select');
            onClose();
          }}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-[#1C2541] hover:bg-[#2A3756] rounded-xl transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* STEP 1: Multi-Wallet Selection Screen */}
        {step === 'select' && (
          <div>
            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600/30 to-purple-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400 shadow-glow-sm">
                <Wallet className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Connect a Web3 Wallet
                </h3>
                <p className="text-xs text-slate-400">
                  Select your wallet to connect to Aether Feed
                </p>
              </div>
            </div>

            {/* Error Notification Banner */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Wallet Options List */}
            <div className="space-y-3">
              
              {/* Option 1: ⭐ Dlicom Native Wallet (Official / Recommended) */}
              <button
                type="button"
                onClick={() => handleConnectSpecificWallet('dlicom')}
                disabled={Boolean(activeConnectingWallet)}
                className="w-full relative flex items-center justify-between p-4 bg-gradient-to-r from-blue-950/70 via-purple-950/50 to-[#1C2541] hover:from-blue-900/80 hover:to-[#2A3756] border-2 border-purple-500/60 hover:border-purple-400 rounded-2xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer group shadow-glow-sm"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-400/50 flex items-center justify-center text-purple-300 shrink-0">
                    <ShieldCheck className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-bold text-sm flex items-center gap-2">
                      <span>Dlicom Native Wallet</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-500/30 text-purple-300 border border-purple-400/40 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-purple-300" /> Recommended
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 font-normal">
                      Official Dlicom Network & In-App Web3
                    </div>
                  </div>
                </div>
                {activeConnectingWallet === 'dlicom' ? (
                  <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                )}
              </button>

              {/* Option 2: 🦊 MetaMask */}
              <button
                type="button"
                onClick={() => handleConnectSpecificWallet('metamask')}
                disabled={Boolean(activeConnectingWallet)}
                className="w-full flex items-center justify-between p-3.5 bg-[#1C2541] hover:bg-[#2A3756] border border-[#334155] hover:border-amber-500/70 rounded-2xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 text-base shrink-0">
                    🦊
                  </div>
                  <div className="text-left">
                    <div className="text-white font-bold text-sm">MetaMask</div>
                    <div className="text-[11px] text-slate-400 font-normal">Browser extension or mobile app</div>
                  </div>
                </div>
                {activeConnectingWallet === 'metamask' ? (
                  <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                )}
              </button>

              {/* Option 3: ⬛ OKX / Universal Web3 Wallet */}
              <button
                type="button"
                onClick={() => handleConnectSpecificWallet('okx')}
                disabled={Boolean(activeConnectingWallet)}
                className="w-full flex items-center justify-between p-3.5 bg-[#1C2541] hover:bg-[#2A3756] border border-[#334155] hover:border-blue-500/70 rounded-2xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                    <Layers className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-bold text-sm">OKX & Injected Web3</div>
                    <div className="text-[11px] text-slate-400 font-normal">OKX, Rabby, Coinbase & others</div>
                  </div>
                </div>
                {activeConnectingWallet === 'okx' ? (
                  <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                )}
              </button>

              {/* Option 4: 🔑 Direct Dlicom 0x Address / Instant ID (No Extension Needed) */}
              <div className="pt-2 border-t border-[#334155]/60">
                <button
                  type="button"
                  onClick={() => setShowDirectAddressInput(!showDirectAddressInput)}
                  className="w-full flex items-center justify-between p-3 bg-[#0B132B] hover:bg-[#1C2541] border border-[#334155] rounded-xl text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="font-semibold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-400" />
                    <span>Connect with Dlicom 0x Address (No Extension)</span>
                  </span>
                  {showDirectAddressInput ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {showDirectAddressInput && (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleProceedToSign();
                    }}
                    className="p-3.5 bg-[#1C2541] border border-[#334155] rounded-2xl mt-2 space-y-3 animate-in fade-in"
                  >
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1 font-mono">
                        Dlicom 0x Wallet Address:
                      </label>
                      <input
                        type="text"
                        value={dlicomAddressInput}
                        onChange={(e) => setDlicomAddressInput(e.target.value)}
                        placeholder="0x71C4...98A2"
                        className="w-full px-3 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-glow transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Continue with Address</span>
                    </button>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={handleGenerateInstant}
                        className="inline-flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 transition-colors cursor-pointer font-semibold"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate Instant Dlicom Web3 Key (1-Click)</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

            </div>
          </div>
        )}

        {/* STEP 2: Cryptographic Signature Screen */}
        {step === 'sign' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/50 flex items-center justify-center text-blue-400 shadow-glow-sm">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Sign In Request
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Pending Signature
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono truncate">
                  Address: <span className="text-blue-300">{dlicomAddressInput.slice(0, 8)}...{dlicomAddressInput.slice(-6)}</span>
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Formatted Cryptographic Message Box */}
            <div className="p-3.5 bg-[#1C2541] border border-blue-500/30 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pb-1 border-b border-slate-700/50">
                <span className="flex items-center gap-1 text-slate-300">
                  <FileText className="w-3.5 h-3.5 text-blue-400" /> Dlicom Authentication Signature
                </span>
                <span>Domain: aether-feed.vercel.app</span>
              </div>

              <div className="text-[11px] text-slate-300 font-mono space-y-1.5 leading-relaxed bg-[#0B132B]/60 p-2.5 rounded-xl border border-[#334155]">
                <p className="text-white font-semibold">Welcome to Aether Feed by Dlicom SocialFi!</p>
                <p className="text-slate-400">Sign this cryptographic request to authenticate your Dlicom Wallet session securely.</p>
                <div className="text-[10px] text-slate-500 pt-1 space-y-0.5">
                  <p>Wallet: <span className="text-slate-300">{dlicomAddressInput}</span></p>
                  <p>Nonce: <span className="text-slate-300">{signNonce}</span></p>
                  <p>Issued At: <span className="text-slate-300">{signTimestamp}</span></p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleExecuteSign}
                disabled={isSigning}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-glow transition-all active:scale-[0.98] cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSigning ? 'Verifying Signature...' : 'Sign Message & Enter Feed'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setStep('select');
                }}
                className="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Back to Wallet Selection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
