import React from 'react';
import { Flame, Clock, Award, Sparkles, X, User } from 'lucide-react';
import type { Post, Profile, FeedFilter } from '../../types';
import { PostCard } from './PostCard';

interface FeedListProps {
  posts: Post[];
  votesList: Array<{ user_id: string; post_id: string; type: 'up' | 'down' }>;
  currentUserId: string;
  currentUser?: Profile | null;
  allUsers?: Profile[];
  activeFilter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
  filteredCreator: Profile | null;
  onClearCreatorFilter: () => void;
  searchQuery: string;
  onClearSearch: () => void;
  onVote: (postId: string, type: 'up' | 'down') => void;
  onDeletePost?: (postId: string) => void;
  onEditPost?: (post: Post) => void;
  onViewPostDetails?: (post: Post) => void;
  onSelectTag?: (tag: string) => void;
  onOpenLightbox: (imageData: string, title: string) => void;
  onOpenProfile: (profile: Profile) => void;
  onShare: (post: Post) => void;
  onTogglePinHome?: (postId: string) => void;
  onTogglePinProfile?: (postId: string) => void;
}

export const FeedList: React.FC<FeedListProps> = ({
  posts,
  votesList,
  currentUserId,
  currentUser,
  allUsers,
  activeFilter,
  onFilterChange,
  filteredCreator,
  onClearCreatorFilter,
  searchQuery,
  onClearSearch,
  onVote,
  onDeletePost,
  onEditPost,
  onViewPostDetails,
  onSelectTag,
  onOpenLightbox,
  onOpenProfile,
  onShare,
  onTogglePinHome,
  onTogglePinProfile,
}) => {
  const tabs: Array<{ id: FeedFilter; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'trending', label: 'Trending', icon: Flame },
    { id: 'latest', label: 'Latest', icon: Clock },
    { id: 'top_voted', label: 'Top Voted', icon: Award },
  ];

  return (
    <div className="w-full">
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#334155]">
        
        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#1C2541] border border-[#334155] rounded-2xl">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeFilter === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onFilterChange(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-glow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Sub-filters */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {filteredCreator && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-950/60 border border-blue-600/50 rounded-xl text-blue-300">
              <User className="w-3.5 h-3.5" />
              <span>Posts by <strong>{filteredCreator.display_name}</strong></span>
              <button onClick={onClearCreatorFilter} className="hover:text-white ml-1">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {searchQuery && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1E293B] border border-[#334155] rounded-xl text-slate-300">
              <span>Matching: "{searchQuery}"</span>
              <button onClick={onClearSearch} className="hover:text-white ml-1">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Grid of Feed Posts */}
      {posts.length === 0 ? (
        <div className="py-20 text-center bg-[#1E293B]/40 border border-[#334155] rounded-3xl p-8">
          <Sparkles className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-white">No artworks found</h3>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => {
            const voteMatch = votesList.find(v => v.post_id === post.id && v.user_id === currentUserId);
            return (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                allUsers={allUsers}
                userVote={voteMatch ? voteMatch.type : null}
                onVote={onVote}
                onDelete={onDeletePost}
                onEdit={onEditPost}
                onViewDetails={onViewPostDetails}
                onSelectTag={onSelectTag}
                onOpenLightbox={onOpenLightbox}
                onOpenProfile={onOpenProfile}
                onShare={onShare}
                onTogglePinHome={onTogglePinHome}
                onTogglePinProfile={onTogglePinProfile}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
