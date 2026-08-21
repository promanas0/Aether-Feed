import React from 'react';
import { 
  Bell, 
  ChevronUp, 
  ChevronDown, 
  UserPlus, 
  Tag, 
  FileImage, 
  Check, 
  Radio, 
  ExternalLink 
} from 'lucide-react';
import type { NotificationItem } from '../../types';
import { DEFAULT_DLICOM_AVATAR } from '../../lib/storage';

interface NotificationFlyoutProps {
  notifications: NotificationItem[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAllRead: () => void;
  onSelectPost: (postId: string) => void;
}

const formatTimeAgo = (dateStr: string): string => {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${Math.max(1, seconds)}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const NotificationFlyout: React.FC<NotificationFlyoutProps> = ({
  notifications,
  isOpen,
  onClose,
  onMarkAllRead,
  onSelectPost,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      <div className="absolute right-0 top-full mt-2.5 w-80 sm:w-96 max-h-[480px] bg-[#1C2541] border border-[#334155] rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#334155] bg-[#1E293B]/80">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-white uppercase tracking-wider">
              Notifications
            </span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-[11px] font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              <Check className="w-3 h-3" />
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 divide-y divide-[#334155]/60">
          {notifications.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <Radio className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-xs font-medium text-slate-400">No notifications yet</p>
              <p className="text-[11px] text-slate-500 mt-1">Live broadcasts and follow alerts will arrive here.</p>
            </div>
          ) : (
            notifications.map((n) => {
              return (
                <div
                  key={n.id}
                  onClick={() => {
                    if (n.post_id) {
                      onSelectPost(n.post_id);
                      onClose();
                    }
                  }}
                  className={`p-3.5 flex items-start gap-3 hover:bg-[#1E293B] cursor-pointer transition-colors ${
                    !n.is_read ? 'bg-blue-950/30' : ''
                  }`}
                >
                  {/* Actor Avatar with vector sub-badge */}
                  <div className="relative shrink-0">
                    <img
                      src={n.actor?.avatar_url || DEFAULT_DLICOM_AVATAR}
                      alt={n.actor?.display_name || 'User'}
                      className="w-8 h-8 rounded-full object-cover border border-[#334155]"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px]">
                      {n.type === 'vote_up' && <ChevronUp className="w-2.5 h-2.5 stroke-[3]" />}
                      {n.type === 'vote_down' && <ChevronDown className="w-2.5 h-2.5 stroke-[3]" />}
                      {n.type === 'follow' && <UserPlus className="w-2.5 h-2.5 stroke-[2.5]" />}
                      {n.type === 'tag' && <Tag className="w-2.5 h-2.5 stroke-[2.5]" />}
                      {n.type === 'new_post' && <FileImage className="w-2.5 h-2.5 stroke-[2.5]" />}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-200 leading-snug">
                      <span className="font-semibold text-white hover:underline">
                        {n.actor?.display_name || 'Aether Curator'}
                      </span>{' '}
                      {n.type === 'vote_up' && <span className="text-slate-300">upvoted your artwork</span>}
                      {n.type === 'vote_down' && <span className="text-slate-300">downvoted your artwork</span>}
                      {n.type === 'follow' && <span className="text-slate-300">started following your profile</span>}
                      {n.type === 'tag' && <span className="text-slate-300">tagged you in an artwork</span>}
                      {n.type === 'new_post' && <span className="text-slate-300">broadcasted a new artwork</span>}
                    </p>

                    {n.post && (
                      <p className="text-[11px] text-blue-400 font-medium truncate mt-0.5 flex items-center gap-1">
                        <span>"{n.post.title}"</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                      </p>
                    )}

                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {formatTimeAgo(n.created_at)}
                    </span>
                  </div>

                  {/* Unread indicator dot */}
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5 shadow-glow-sm" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#0B132B] border-t border-[#334155] text-center">
          <span className="text-[10px] text-slate-500 font-mono">
            Dlicom Aether Event Node
          </span>
        </div>
      </div>
    </>
  );
};
