import React, { useState } from 'react';
import { Trophy, Search, UserPlus, UserCheck, ShieldCheck, ArrowUpCircle } from 'lucide-react';
import type { Profile } from '../../types';
import { VerifiedBadge } from '../ui/VerifiedBadge';

interface RealLeaderboardViewProps {
  leaderboard: Array<Profile & { rank: number; posts_count: number }>;
  currentUser: Profile;
  onSelectUser: (user: Profile) => void;
  onToggleFollow: (targetUserId: string) => void;
}

export const RealLeaderboardView: React.FC<RealLeaderboardViewProps> = ({
  leaderboard,
  currentUser,
  onSelectUser,
  onToggleFollow,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = leaderboard.filter(
    (u) =>
      u.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full bg-[#1C2541] border border-[#334155] rounded-3xl p-5 sm:p-6 shadow-md">
      
      {/* Leaderboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#334155]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-2xl shadow-glow-sm">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Member Leaderboard
            </h2>
            <p className="text-xs text-slate-400">
              Ranked by net votes (▲ Upvotes &minus; ▼ Downvotes)
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search member..."
            className="w-full pl-8.5 pr-3 py-1.5 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="mt-3 divide-y divide-[#334155]/60">
        {filtered.length === 0 ? (
          <div className="py-14 text-center text-slate-400">
            <p className="text-xs font-semibold text-slate-300">No members registered yet</p>
          </div>
        ) : (
          filtered.map((curator) => {
            const isRank1 = curator.rank === 1;
            const isRank2 = curator.rank === 2;
            const isRank3 = curator.rank === 3;
            const isFollowing = currentUser.following.includes(curator.id);
            const isSelf = currentUser.id === curator.id;

            return (
              <div
                key={curator.id}
                className="py-3 px-2 rounded-2xl flex items-center justify-between gap-3 hover:bg-[#1E293B] transition-colors"
              >
                {/* Left: Rank, Avatar & Details */}
                <div 
                  onClick={() => onSelectUser(curator)}
                  className="flex items-center gap-3 min-w-0 cursor-pointer flex-1 group"
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                      isRank1
                        ? 'bg-blue-600 text-white shadow-glow-sm'
                        : isRank2
                        ? 'bg-slate-700 text-blue-200'
                        : isRank3
                        ? 'bg-slate-800 text-slate-300'
                        : 'text-slate-500 bg-[#0B132B]'
                    }`}
                  >
                    #{curator.rank}
                  </div>

                  <img
                    src={curator.avatar_url}
                    alt={curator.display_name}
                    className="w-9 h-9 rounded-xl object-cover border border-[#334155] shrink-0"
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                        {curator.display_name}
                      </h4>
                      <VerifiedBadge user={curator} />
                      {isSelf && (
                        <span className="px-1.5 py-0.2 bg-blue-600/30 text-blue-300 text-[9px] font-mono rounded">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono truncate">
                      @{curator.username}
                    </p>
                  </div>
                </div>

                {/* Right: Posts, Net Votes & Follow */}
                <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-blue-400 font-mono font-bold text-xs sm:text-sm">
                      <ArrowUpCircle className="w-3.5 h-3.5" />
                      <span>▲ {curator.total_votes_received}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 block">
                      {curator.posts_count} posts
                    </span>
                  </div>

                  {!isSelf && (
                    <button
                      onClick={() => onToggleFollow(curator.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isFollowing
                          ? 'bg-[#0B132B] text-slate-300 hover:text-rose-400 border border-[#334155]'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-glow-sm'
                      }`}
                    >
                      {isFollowing ? (
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" />
                          Following
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

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
