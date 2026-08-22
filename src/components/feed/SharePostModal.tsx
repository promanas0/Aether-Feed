import React from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Send, 
  ExternalLink, 
  MessageCircle 
} from 'lucide-react';
import type { Post } from '../../types';

interface SharePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  addToast: (title: string, desc?: string, type?: 'info' | 'success' | 'vote' | 'broadcast') => void;
}

export const SharePostModal: React.FC<SharePostModalProps> = ({
  isOpen,
  onClose,
  post,
  addToast,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !post) return null;

  const shareUrl = window.location.origin + window.location.pathname;
  const shareText = `Check out this post by ${post.user?.display_name || 'Aether Member'} on Aether Feed: "${post.title ? post.title + ' - ' : ''}${post.description.slice(0, 100)}..."`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    setCopied(true);
    addToast('Link Copied', 'Post link & preview copied to clipboard.', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title || 'Aether Feed Post',
          text: shareText,
          url: shareUrl,
        });
        addToast('Shared', 'Post shared successfully.', 'success');
        onClose();
      } catch (err) {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
    window.open(url, '_blank');
  };

  const handleShareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B132B]/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-[#1C2541] border border-[#334155] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#334155] bg-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Share Post
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#334155] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Post Preview Snippet */}
        <div className="p-4 border-b border-[#334155]/60 bg-[#0B132B]">
          <div className="flex items-center gap-2.5 mb-2">
            <img
              src={post.user?.avatar_url}
              alt={post.user?.display_name}
              className="w-7 h-7 rounded-lg object-cover"
            />
            <div>
              <p className="text-xs font-bold text-white leading-tight">
                {post.user?.display_name}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                @{post.user?.username}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-200 line-clamp-2 italic">
            "{post.description}"
          </p>
        </div>

        {/* Share Destinations */}
        <div className="p-4 space-y-3">
          
          {/* Quick Copy Link Box */}
          <div className="flex items-center gap-2 p-2 bg-[#0B132B] border border-[#334155] rounded-2xl">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent px-2 text-xs font-mono text-slate-300 focus:outline-none truncate"
            />
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-glow-sm cursor-pointer shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Social Share Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            
            {/* WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              className="flex flex-col items-center justify-center p-3 bg-[#0B132B] hover:bg-[#1E293B] border border-[#334155] rounded-2xl text-slate-200 transition-all hover:border-emerald-500 group cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-semibold">WhatsApp</span>
            </button>

            {/* X / Twitter */}
            <button
              onClick={handleShareTwitter}
              className="flex flex-col items-center justify-center p-3 bg-[#0B132B] hover:bg-[#1E293B] border border-[#334155] rounded-2xl text-slate-200 transition-all hover:border-blue-400 group cursor-pointer"
            >
              <svg className="w-5 h-5 text-sky-400 mb-1 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span className="text-[11px] font-semibold">X (Twitter)</span>
            </button>

            {/* Telegram */}
            <button
              onClick={handleShareTelegram}
              className="flex flex-col items-center justify-center p-3 bg-[#0B132B] hover:bg-[#1E293B] border border-[#334155] rounded-2xl text-slate-200 transition-all hover:border-cyan-400 group cursor-pointer"
            >
              <Send className="w-5 h-5 text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-semibold">Telegram</span>
            </button>

          </div>

          {/* Native System Share if available */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#0B132B] hover:bg-[#1E293B] border border-[#334155] text-slate-200 rounded-2xl text-xs font-semibold transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-blue-400" />
              <span>More Share Options...</span>
            </button>
          )}

        </div>

      </div>
    </div>
  );
};
