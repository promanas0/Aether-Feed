import React, { useState } from 'react';
import { 
  X, 
  UserCheck, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Users, 
  ArrowRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import type { Profile } from '../../types';

interface AccountSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Profile | null;
  savedAccounts: Profile[];
  onSwitchAccount: (userId: string) => void;
  onAddAnotherAccount: () => void;
  onRemoveAccount: (userId: string) => void;
}

export const AccountSwitcherModal: React.FC<AccountSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  savedAccounts,
  onSwitchAccount,
  onAddAnotherAccount,
  onRemoveAccount,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B132B]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#1C2541] border border-[#334155] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        
        {/* Header Bar */}
        <div className="p-5 pb-4 flex items-center justify-between border-b border-[#334155]/70 bg-[#1E293B]/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-glow-sm">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                <span>Account Switcher</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-normal">
                  Multi-Account
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Switch between your creator profiles on this device
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#334155] transition-colors cursor-pointer"
            aria-label="Close account switcher"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Saved Accounts List */}
        <div className="p-5 space-y-2.5 max-h-80 overflow-y-auto">
          {savedAccounts.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              No saved accounts found.
            </div>
          ) : (
            savedAccounts.map((account) => {
              const isActive = currentUser?.id === account.id;

              return (
                <div
                  key={account.id}
                  onMouseEnter={() => setHoveredId(account.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`group relative p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-blue-950/40 border-blue-500/60 shadow-glow-sm'
                      : 'bg-[#1E293B]/60 hover:bg-[#1E293B] border-[#334155]/80 hover:border-slate-400/50 cursor-pointer'
                  }`}
                  onClick={() => {
                    if (!isActive) {
                      onSwitchAccount(account.id);
                      onClose();
                    }
                  }}
                >
                  {/* Account Avatar & Name */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <img
                        src={account.avatar_url}
                        alt={account.display_name}
                        className={`w-11 h-11 rounded-xl object-cover border ${
                          isActive ? 'border-blue-400 ring-2 ring-blue-500/30' : 'border-[#334155]'
                        }`}
                      />
                      {isActive && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center border-2 border-[#1C2541]">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">
                          {account.display_name}
                        </span>
                        {account.is_verified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate">
                        @{account.username}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {account.email}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions: Active status or Switch & Remove */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isActive ? (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-blue-600/30 text-blue-300 border border-blue-500/40">
                        Active
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSwitchAccount(account.id);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-glow-sm transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>Switch</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          title="Remove from saved accounts"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveAccount(account.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Add Another Account Button */}
        <div className="p-4 border-t border-[#334155]/70 bg-[#1E293B]/50 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onAddAnotherAccount();
            }}
            className="w-full py-2.5 px-4 bg-[#1C2541] hover:bg-[#2A3756] border border-[#334155] hover:border-blue-500/50 rounded-2xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 text-blue-400 stroke-[2.5]" />
            <span>Add Another Account</span>
          </button>
          
          <p className="text-[10px] text-center text-slate-400">
            Easily manage personal, creator, or community accounts on one device
          </p>
        </div>

      </div>
    </div>
  );
};
