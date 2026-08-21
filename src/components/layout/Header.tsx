import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  Sun, 
  Moon, 
  Layers, 
  Settings, 
  LogOut, 
  User, 
  ChevronDown,
  Plus,
  X,
  FileText,
  ShieldCheck,
  ArrowRight,
  Repeat,
  Crown
} from 'lucide-react';
import type { Profile, NotificationItem, ThemeMode, Post } from '../../types';
import { isUserAdmin } from '../../lib/storage';
import { NotificationFlyout } from './NotificationFlyout';
import { VerifiedBadge } from '../ui/VerifiedBadge';

interface HeaderProps {
  currentUser: Profile;
  allUsers?: Profile[];
  allPosts?: Post[];
  notifications: NotificationItem[];
  searchQuery: string;
  themeMode: ThemeMode;
  onGoHome: () => void;
  onOpenCreateModal: () => void;
  onSearchChange: (q: string) => void;
  onThemeToggle: () => void;
  onOpenProfile: (profile: Profile) => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  onOpenAccountSwitcher?: () => void;
  onOpenAdminPanel?: () => void;
  onMarkAllNotificationsRead: () => void;
  onSelectPostFromNotif: (postId: string) => void;
  onSelectPostFromSearch?: (post: Post) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allUsers = [],
  allPosts = [],
  notifications,
  searchQuery,
  themeMode,
  onGoHome,
  onOpenCreateModal,
  onSearchChange,
  onThemeToggle,
  onOpenProfile,
  onOpenSettings,
  onSignOut,
  onOpenAccountSwitcher,
  onOpenAdminPanel,
  onMarkAllNotificationsRead,
  onSelectPostFromNotif,
  onSelectPostFromSearch,
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const query = searchQuery.toLowerCase().trim();

  // Matched Users (Search by Name, Username, Bio)
  const matchedUsers = query
    ? allUsers.filter(
        u =>
          (u.display_name && u.display_name.toLowerCase().includes(query)) ||
          (u.username && u.username.toLowerCase().includes(query)) ||
          (u.first_name && u.first_name.toLowerCase().includes(query)) ||
          (u.bio && u.bio.toLowerCase().includes(query))
      ).slice(0, 4)
    : [];

  // Matched Posts (Search by Title, Description, Tags, Author Name)
  const matchedPosts = query
    ? allPosts.filter(
        p =>
          (p.title && p.title.toLowerCase().includes(query)) ||
          (p.description && p.description.toLowerCase().includes(query)) ||
          (p.user?.display_name && p.user.display_name.toLowerCase().includes(query)) ||
          (p.tags && p.tags.some(t => t.toLowerCase().includes(query)))
      ).slice(0, 5)
    : [];

  const hasLiveResults = query.length > 0 && (matchedUsers.length > 0 || matchedPosts.length > 0);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full glass-header-dark border-b border-[#334155]/80 bg-[#0B132B]/95 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        
        {/* Left: Brand Logo & Home Button */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={onGoHome} 
            className="flex items-center gap-2.5 group text-left focus:outline-none cursor-pointer"
            title="Go to Home Feed"
          >
            <img
              src="/logo.jpg"
              alt="Aether Feed"
              className="w-9 h-9 rounded-xl object-cover shadow-glow-sm group-hover:scale-105 transition-transform duration-200 border border-blue-500/40"
            />
            
            <span className="text-base font-extrabold text-white tracking-tight group-hover:text-blue-400 transition-colors">
              Aether Feed
            </span>
          </button>
        </div>

        {/* Center: Search Bar with Live Instant Dropdown */}
        <div ref={searchContainerRef} className="flex-1 max-w-sm hidden sm:block mx-4 relative">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setIsSearchFocused(true);
              }}
              placeholder="Search post titles, members, #tags..."
              className="w-full pl-8.5 pr-8 py-1.5 bg-[#1C2541] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none font-sans transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  onSearchChange('');
                  setIsSearchFocused(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Live Search Floating Results Dropdown */}
          {isSearchFocused && query.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-[#1C2541] border border-[#334155] rounded-2xl shadow-2xl z-50 overflow-hidden max-h-96 overflow-y-auto animate-in fade-in duration-150 backdrop-blur-xl">
              
              {/* Section 1: Matching Members / Profiles */}
              {matchedUsers.length > 0 && (
                <div className="p-2 border-b border-[#334155]/60">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                    <User className="w-3 h-3 text-blue-400" />
                    <span>Members ({matchedUsers.length})</span>
                  </p>
                  <div className="space-y-1 mt-1">
                    {matchedUsers.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => {
                          onOpenProfile(user);
                          setIsSearchFocused(false);
                        }}
                        className="flex items-center gap-2.5 p-2 hover:bg-[#1E293B] rounded-xl cursor-pointer transition-colors"
                      >
                        <img
                          src={user.avatar_url}
                          alt={user.display_name}
                          className="w-7 h-7 rounded-lg object-cover border border-[#334155]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-bold text-white truncate">{user.display_name}</p>
                            <VerifiedBadge user={user} size="xs" />
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono truncate">@{user.username}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 2: Matching Posts / Titles */}
              {matchedPosts.length > 0 && (
                <div className="p-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-emerald-400" />
                    <span>Posts & Titles ({matchedPosts.length})</span>
                  </p>
                  <div className="space-y-1 mt-1">
                    {matchedPosts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => {
                          if (onSelectPostFromSearch) {
                            onSelectPostFromSearch(post);
                          }
                          setIsSearchFocused(false);
                        }}
                        className="p-2 hover:bg-[#1E293B] rounded-xl cursor-pointer transition-colors"
                      >
                        {post.title ? (
                          <p className="text-xs font-bold text-white truncate mb-0.5">
                            {post.title}
                          </p>
                        ) : null}
                        <p className="text-[11px] text-slate-300 truncate line-clamp-1">
                          {post.description}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          by @{post.user?.username || 'member'} &bull; ▲ {post.net_votes}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No results notice */}
              {!hasLiveResults && (
                <div className="py-6 text-center text-xs text-slate-400 p-4">
                  No matching profiles or posts found for "{searchQuery}".
                </div>
              )}

            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* Mobile Search Icon Toggle */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="sm:hidden p-2 rounded-xl border border-[#334155] bg-[#1C2541] hover:bg-[#2A3756] text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Top + Create Button */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-glow transition-all active:scale-95 cursor-pointer"
            title="Create New Post / Status"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Post</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={onThemeToggle}
            title={themeMode === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="p-2 rounded-xl border border-[#334155] bg-[#1C2541] hover:bg-[#2A3756] text-slate-300 hover:text-white transition-all cursor-pointer"
            aria-label="Toggle Theme"
          >
            {themeMode === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-blue-400" />
            )}
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`relative p-2 rounded-xl border transition-all cursor-pointer ${
                isNotifOpen 
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300' 
                  : 'text-slate-300 hover:text-white bg-[#1C2541] hover:bg-[#2A3756] border-[#334155]'
              }`}
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center bg-blue-600 border-2 border-[#0B132B] rounded-full text-[9px] font-bold text-white shadow-glow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <NotificationFlyout
              notifications={notifications}
              isOpen={isNotifOpen}
              onClose={() => setIsNotifOpen(false)}
              onMarkAllRead={onMarkAllNotificationsRead}
              onSelectPost={onSelectPostFromNotif}
            />
          </div>

          {/* Current User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl bg-[#1C2541] hover:bg-[#2A3756] border border-[#334155] transition-all cursor-pointer"
            >
              <img
                src={currentUser.avatar_url}
                alt={currentUser.display_name}
                className="w-7 h-7 rounded-lg object-cover border border-blue-500/40"
              />
              <span className="text-xs font-semibold text-slate-200 hidden md:inline max-w-[90px] truncate">
                {currentUser.first_name}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-52 bg-[#1C2541] border border-[#334155] rounded-2xl shadow-2xl z-50 p-2 text-slate-200 backdrop-blur-xl animate-in fade-in duration-150">
                  
                  <div
                    onClick={() => {
                      onOpenProfile(currentUser);
                      setIsMenuOpen(false);
                    }}
                    className="p-2.5 bg-[#1E293B] rounded-xl hover:bg-[#2A3756] cursor-pointer mb-2"
                  >
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-white truncate">{currentUser.display_name}</p>
                      <VerifiedBadge user={currentUser} size="xs" showAdminLabel={true} />
                    </div>
                    <p className="text-[11px] text-blue-400 font-mono">@{currentUser.username}</p>
                  </div>

                  <button
                    onClick={() => {
                      onOpenProfile(currentUser);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-[#1E293B] rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>My Profile</span>
                  </button>

                  {onOpenAccountSwitcher && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenAccountSwitcher();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-400 hover:text-white hover:bg-blue-950/40 rounded-lg transition-colors text-left cursor-pointer font-medium"
                    >
                      <Repeat className="w-3.5 h-3.5 text-blue-400" />
                      <span>Switch Account</span>
                    </button>
                  )}

                  {/* Admin Console (Super Admin Exclusive) */}
                  {isUserAdmin(currentUser) && onOpenAdminPanel && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenAdminPanel();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 rounded-lg transition-colors text-left cursor-pointer font-bold shadow-sm"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>Admin Panel</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onOpenSettings();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-[#1E293B] rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Settings</span>
                  </button>

                  <div className="border-t border-[#334155] pt-1 mt-1">
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onSignOut();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>

                </div>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Mobile Search Bar Expansion */}
      {isMobileSearchOpen && (
        <div className="sm:hidden px-4 py-2 bg-[#1C2541] border-b border-[#334155] animate-in slide-in-from-top duration-150">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search post titles, members, #tags..."
              className="w-full pl-8.5 pr-8 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
