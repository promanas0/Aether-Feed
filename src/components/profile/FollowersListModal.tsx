import React, { useState } from 'react';
import { 
  X, 
  Users, 
  UserPlus, 
  UserCheck, 
  ShieldCheck, 
  Search,
  ArrowRight
} from 'lucide-react';
import type { Profile } from '../../types';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { DEFAULT_DLICOM_AVATAR, resolveProfileOrFallback } from '../../lib/storage';

interface FollowersListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  userIds?: string[];
  allUsers: Profile[];
  currentUser: Profile;
  onSelectUser: (profile: Profile) => void;
  onToggleFollow: (targetUserId: string) => void;
}

export const FollowersListModal: React.FC<FollowersListModalProps> = ({
  isOpen,
  onClose,
  title,
  userIds = [],
  allUsers = [],
  currentUser,
  onSelectUser,
  onToggleFollow,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const safeUserIds = Array.isArray(userIds) ? userIds : [];
  const safeAllUsers = Array.isArray(allUsers) ? allUsers : [];

  // Resolve user objects
  const userList = safeUserIds
    .map(id => safeAllUsers.find(u => u && u.id === id) || resolveProfileOrFallback(id))
    .filter((u): u is Profile => Boolean(u));

  const filtered = userList.filter(
    u =>
      (u.display_name && u.display_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B132B]/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-[#1C2541] border border-[#334155] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#334155] bg-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              {title} ({userList.length})
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#334155] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        {userList.length > 4 && (
          <div className="p-3 border-b border-[#334155]/60 bg-[#0B132B]">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or @username..."
                className="w-full pl-8.5 pr-3 py-1.5 bg-[#1C2541] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none font-sans"
              />
            </div>
          </div>
        )}

        {/* User List */}
        <div className="p-3 overflow-y-auto flex-1 divide-y divide-[#334155]/40 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-300">No members in this list yet</p>
            </div>
          ) : (
            filtered.map((user) => {
              const isSelf = user.id === currentUser?.id;
              const myFollowing = currentUser?.following || [];
              const userFollowing = user?.following || [];
              const isFollowing = myFollowing.includes(user.id);
              const userFollowsMe = userFollowing.includes(currentUser?.id || '');

              return (
                <div
                  key={user.id}
                  className="py-2.5 px-2 rounded-2xl flex items-center justify-between gap-3 hover:bg-[#1E293B] transition-colors"
                >
                  {/* Avatar & Name -> Click to View Profile */}
                  <div
                    onClick={() => {
                      onSelectUser(user);
                      onClose();
                    }}
                    className="flex items-center gap-3 min-w-0 cursor-pointer flex-1 group"
                  >
                    <img
                      src={user.avatar_url || DEFAULT_DLICOM_AVATAR}
                      alt={user.display_name || 'User'}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = DEFAULT_DLICOM_AVATAR;
                      }}
                      className="w-10 h-10 rounded-xl object-cover border border-[#334155] shrink-0"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                          {user.display_name || user.username || 'Member'}
                        </h4>
                        <VerifiedBadge user={user} />
                        {isSelf && (
                          <span className="px-1.5 py-0.2 bg-blue-600/30 text-blue-300 text-[9px] font-mono rounded">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate">
                        @{user.username || (user.id ? user.id.slice(-6) : 'user')}
                      </p>
                    </div>
                  </div>

                  {/* Follow / Unfollow / Follow Back Action Button */}
                  {!isSelf && (
                    <button
                      onClick={() => onToggleFollow(user.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer shrink-0 ${
                        isFollowing
                          ? 'bg-[#0B132B] text-slate-300 hover:text-rose-400 border border-[#334155]'
                          : userFollowsMe
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-glow-sm'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-glow-sm'
                      }`}
                    >
                      {isFollowing ? (
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" />
                          Following
                        </span>
                      ) : userFollowsMe ? (
                        <span className="flex items-center gap-1">
                          <UserPlus className="w-3.5 h-3.5" />
                          Follow Back
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <UserPlus className="w-3.5 h-3.5" />
                          Follow
                        </span>
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
