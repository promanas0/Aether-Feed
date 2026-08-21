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
  syncWithServer 
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
    setCurrentUser(user);
    setUsers(getRealUsers());
    setPosts(getRealPosts());
    setVotes(getVotesList());
    setLeaderboard(getRealLeaderboard());
    setThemeModeState(getThemeMode());
    if (user) {
      setNotifications(getNotificationsForRealUser(user.id));
    } else {
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    syncStateFromStorage();
    syncWithServer();

    // Periodic sync from central server to pull new users & posts across all devices
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
    tagged_users: string[];
    tags: string[];
  }) => {
    if (!currentUser) return;
    const newPost = createRealPost({
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

  // Filtered Posts Logic (Search by Title, Description, Tags, Author)
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

      {/* Clean Top Header with Live Search Dropdown */}
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
          onSignOut={handleSignOut}
        />

        {/* Center Main Column: Pure Focused Stream */}
        <main className="flex-1 min-w-0 max-w-2xl mx-auto w-full">
          
          {/* VIEW 1: Feed (Home or Following) */}
          {(activeView === 'feed' || activeView === 'following_feed') && (
            <div className="view-transition">
              
              {/* Post & Status Composer (Hidden when actively searching to keep clean results focus) */}
              {!searchQuery && (
                <CreatePostBox
                  currentUser={currentUser}
                  allUsers={users}
                  onSubmitPost={handleCreatePost}
                  addToast={addToast}
                />
              )}

              {/* Matching Members Shelf (Appears when searching members) */}
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
                          className="p-3 bg-[#0B132B] border border-[#334155] rounded-2xl flex items-center justify-between gap-2.5 hover:border-blue-500/50 transition-all"
                        >
                          <div
                            onClick={() => handleOpenProfile(member)}
                            className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1 group"
                          >
                            <img
                              src={member.avatar_url}
                              alt={member.display_name}
                              className="w-9 h-9 rounded-xl object-cover border border-[#334155]"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <p className="text-xs font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                                  {member.display_name}
                                </p>
                                {member.is_verified && (
                                  <ShieldCheck className="w-3 h-3 text-blue-400 shrink-0" />
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 font-mono truncate">
                                @{member.username}
                              </p>
                            </div>
                          </div>

                          {!isSelf && (
                            <button
                              onClick={() => handleToggleFollow(member.id)}
                              className={`p-1.5 px-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer shrink-0 ${
                                isFollowing
                                  ? 'bg-[#1C2541] text-slate-300 hover:text-rose-400 border border-[#334155]'
                                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-glow-sm'
                              }`}
                            >
                              {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Feed Filter Bar & Search Result Banner */}
              <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-[#334155]">
                
                {/* Search Active Indicator or Filter Tabs */}
                {searchQuery.trim() ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      Search Results for: <span className="text-blue-400 font-mono">"{searchQuery}"</span>
                    </span>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-2 py-0.5 bg-[#1C2541] hover:bg-[#2A3756] text-slate-300 hover:text-white rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                      <span>Clear Search</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 p-1 bg-[#1C2541] border border-[#334155] rounded-2xl text-xs font-semibold">
                    <button
                      onClick={() => setFeedFilter('latest')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                        feedFilter === 'latest' ? 'bg-blue-600 text-white shadow-glow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Latest</span>
                    </button>
                    <button
                      onClick={() => setFeedFilter('trending')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                        feedFilter === 'trending' ? 'bg-blue-600 text-white shadow-glow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>Trending</span>
                    </button>
                    <button
                      onClick={() => setFeedFilter('top_voted')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                        feedFilter === 'top_voted' ? 'bg-blue-600 text-white shadow-glow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Top Upvoted</span>
                    </button>
                  </div>
                )}

                {/* Active Sub-filter Indicator */}
                {selectedTagFilter && (
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-blue-950/60 border border-blue-600/50 rounded-xl text-xs text-blue-300">
                    <span>#{selectedTagFilter}</span>
                    <button onClick={() => setSelectedTagFilter(null)} className="hover:text-white ml-1 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Feed Post List */}
              {displayedPosts.length === 0 ? (
                <div className="py-16 text-center bg-[#1C2541] border border-[#334155] rounded-3xl p-8">
                  <FileText className="w-9 h-9 mx-auto text-slate-600 mb-2" />
                  <p className="text-sm font-bold text-white">
                    {searchQuery.trim() ? `No posts matched "${searchQuery}"` : 'No posts in feed yet'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchQuery.trim()
                      ? 'Try searching by title keywords, hashtags, or member username.'
                      : activeView === 'following_feed'
                      ? 'No posts from members you follow yet.'
                      : 'Share a status update or attach a photo above to get started!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayedPosts.map((post) => {
                    const userVoteMatch = votes.find(v => v.post_id === post.id && v.user_id === currentUser.id);
                    return (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUser={currentUser}
                        userVote={userVoteMatch ? userVoteMatch.type : null}
                        onVote={handleVote}
                        onDelete={handleDeletePost}
                        onEdit={(p) => setEditingPost(p)}
                        onViewDetails={(p) => setDetailsPost(p)}
                        onOpenLightbox={(url, title) => setLightboxData({ isOpen: true, url, title })}
                        onOpenProfile={handleOpenProfile}
                        onShare={(p) => setShareModalPost(p)}
                        onSelectTag={(tag) => setSelectedTagFilter(tag)}
                      />
                    );
                  })}
                </div>
              )}
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
        addToast={addToast}
      />

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
