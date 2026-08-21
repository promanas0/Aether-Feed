import React from 'react';
import { 
  X, 
  Info, 
  Clock, 
  Calendar, 
  User, 
  ChevronUp, 
  ChevronDown, 
  Tag, 
  Hash, 
  FileText, 
  Copy, 
  Check, 
  ShieldCheck,
  Share2
} from 'lucide-react';
import type { Post, Profile } from '../../types';
import { VerifiedBadge } from '../ui/VerifiedBadge';

interface PostDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  onOpenShare: (post: Post) => void;
  addToast: (title: string, desc?: string, type?: 'info' | 'success' | 'vote' | 'broadcast') => void;
}

export const PostDetailsModal: React.FC<PostDetailsModalProps> = ({
  isOpen,
  onClose,
  post,
  onOpenShare,
  addToast,
}) => {
  const [copiedId, setCopiedId] = React.useState(false);

  if (!isOpen || !post) return null;

  const dateObj = new Date(post.created_at);
  const formattedFullDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const wordCount = post.description.trim().split(/\s+/).filter(Boolean).length;
  const charCount = post.description.length;

  const handleCopyId = () => {
    navigator.clipboard.writeText(post.id);
    setCopiedId(true);
    addToast('Post ID Copied', post.id, 'success');
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B132B]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#1C2541] border border-[#334155] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#334155] bg-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Post Details & Metadata
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#334155] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Post Author Card */}
          <div className="p-3.5 bg-[#0B132B] border border-[#334155] rounded-2xl flex items-center gap-3">
            <img
              src={post.user?.avatar_url}
              alt={post.user?.display_name}
              className="w-11 h-11 rounded-xl object-cover border border-[#334155]"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-white truncate">
                  {post.user?.display_name}
                </h4>
                <VerifiedBadge user={post.user} showAdminLabel={true} />
              </div>
              <p className="text-[11px] text-blue-400 font-mono truncate">
                @{post.user?.username}
              </p>
            </div>
          </div>

          {/* Timestamp & Timing */}
          <div className="p-3.5 bg-[#0B132B] border border-[#334155] rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-wider text-[10px]">
              <Clock className="w-3.5 h-3.5" />
              <span>Published Timestamp</span>
            </div>
            <p className="text-xs font-semibold text-white">
              {formattedFullDate}
            </p>
            <p className="text-xs text-slate-300 font-mono">
              Exact Time: <span className="text-blue-300">{formattedTime}</span>
            </p>
          </div>

          {/* Voting & Engagement Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-[#0B132B] border border-[#334155] rounded-2xl">
              <div className="flex items-center justify-center gap-1 text-blue-400 font-bold text-sm">
                <ChevronUp className="w-4 h-4" />
                <span>{post.votes_up}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Upvotes</p>
            </div>

            <div className="p-3 bg-[#0B132B] border border-[#334155] rounded-2xl">
              <div className="flex items-center justify-center gap-1 text-rose-400 font-bold text-sm">
                <ChevronDown className="w-4 h-4" />
                <span>{post.votes_down}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Downvotes</p>
            </div>

            <div className="p-3 bg-[#0B132B] border border-[#334155] rounded-2xl">
              <p className="text-sm font-bold text-white font-mono">
                {post.net_votes >= 0 ? `+${post.net_votes}` : post.net_votes}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Net Score</p>
            </div>
          </div>

          {/* Text Metrics */}
          <div className="p-3.5 bg-[#0B132B] border border-[#334155] rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between text-slate-300">
              <span>Word Count:</span>
              <span className="font-mono text-white font-bold">{wordCount} words</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Character Count:</span>
              <span className="font-mono text-white font-bold">{charCount} characters</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Media Attachment:</span>
              <span className="font-mono text-blue-400 font-bold">
                {post.video_data ? 'Video Attached (MP4/WebM)' : post.image_data ? 'Photo Attached' : 'Text Status Only'}
              </span>
            </div>
          </div>

          {/* Tagged & Hashtags if present */}
          {( (post.tagged_users && post.tagged_users.length > 0) || (post.tags && post.tags.length > 0) ) && (
            <div className="p-3.5 bg-[#0B132B] border border-[#334155] rounded-2xl space-y-2">
              {post.tagged_users && post.tagged_users.length > 0 && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tagged Members:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {post.tagged_users.map(u => (
                      <span key={u} className="px-2 py-0.5 bg-blue-950/60 border border-blue-600/40 text-blue-300 rounded-lg text-[11px] font-mono">
                        @{u}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {post.tags && post.tags.length > 0 && (
                <div className="pt-2 border-t border-[#334155]/50">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Topics / Hashtags:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {post.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-[#1C2541] border border-[#334155] text-slate-300 rounded-lg text-[11px]">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Post ID & Copy */}
          <div className="p-3 bg-[#0B132B] border border-[#334155] rounded-2xl flex items-center justify-between gap-2 font-mono">
            <span className="text-slate-400 truncate text-[11px] select-all">
              ID: {post.id}
            </span>
            <button
              onClick={handleCopyId}
              className="p-1.5 hover:bg-[#1C2541] text-slate-300 hover:text-white rounded-lg transition-colors shrink-0 cursor-pointer"
              title="Copy Post ID"
            >
              {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Share Action Button */}
          <button
            onClick={() => {
              onClose();
              onOpenShare(post);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold shadow-glow-sm cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Share This Post</span>
          </button>

        </div>

      </div>
    </div>
  );
};
