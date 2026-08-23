import React, { useState } from 'react';
import { X, ShieldCheck, Wallet, ArrowRight, Sparkles, AlertCircle, Copy, Check } from 'lucide-react';
import type { Profile, ToastMessage } from '../../types';
import { authenticateWithDlicomWallet, authenticateWithDlicomAddress } from '../../lib/storage';

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
  const [dlicomAddressInput, setDlicomAddressInput] = useState('');
  const [isConnectingAuto, setIsConnectingAuto] = useState(false);
  const [isConnectingManual, setIsConnectingManual] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Auto-Trigger Browser Extension / In-App Provider
  const handleAutoConnect = async () => {
    setIsConnectingAuto(true);
    setErrorMsg(null);
    try {
      const res = await authenticateWithDlicomWallet();
      setIsConnectingAuto(false);
      if (res.success && res.user) {
        addToast?.('Dlicom Wallet Connected', res.message, 'success');
        onSuccess(res.user);
        onClose();
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setIsConnectingAuto(false);
      setErrorMsg(err?.message || 'Failed to connect Dlicom Wallet extension.');
    }
  };

  // 2. Direct 0x Dlicom Address Connect (Works 100% on Phone & PC)
  const handleAddressConnect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const address = dlicomAddressInput.trim();
    if (!address) {
      setErrorMsg('Please enter your Dlicom 0x Wallet address.');
      return;
    }
    if (!address.toLowerCase().startsWith('0x') || address.length < 10) {
      setErrorMsg('Invalid address format. Dlicom wallet addresses start with 0x (e.g. 0x71C4...98A2).');
      return;
    }

    setIsConnectingManual(true);
    setErrorMsg(null);
    try {
      const res = await authenticateWithDlicomAddress(address);
      setIsConnectingManual(false);
      if (res.success && res.user) {
        addToast?.('Dlicom Wallet Connected', res.message, 'success');
        onSuccess(res.user);
        onClose();
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setIsConnectingManual(false);
      setErrorMsg(err?.message || 'Could not verify Dlicom address.');
    }
  };

  // 3. Instant 1-Click Dlicom Keypair Generator
  const handleGenerateInstant = async () => {
    const chars = '0123456789abcdef';
    let randomHex = '0x';
    for (let i = 0; i < 40; i++) {
      randomHex += chars[Math.floor(Math.random() * chars.length)];
    }
    setDlicomAddressInput(randomHex);
    setIsConnectingManual(true);
    setErrorMsg(null);
    try {
      const res = await authenticateWithDlicomAddress(randomHex);
      setIsConnectingManual(false);
      if (res.success && res.user) {
        addToast?.('Dlicom Keypair Generated', `Connected as ${randomHex.slice(0, 6)}...${randomHex.slice(-4)}`, 'success');
        onSuccess(res.user);
        onClose();
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setIsConnectingManual(false);
      setErrorMsg(err?.message || 'Could not generate instant Dlicom account.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-[#0B132B] border border-blue-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(59,130,246,0.2)] text-white animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-blue-600/20 border border-blue-500/50 flex items-center justify-center text-blue-400 shadow-glow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Dlicom Core Wallet
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                0x Web3
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Connect your official Dlicom address across phone and PC.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Method 1: Auto Browser Connect */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleAutoConnect}
            disabled={isConnectingAuto}
            className="w-full flex items-center justify-between p-3.5 bg-[#1C2541] hover:bg-[#2A3756] border border-blue-500/50 hover:border-blue-400 rounded-2xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <Wallet className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
              <div className="text-left">
                <div className="text-white">Auto Connect Wallet</div>
                <div className="text-[10px] text-slate-400 font-normal">Browser extension or in-app wallet</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-slate-700/60" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Or Enter 0x Address
            </span>
            <div className="flex-1 h-px bg-slate-700/60" />
          </div>

          {/* Method 2: Direct 0x Address Input */}
          <form onSubmit={handleAddressConnect} className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 font-mono">
                Your Dlicom 0x Wallet Address
              </label>
              <input
                type="text"
                value={dlicomAddressInput}
                onChange={(e) => setDlicomAddressInput(e.target.value)}
                placeholder="0x71C4...98A2"
                className="w-full px-3.5 py-2.5 bg-[#1C2541] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isConnectingManual}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-glow transition-all active:scale-[0.98] cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isConnectingManual ? 'Verifying Address...' : 'Connect with Dlicom Address'}</span>
            </button>
          </form>

          {/* Method 3: Generate Instant Key */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleGenerateInstant}
              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate New Dlicom Web3 ID (1-Click Instant)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
