import React, { useState } from 'react';
import { 
  ShieldCheck, 
  MapPin, 
  Globe, 
  Calendar, 
  UserPlus, 
  UserCheck, 
  ArrowUpCircle,
  FileText,
  ArrowLeft,
  Users,
  MessageSquare,
  UserX,
  Clock,
  AlertTriangle
} from 'lucide-react';
import type { Profile, Post, ToastMessage } from '../../types';
import { PostCard } from '../feed/PostCard';
import { FollowersListModal } from './FollowersListModal';
import { EditProfileModal } from './EditProfileModal';
import { VerifiedBadge } from '../ui/VerifiedBadge';

interface UserProfileViewProps {
  profile: Profile;
  currentUser: Profile;
  allUsers: Profile[];
  posts: Post[];
  votesList: Array<{ user_id: string; post_id: string; type: 'up' | 'down' }>;
  onBack: () => void;
  onToggleFollow: (targetUserId: string) => void;
  onVote: (postId: string, type: 'up' | 'down') => void;
  onDeletePost?: (postId: string) => void;
  onEditPost?: (post: Post) => void;
  onViewPostDetails?: (post: Post) => void;
  onOpenLightbox: (imageData: string, title: string) => void;
  onOpenProfile: (profile: Profile) => void;
  onShare: (post: Post) => void;
  onOpenSettings: () => void;
  onUpdateProfile?: (updates: Partial<Profile>) => Promise<void> | void;
  onSendMessage?: (userId: string) => void;
  onTogglePinHome?: (postId: string) => void;
  onTogglePinProfile?: (postId: string) => void;
  addToast?: (title: string, desc?: string, type?: ToastMessage['type']) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  profile,
  currentUser,
  allUsers,
  posts,
  votesList,
  onBack,
  onToggleFollow,
  onVote,
  onDeletePost,
  onEditPost,
  onViewPostDetails,
  onOpenLightbox,
  onOpenProfile,
  onShare,
  onOpenSettings,
  onUpdateProfile,
  onSendMessage,
  onTogglePinHome,
  onTogglePinProfile,
  addToast,
}) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'upvoted' | 'about'>('posts');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [followersModal, setFollowersModal] = useState<{
    isOpen: boolean;
    title: string;
    userIds: string[];
  }>({
    isOpen: false,
    title: '',
    userIds: [],
  });

  const isCurrentUser = Boolean(currentUser && profile && currentUser.id === profile.id);
  const displayProfile = isCurrentUser ? currentUser : (allUsers.find(u => u.id === profile.id) || profile);
  const currentFollowingList = Array.isArray(currentUser?.following) ? currentUser.following : [];
  const isFollowing = currentFollowingList.includes(displayProfile.id);

  // User's own posts (Pinned to profile first, then newest)
  const userPosts = posts
    .filter(p => p && p.user_id && displayProfile.id && p.user_id.trim() === displayProfile.id.trim())
    .sort((a, b) => {
      if (a.is_pinned_profile && !b.is_pinned_profile) return -1;
      if (!a.is_pinned_profile && b.is_pinned_profile) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // Posts upvoted by this user
  const upvotedPostIds = new Set(
    votesList
      .filter(v => v && v.user_id && displayProfile.id && v.user_id.trim() === displayProfile.id.trim() && v.type === 'up')
      .map(v => v.post_id)
  );
  const upvotedPosts = posts.filter(p => upvotedPostIds.has(p.id));

  const profileFollowers = Array.isArray(displayProfile.followers) ? displayProfile.followers : [];
  const profileFollowing = Array.isArray(displayProfile.following) ? displayProfile.following : [];

  const bannerHeightClass = 
    displayProfile.banner_size === 'compact' ? 'h-28 sm:h-36' :
    displayProfile.banner_size === 'tall' ? 'h-48 sm:h-64' :
    'h-36 sm:h-48';

  return (
    <div className="w-full">
      
      {/* Top Back Nav */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-4 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Feed</span>
      </button>

      {/* Profile Header Card */}
      <div className="bg-[#1C2541] border border-[#334155] rounded-3xl overflow-hidden shadow-lg mb-6">
        
        {/* Cover Banner */}
        <div className={`${bannerHeightClass} bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 relative overflow-hidden transition-all duration-300`}>
          {displayProfile.banner_url ? (
            <>
              <img
                src={displayProfile.banner_url}
                alt="Cover Banner"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (displayProfile.banner_url && !displayProfile.banner_url.startsWith('http') && !displayProfile.banner_url.startsWith('/') && !displayProfile.banner_url.startsWith('data:')) {
                    target.src = '/' + displayProfile.banner_url;
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1E293B]/70 via-transparent to-black/20 pointer-events-none" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-30">
              <div className="w-96 h-96 rounded-full bg-blue-500/20 blur-3xl" />
            </div>
          )}
        </div>

        {/* Profile Details Container */}
        <div className="p-5 sm:p-6 pt-0 relative bg-[#1E293B]">
          
          {/* Avatar & Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-4">
            <div className="flex items-end gap-3.5">
              <img
                src={displayProfile.avatar_url}
                alt={displayProfile.display_name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-[#1E293B] shadow-xl"
              />
              <div className="mb-1.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                    {displayProfile.display_name}
                  </h1>
                  <VerifiedBadge user={displayProfile} size="md" />
                </div>
                <p className="text-xs text-blue-400 font-mono">
                  @{displayProfile.username}
                </p>
              </div>
            </div>

            {/* Follow / Edit Profile / Message Actions */}
            <div className="flex items-center gap-2">
              {isCurrentUser ? (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white shadow-glow-sm rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Edit Profile</span>
                </button>
              ) : (
                <>
                  {onSendMessage && (
                    <button
                      onClick={() => onSendMessage(displayProfile.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#1C2541] hover:bg-[#2A3756] border border-[#334155] rounded-xl text-xs font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer"
                      title="Send Direct Message"
                    >
                      <MessageSquare className="w-4 h-4 text-blue-400" />
                      <span>Message</span>
                    </button>
                  )}

                  <button
                    onClick={() => onToggleFollow(displayProfile.id)}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isFollowing
                        ? 'bg-[#1C2541] hover:bg-rose-950/40 text-slate-200 hover:text-rose-300 border border-[#334155]'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-glow'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Follow Member</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Banned Alert Banner on Profile */}
          {displayProfile.is_banned && (
            <div className="mb-4 p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-2xl flex items-center gap-3 text-rose-200 text-xs shadow-[0_0_15px_rgba(244,63,94,0.15)]">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-rose-300 flex items-center gap-1.5">
                  <span>Account Suspended by Administrator</span>
                  <span className="px-1.5 py-0.2 bg-rose-600/40 text-white rounded text-[10px] uppercase font-mono">Banned</span>
                </h4>
                <p className="text-[11px] text-rose-200/80 mt-0.5">
                  This user account has been banned for policy violations. All interactions and posting privileges are restricted.
                </p>
              </div>
            </div>
          )}

          {/* Posting Timeout Alert Banner on Profile */}
          {displayProfile.posting_timeout_until && (
            <div className="mb-4 p-3.5 bg-orange-500/15 border border-orange-500/40 rounded-2xl flex items-center gap-3 text-orange-200 text-xs shadow-[0_0_15px_rgba(249,115,22,0.15)]">
              <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-orange-300 flex items-center gap-1.5">
                  <span>Posting Timeout Active</span>
                  <span className="px-1.5 py-0.2 bg-orange-600/40 text-white rounded text-[10px] uppercase font-mono">Restricted</span>
                </h4>
                <p className="text-[11px] text-orange-200/80 mt-0.5">
                  {displayProfile.posting_timeout_until === 'indefinite'
                    ? 'This account has been placed on indefinite posting restriction by Administrator.'
                    : `Posting privileges restricted until ${new Date(displayProfile.posting_timeout_until).toLocaleString()}.`}
                </p>
              </div>
            </div>
          )}

          {/* Bio */}
          {displayProfile.bio && (
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4 max-w-2xl">
              {displayProfile.bio}
            </p>
          )}

          {/* Metadata & Stats Row */}
          <div className="flex flex-wrap items-center gap-5 text-xs text-slate-400 pt-3 border-t border-[#334155]/60">
            {displayProfile.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{displayProfile.location}</span>
              </div>
            )}

            {displayProfile.website && (
              <a
                href={displayProfile.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-blue-400 hover:underline"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{displayProfile.website.replace(/^https?:\/\//, '')}</span>
              </a>
            )}

            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <Calendar className="w-3.5 h-3.5" />
              <span>Joined {new Date(displayProfile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
            </div>

            {/* Clickable Followers & Following Counts */}
            <div className="ml-auto flex items-center gap-4 text-xs font-mono">
              <button
                onClick={() => setFollowersModal({
                  isOpen: true,
                  title: 'Followers',
                  userIds: profileFollowers,
                })}
                className="hover:text-blue-400 transition-colors cursor-pointer group"
                title="View Followers list"
              >
                <strong className="text-white font-bold group-hover:text-blue-400">{profileFollowers.length}</strong> Followers
              </button>

              <button
                onClick={() => setFollowersModal({
                  isOpen: true,
                  title: 'Following',
                  userIds: profileFollowing,
                })}
                className="hover:text-blue-400 transition-colors cursor-pointer group"
                title="View Following list"
              >
                <strong className="text-white font-bold group-hover:text-blue-400">{profileFollowing.length}</strong> Following
              </button>

              <span className="text-blue-400">
                <strong className="text-blue-400 font-bold">▲ {displayProfile.total_votes_received || 0}</strong> Net Votes
              </span>
            </div>
          </div>

        </div>

        {/* Profile Tabs Navigation */}
        <div className="flex border-t border-[#334155] bg-[#1C2541] px-5 sm:px-6">
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'posts'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Posts ({userPosts.length})
          </button>

          <button
            onClick={() => setActiveTab('upvoted')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'upvoted'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Upvoted ({upvotedPosts.length})
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'about'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            About
          </button>
        </div>

      </div>

      {/* Tab Content 1: User's Posts */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {userPosts.length === 0 ? (
            <div className="py-16 text-center bg-[#1C2541] border border-[#334155] rounded-3xl p-8">
              <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-xs font-bold text-white">No posts published yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">This member hasn't posted any updates yet.</p>
            </div>
          ) : (
            userPosts.map((post) => {
              const userVoteMatch = votesList.find(v => v.post_id === post.id && v.user_id === currentUser.id);
              return (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  allUsers={allUsers}
                  userVote={userVoteMatch ? userVoteMatch.type : null}
                  onVote={onVote}
                  onDelete={onDeletePost}
                  onEdit={onEditPost}
                  onViewDetails={onViewPostDetails}
                  onOpenLightbox={onOpenLightbox}
                  onOpenProfile={onOpenProfile}
                  onShare={onShare}
                  onTogglePinHome={onTogglePinHome}
                  onTogglePinProfile={onTogglePinProfile}
                />
              );
            })
          )}
        </div>
      )}

      {/* Tab Content 2: Upvoted Posts */}
      {activeTab === 'upvoted' && (
        <div className="space-y-4">
          {upvotedPosts.length === 0 ? (
            <div className="py-16 text-center bg-[#1C2541] border border-[#334155] rounded-3xl p-8">
              <ArrowUpCircle className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-xs font-bold text-white">No upvoted posts</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Posts upvoted by this member will appear here.</p>
            </div>
          ) : (
            upvotedPosts.map((post) => {
              const userVoteMatch = votesList.find(v => v.post_id === post.id && v.user_id === currentUser.id);
              return (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  allUsers={allUsers}
                  userVote={userVoteMatch ? userVoteMatch.type : null}
                  onVote={onVote}
                  onDelete={onDeletePost}
                  onEdit={onEditPost}
                  onViewDetails={onViewPostDetails}
                  onOpenLightbox={onOpenLightbox}
                  onOpenProfile={onOpenProfile}
                  onShare={onShare}
                  onTogglePinHome={onTogglePinHome}
                  onTogglePinProfile={onTogglePinProfile}
                />
              );
            })
          )}
        </div>
      )}

      {/* Tab Content 3: About User */}
      {activeTab === 'about' && (
        <div className="bg-[#1C2541] border border-[#334155] rounded-3xl p-6 space-y-4 text-xs">
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-1 text-[11px]">
              Full Display Name
            </h4>
            <p className="text-slate-300 font-semibold">{displayProfile.display_name}</p>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-1 text-[11px]">
              Handle Username
            </h4>
            <p className="text-blue-400 font-mono">@{displayProfile.username}</p>
          </div>

          {displayProfile.bio && (
            <div>
              <h4 className="font-bold text-white uppercase tracking-wider mb-1 text-[11px]">
                Biography
              </h4>
              <p className="text-slate-300 whitespace-pre-line">{displayProfile.bio}</p>
            </div>
          )}

          {displayProfile.location && (
            <div>
              <h4 className="font-bold text-white uppercase tracking-wider mb-1 text-[11px]">
                Location
              </h4>
              <p className="text-slate-300">{displayProfile.location}</p>
            </div>
          )}
        </div>
      )}

      {/* Followers / Following List Modal */}
      <FollowersListModal
        isOpen={followersModal.isOpen}
        onClose={() => setFollowersModal({ isOpen: false, title: '', userIds: [] })}
        title={followersModal.title}
        userIds={followersModal.userIds}
        allUsers={allUsers}
        currentUser={currentUser}
        onSelectUser={onOpenProfile}
        onToggleFollow={onToggleFollow}
      />

      {/* Mobile-Friendly Dedicated Edit Profile Modal */}
      {isCurrentUser && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          currentUser={currentUser}
          onUpdateProfile={async (updates) => {
            if (onUpdateProfile) {
              await onUpdateProfile(updates);
            }
          }}
          addToast={addToast || (() => {})}
        />
      )}

    </div>
  );
};
