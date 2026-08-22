import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  ChevronUp, 
  ChevronDown, 
  UserPlus, 
  Tag, 
  FileImage, 
  Check, 
  Radio, 
  ExternalLink,
  Trash2,
  Smartphone,
  CheckCheck,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import type { NotificationItem } from '../../types';
import { 
  DEFAULT_DLICOM_AVATAR, 
  getPushNotificationPermissionStatus, 
  requestPushNotificationPermission 
} from '../../lib/storage';

interface NotificationFlyoutProps {
  notifications: NotificationItem[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAllRead: () => void;
  onClearRead?: () => void;
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
  onClearRead,
  onSelectPost,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');
  const [pushStatus, setPushStatus] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');

  useEffect(() => {
    setPushStatus(getPushNotificationPermissionStatus());
  }, [isOpen]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const readCount = notifications.length - unreadCount;

  const displayedNotifications = filterMode === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const handleEnablePush = async () => {
    const granted = await requestPushNotificationPermission();
    setPushStatus(granted ? 'granted' : getPushNotificationPermissionStatus());
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      <div className="absolute right-0 top-full mt-2.5 w-[calc(100vw-2rem)] sm:w-96 max-h-[540px] bg-[#1C2541] border border-[#334155] rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-2xl">
        
        {/* Header */}
        <div className="p-3.5 border-b border-[#334155] bg-[#1E293B]/90 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                <Bell className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-blue-600 text-white rounded-full shadow-glow-sm">
                  {unreadCount} new
                </span>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-blue-950/40"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark Read</span>
                </button>
              )}

              {readCount > 0 && onClearRead && (
                <button
                  onClick={onClearRead}
                  className="text-[11px] font-semibold text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-rose-950/30"
                  title="Clear already checked/read notifications"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear Read</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills (All vs Unread Only) */}
          <div className="flex items-center justify-between gap-1 bg-[#0B132B] p-1 rounded-xl border border-[#334155]/60 text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`flex-1 py-1 px-2 rounded-lg font-semibold transition-all text-center cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilterMode('unread')}
              className={`flex-1 py-1 px-2 rounded-lg font-semibold transition-all text-center cursor-pointer ${
                filterMode === 'unread'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        {/* Push Notification Mobile Activation Bar */}
        {pushStatus !== 'granted' && pushStatus !== 'unsupported' && (
          <div className="px-3.5 py-2 bg-gradient-to-r from-blue-950/80 to-[#1C2541] border-b border-blue-500/20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Smartphone className="w-4 h-4 text-blue-400 shrink-0" />
              <p className="text-[11px] text-slate-300 truncate">
                Get live alerts directly on your phone
              </p>
            </div>
            <button
              onClick={handleEnablePush}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg shrink-0 transition-colors shadow-sm cursor-pointer"
            >
              Allow
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="overflow-y-auto flex-1 divide-y divide-[#334155]/40">
          {displayedNotifications.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <Radio className="w-8 h-8 mx-auto text-slate-600 mb-2 animate-pulse" />
              <p className="text-xs font-semibold text-slate-300">
                {filterMode === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                {filterMode === 'unread' 
                  ? 'All notifications have been checked and read.' 
                  : 'Live broadcasts, replies, upvotes, and follow alerts will arrive here.'}
              </p>
            </div>
          ) : (
            displayedNotifications.map((n) => {
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
                    !n.is_read ? 'bg-blue-950/40 border-l-4 border-l-blue-500' : 'opacity-85 hover:opacity-100'
                  }`}
                >
                  {/* Actor Avatar with vector sub-badge */}
                  <div className="relative shrink-0">
                    <img
                      src={n.actor?.avatar_url || DEFAULT_DLICOM_AVATAR}
                      alt={n.actor?.display_name || 'User'}
                      className="w-8 h-8 rounded-full object-cover border border-[#334155]"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] shadow-sm">
                      {n.type === 'vote_up' && <ChevronUp className="w-2.5 h-2.5 stroke-[3]" />}
                      {n.type === 'vote_down' && <ChevronDown className="w-2.5 h-2.5 stroke-[3]" />}
                      {n.type === 'follow' && <UserPlus className="w-2.5 h-2.5 stroke-[2.5]" />}
                      {n.type === 'tag' && <Tag className="w-2.5 h-2.5 stroke-[2.5]" />}
                      {n.type === 'new_post' && <FileImage className="w-2.5 h-2.5 stroke-[2.5]" />}
                      {n.type === 'comment' && <MessageSquare className="w-2.5 h-2.5 stroke-[2.5]" />}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-200 leading-snug">
                      <span className="font-bold text-white hover:underline">
                        {n.actor?.display_name || 'Aether Curator'}
                      </span>{' '}
                      {n.type === 'vote_up' && <span className="text-slate-300">upvoted your artwork</span>}
                      {n.type === 'vote_down' && <span className="text-slate-300">voted on your artwork</span>}
                      {n.type === 'follow' && <span className="text-slate-300">started following your profile</span>}
                      {n.type === 'tag' && <span className="text-slate-300">tagged you in an artwork</span>}
                      {n.type === 'new_post' && <span className="text-slate-300">broadcasted a new artwork</span>}
                      {n.type === 'comment' && <span className="text-slate-300">commented / replied to your post</span>}
                    </p>

                    {n.post && (
                      <p className="text-[11px] text-blue-400 font-medium truncate mt-0.5 flex items-center gap-1">
                        <span>"{n.post.title || n.post.description}"</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                      </p>
                    )}

                    <span className="text-[10px] text-slate-500 mt-1 block font-mono">
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
        <div className="px-4 py-2.5 bg-[#0B132B] border-t border-[#334155] flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Dlicom Real-Time Alerts</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>
      </div>
    </>
  );
};
