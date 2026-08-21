import React from 'react';
import { 
  Home, 
  Users, 
  Trophy, 
  User, 
  Settings, 
  LogOut, 
  ShieldCheck,
  UserCheck,
  Repeat,
  Crown
} from 'lucide-react';
import type { Profile, ActiveView } from '../../types';
import { isUserAdmin } from '../../lib/storage';

interface LeftSidebarProps {
  currentUser: Profile;
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  onOpenMyProfile: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  onOpenAccountSwitcher?: () => void;
  onOpenAdminPanel?: () => void;
  onCopyDlicomAddress?: (addr: string) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  currentUser,
  activeView,
  onViewChange,
  onOpenMyProfile,
  onOpenSettings,
  onSignOut,
  onOpenAccountSwitcher,
  onOpenAdminPanel,
}) => {
  const navItems: Array<{ id: ActiveView; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'feed', label: 'Home Feed', icon: Home },
    { id: 'following_feed', label: 'Following Feed', icon: Users },
    { id: 'leaderboard', label: 'Top Leaderboard', icon: Trophy },
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:block sticky top-20 h-[calc(100vh-6rem)] space-y-3 select-none">
      
      {/* Current User Card */}
      <div className="p-3 bg-[#1C2541] border border-[#334155] rounded-2xl space-y-2.5">
        <div 
          onClick={onOpenMyProfile}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <img
            src={currentUser.avatar_url}
            alt={currentUser.display_name}
            className="w-10 h-10 rounded-xl object-cover border border-blue-500/40 group-hover:border-blue-400 transition-colors shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <h3 className="text-xs font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                {currentUser.display_name}
              </h3>
              {currentUser.is_verified && (
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-mono truncate">
              @{currentUser.username}
            </p>
          </div>
        </div>

        {/* Quick Multi-Account Switcher Trigger */}
        {onOpenAccountSwitcher && (
          <button
            onClick={onOpenAccountSwitcher}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#0B132B] hover:bg-[#2A3756] border border-[#334155] rounded-xl text-[11px] font-semibold text-blue-400 hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <Repeat className="w-3.5 h-3.5 text-blue-400" />
            <span>Switch / Multi Account</span>
          </button>
        )}
      </div>

      {/* Primary Navigation Links */}
      <nav className="p-2 bg-[#1C2541] border border-[#334155] rounded-2xl space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-glow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-[#1E293B]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* My Profile Link */}
        <button
          onClick={onOpenMyProfile}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
            activeView === 'profile'
              ? 'bg-blue-600 text-white shadow-glow-sm'
              : 'text-slate-300 hover:text-white hover:bg-[#1E293B]'
          }`}
        >
          <User className="w-4 h-4 shrink-0" />
          <span>My Profile</span>
        </button>

        {/* Admin Console (Super Admin Exclusive) */}
        {isUserAdmin(currentUser) && onOpenAdminPanel && (
          <button
            onClick={onOpenAdminPanel}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-300 hover:text-white bg-gradient-to-r from-rose-950/70 to-[#1E1B4B]/80 hover:from-rose-900/80 hover:to-rose-950/90 border border-rose-500/40 hover:border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)] transition-all text-left cursor-pointer"
          >
            <Crown className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="flex-1">Admin Panel</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-rose-500/30 text-rose-200 border border-rose-400/40">
              OWNER
            </span>
          </button>
        )}
      </nav>

      {/* Secondary Controls */}
      <div className="p-2 bg-[#1C2541] border border-[#334155] rounded-2xl space-y-1">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#1E293B] transition-all text-left cursor-pointer"
        >
          <Settings className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Settings</span>
        </button>

        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/30 transition-all text-left cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Log Out</span>
        </button>
      </div>

    </aside>
  );
};
