import React from 'react';
import { Home, Users, Plus, Trophy, User, MessageSquare } from 'lucide-react';
import type { Profile, ActiveView } from '../../types';

interface MobileBottomNavProps {
  currentUser: Profile;
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  onOpenMyProfile: () => void;
  onOpenCreateModal: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentUser,
  activeView,
  onViewChange,
  onOpenMyProfile,
  onOpenCreateModal,
}) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B132B]/90 dark:bg-[#0B132B]/90 light:bg-white/95 backdrop-blur-xl border-t border-[#334155]/80 px-2 py-1.5 flex items-center justify-around shadow-2xl transition-all duration-200">
      
      {/* Home Feed */}
      <button
        onClick={() => onViewChange('feed')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all active:scale-90 ${
          activeView === 'feed'
            ? 'text-blue-400 font-bold'
            : 'text-slate-400 hover:text-white'
        }`}
        title="Home Feed"
      >
        <Home className={`w-5 h-5 ${activeView === 'feed' ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] mt-0.5 font-medium">Home</span>
      </button>

      {/* Following Feed */}
      <button
        onClick={() => onViewChange('following_feed')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all active:scale-90 ${
          activeView === 'following_feed'
            ? 'text-blue-400 font-bold'
            : 'text-slate-400 hover:text-white'
        }`}
        title="Following"
      >
        <Users className={`w-5 h-5 ${activeView === 'following_feed' ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] mt-0.5 font-medium">Following</span>
      </button>

      {/* Center + Post Button */}
      <button
        onClick={onOpenCreateModal}
        className="flex items-center justify-center -mt-5 w-11 h-11 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-glow transition-all active:scale-90 hover:scale-105 shrink-0"
        title="Create New Post / Status"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>

      {/* VIP Chat Lounge */}
      <button
        onClick={() => onViewChange('chat')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all active:scale-90 ${
          activeView === 'chat'
            ? 'text-amber-400 font-bold'
            : 'text-slate-400 hover:text-white'
        }`}
        title="VIP Golden Chat"
      >
        <MessageSquare className={`w-5 h-5 ${activeView === 'chat' ? 'stroke-[2.5] text-amber-400' : 'stroke-2'}`} />
        <span className="text-[10px] mt-0.5 font-medium">Chat</span>
      </button>

      {/* Leaderboard */}
      <button
        onClick={() => onViewChange('leaderboard')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all active:scale-90 ${
          activeView === 'leaderboard'
            ? 'text-blue-400 font-bold'
            : 'text-slate-400 hover:text-white'
        }`}
        title="Leaderboard"
      >
        <Trophy className={`w-5 h-5 ${activeView === 'leaderboard' ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] mt-0.5 font-medium font-mono">Rank</span>
      </button>

      {/* Profile */}
      <button
        onClick={onOpenMyProfile}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all active:scale-90 ${
          activeView === 'profile'
            ? 'text-blue-400 font-bold'
            : 'text-slate-400 hover:text-white'
        }`}
        title="My Profile"
      >
        <div className="relative">
          <img
            src={currentUser.avatar_url}
            alt={currentUser.display_name}
            className={`w-5 h-5 rounded-full object-cover border ${
              activeView === 'profile' ? 'border-blue-400 ring-2 ring-blue-500/30' : 'border-[#334155]'
            }`}
          />
        </div>
        <span className="text-[10px] mt-0.5 font-medium">Profile</span>
      </button>

    </nav>
  );
};
