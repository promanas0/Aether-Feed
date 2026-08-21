import React from 'react';
import { 
  Home, 
  Users, 
  Trophy, 
  User, 
  Settings, 
  LogOut, 
  ShieldCheck 
} from 'lucide-react';
import type { Profile, ActiveView } from '../../types';

interface LeftSidebarProps {
  currentUser: Profile;
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  onOpenMyProfile: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  onCopyDlicomAddress?: (addr: string) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  currentUser,
  activeView,
  onViewChange,
  onOpenMyProfile,
  onOpenSettings,
  onSignOut,
}) => {
  const navItems: Array<{ id: ActiveView; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'feed', label: 'Home Feed', icon: Home },
    { id: 'following_feed', label: 'Following Feed', icon: Users },
    { id: 'leaderboard', label: 'Top Leaderboard', icon: Trophy },
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:block sticky top-20 h-[calc(100vh-6rem)] space-y-3 select-none">
      
      {/* Current User Card */}
      <div 
        onClick={onOpenMyProfile}
        className="p-3.5 bg-[#1C2541] hover:bg-[#2A3756] border border-[#334155] rounded-2xl cursor-pointer transition-all flex items-center gap-3 group"
      >
        <img
          src={currentUser.avatar_url}
          alt={currentUser.display_name}
          className="w-10 h-10 rounded-xl object-cover border border-blue-500/40 shrink-0"
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

      {/* Primary Navigation Links */}
      <nav className="p-2 bg-[#1C2541] border border-[#334155] rounded-2xl space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
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
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
            activeView === 'profile'
              ? 'bg-blue-600 text-white shadow-glow-sm'
              : 'text-slate-300 hover:text-white hover:bg-[#1E293B]'
          }`}
        >
          <User className="w-4 h-4 shrink-0" />
          <span>My Profile</span>
        </button>
      </nav>

      {/* Secondary Controls */}
      <div className="p-2 bg-[#1C2541] border border-[#334155] rounded-2xl space-y-1">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#1E293B] transition-all text-left"
        >
          <Settings className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Settings</span>
        </button>

        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/30 transition-all text-left"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Log Out</span>
        </button>
      </div>

    </aside>
  );
};
