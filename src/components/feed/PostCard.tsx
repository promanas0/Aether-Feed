import React, { useState, useEffect } from 'react';
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
  Info,
  MessageSquare,
  Send,
  Reply,
  CornerDownRight,
  Pin,
  X
} from 'lucide-react';
import type { Post, Profile, PostComment } from '../../types';

import { VerifiedBadge } from '../ui/VerifiedBadge';
import { DEFAULT_DLICOM_AVATAR, isUserAdmin, getPostComments, addPostComment, deletePostComment } from '../../lib/storage';

interface PostCardProps {
  post: Post;
  userVote: 'up' | 'down' | null;
  currentUser?: Profile | null;
  allUsers?: Profile[];
  onVote: (postId: string, type: 'up' | 'down') => void;
  onOpenLightbox: (imageData: string, title: string) => void;
  onOpenProfile: (profile: Profile) => void;
  onShare: (post: Post) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
  onViewDetails?: (post: Post) => void;
  onSelectTag?: (tag: string) => void;
  onTogglePinHome?: (postId: string) => void;
  onTogglePinProfile?: (postId: string) => void;
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
  allUsers,
  onVote,
  onOpenLightbox,
  onOpenProfile,
  onShare,
  onEdit,
  onDelete,
  onViewDetails,
  onSelectTag,
  onTogglePinHome,
  onTogglePinProfile,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isPopAnim, setIsPopAnim] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>(() => getPostComments(post.id));
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    user: Profile;
  } | null>(null);
  const commentInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleSync = () => {
      setComments(getPostComments(post.id));
    };
    window.addEventListener('aether_storage_sync', handleSync);
    return () => window.removeEventListener('aether_storage_sync', handleSync);
  }, [post.id]);

  const handleVoteClick = (type: 'up' | 'down') => {
    setIsPopAnim(true);
    onVote(post.id, type);
    setTimeout(() => setIsPopAnim(false), 300);
  };

  const author = (currentUser && currentUser.id === post.user_id ? currentUser : null)
    || (allUsers ? allUsers.find(u => u.id === post.user_id) : null)
    || post.user 
    || {
      id: post.user_id,
      email: '',
      first_name: 'Member',
      last_name: '',
      display_name: 'Aether Member',
      username: 'member',
      avatar_url: DEFAULT_DLICOM_AVATAR,
      bio: '',
      dlicom_address: '',
      is_verified: true,
      followers: [],
      following: [],
      total_votes_received: 0,
      created_at: '',
    };

  const isAuthor = Boolean(currentUser && currentUser.id === post.user_id);
  const isAdmin = Boolean(currentUser && isUserAdmin(currentUser));
  const canDelete = isAuthor || isAdmin;
  const hasImage = Boolean(post.image_data && post.image_data.trim().length > 0);

  return (
    <article className={`bg-[#1E293B] border ${
      post.is_pinned_home ? 'border-amber-500/50 shadow-lg shadow-amber-500/5' : post.is_pinned_profile ? 'border-blue-500/40' : 'border-[#334155]'
    } rounded-3xl overflow-hidden shadow-sm hover:border-slate-500/40 transition-all duration-150 flex flex-col mb-5`}>
      
      {/* Pinned Badges */}
      {post.is_pinned_home && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border-b border-amber-500/30 text-amber-300 text-[11px] font-semibold">
          <div className="flex items-center gap-1.5">
            <Pin className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Pinned Announcement (Admin)</span>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400/90 bg-amber-400/15 px-2 py-0.5 rounded border border-amber-400/30">Featured</span>
        </div>
      )}

      {!post.is_pinned_home && post.is_pinned_profile && (
        <div className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-transparent border-b border-blue-500/30 text-blue-300 text-[11px] font-semibold">
          <Pin className="w-3.5 h-3.5 fill-blue-400 text-blue-400" />
          <span>Pinned to Profile</span>
        </div>
      )}

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

                <div className="absolute right-0 top-full mt-1.5 w-52 bg-[#1C2541] border border-[#334155] rounded-2xl shadow-2xl z-40 p-1.5 text-xs text-slate-200 animate-in fade-in duration-150 backdrop-blur-xl">
                  
                  {/* Option: Pin to Home Feed (Admin Only) */}
                  {isAdmin && onTogglePinHome && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onTogglePinHome(post.id);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-amber-300 hover:text-amber-100 hover:bg-amber-950/40 rounded-xl transition-colors text-left cursor-pointer font-medium"
                    >
                      <Pin className={`w-3.5 h-3.5 text-amber-400 ${post.is_pinned_home ? 'fill-amber-400' : ''}`} />
                      <span>{post.is_pinned_home ? 'Unpin from Home Feed' : 'Pin to Home Feed (Admin)'}</span>
                    </button>
                  )}

                  {/* Option: Pin to Profile (Author Only) */}
                  {isAuthor && onTogglePinProfile && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onTogglePinProfile(post.id);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-blue-300 hover:text-blue-100 hover:bg-blue-950/40 rounded-xl transition-colors text-left cursor-pointer font-medium"
                    >
                      <Pin className={`w-3.5 h-3.5 text-blue-400 ${post.is_pinned_profile ? 'fill-blue-400' : ''}`} />
                      <span>{post.is_pinned_profile ? 'Unpin from Profile' : 'Pin to Profile'}</span>
                    </button>
                  )}

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

                  {/* Option 4: Delete Post (Author or Admin) */}
                  {canDelete && onDelete && (
                    <div className="border-t border-[#334155] pt-1 mt-1">
                      {!showDeleteConfirm ? (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors text-left cursor-pointer font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isAdmin && !isAuthor ? 'Delete Post (Admin)' : 'Delete Post'}</span>
                        </button>
                      ) : (
                        <div className="p-2 bg-rose-950/40 border border-rose-600/40 rounded-xl space-y-1.5">
                          <p className="text-[11px] font-bold text-rose-300">
                            {isAdmin && !isAuthor ? 'Admin delete post?' : 'Permanently delete?'}
                          </p>
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

        {/* Comments Toggle Button */}
        <button
          onClick={() => {
            setShowComments(!showComments);
            setComments(getPostComments(post.id));
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 border rounded-2xl text-xs font-semibold transition-colors cursor-pointer ${
            showComments
              ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
              : 'bg-[#1C2541]/70 hover:bg-[#1C2541] text-slate-300 hover:text-white border-[#334155]'
          }`}
          title="View comments"
        >
          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
          <span>Comments</span>
          <span className="font-mono text-[11px] bg-[#0B132B] px-1.5 py-0.5 rounded-full text-slate-300 border border-[#334155]/60">
            {comments.length}
          </span>
        </button>

        {/* Share Action */}
        <button
          onClick={() => onShare(post)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1C2541]/70 hover:bg-[#1C2541] text-slate-300 hover:text-white border border-[#334155] rounded-2xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-blue-400" />
          <span>Share</span>
        </button>

      </div>

      {/* Expandable Comments Drawer */}
      {showComments && (
        <div className="bg-[#0B132B]/90 border-t border-[#334155]/60 p-4 flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              <span>Comments & Replies ({comments.length})</span>
            </h4>
          </div>

          {/* Comments & Replies Threaded List */}
          <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1">
            {comments.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                No comments yet. Start the conversation!
              </p>
            ) : (
              // Filter root comments and display their replies directly beneath them
              comments
                .filter(c => !c.parent_comment_id)
                .map((comment) => {
                  const isCommentAuthor = currentUser?.id === comment.user_id;
                  const canDeleteComment = isCommentAuthor || isAdmin;
                  const commentUser = comment.user || allUsers?.find(u => u.id === comment.user_id);
                  const replies = comments.filter(r => r.parent_comment_id === comment.id);

                  return (
                    <div key={comment.id} className="flex flex-col gap-2">
                      {/* Parent Comment Card */}
                      <div className="flex items-start gap-2.5 p-3 bg-[#1E293B]/80 rounded-2xl border border-[#334155]/50 text-xs group hover:border-slate-500/40 transition-colors">
                        <img
                          src={commentUser?.avatar_url || DEFAULT_DLICOM_AVATAR}
                          alt={commentUser?.display_name || 'User'}
                          className="w-7 h-7 rounded-full border border-slate-700 object-cover flex-shrink-0 cursor-pointer hover:border-blue-400"
                          onClick={() => commentUser && onOpenProfile(commentUser)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span 
                                onClick={() => commentUser && onOpenProfile(commentUser)}
                                className="font-bold text-slate-200 hover:text-blue-400 cursor-pointer truncate"
                              >
                                {commentUser?.display_name || 'Member'}
                              </span>
                              {commentUser && (
                                <VerifiedBadge
                                  isVerified={commentUser.is_verified}
                                  isGoldenVerified={commentUser.is_golden_verified}
                                  size="sm"
                                />
                              )}
                              <span className="text-[10px] text-slate-400 font-mono">
                                {formatTimeAgo(comment.created_at)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              {/* Reply Trigger */}
                              {currentUser && (
                                <button
                                  onClick={() => {
                                    if (commentUser) {
                                      setReplyingTo({ commentId: comment.id, user: commentUser });
                                      commentInputRef.current?.focus();
                                    }
                                  }}
                                  className="text-[11px] text-slate-400 hover:text-blue-400 flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-[#2A3756] transition-colors cursor-pointer"
                                  title="Reply to this comment"
                                >
                                  <Reply className="w-3 h-3" />
                                  <span>Reply</span>
                                </button>
                              )}

                              {canDeleteComment && (
                                <button
                                  onClick={async () => {
                                    if (!currentUser) return;
                                    await deletePostComment(comment.id, currentUser.id);
                                    setComments(getPostComments(post.id));
                                  }}
                                  className="text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                                  title="Delete comment"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-slate-300 mt-1 whitespace-pre-wrap break-words leading-relaxed">
                            {comment.text}
                          </p>
                        </div>
                      </div>

                      {/* Nested Replies Thread */}
                      {replies.length > 0 && (
                        <div className="ml-5 sm:ml-7 pl-3 border-l-2 border-blue-500/30 space-y-2 pt-0.5">
                          {replies.map((reply) => {
                            const isReplyAuthor = currentUser?.id === reply.user_id;
                            const canDeleteReply = isReplyAuthor || isAdmin;
                            const replyAuthor = reply.user || allUsers?.find(u => u.id === reply.user_id);

                            return (
                              <div
                                key={reply.id}
                                className="flex items-start gap-2.5 p-2.5 bg-[#141E33]/90 rounded-2xl border border-blue-500/20 text-xs group hover:border-blue-500/40 transition-colors"
                              >
                                <img
                                  src={replyAuthor?.avatar_url || DEFAULT_DLICOM_AVATAR}
                                  alt={replyAuthor?.display_name || 'User'}
                                  className="w-6 h-6 rounded-full border border-slate-700 object-cover flex-shrink-0 cursor-pointer"
                                  onClick={() => replyAuthor && onOpenProfile(replyAuthor)}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span
                                        onClick={() => replyAuthor && onOpenProfile(replyAuthor)}
                                        className="font-bold text-slate-200 hover:text-blue-400 cursor-pointer truncate"
                                      >
                                        {replyAuthor?.display_name || 'Member'}
                                      </span>
                                      {replyAuthor && (
                                        <VerifiedBadge
                                          isVerified={replyAuthor.is_verified}
                                          isGoldenVerified={replyAuthor.is_golden_verified}
                                          size="xs"
                                        />
                                      )}
                                      {reply.reply_to_username && (
                                        <span className="text-[10px] text-blue-400 font-mono bg-blue-950/70 border border-blue-600/30 px-1.5 py-0.2 rounded-md">
                                          @{reply.reply_to_username}
                                        </span>
                                      )}
                                      <span className="text-[10px] text-slate-500 font-mono">
                                        {formatTimeAgo(reply.created_at)}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      {currentUser && (
                                        <button
                                          onClick={() => {
                                            if (replyAuthor) {
                                              setReplyingTo({ commentId: comment.id, user: replyAuthor });
                                              commentInputRef.current?.focus();
                                            }
                                          }}
                                          className="text-[10px] text-slate-400 hover:text-blue-400 flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-[#2A3756] transition-colors cursor-pointer"
                                          title="Reply to this member"
                                        >
                                          <Reply className="w-2.5 h-2.5" />
                                          <span>Reply</span>
                                        </button>
                                      )}

                                      {canDeleteReply && (
                                        <button
                                          onClick={async () => {
                                            if (!currentUser) return;
                                            await deletePostComment(reply.id, currentUser.id);
                                            setComments(getPostComments(post.id));
                                          }}
                                          className="text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                                          title="Delete reply"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  <p className="text-slate-300 mt-1 whitespace-pre-wrap break-words leading-relaxed text-[11px]">
                                    {reply.text}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>

          {/* New Comment / Reply Input Box */}
          {currentUser ? (
            <div className="flex flex-col gap-1.5 pt-2 border-t border-[#334155]/50">
              {/* Active Replying Banner */}
              {replyingTo && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-blue-950/80 border border-blue-500/40 text-xs text-blue-300 rounded-xl animate-in fade-in">
                  <div className="flex items-center gap-1.5 truncate">
                    <CornerDownRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Replying to <strong className="text-white">@{replyingTo.user.username}</strong></span>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-slate-400 hover:text-white p-0.5 cursor-pointer ml-2"
                    title="Cancel reply"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <img
                  src={currentUser.avatar_url || DEFAULT_DLICOM_AVATAR}
                  alt={currentUser.display_name}
                  className="w-7 h-7 rounded-full border border-slate-700 object-cover flex-shrink-0"
                />
                <input
                  ref={commentInputRef}
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && !e.shiftKey && newCommentText.trim() && !isSubmittingComment) {
                      e.preventDefault();
                      setIsSubmittingComment(true);
                      await addPostComment(
                        post.id, 
                        currentUser.id, 
                        newCommentText,
                        replyingTo?.commentId || null,
                        replyingTo?.user.id || null,
                        replyingTo?.user.username
                      );
                      setNewCommentText('');
                      setReplyingTo(null);
                      setComments(getPostComments(post.id));
                      setIsSubmittingComment(false);
                    }
                  }}
                  placeholder={replyingTo ? `Reply to @${replyingTo.user.username}...` : "Write a comment..."}
                  className="flex-1 bg-[#1E293B] border border-[#334155] focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
                  maxLength={500}
                />
                <button
                  disabled={!newCommentText.trim() || isSubmittingComment}
                  onClick={async () => {
                    if (!newCommentText.trim() || isSubmittingComment) return;
                    setIsSubmittingComment(true);
                    await addPostComment(
                      post.id, 
                      currentUser.id, 
                      newCommentText,
                      replyingTo?.commentId || null,
                      replyingTo?.user.id || null,
                      replyingTo?.user.username
                    );
                    setNewCommentText('');
                    setReplyingTo(null);
                    setComments(getPostComments(post.id));
                    setIsSubmittingComment(false);
                  }}
                  className={`p-2 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                    newCommentText.trim() && !isSubmittingComment
                      ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed'
                  }`}
                  title="Send"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-1">
              Please sign in to write comments.
            </p>
          )}
        </div>
      )}

    </article>
  );
};
