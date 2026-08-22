import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  initializeV3Storage, 
  getCurrentUser, 
  setCurrentUserSession, 
  getRealUsers, 
  getRealPosts, 
  getVotesList, 
  votePostAction, 
  createRealPost, 
  deleteRealPost,
  updateRealPostText,
  toggleFollowUser, 
  updateProfileData, 
  getRealLeaderboard, 
  getNotificationsForRealUser, 
  markAllNotificationsRead, 
  getThemeMode, 
  setThemeMode,
  syncWithServer,
  getSavedAccounts,
  removeSavedAccount,
  switchAccountSession,
  subscribeToSupabaseRealtime,
  authenticateUser
} from './lib/storage';
import type { 
  Profile, 
  Post, 
  NotificationItem, 
  ActiveView, 
  FeedFilter, 
  ThemeMode, 
  ToastMessage 
} from './types';

// Components
import { LandingPage } from './components/auth/LandingPage';
import { Header } from './components/layout/Header';
import { LeftSidebar } from './components/layout/LeftSidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { CreatePostBox } from './components/feed/CreatePostBox';
import { CreatePostModal } from './components/feed/CreatePostModal';
import { EditPostModal } from './components/feed/EditPostModal';
import { PostDetailsModal } from './components/feed/PostDetailsModal';
import { SharePostModal } from './components/feed/SharePostModal';
import { PostCard } from './components/feed/PostCard';
import { UserProfileView } from './components/profile/UserProfileView';
import { RealLeaderboardView } from './components/leaderboard/RealLeaderboardView';
import { SettingsModal } from './components/settings/SettingsModal';
import { ImageLightboxModal } from './components/feed/ImageLightboxModal';
import { AccountSwitcherModal } from './components/auth/AccountSwitcherModal';
import { AuthModal } from './components/auth/AuthModal';
import { AdminPanelModal } from './components/admin/AdminPanelModal';
import { VerifiedBadge } from './components/ui/VerifiedBadge';
import { ToastContainer } from './components/ui/Toast';
import { 
  Flame, 
  Clock, 
  Award, 
  X, 
  FileText, 
  Plus, 
  User, 
  ShieldCheck, 
  UserPlus, 
  UserCheck 
} from 'lucide-react';

export function App() {
  // 1. Storage & Theme Initialization
  useEffect(() => {
    initializeV3Storage();
    const mode = getThemeMode();
    setThemeMode(mode);
  }, []);

  const [currentUser, setCurrentUser] = useState<Profile | null>(() => getCurrentUser());
  const [savedAccounts, setSavedAccounts] = useState<Profile[]>(() => getSavedAccounts());
  const [users, setUsers] = useState<Profile[]>(() => getRealUsers());
  const [posts, setPosts] = useState<Post[]>(() => getRealPosts());
  const [votes, setVotes] = useState(() => getVotesList());
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [leaderboard, setLeaderboard] = useState(() => getRealLeaderboard());
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => getThemeMode());

  // Navigation & View States
  const [activeView, setActiveView] = useState<ActiveView>('feed');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAccountSwitcherOpen, setIsAccountSwitcherOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [detailsPost, setDetailsPost] = useState<Post | null>(null);
  const [shareModalPost, setShareModalPost] = useState<Post | null>(null);
  const [lightboxData, setLightboxData] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: '',
    title: ''
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((title: string, description?: string, type: ToastMessage['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync state from storage cleanly
  const syncStateFromStorage = useCallback(() => {
    const user = getCurrentUser();
    const freshUsers = getRealUsers();
    setCurrentUser(user);
    setSavedAccounts(getSavedAccounts());
    setUsers(freshUsers);
    setPosts(getRealPosts());
    setVotes(getVotesList());
    setLeaderboard(getRealLeaderboard());
    setThemeModeState(getThemeMode());
    if (user) {
      setNotifications(getNotificationsForRealUser(user.id));
    } else {
      setNotifications([]);
    }
    // Keep selectedProfile in sync with latest user data if viewing a profile
    setSelectedProfile((prev) => {
      if (!prev) return null;
      const match = freshUsers.find(u => u.id === prev.id);
      return match || prev;
    });
  }, []);

  useEffect(() => {
    syncStateFromStorage();
    syncWithServer();

    // 1. Live Instant Supabase Realtime Subscription
    const unsubscribeRealtime = subscribeToSupabaseRealtime(() => {
      syncStateFromStorage();
    });

    // 2. Responsive Periodic Background Sync (every 3.5s for seamless multi-device sync)
    const pollInterval = setInterval(() => {
      syncWithServer();
    }, 3500);

    const handleSync = () => {
      syncStateFromStorage();
    };

    const handleWindowFocus = () => {
      syncWithServer();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncWithServer();
      }
    };

    const handleBroadcast = (e: Event) => {
      const customEvent = e as CustomEvent<{ post: Post; authorId: string }>;
      const { post, authorId } = customEvent.detail;
      syncStateFromStorage();
      const curr = getCurrentUser();
      if (curr && curr.id !== authorId) {
        addToast(
          'New Post Published',
          `${post.user?.display_name || 'A member'} shared an update.`,
          'broadcast'
        );
      }
    };

    window.addEventListener('aether_storage_sync', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('aether_post_broadcast', handleBroadcast);

    return () => {
      unsubscribeRealtime();
      clearInterval(pollInterval);
      window.removeEventListener('aether_storage_sync', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('aether_post_broadcast', handleBroadcast);
    };
  }, [syncStateFromStorage, addToast]);

  // Handle Theme Toggle
  const handleToggleTheme = () => {
    const nextMode: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextMode);
    setThemeModeState(nextMode);
    addToast('Theme Changed', `Switched to ${nextMode === 'dark' ? 'Dark Theme' : 'Clean Light Theme'}.`, 'info');
  };

  // Handle Dual Upvote / Downvote Action
  const handleVote = (postId: string, type: 'up' | 'down') => {
    if (!currentUser) return;
    const res = votePostAction(postId, currentUser.id, type);
    syncStateFromStorage();

    if (res.userVote === 'up') {
      addToast('Upvoted', 'Upvote recorded (+1).', 'vote');
    } else if (res.userVote === 'down') {
      addToast('Downvoted', 'Downvote recorded (-1).', 'info');
    } else {
      addToast('Vote Withdrawn', 'Vote reset.', 'info');
    }
  };

  // Handle Create Post / Status
  const handleCreatePost = (data: {
    title: string;
    description: string;
    image_data: string;
    video_data?: string;
    media_type?: 'image' | 'video' | 'text';
    tagged_users: string[];
    tags: string[];
  }) => {
    if (!currentUser) return;
    createRealPost({
      ...data,
      authorId: currentUser.id,
    });
    syncStateFromStorage();
    addToast('Status Posted', 'Your post is now live in the feed.', 'success');
  };

  // Handle Delete Post Action
  const handleDeletePost = (postId: string) => {
    if (!currentUser) return;
    const ok = deleteRealPost(postId, currentUser.id);
    if (ok) {
      syncStateFromStorage();
      addToast('Post Deleted', 'Your post has been permanently removed.', 'info');
    }
  };

  // Handle Save Edited Post (Text Only)
  const handleSaveEditedPost = (postId: string, description: string, title?: string) => {
    if (!currentUser) return;
    const updated = updateRealPostText(postId, currentUser.id, description, title);
    if (updated) {
      syncStateFromStorage();
      addToast('Post Updated', 'Post text has been saved successfully.', 'success');
    }
  };

  // Handle Follow / Unfollow
  const handleToggleFollow = (targetUserId: string) => {
    if (!currentUser) return;
    const res = toggleFollowUser(targetUserId, currentUser.id);
    syncStateFromStorage();

    if (selectedProfile && selectedProfile.id === targetUserId) {
      setSelectedProfile(res.targetUser);
    }

    if (res.isFollowing) {
      addToast('Member Followed', `Now following ${res.targetUser.display_name}.`, 'success');
    } else {
      addToast('Unfollowed', `Unfollowed ${res.targetUser.display_name}.`, 'info');
    }
  };

  // Handle Profile Update
  const handleUpdateProfile = (updates: Partial<Profile>) => {
    if (!currentUser) return;
    const updated = updateProfileData(currentUser.id, updates);
    if (updated) {
      setCurrentUser(updated);
      syncStateFromStorage();
    }
  };

  // Handle Multi-Account Switching
  const handleSwitchAccount = (userId: string) => {
    const nextUser = switchAccountSession(userId);
    if (nextUser) {
      setCurrentUser(nextUser);
      syncStateFromStorage();
      addToast('Account Switched', `Now active as @${nextUser.username} (${nextUser.display_name}).`, 'success');
    }
  };

  // Handle Remove Saved Account
  const handleRemoveSavedAccount = (userId: string) => {
    const nextUser = removeSavedAccount(userId);
    setCurrentUser(nextUser);
    syncStateFromStorage();
    addToast('Account Removed', 'Account removed from saved list.', 'info');
  };

  // Handle Navigation to User Profile
  const handleOpenProfile = (profile: Profile) => {
    setSelectedProfile(profile);
    setActiveView('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Go Home / Brand Click
  const handleGoHome = () => {
    setActiveView('feed');
    setSelectedProfile(null);
    setSelectedTagFilter(null);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Sign Out
  const handleSignOut = () => {
    setCurrentUserSession(null);
    setCurrentUser(null);
    setActiveView('feed');
    setSelectedProfile(null);
    syncStateFromStorage();
    addToast('Signed Out', 'You have been logged out.', 'info');
  };

  // Matched Members on Search
  const matchingSearchMembers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return users.filter(
      u =>
        (u.display_name && u.display_name.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.first_name && u.first_name.toLowerCase().includes(q)) ||
        (u.bio && u.bio.toLowerCase().includes(q))
    );
  }, [users, searchQuery]);

  // Filtered Posts Logic
  const displayedPosts = useMemo(() => {
    let result = [...posts];

    // Filter by Following Tab
    if (activeView === 'following_feed' && currentUser) {
      result = result.filter(p => currentUser.following.includes(p.user_id) || p.user_id === currentUser.id);
    }

    // Filter by Topic Tag
    if (selectedTagFilter) {
      result = result.filter(p => p.tags && p.tags.includes(selectedTagFilter.toLowerCase()));
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        p =>
          (p.title && p.title.toLowerCase().includes(q)) ||
          p.description.toLowerCase().includes(q) ||
          p.user?.display_name.toLowerCase().includes(q) ||
          p.user?.username.toLowerCase().includes(q) ||
          p.tags?.some(t => t.toLowerCase().includes(q))
      );
    }

    // Sort according to Active Filter
    switch (feedFilter) {
      case 'trending':
        return result.sort((a, b) => b.net_votes - a.net_votes);
      case 'latest':
        return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'top_voted':
        return result.sort((a, b) => b.votes_up - a.votes_up);
      default:
        return result;
    }
  }, [posts, activeView, currentUser, selectedTagFilter, searchQuery, feedFilter]);

  // If user is not logged in, render Landing Page
  if (!currentUser) {
    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <LandingPage
          onAuthSuccess={(user) => {
            setCurrentUser(user);
            syncStateFromStorage();
          }}
          addToast={addToast}
          themeMode={themeMode}
          onThemeToggle={handleToggleTheme}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white font-sans relative">
      
      {/* Toast Alerts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Clean Top Header with Live Search Dropdown & Switch Account */}
      <Header
        currentUser={currentUser}
        allUsers={users}
        allPosts={posts}
        notifications={notifications}
        searchQuery={searchQuery}
        themeMode={themeMode}
        onGoHome={handleGoHome}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onSearchChange={setSearchQuery}
        onThemeToggle={handleToggleTheme}
        onOpenProfile={handleOpenProfile}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAccountSwitcher={() => setIsAccountSwitcherOpen(true)}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        onSignOut={handleSignOut}
        onMarkAllNotificationsRead={() => {
          markAllNotificationsRead(currentUser.id);
          syncStateFromStorage();
          addToast('Notifications Cleared', 'Marked all as read.', 'success');
        }}
        onSelectPostFromNotif={(postId) => {
          const target = posts.find(p => p.id === postId);
          if (target) {
            setSearchQuery(target.title || target.description);
            setActiveView('feed');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        onSelectPostFromSearch={(post) => {
          setDetailsPost(post);
        }}
      />

      {/* Main Content Layout: Clean Focused 2-Column with Mobile Bottom Nav Clearance */}
      <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-8 flex gap-6 flex-1">
        
        {/* Left Column: Navigation Menu (Desktop) */}
        <LeftSidebar
          currentUser={currentUser}
          activeView={activeView}
          onViewChange={(v) => {
            setActiveView(v);
            setSelectedProfile(null);
            setSelectedTagFilter(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenMyProfile={() => handleOpenProfile(currentUser)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAccountSwitcher={() => setIsAccountSwitcherOpen(true)}
          onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
          onSignOut={handleSignOut}
        />

        {/* Center Main Column: Pure Focused Stream */}
        <main className="flex-1 min-w-0 max-w-2xl mx-auto w-full">
          
          {/* VIEW 1: Feed (Home or Following) */}
          {(activeView === 'feed' || activeView === 'following_feed') && (
            <div className="view-transition">
              
              {/* Post & Status Composer */}
              {!searchQuery && (
                <CreatePostBox
                  currentUser={currentUser}
                  allUsers={users}
                  onSubmitPost={handleCreatePost}
                  addToast={addToast}
                />
              )}

              {/* Matching Members Shelf */}
              {searchQuery.trim() && matchingSearchMembers.length > 0 && (
                <div className="mb-6 p-4 bg-[#1C2541] border border-[#334155] rounded-3xl animate-in fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      <span>Matching Members ({matchingSearchMembers.length})</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {matchingSearchMembers.map((member) => {
                      const isSelf = member.id === currentUser.id;
                      const isFollowing = currentUser.following.includes(member.id);

                      return (
                        <div
                          key={member.id}
                          className="p-3 bg-[#1E293B] border border-[#334155] rounded-2xl flex items-center justify-between gap-3 hover:border-slate-500 transition-all cursor-pointer"
                          onClick={() => handleOpenProfile(member)}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={member.avatar_url}
                              alt={member.display_name}
                              className="w-9 h-9 rounded-xl object-cover border border-blue-500/30 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-white truncate">
                                  {member.display_name}
                                </span>
                                <VerifiedBadge user={member} />
                              </div>
                              <p className="text-[11px] text-slate-400 font-mono truncate">
                                @{member.username}
                              </p>
                            </div>
                          </div>

                          {!isSelf && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFollow(member.id);
                              }}
                              className={`p-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                                isFollowing
                                  ? 'bg-[#1C2541] text-slate-300 hover:text-rose-300'
                                  : 'bg-blue-600 text-white shadow-glow-sm hover:bg-blue-500'
                              }`}
                            >
                              {isFollowing ? (
                                <UserCheck className="w-4 h-4" />
                              ) : (
                                <UserPlus className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Feed Filter Tabs (Trending, Latest, Top Voted) & Tag Clear */}
              <div className="flex items-center justify-between gap-2 mb-4 bg-[#1C2541] border border-[#334155] p-1.5 rounded-2xl">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setFeedFilter('latest')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      feedFilter === 'latest'
                        ? 'bg-blue-600 text-white shadow-glow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Latest</span>
                  </button>

                  <button
                    onClick={() => setFeedFilter('trending')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      feedFilter === 'trending'
                        ? 'bg-blue-600 text-white shadow-glow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Trending</span>
                  </button>

                  <button
                    onClick={() => setFeedFilter('top_voted')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      feedFilter === 'top_voted'
                        ? 'bg-blue-600 text-white shadow-glow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Top Voted</span>
                  </button>
                </div>

                {/* Active Tag Filter Pill */}
                {selectedTagFilter && (
                  <div className="flex items-center gap-1 bg-blue-950/60 border border-blue-500/40 px-2.5 py-1 rounded-xl text-xs text-blue-300 font-mono">
                    <span>#{selectedTagFilter}</span>
                    <button
                      onClick={() => setSelectedTagFilter(null)}
                      className="text-blue-400 hover:text-white cursor-pointer ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Posts Stream */}
              <div className="space-y-4">
                {displayedPosts.length === 0 ? (
                  <div className="p-12 text-center bg-[#1C2541] border border-[#334155] rounded-3xl">
                    <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-white mb-1">
                      No Posts in Stream
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                      {searchQuery
                        ? `No results matching "${searchQuery}". Try a different term or hashtag.`
                        : activeView === 'following_feed'
                        ? 'You are not following anyone with posts yet. Check the Home Feed or Leaderboard!'
                        : 'Be the first creator to share a post or photo.'}
                    </p>
                    {activeView === 'following_feed' && (
                      <button
                        onClick={() => setActiveView('feed')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                      >
                        Explore Home Feed
                      </button>
                    )}
                  </div>
                ) : (
                  displayedPosts.map((post) => {
                    const userVoteRecord = votes.find(
                      v => v.post_id === post.id && v.user_id === currentUser.id
                    );
                    const userVote = userVoteRecord ? userVoteRecord.type : null;
                    const isFollowingAuthor = currentUser.following.includes(post.user_id);

                    return (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUser={currentUser}
                        userVote={userVote}
                        onVote={handleVote}
                        onDelete={handleDeletePost}
                        onEdit={(p: Post) => setEditingPost(p)}
                        onViewDetails={(p: Post) => setDetailsPost(p)}
                        onOpenLightbox={(url: string, title: string) => setLightboxData({ isOpen: true, url, title })}
                        onOpenProfile={handleOpenProfile}
                        onShare={(p: Post) => setShareModalPost(p)}
                        onSelectTag={(tag: string) => setSelectedTagFilter(tag)}
                      />
                    );
                  })
                )}
              </div>

            </div>
          )}

          {/* VIEW 2: User Profile Page */}
          {activeView === 'profile' && (
            <div className="view-transition">
              <UserProfileView
                profile={(selectedProfile && selectedProfile.id === currentUser.id) ? currentUser : (selectedProfile || currentUser)}
                currentUser={currentUser}
                allUsers={users}
                posts={posts}
                votesList={votes}
                onBack={() => setActiveView('feed')}
                onToggleFollow={handleToggleFollow}
                onVote={handleVote}
                onDeletePost={handleDeletePost}
                onEditPost={(p) => setEditingPost(p)}
                onViewPostDetails={(p) => setDetailsPost(p)}
                onOpenLightbox={(url, title) => setLightboxData({ isOpen: true, url, title })}
                onOpenProfile={handleOpenProfile}
                onShare={(p) => setShareModalPost(p)}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            </div>
          )}

          {/* VIEW 3: Clean Real Leaderboard */}
          {activeView === 'leaderboard' && (
            <div className="view-transition">
              <RealLeaderboardView
                leaderboard={leaderboard}
                currentUser={currentUser}
                onSelectUser={handleOpenProfile}
                onToggleFollow={handleToggleFollow}
              />
            </div>
          )}

        </main>

      </div>

      {/* Mobile Bottom Navigation Bar (Appears on Mobile & Tablet) */}
      <MobileBottomNav
        currentUser={currentUser}
        activeView={activeView}
        onViewChange={(v) => {
          setActiveView(v);
          setSelectedProfile(null);
          setSelectedTagFilter(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenMyProfile={() => handleOpenProfile(currentUser)}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* Desktop Floating Action Button (+ Post / Status) */}
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="hidden lg:flex fixed bottom-6 right-6 z-40 w-12 h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white items-center justify-center shadow-glow transition-all active:scale-95 cursor-pointer hover:scale-105"
        title="Create New Post / Status"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePost}
        currentUser={currentUser}
        allUsers={users}
        addToast={addToast}
      />

      {/* Edit Post Modal (Text Only) */}
      <EditPostModal
        isOpen={Boolean(editingPost)}
        post={editingPost}
        onClose={() => setEditingPost(null)}
        onSave={handleSaveEditedPost}
        addToast={addToast}
      />

      {/* Post Details & Metadata Modal */}
      <PostDetailsModal
        isOpen={Boolean(detailsPost)}
        post={detailsPost}
        onClose={() => setDetailsPost(null)}
        onOpenShare={(p) => setShareModalPost(p)}
        addToast={addToast}
      />

      {/* Share Post Modal */}
      <SharePostModal
        isOpen={Boolean(shareModalPost)}
        post={shareModalPost}
        onClose={() => setShareModalPost(null)}
        addToast={addToast}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser}
        themeMode={themeMode}
        onThemeChange={(mode) => {
          setThemeMode(mode);
          setThemeModeState(mode);
        }}
        onUpdateProfile={handleUpdateProfile}
        onSignOut={handleSignOut}
        onOpenAccountSwitcher={() => setIsAccountSwitcherOpen(true)}
        onSwitchAccount={handleSwitchAccount}
        onAddAccount={() => setIsAddAccountOpen(true)}
        addToast={addToast}
      />

      {/* Admin Panel Console (Super Admin & Authorized Team Only) */}
      {isAdminPanelOpen && (
        <AdminPanelModal
          isOpen={isAdminPanelOpen}
          onClose={() => setIsAdminPanelOpen(false)}
          currentUser={currentUser}
          allUsers={users}
          allPosts={posts}
          onRefreshData={syncStateFromStorage}
          addToast={addToast}
        />
      )}

      {/* Account Switcher Modal (Multi-Account) */}
      <AccountSwitcherModal
        isOpen={isAccountSwitcherOpen}
        onClose={() => setIsAccountSwitcherOpen(false)}
        currentUser={currentUser}
        savedAccounts={savedAccounts}
        onSwitchAccount={handleSwitchAccount}
        onAddAnotherAccount={() => setIsAddAccountOpen(true)}
        onRemoveAccount={handleRemoveSavedAccount}
      />

      {/* Add Account Modal (Sign In / Switch to Another Profile) */}
      {isAddAccountOpen && (
        <AuthModal
          isOpen={isAddAccountOpen}
          onClose={() => setIsAddAccountOpen(false)}
          onSignIn={async (email, pass) => {
            const res = await authenticateUser(email, pass);
            if (res.success && res.user) {
              setIsAddAccountOpen(false);
              setCurrentUser(res.user);
              syncStateFromStorage();
              addToast('Account Added & Switched', `Active as @${res.user.username} (${res.user.display_name}).`, 'success');
            } else {
              addToast('Sign In Failed', res.message, 'info');
            }
          }}
          onSignUpStart={() => {
            setIsAddAccountOpen(false);
            handleSignOut();
            addToast('Registration', 'Fill in details on the registration page to create a new account.', 'info');
          }}
          onQuickSelectDemo={() => {}}
          demoProfiles={[]}
        />
      )}

      {/* Lightbox Modal */}
      <ImageLightboxModal
        isOpen={lightboxData.isOpen}
        imageUrl={lightboxData.url}
        title={lightboxData.title}
        onClose={() => setLightboxData({ isOpen: false, url: '', title: '' })}
      />

      {/* Simple Clean Footer */}
      <footer className="w-full border-t border-[#334155]/60 bg-[#0B132B] py-5 pb-20 lg:pb-5 text-center text-xs text-slate-500 font-mono">
        <p>Aether Feed &bull; Minimalist Clean Social Platform</p>
      </footer>

    </div>
  );
}

export default App;
