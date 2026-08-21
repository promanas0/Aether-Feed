import React, { useState } from 'react';
import { Trophy, X, Search, ChevronRight, Image as ImageIcon, ArrowUpCircle } from 'lucide-react';
import { Profile } from '../../types';
import { VerifiedBadge } from '../ui/VerifiedBadge';

interface LeaderboardItem extends Profile {
  rank: number;
  posts_count: number;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaderboard: LeaderboardItem[];
  onSelectCreator: (profile: Profile) => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  leaderboard,
  onSelectCreator,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filtered = leaderboard.filter(
    (item) =>
      item.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.bio.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B132B]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#1C2541] border border-[#334155] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#334155] bg-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Top 100 Creator Leaderboard</span>
                <span className="text-[11px] font-mono px-2 py-0.5 bg-blue-600 text-white rounded-md">
                  Rank 1 - 100
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Ranked purely by aggregated votes received across all curated posts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#334155]/60 transition-colors"
            aria-label="Close leaderboard"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search inside leaderboard */}
        <div className="px-6 py-3 border-b border-[#334155]/60 bg-[#1C2541]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search creator by name, handle, or bio..."
              className="w-full pl-9 pr-4 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans transition-all"
            />
          </div>
        </div>

        {/* List Content */}
        <div className="overflow-y-auto flex-1 divide-y divide-[#334155]/50 p-2 sm:p-4 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <p className="text-xs font-semibold text-slate-300">No creators match your query</p>
              <p className="text-[11px] text-slate-500 mt-1">Try another search term</p>
            </div>
          ) : (
            filtered.map((creator) => {
              const isTop1 = creator.rank === 1;
              const isTop2 = creator.rank === 2;
              const isTop3 = creator.rank === 3;
              const isTop3Overall = isTop1 || isTop2 || isTop3;

              return (
                <div
                  key={creator.id}
                  onClick={() => {
                    onSelectCreator(creator);
                    onClose();
                  }}
                  className={`flex items-center justify-between p-3 sm:p-3.5 rounded-xl transition-all cursor-pointer group ${
                    isTop1
                      ? 'bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/40 shadow-glow-sm'
                      : isTop2
                      ? 'bg-slate-800/40 hover:bg-slate-800/80 border border-slate-600/40'
                      : isTop3
                      ? 'bg-slate-800/30 hover:bg-slate-800/70 border border-slate-700/40'
                      : 'hover:bg-[#1E293B] border border-transparent'
                  }`}
                >
                  {/* Left: Rank & Avatar & User Info */}
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {/* Rank Badge (Clean Numerical, No Emojis) */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                        isTop1
                          ? 'bg-blue-600 text-white shadow-glow-sm border border-blue-400'
                          : isTop2
                          ? 'bg-slate-700 text-blue-200 border border-slate-500'
                          : isTop3
                          ? 'bg-slate-800 text-slate-300 border border-slate-600'
                          : 'text-slate-500 bg-[#0B132B]/60'
                      }`}
                    >
                      #{creator.rank}
                    </div>

                    {/* Avatar */}
                    <img
                      src={creator.avatar_url}
                      alt={creator.display_name}
                      className={`w-10 h-10 rounded-xl object-cover shrink-0 border ${
                        isTop3Overall ? 'border-blue-400/60' : 'border-[#334155]'
                      }`}
                    />

                    {/* Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                          {creator.display_name}
                        </h4>
                        <VerifiedBadge user={creator} />
                        <span className="text-[11px] font-mono text-blue-400 truncate">
                          @{creator.username}
                        </span>
                      </div>
                      {creator.bio && (
                        <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md mt-0.5">
                          {creator.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Posts & Total Votes */}
                  <div className="flex items-center gap-4 sm:gap-6 shrink-0 text-right pl-3">
                    <div className="hidden sm:block text-slate-400 text-xs">
                      <span className="font-mono font-semibold text-slate-200">
                        {creator.posts_count}
                      </span>{' '}
                      <span className="text-[10px] text-slate-500">posts</span>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5 text-blue-400 font-mono font-bold text-xs sm:text-sm">
                        <ArrowUpCircle className="w-3.5 h-3.5" />
                        <span>{creator.total_votes_received.toLocaleString()}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-sans uppercase tracking-wider">
                        Total Votes
                      </span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#0B132B] border-t border-[#334155] flex items-center justify-between text-[11px] text-slate-400">
          <span>Click any creator to view all their posts on the feed</span>
          <span className="font-mono">Total ranked: 100 creators</span>
        </div>

      </div>
    </div>
  );
};
