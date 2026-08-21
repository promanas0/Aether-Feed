import React, { useState } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Share2, 
  Maximize2, 
  Clock, 
  ShieldCheck, 
  Tag, 
  Sparkles,
  MoreVertical,
  Edit3,
  Trash2,
  Info
} from 'lucide-react';
import type { Post, Profile } from '../../types';

import { VerifiedBadge } from '../ui/VerifiedBadge';
import { DEFAULT_DLICOM_AVATAR } from '../../lib/storage';

interface PostCardProps {
  post: Post;
  userVote: 'up' | 'down' | null;
  currentUser?: Profile | null;
  onVote: (postId: string, type: 'up' | 'down') => void;
  onOpenLightbox: (imageData: string, title: string) => void;
  onOpenProfile: (profile: Profile) => void;
  onShare: (post: Post) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
  onViewDetails?: (post: Post) => void;
  onSelectTag?: (tag: string) => void;
}

const formatTimeAgo = (dateStr: string): string => {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const PostCard: React.FC<PostCardProps> = ({
  post,
  userVote,
  currentUser,
  onVote,
  onOpenLightbox,
  onOpenProfile,
  onShare,
  onEdit,
  onDelete,
  onViewDetails,
  onSelectTag,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isPopAnim, setIsPopAnim] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleVoteClick = (type: 'up' | 'down') => {
    setIsPopAnim(true);
    onVote(post.id, type);
    setTimeout(() => setIsPopAnim(false), 300);
  };

  const author = post.user || {
    id: post.user_id,
    email: '',
    first_name: 'Aether',
    last_name: 'Member',
    display_name: 'Aether Member',
    username: 'member',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    bio: '',
    dlicom_address: '',
    is_verified: true,
    followers: [],
    following: [],
    total_votes_received: 0,
    created_at: '',
  };

  const isAuthor = Boolean(currentUser && currentUser.id === post.user_id);
  const hasImage = Boolean(post.image_data && post.image_data.trim().length > 0);

  return (
    <article className="bg-[#1E293B] border border-[#334155] rounded-3xl overflow-hidden shadow-sm hover:border-slate-500/40 transition-all duration-150 flex flex-col mb-5">
      
      {/* Creator Header & 3-Dots Menu */}
      <div className="p-4 flex items-center justify-between gap-3 border-b border-[#334155]/50 bg-[#1C2541]/30">
        <button
          onClick={() => onOpenProfile(author)}
          className="flex items-center gap-3 text-left group/author focus:outline-none cursor-pointer"
        >
          <img
            src={author.avatar_url || DEFAULT_DLICOM_AVATAR}
            alt={author.display_name}
            className="w-10 h-10 rounded-xl object-cover border border-[#334155] group-hover/author:border-blue-500 transition-colors"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-white group-hover/author:text-blue-300 transition-colors">
                {author.display_name}
              </h4>
              <VerifiedBadge user={author} />
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              @{author.username}
            </p>
          </div>
        </button>

        {/* Right Header: Timestamp & 3-Dots Menu */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{formatTimeAgo(post.created_at)}</span>
          </div>

          {/* 3-Dots Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-[#2A3756] rounded-xl transition-all cursor-pointer"
              title="Post Options"
              aria-label="Post Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu Modal/Popover */}
            {isMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => {
                    setIsMenuOpen(false);
                    setShowDeleteConfirm(false);
                  }} 
                />

                <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#1C2541] border border-[#334155] rounded-2xl shadow-2xl z-40 p-1.5 text-xs text-slate-200 animate-in fade-in duration-150 backdrop-blur-xl">
                  
                  {/* Option 1: Edit Post (Author Only) */}
                  {isAuthor && onEdit && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onEdit(post);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-[#1E293B] rounded-xl transition-colors text-left cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Edit Post Text</span>
                    </button>
                  )}

                  {/* Option 2: Post Details & Metadata */}
                  {onViewDetails && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onViewDetails(post);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-[#1E293B] rounded-xl transition-colors text-left cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5 text-blue-400" />
                      <span>Post Details</span>
                    </button>
                  )}

                  {/* Option 3: Share Post */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onShare(post);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-[#1E293B] rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Share Post</span>
                  </button>

                  {/* Option 4: Delete Post (Author Only) */}
                  {isAuthor && onDelete && (
                    <div className="border-t border-[#334155] pt-1 mt-1">
                      {!showDeleteConfirm ? (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors text-left cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Post</span>
                        </button>
                      ) : (
                        <div className="p-2 bg-rose-950/40 border border-rose-600/40 rounded-xl space-y-1.5">
                          <p className="text-[11px] font-bold text-rose-300">Permanently delete?</p>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setIsMenuOpen(false);
                                onDelete(post.id);
                              }}
                              className="flex-1 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Yes, Delete
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(false)}
                              className="px-2 py-1 bg-[#1C2541] text-slate-300 hover:text-white rounded-lg text-[10px] cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Post Text / Status Description */}
      <div className="p-4 sm:p-5">
        {post.title && post.title !== post.description && (
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight mb-2">
            {post.title}
          </h3>
        )}

        {post.description && (
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
            {post.description}
          </p>
        )}

        {/* Tagged Curators & Hashtags */}
        {( (post.tagged_users && post.tagged_users.length > 0) || (post.tags && post.tags.length > 0) ) && (
          <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-[#334155]/40 text-[11px] font-mono">
            {post.tagged_users && post.tagged_users.length > 0 && (
              <div className="flex items-center gap-1 text-slate-400 mr-2">
                <Tag className="w-3 h-3 text-blue-400" />
                <span>Tagged:</span>
                {post.tagged_users.map((uname) => (
                  <span key={uname} className="text-blue-400 font-semibold">
                    @{uname}
                  </span>
                ))}
              </div>
            )}

            {post.tags && post.tags.map((t) => (
              <button
                key={t}
                onClick={() => onSelectTag?.(t)}
                className="px-2 py-0.5 bg-[#0B132B] hover:bg-blue-600 hover:text-white border border-[#334155] rounded text-slate-400 text-[10px] transition-colors cursor-pointer"
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Attached Image (Only if present) */}
      {hasImage && (
        <div className="relative w-full max-h-[480px] bg-[#0B132B] overflow-hidden group/image border-y border-[#334155]/40">
          {!imageLoaded && (
            <div className="w-full h-64 bg-[#1C2541] animate-pulse flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-slate-600 animate-spin" />
            </div>
          )}
          <img
            src={post.image_data}
            alt={post.title || 'Post Image'}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`w-full max-h-[480px] object-contain mx-auto transition-transform duration-300 group-hover/image:scale-[1.01] ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Fullscreen Lightbox Trigger */}
          <button
            onClick={() => onOpenLightbox(post.image_data!, post.title || 'Post Image')}
            className="absolute top-3 right-3 p-2 bg-[#0B132B]/80 hover:bg-blue-600 text-slate-200 hover:text-white rounded-xl backdrop-blur-md opacity-0 group-hover/image:opacity-100 transition-all duration-150 shadow-md cursor-pointer"
            title="Fullscreen preview"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attached Video (Only if present) */}
      {post.video_data && post.video_data.trim().length > 0 && (
        <div className="relative w-full max-h-[480px] bg-black overflow-hidden border-y border-[#334155]/40">
          <video
            src={post.video_data}
            controls
            playsInline
            preload="metadata"
            className="w-full max-h-[480px] object-contain mx-auto"
          />
        </div>
      )}

      {/* Dual Upvote / Downvote & Share Footer */}
      <div className="px-4 py-3 bg-[#1C2541]/40 border-t border-[#334155]/50 flex items-center justify-between gap-3">
        
        {/* Dual Voting Button Group */}
        <div className={`flex items-center bg-[#1C2541] border border-[#334155] rounded-2xl p-1 gap-1 ${isPopAnim ? 'animate-vote-pop' : ''}`}>
          
          {/* Upvote Button (▲) */}
          <button
            onClick={() => handleVoteClick('up')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              userVote === 'up'
                ? 'bg-blue-600 text-white shadow-glow-sm'
                : 'text-slate-300 hover:text-white hover:bg-[#2A3756]'
            }`}
            title="Upvote"
          >
            <ChevronUp className={`w-4 h-4 stroke-[2.5] ${userVote === 'up' ? 'text-white' : 'text-blue-400'}`} />
            <span className="font-mono text-xs">{post.votes_up}</span>
          </button>

          {/* Net Votes Indicator */}
          <div className="px-2 font-mono text-xs font-bold text-slate-200 border-x border-[#334155]/80">
            {post.net_votes >= 0 ? `+${post.net_votes}` : post.net_votes}
          </div>

          {/* Downvote Button (▼) */}
          <button
            onClick={() => handleVoteClick('down')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              userVote === 'down'
                ? 'bg-rose-600 text-white shadow-glow-sm'
                : 'text-slate-300 hover:text-white hover:bg-[#2A3756]'
            }`}
            title="Downvote"
          >
            <ChevronDown className={`w-4 h-4 stroke-[2.5] ${userVote === 'down' ? 'text-white' : 'text-slate-400'}`} />
            <span className="font-mono text-xs">{post.votes_down}</span>
          </button>

        </div>

        {/* Share Action */}
        <button
          onClick={() => onShare(post)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1C2541]/70 hover:bg-[#1C2541] text-slate-300 hover:text-white border border-[#334155] rounded-2xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-blue-400" />
          <span>Share</span>
        </button>

      </div>

    </article>
  );
};
