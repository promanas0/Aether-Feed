import React, { useState } from 'react';
import { Trophy, Search, UserPlus, UserCheck, ShieldCheck, ArrowUpCircle } from 'lucide-react';
import type { Profile } from '../../types';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { DEFAULT_DLICOM_AVATAR } from '../../lib/storage';

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

  const q = searchQuery.toLowerCase().trim();
  const filtered = leaderboard.filter(
    (u) =>
      !q ||
      (u.display_name && u.display_name.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.first_name && u.first_name.toLowerCase().includes(q)) ||
      (u.last_name && u.last_name.toLowerCase().includes(q)) ||
      (u.bio && u.bio.toLowerCase().includes(q)) ||
      (u.dlicom_address && u.dlicom_address.toLowerCase().includes(q))
  );

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/60 via-[#1C2541] to-[#0B132B] border border-blue-500/30 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/40 rounded-full text-blue-300 text-xs font-semibold uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-blue-400" />
              <span>Real Community Standings</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Top Curators & Creators
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Ranked dynamically by total upvotes received across all authentic posts. Updated in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#0B132B]/80 backdrop-blur-md p-3.5 rounded-2xl border border-[#334155]">
            <div className="text-center px-3 border-r border-[#334155]">
              <p className="text-[10px] text-slate-400 font-mono uppercase">Total Creators</p>
              <p className="text-lg font-bold text-white font-mono">{leaderboard.length}</p>
            </div>
            <div className="text-center px-3">
              <p className="text-[10px] text-slate-400 font-mono uppercase">Your Rank</p>
              <p className="text-lg font-bold text-blue-400 font-mono">
                #{leaderboard.findIndex((u) => u.id === currentUser.id) + 1 || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, @handle, or bio..."
          className="w-full bg-[#1C2541] border border-[#334155] rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="bg-[#1C2541] border border-[#334155] rounded-3xl overflow-hidden shadow-lg">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Trophy className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-400">No members found</p>
            <p className="text-xs">Try searching for a different name or handle.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#334155]/60">
            {filtered.map((curator) => {
              const isSelf = curator.id === currentUser.id;
              const isFollowing = Array.isArray(currentUser.following) && currentUser.following.includes(curator.id);

              return (
                <div
                  key={curator.id}
                  className={`p-4 sm:p-5 flex items-center justify-between gap-3 sm:gap-4 transition-colors ${
                    isSelf ? 'bg-blue-950/20 hover:bg-blue-950/30' : 'hover:bg-[#1E293B]/80'
                  }`}
                >
                  {/* Left: Rank, Avatar & Info */}
                  <div
                    onClick={() => onSelectUser(curator)}
                    className="flex items-center gap-3 sm:gap-4 min-w-0 cursor-pointer group flex-1"
                  >
                    {/* Rank Badge */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                        curator.rank === 1
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-glow-sm'
                          : curator.rank === 2
                          ? 'bg-slate-300/20 text-slate-200 border border-slate-300/50'
                          : curator.rank === 3
                          ? 'bg-amber-700/20 text-amber-500 border border-amber-700/50'
                          : curator.rank <= 10
                          ? 'bg-slate-800 text-slate-300'
                          : 'text-slate-500 bg-[#0B132B]'
                      }`}
                    >
                      #{curator.rank}
                    </div>

                    <img
                      src={curator.avatar_url || DEFAULT_DLICOM_AVATAR}
                      alt={curator.display_name || 'Curator'}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = DEFAULT_DLICOM_AVATAR;
                      }}
                      className="w-9 h-9 rounded-xl object-cover border border-[#334155] shrink-0"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                          {curator.display_name || curator.username || 'Member'}
                        </h4>
                        <VerifiedBadge user={curator} />
                        {isSelf && (
                          <span className="px-1.5 py-0.2 bg-blue-600/30 text-blue-300 text-[9px] font-mono rounded">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate">
                        @{curator.username || (curator.id ? curator.id.slice(-6) : 'user')}
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
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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
            })}
          </div>
        )}
      </div>

    </div>
  );
};
