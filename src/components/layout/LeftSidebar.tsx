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
  Crown,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import type { Profile, ActiveView } from '../../types';
import { isUserAdmin } from '../../lib/storage';
import { VerifiedBadge } from '../ui/VerifiedBadge';

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
  const isGolden = Boolean(currentUser.is_golden_verified || isUserAdmin(currentUser));

  const navItems: Array<{ id: ActiveView; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'feed', label: 'Home Feed', icon: Home },
    { id: 'following_feed', label: 'Following Feed', icon: Users },
    { id: 'dms', label: 'Direct Messages', icon: UserCheck },
    { id: 'leaderboard', label: 'Top Leaderboard', icon: Trophy },
  ];

  if (isGolden) {
    navItems.splice(3, 0, { id: 'chat', label: 'Aether Chat', icon: MessageSquare });
  }

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
            className="w-10 h-10 rounded-xl object-cover border border-slate-700 group-hover:border-blue-500 transition-colors shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <h3 className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                {currentUser.display_name}
              </h3>
              <VerifiedBadge isVerified={currentUser.is_verified} isGoldenVerified={currentUser.is_golden_verified} />
            </div>
            <p className="text-[11px] text-slate-400 font-mono truncate">
              @{currentUser.username}
            </p>
          </div>
        </div>
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
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-[#1E293B]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
            </button>
          );
        })}

        {/* My Profile Link */}
        <button
          onClick={onOpenMyProfile}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
            activeView === 'profile'
              ? 'bg-blue-600 text-white shadow-sm'
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
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 transition-all text-left cursor-pointer"
          >
            <Crown className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="flex-1">Admin Panel</span>
          </button>
        )}
      </nav>

      {/* Secondary Controls */}
      <div className="p-2 bg-[#1C2541] border border-[#334155] rounded-2xl space-y-1">
        <button
          onClick={() => onViewChange('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
            activeView === 'settings'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-[#1E293B]'
          }`}
        >
          <Settings className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Settings</span>
        </button>

        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-600/20 transition-all text-left cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>

    </aside>
  );
};
