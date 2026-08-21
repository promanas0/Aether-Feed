import React from 'react';
import { Trophy, Hash, UserPlus, UserCheck, ShieldCheck, ArrowRight } from 'lucide-react';
import type { Profile } from '../../types';

interface RightSidebarProps {
  leaderboard: Array<Profile & { rank: number; posts_count: number }>;
  registeredUsers: Profile[];
  currentUser: Profile;
  onSelectUser: (user: Profile) => void;
  onToggleFollow: (targetUserId: string) => void;
  onSelectTag: (tag: string) => void;
  onOpenFullLeaderboard: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  leaderboard,
  registeredUsers,
  currentUser,
  onSelectUser,
  onToggleFollow,
  onSelectTag,
  onOpenFullLeaderboard,
}) => {
  const trendingTags = ['dlicom', 'web3', 'architecture', 'design', 'minimalism', 'cyberpunk'];

  // Other users to follow (excluding current user)
  const whoToFollow = registeredUsers.filter(u => u.id !== currentUser.id).slice(0, 4);

  return (
    <aside className="w-72 shrink-0 hidden xl:flex flex-col gap-4 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-6">
      
      {/* Top 3 Real-Users Leaderboard Widget */}
      <div className="p-4 bg-[#1C2541] border border-[#334155] rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Top Ranked Curators
            </h3>
          </div>
          <button
            onClick={onOpenFullLeaderboard}
            className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            View All &rarr;
          </button>
        </div>

        <div className="space-y-2">
          {leaderboard.slice(0, 3).map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectUser(item)}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-[#1E293B] cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-md bg-[#0B132B] border border-[#334155] flex items-center justify-center font-mono text-[10px] font-bold text-blue-400 shrink-0">
                  #{item.rank}
                </div>
                <img
                  src={item.avatar_url}
                  alt={item.display_name}
                  className="w-8 h-8 rounded-lg object-cover border border-[#334155]"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                    {item.display_name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">
                    @{item.username}
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono font-bold text-blue-400 shrink-0">
                ▲ {item.total_votes_received}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Hashtags */}
      <div className="p-4 bg-[#1C2541] border border-[#334155] rounded-2xl">
        <div className="flex items-center gap-2 mb-3">
          <Hash className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Trending Topics
          </h3>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {trendingTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onSelectTag(tag)}
              className="px-2.5 py-1 bg-[#1E293B] hover:bg-blue-600 hover:text-white border border-[#334155] rounded-lg text-[11px] font-mono text-slate-300 transition-all"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Who To Follow Widget */}
      <div className="p-4 bg-[#1C2541] border border-[#334155] rounded-2xl">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
          Curators to Follow
        </h3>

        <div className="space-y-3">
          {whoToFollow.map((user) => {
            const isFollowing = currentUser.following.includes(user.id);
            return (
              <div key={user.id} className="flex items-center justify-between gap-2">
                <div 
                  onClick={() => onSelectUser(user)}
                  className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1"
                >
                  <img
                    src={user.avatar_url}
                    alt={user.display_name}
                    className="w-8 h-8 rounded-lg object-cover border border-[#334155]"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate group-hover:text-blue-300">
                      {user.display_name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      @{user.username}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onToggleFollow(user.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                    isFollowing
                      ? 'bg-[#1E293B] text-slate-300 hover:text-rose-400 border border-[#334155]'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-glow-sm'
                  }`}
                >
                  {isFollowing ? (
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      Following
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <UserPlus className="w-3 h-3" />
                      Follow
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Network Node Status */}
      <div className="p-3 bg-[#0F172A] border border-[#334155] rounded-2xl flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span>Dlicom Network Node</span>
        </div>
        <span className="text-blue-400">v3.4 Active</span>
      </div>

    </aside>
  );
};
