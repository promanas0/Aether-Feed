import React from 'react';
import { Home, Users, Plus, Trophy, User, MessageSquare, Send } from 'lucide-react';
import type { Profile, ActiveView } from '../../types';
import { isUserAdmin } from '../../lib/storage';

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
  const isGolden = Boolean(currentUser.is_golden_verified || isUserAdmin(currentUser));

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B132B]/95 backdrop-blur-xl border-t border-[#334155]/80 px-2 py-1.5 flex items-center justify-around shadow-2xl transition-all duration-200">
      
      {/* Home Feed */}
      <button
        onClick={() => onViewChange('feed')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all active:scale-90 ${
          activeView === 'feed'
            ? 'text-blue-400 font-bold'
            : 'text-slate-400 hover:text-white'
        }`}
        title="Home Feed"
      >
        <Home className={`w-5 h-5 ${activeView === 'feed' ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] mt-0.5 font-medium">Home</span>
      </button>

      {/* Direct Messages */}
      <button
        onClick={() => onViewChange('dms')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all active:scale-90 ${
          activeView === 'dms'
            ? 'text-blue-400 font-bold'
            : 'text-slate-400 hover:text-white'
        }`}
        title="Direct Messages"
      >
        <Send className={`w-5 h-5 ${activeView === 'dms' ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] mt-0.5 font-medium">DMs</span>
      </button>

      {/* Center + Post Button */}
      <button
        onClick={onOpenCreateModal}
        className="flex items-center justify-center -mt-5 w-11 h-11 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-glow transition-all active:scale-90 hover:scale-105 shrink-0"
        title="Create New Post / Status"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>

      {/* Aether Chat (Golden users) OR Following Feed (Non-golden users) */}
      {isGolden ? (
        <button
          onClick={() => onViewChange('chat')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all active:scale-90 ${
            activeView === 'chat'
              ? 'text-blue-400 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Aether Chat"
        >
          <MessageSquare className={`w-5 h-5 ${activeView === 'chat' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5 font-medium">Chat</span>
        </button>
      ) : (
        <button
          onClick={() => onViewChange('following_feed')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all active:scale-90 ${
            activeView === 'following_feed'
              ? 'text-blue-400 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Following Feed"
        >
          <Users className={`w-5 h-5 ${activeView === 'following_feed' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5 font-medium">Following</span>
        </button>
      )}

      {/* Leaderboard */}
      <button
        onClick={() => onViewChange('leaderboard')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all active:scale-90 ${
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
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all active:scale-90 ${
          activeView === 'profile'
            ? 'text-blue-400 font-bold'
            : 'text-slate-400 hover:text-white'
        }`}
        title="My Profile"
      >
        <User className={`w-5 h-5 ${activeView === 'profile' ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] mt-0.5 font-medium">Profile</span>
      </button>

    </nav>
  );
};
