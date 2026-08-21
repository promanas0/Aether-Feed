import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  Users, 
  Trash2, 
  ShieldCheck, 
  ShieldX, 
  UserPlus, 
  Search, 
  AlertTriangle, 
  FileText, 
  Database, 
  RefreshCw, 
  Crown,
  Lock,
  Mail,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import type { Profile, Post, ToastMessage } from '../../types';
import { 
  getAdminEmails, 
  addAdminEmail, 
  removeAdminEmail, 
  adminBanUser, 
  adminToggleVerifyUser, 
  deleteRealPost,
  syncWithServer
} from '../../lib/storage';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Profile;
  allUsers: Profile[];
  allPosts: Post[];
  onRefreshData: () => void;
  addToast: (title: string, desc?: string, type?: ToastMessage['type']) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  allPosts,
  onRefreshData,
  addToast,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'team' | 'system'>('users');
  const [userSearch, setUserSearch] = useState('');
  const [postSearch, setPostSearch] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [banConfirmId, setBanConfirmId] = useState<string | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  const adminEmails = getAdminEmails();

  // Filtered Users
  const filteredUsers = allUsers.filter(u => {
    const q = userSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.display_name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    );
  });

  // Filtered Posts
  const filteredPosts = allPosts.filter(p => {
    const q = postSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.title || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.user?.username || '').toLowerCase().includes(q) ||
      (p.user?.email || '').toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  });

  // Handle Ban / Wipe User
  const handleBanUser = async (targetUser: Profile) => {
    if (targetUser.email.toLowerCase() === 'promanas018@gmail.com') {
      addToast('Protected Account', 'The Root Super Admin cannot be banned.', 'info');
      setBanConfirmId(null);
      return;
    }

    try {
      const res = adminBanUser(targetUser.id, currentUser.email);
      if (res.success) {
        addToast('Scammer / User Banned', `User @${targetUser.username} (${targetUser.email}) and all their posts have been purged completely.`, 'success');
        setBanConfirmId(null);
        onRefreshData();
      } else {
        addToast('Ban Failed', res.message, 'info');
      }
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to ban user.', 'info');
    }
  };

  // Handle Toggle Verification Badge
  const handleToggleVerify = (targetUser: Profile) => {
    const updated = adminToggleVerifyUser(targetUser.id, currentUser.email);
    if (updated) {
      addToast(
        updated.is_verified ? 'Verified Badge Granted' : 'Verified Badge Revoked',
        `@${updated.username} verification status updated to: ${updated.is_verified ? 'Verified' : 'Unverified'}`,
        'success'
      );
      onRefreshData();
    }
  };

  // Handle Delete Post
  const handleDeletePost = (postId: string) => {
    deleteRealPost(postId);
    addToast('Post Deleted', 'The selected post has been removed platform-wide.', 'success');
    setDeletePostId(null);
    onRefreshData();
  };

  // Handle Add Admin Email
  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newAdminEmail.toLowerCase().trim();
    if (!clean || !clean.includes('@')) {
      addToast('Invalid Email', 'Please enter a valid email address.', 'info');
      return;
    }

    const success = addAdminEmail(clean, currentUser.email);
    if (success) {
      addToast('Admin Team Member Added', `${clean} now has full admin privileges.`, 'success');
      setNewAdminEmail('');
      onRefreshData();
    } else {
      addToast('Already Admin', `${clean} is already in the admin team list.`, 'info');
    }
  };

  // Handle Remove Admin Email
  const handleRemoveAdmin = (targetEmail: string) => {
    if (targetEmail.toLowerCase() === 'promanas018@gmail.com') {
      addToast('Action Prohibited', 'Root Super Admin cannot be removed.', 'info');
      return;
    }

    const success = removeAdminEmail(targetEmail, currentUser.email);
    if (success) {
      addToast('Admin Revoked', `${targetEmail} has been removed from the admin team.`, 'success');
      onRefreshData();
    }
  };

  // Handle Force Global Sync
  const handleForceSync = async () => {
    setIsSyncing(true);
    await syncWithServer();
    setIsSyncing(false);
    onRefreshData();
    addToast('Global Sync Complete', 'Synced all records with Supabase and Server storage.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#070D1F]/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#0F172A] border-2 border-rose-500/40 rounded-3xl shadow-[0_0_50px_rgba(244,63,94,0.15)] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header with Cyber Admin Badge */}
        <div className="px-6 py-4 border-b border-rose-500/30 bg-gradient-to-r from-rose-950/60 via-[#1E1B4B]/80 to-[#0F172A] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-600 to-amber-600 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.4)] border border-rose-400/40">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-tight uppercase">
                  Aether Central Command
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  Admin Exclusive
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Authenticated as <span className="text-rose-300 font-semibold">{currentUser.email}</span> (Super Admin)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleForceSync}
              disabled={isSyncing}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#1E293B] hover:bg-[#334155] border border-slate-600 text-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              title="Force Sync"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-rose-400' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-rose-950/40 transition-colors cursor-pointer"
              aria-label="Close Admin Console"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 Tabs Bar */}
        <div className="grid grid-cols-4 border-b border-[#334155] bg-[#0B132B] text-xs font-semibold">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-3.5 text-center border-b-2 flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'users' 
                ? 'border-rose-500 text-white bg-rose-950/20' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-rose-400" />
            <span>Users & Scammer Watch ({allUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('posts')}
            className={`py-3.5 text-center border-b-2 flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'posts' 
                ? 'border-rose-500 text-white bg-rose-950/20' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Feed Moderation ({allPosts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`py-3.5 text-center border-b-2 flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'team' 
                ? 'border-rose-500 text-white bg-rose-950/20' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-blue-400" />
            <span>Admin Team ({adminEmails.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`py-3.5 text-center border-b-2 flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'system' 
                ? 'border-rose-500 text-white bg-rose-950/20' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>System Stats</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-[#0F172A]">
          
          {/* TAB 1: User & Scammer Moderation */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              
              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name, @username, or email..."
                    className="w-full pl-9 pr-4 py-2 bg-[#0B132B] border border-[#334155] focus:border-rose-500 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none font-mono"
                  />
                </div>

                <p className="text-xs text-slate-400 font-mono self-end sm:self-center">
                  Showing <span className="text-white font-bold">{filteredUsers.length}</span> of {allUsers.length} registered members
                </p>
              </div>

              {/* Users Table / Card List */}
              <div className="space-y-2.5">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center bg-[#0B132B] rounded-2xl border border-[#334155] text-slate-400 text-xs">
                    No users matching "{userSearch}"
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const isRootSuperAdmin = u.email.toLowerCase() === 'promanas018@gmail.com';
                    const isTeamAdmin = adminEmails.includes(u.email.toLowerCase());
                    const userPostsCount = allPosts.filter(p => p.user_id === u.id).length;

                    return (
                      <div
                        key={u.id}
                        className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                          isRootSuperAdmin
                            ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                            : isTeamAdmin
                            ? 'bg-blue-950/20 border-blue-500/40'
                            : 'bg-[#0B132B] border-[#334155] hover:border-slate-500'
                        }`}
                      >
                        {/* User Identity Info */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          <img
                            src={u.avatar_url}
                            alt={u.display_name}
                            className="w-11 h-11 rounded-2xl object-cover border border-slate-600 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                                {u.display_name}
                              </h4>
                              {u.is_verified && (
                                <span className="flex items-center gap-0.5 text-[10px] text-blue-400 font-bold px-1.5 py-0.2 rounded bg-blue-950/50 border border-blue-500/30">
                                  <ShieldCheck className="w-3 h-3" /> Verified
                                </span>
                              )}
                              {isRootSuperAdmin && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                  <Crown className="w-3 h-3" /> Root Admin
                                </span>
                              )}
                              {isTeamAdmin && !isRootSuperAdmin && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                                  Admin Team
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-400 font-mono truncate">
                              @{u.username} &bull; <span className="text-slate-300">{u.email}</span>
                            </p>

                            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                              Posts: <span className="text-slate-300">{userPostsCount}</span> &bull; 
                              Votes Received: <span className="text-slate-300">{u.total_votes_received || 0}</span> &bull; 
                              ID: <span className="text-slate-500 text-[10px]">{u.id}</span>
                            </p>
                          </div>
                        </div>

                        {/* Admin Actions */}
                        <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-[#334155]">
                          
                          {/* Toggle Verified Badge */}
                          <button
                            type="button"
                            onClick={() => handleToggleVerify(u)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              u.is_verified
                                ? 'bg-[#1C2541] hover:bg-slate-800 text-slate-300 border border-[#334155]'
                                : 'bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40'
                            }`}
                            title="Toggle Verified Checkmark"
                          >
                            {u.is_verified ? <ShieldX className="w-3.5 h-3.5 text-slate-400" /> : <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />}
                            <span>{u.is_verified ? 'Remove Checkmark' : 'Verify'}</span>
                          </button>

                          {/* Ban / Wipe Scammer Button */}
                          {!isRootSuperAdmin && (
                            <div>
                              {banConfirmId !== u.id ? (
                                <button
                                  type="button"
                                  onClick={() => setBanConfirmId(u.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                  title="Ban and delete this user completely"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Ban / Wipe</span>
                                </button>
                              ) : (
                                <div className="flex items-center gap-1 p-1 bg-rose-950/80 border border-rose-500 rounded-xl">
                                  <button
                                    type="button"
                                    onClick={() => handleBanUser(u)}
                                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                                  >
                                    Confirm Wipe
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setBanConfirmId(null)}
                                    className="px-2 py-1 bg-[#1C2541] text-slate-300 hover:text-white rounded-lg text-[11px] cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Post Feed Moderation */}
          {activeTab === 'posts' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={postSearch}
                    onChange={(e) => setPostSearch(e.target.value)}
                    placeholder="Search posts by title, caption, author..."
                    className="w-full pl-9 pr-4 py-2 bg-[#0B132B] border border-[#334155] focus:border-rose-500 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none font-mono"
                  />
                </div>

                <p className="text-xs text-slate-400 font-mono">
                  Total Posts: <span className="text-white font-bold">{allPosts.length}</span>
                </p>
              </div>

              <div className="space-y-3">
                {filteredPosts.length === 0 ? (
                  <div className="p-8 text-center bg-[#0B132B] rounded-2xl border border-[#334155] text-slate-400 text-xs">
                    No posts found matching search.
                  </div>
                ) : (
                  filteredPosts.map((p) => {
                    const author = p.user || allUsers.find(u => u.id === p.user_id);

                    return (
                      <div
                        key={p.id}
                        className="p-4 bg-[#0B132B] border border-[#334155] hover:border-slate-500 rounded-2xl flex flex-col sm:flex-row items-start justify-between gap-4 transition-all"
                      >
                        <div className="flex gap-3.5 min-w-0 flex-1">
                          {p.image_data ? (
                            <img
                              src={p.image_data}
                              alt="Post preview"
                              className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-[#1C2541] border border-slate-700 flex items-center justify-center shrink-0 text-slate-500 text-xs font-mono">
                              Text
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-white truncate">
                                {author?.display_name || 'Aether Member'}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                @{author?.username || p.user_id}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                &bull; {new Date(p.created_at).toLocaleDateString()}
                              </span>
                            </div>

                            {p.title && (
                              <p className="text-xs font-bold text-slate-200 mb-0.5 truncate">
                                {p.title}
                              </p>
                            )}
                            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                              {p.description || '(No caption)'}
                            </p>

                            <p className="text-[11px] text-slate-500 font-mono mt-1">
                              Votes: +{p.votes_up} / -{p.votes_down} (Net: {p.net_votes}) &bull; ID: {p.id}
                            </p>
                          </div>
                        </div>

                        {/* Delete Post Action */}
                        <div className="shrink-0 self-end sm:self-center">
                          {deletePostId !== p.id ? (
                            <button
                              type="button"
                              onClick={() => setDeletePostId(p.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Post</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 p-1 bg-rose-950/80 border border-rose-500 rounded-xl">
                              <button
                                type="button"
                                onClick={() => handleDeletePost(p.id)}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletePostId(null)}
                                className="px-2 py-1 bg-[#1C2541] text-slate-300 hover:text-white rounded-lg text-[11px] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Admin Team Manager */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              
              {/* Add New Team Member Form */}
              <form onSubmit={handleAddAdmin} className="p-5 bg-[#0B132B] border border-blue-500/40 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-blue-400">
                  <UserPlus className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Add Team Member to Admin Panel
                  </h4>
                </div>
                <p className="text-xs text-slate-400">
                  Authorize additional team members to access this Admin Console using their email address.
                </p>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="team_moderator@gmail.com"
                      className="w-full pl-9 pr-4 py-2.5 bg-[#1C2541] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-glow transition-all cursor-pointer shrink-0"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Grant Admin Access</span>
                  </button>
                </div>
              </form>

              {/* Current Authorized Admin List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Currently Authorized Admins ({adminEmails.length})
                </h4>

                <div className="space-y-2">
                  {adminEmails.map((email) => {
                    const isRoot = email.toLowerCase() === 'promanas018@gmail.com';
                    const matchingUser = allUsers.find(u => (u.email || '').toLowerCase() === email.toLowerCase());

                    return (
                      <div
                        key={email}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                          isRoot
                            ? 'bg-amber-950/20 border-amber-500/40'
                            : 'bg-[#0B132B] border-[#334155]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isRoot ? 'bg-amber-600/30 text-amber-300' : 'bg-blue-600/20 text-blue-400'
                          }`}>
                            {isRoot ? <Crown className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {email}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono truncate">
                              {isRoot ? 'Root Super Admin (Owner)' : 'Team Moderator'} 
                              {matchingUser ? ` &bull; @${matchingUser.username}` : ' &bull; (Account pending registration)'}
                            </p>
                          </div>
                        </div>

                        <div>
                          {isRoot ? (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              Permanent Root
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRemoveAdmin(email)}
                              className="px-3 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                            >
                              Revoke Access
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: System Diagnostics */}
          {activeTab === 'system' && (
            <div className="space-y-5">
              
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-[#0B132B] border border-[#334155] rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Members</p>
                  <p className="text-xl font-extrabold text-white mt-1">{allUsers.length}</p>
                </div>
                <div className="p-4 bg-[#0B132B] border border-[#334155] rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Posts</p>
                  <p className="text-xl font-extrabold text-white mt-1">{allPosts.length}</p>
                </div>
                <div className="p-4 bg-[#0B132B] border border-[#334155] rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Net Votes</p>
                  <p className="text-xl font-extrabold text-blue-400 mt-1">
                    {allPosts.reduce((acc, p) => acc + (p.net_votes || 0), 0)}
                  </p>
                </div>
                <div className="p-4 bg-[#0B132B] border border-[#334155] rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cloud DB</p>
                  <p className="text-xs font-bold text-emerald-400 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Supabase Live
                  </p>
                </div>
              </div>

              {/* Maintenance Tools */}
              <div className="p-5 bg-[#0B132B] border border-[#334155] rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Platform Diagnostics & Maintenance</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Trigger instant re-synchronization with Supabase Cloud DB and local storage, ensuring all posts and profiles are uniformly up to date across all devices.
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleForceSync}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-glow transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Run Global Cloud Re-Sync</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
