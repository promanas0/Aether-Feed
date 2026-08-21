import type { Profile, Post, VoteRecord, NotificationItem, ThemeMode } from '../types';

const STORAGE_KEYS = {
  REAL_USERS: 'aether_real_users_v4',
  POSTS: 'aether_posts_v4',
  VOTES: 'aether_votes_v4',
  NOTIFICATIONS: 'aether_notifications_v4',
  CURRENT_USER_ID: 'aether_current_user_id_v4',
  THEME_MODE: 'aether_theme_mode_v4',
  PENDING_OTPS: 'aether_pending_otps_v4',
  INITIALIZED: 'aether_v4_initialized'
};

// Safe LocalStorage helpers
const getItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('aether_storage_sync'));
  } catch (e) {
    console.error('Failed to write to localStorage', e);
  }
};

const FAKE_MOCK_IDS = ['usr_manas_01', 'usr_elena_02', 'usr_marcus_03'];

/* ==========================================================================
   CROSS-DEVICE & CENTRAL CLOUD/SERVER SYNC ENGINE
   ========================================================================== */

let currentSyncPromise: Promise<boolean> | null = null;

export const syncWithServer = async (): Promise<boolean> => {
  if (currentSyncPromise) {
    return currentSyncPromise;
  }

  currentSyncPromise = (async () => {
    try {
      const localUsers = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []).filter(u => !FAKE_MOCK_IDS.includes(u.id));
      const localPosts = getItem<Post[]>(STORAGE_KEYS.POSTS, []);
      const localVotes = getItem<VoteRecord[]>(STORAGE_KEYS.VOTES, []);
      const localNotifs = getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
      const localOtps = getItem<any[]>(STORAGE_KEYS.PENDING_OTPS, []);

      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          users: localUsers,
          posts: localPosts,
          votes: localVotes,
          notifications: localNotifs,
          pending_otps: localOtps,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const { users, posts, votes, notifications, pending_otps } = result.data;
          if (Array.isArray(users)) {
            const cleanUsers = users.filter((u: any) => !FAKE_MOCK_IDS.includes(u.id));
            localStorage.setItem(STORAGE_KEYS.REAL_USERS, JSON.stringify(cleanUsers));
          }
          if (Array.isArray(posts)) {
            localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
          }
          if (Array.isArray(votes)) {
            localStorage.setItem(STORAGE_KEYS.VOTES, JSON.stringify(votes));
          }
          if (Array.isArray(notifications)) {
            localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
          }
          if (Array.isArray(pending_otps)) {
            localStorage.setItem(STORAGE_KEYS.PENDING_OTPS, JSON.stringify(pending_otps));
          }
          window.dispatchEvent(new Event('aether_storage_sync'));
          return true;
        }
      }
    } catch (e) {
      // Offline / network fallback
    } finally {
      currentSyncPromise = null;
    }
    return false;
  })();

  return currentSyncPromise;
};

/**
 * Initialize Clean Storage with ZERO fake users and auto-sync with server
 */
export const initializeV3Storage = (): void => {
  // Purge any lingering fake seed users from localStorage
  const currentUsers = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  const cleanedUsers = currentUsers.filter(u => !FAKE_MOCK_IDS.includes(u.id));
  if (cleanedUsers.length !== currentUsers.length) {
    setItem(STORAGE_KEYS.REAL_USERS, cleanedUsers);
  }

  const currentId = getItem<string | null>(STORAGE_KEYS.CURRENT_USER_ID, null);
  if (currentId && FAKE_MOCK_IDS.includes(currentId)) {
    const firstReal = cleanedUsers[0]?.id || null;
    setItem(STORAGE_KEYS.CURRENT_USER_ID, firstReal);
  }

  // Initial silent server sync
  syncWithServer();
};

/* ==========================================================================
   AUTHENTICATION & REAL REGISTRATION FLOW
   ========================================================================== */

export const createPendingRegistration = (data: {
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
}): { otp_code: string } => {
  const pending = getItem<Array<any>>(STORAGE_KEYS.PENDING_OTPS, []);
  
  // Generate real 6-digit random numeric OTP
  const otp_code = String(Math.floor(100000 + Math.random() * 900000));
  const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

  const filtered = pending.filter(p => p.email.toLowerCase() !== data.email.toLowerCase());
  
  filtered.push({
    ...data,
    email: data.email.toLowerCase().trim(),
    otp_code,
    expires_at,
  });

  setItem(STORAGE_KEYS.PENDING_OTPS, filtered);
  syncWithServer();

  console.info(`[Aether Auth] 6-Digit OTP code for ${data.email}: ${otp_code}`);
  return { otp_code };
};

export const verifyAndCreateUser = (email: string, otpCode: string): { success: boolean; user?: Profile; message: string } => {
  const pending = getItem<Array<any>>(STORAGE_KEYS.PENDING_OTPS, []);
  const found = pending.find(
    p => p.email.toLowerCase() === email.toLowerCase().trim() && p.otp_code === otpCode.trim()
  );

  if (!found) {
    return { success: false, message: 'Invalid verification code. Please check your email inbox and spam folder.' };
  }

  if (new Date(found.expires_at).getTime() < Date.now()) {
    return { success: false, message: 'Verification code has expired. Please request a new code.' };
  }

  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  
  // Check if email already registered
  let existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (existingUser) {
    setItem(STORAGE_KEYS.CURRENT_USER_ID, existingUser.id);
    syncWithServer();
    return { success: true, user: existingUser, message: 'Account verified successfully!' };
  }

  // Create new real verified profile
  const baseUsername = `${found.first_name}_${found.last_name}`.toLowerCase().replace(/[^a-z0-9_]/g, '');
  const username = baseUsername || `user_${Date.now().toString().slice(-4)}`;
  const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const newProfile: Profile = {
    id: userId,
    email: found.email,
    first_name: found.first_name,
    last_name: found.last_name,
    display_name: `${found.first_name} ${found.last_name}`,
    username,
    avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
    bio: `Hey, I just joined Aether Feed!`,
    dlicom_address: '',
    location: '',
    website: '',
    is_verified: true,
    followers: [],
    following: [],
    total_votes_received: 0,
    created_at: new Date().toISOString(),
    password_hash: found.password_hash,
  };

  users.unshift(newProfile);
  setItem(STORAGE_KEYS.REAL_USERS, users);
  setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);

  // Remove from pending
  const updatedPending = pending.filter(p => p.email.toLowerCase() !== email.toLowerCase().trim());
  setItem(STORAGE_KEYS.PENDING_OTPS, updatedPending);

  // Send direct registration to server
  try {
    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: newProfile }),
    }).catch(() => {});
  } catch {}

  // Sync to central database immediately so all devices have this account
  syncWithServer();

  return { success: true, user: newProfile, message: 'Account verified and created successfully!' };
};

export const authenticateUser = async (email: string, password: string): Promise<{ success: boolean; user?: Profile; message: string }> => {
  const cleanEmail = email.toLowerCase().trim();
  const cleanPass = password.trim();

  // 1. Direct Server Authentication
  try {
    const serverRes = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: cleanPass }),
    });

    if (serverRes.ok) {
      const data = await serverRes.json();
      if (data.success && data.user) {
        // Save user to local storage
        const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []).filter(u => !FAKE_MOCK_IDS.includes(u.id));
        const idx = users.findIndex(u => u.id === data.user.id || u.email.toLowerCase() === cleanEmail);
        if (idx !== -1) {
          users[idx] = { ...users[idx], ...data.user };
        } else {
          users.unshift(data.user);
        }
        setItem(STORAGE_KEYS.REAL_USERS, users);
        setItem(STORAGE_KEYS.CURRENT_USER_ID, data.user.id);
        syncWithServer();
        return { success: true, user: data.user, message: 'Signed in successfully.' };
      } else if (data.message && data.message.includes('Incorrect password')) {
        return { success: false, message: data.message };
      }
    }
  } catch (err) {
    console.warn('[Aether Auth] Server login request failed, falling back to local storage:', err);
  }

  // 2. Local State Fallback / Sync
  await syncWithServer();
  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  const user = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    return { success: false, message: 'No registered account found with this email. Please create an account first.' };
  }

  if (user.password_hash && user.password_hash !== cleanPass) {
    return { success: false, message: 'Incorrect password. Please try again.' };
  }

  setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
  syncWithServer();
  return { success: true, user, message: 'Signed in successfully.' };
};

export const getCurrentUser = (): Profile | null => {
  const currentId = getItem<string | null>(STORAGE_KEYS.CURRENT_USER_ID, null);
  if (!currentId) return null;
  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  return users.find(u => u.id === currentId) || null;
};

export const setCurrentUserSession = (userId: string | null): void => {
  setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
  syncWithServer();
};

export const getRealUsers = (): Profile[] => {
  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  return users.filter(u => !FAKE_MOCK_IDS.includes(u.id));
};

export const createPasswordChangeOtp = (userId: string, email: string): { otp_code: string } => {
  const pending = getItem<Array<any>>(STORAGE_KEYS.PENDING_OTPS, []);
  const otp_code = String(Math.floor(100000 + Math.random() * 900000));
  const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const filtered = pending.filter(p => p.type !== 'password_change' || p.userId !== userId);
  filtered.push({
    userId,
    email: email.toLowerCase().trim(),
    otp_code,
    type: 'password_change',
    expires_at,
  });

  setItem(STORAGE_KEYS.PENDING_OTPS, filtered);
  syncWithServer();
  return { otp_code };
};

export const verifyPasswordChangeOtp = (
  userId: string, 
  otpCode: string, 
  newPassword: string
): { success: boolean; message: string } => {
  const pending = getItem<Array<any>>(STORAGE_KEYS.PENDING_OTPS, []);
  const found = pending.find(p => p.userId === userId && p.type === 'password_change' && p.otp_code === otpCode.trim());

  if (!found) {
    return { success: false, message: 'Invalid verification code. Please check your email inbox and spam folder.' };
  }

  if (new Date(found.expires_at).getTime() < Date.now()) {
    return { success: false, message: 'Verification code has expired. Please request a new code.' };
  }

  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  const idx = users.findIndex(u => u.id === userId);
  if (idx !== -1) {
    users[idx].password_hash = newPassword.trim();
    setItem(STORAGE_KEYS.REAL_USERS, users);
  }

  // Remove from pending
  setItem(STORAGE_KEYS.PENDING_OTPS, pending.filter(p => p !== found));
  syncWithServer();
  return { success: true, message: 'Password updated successfully!' };
};

export const updateProfileData = (userId: string, updates: Partial<Profile>): Profile | null => {
  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return null;

  users[idx] = {
    ...users[idx],
    ...updates,
    display_name: updates.first_name && updates.last_name 
      ? `${updates.first_name} ${updates.last_name}` 
      : users[idx].display_name
  };

  setItem(STORAGE_KEYS.REAL_USERS, users);
  syncWithServer();
  return users[idx];
};

/* ==========================================================================
   FOLLOW / UNFOLLOW ENGINE
   ========================================================================== */

export const toggleFollowUser = (targetUserId: string, currentUserId: string): { isFollowing: boolean; targetUser: Profile } => {
  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  const currentIdx = users.findIndex(u => u.id === currentUserId);
  const targetIdx = users.findIndex(u => u.id === targetUserId);

  if (currentIdx === -1 || targetIdx === -1) {
    throw new Error('User not found');
  }

  const isFollowing = users[currentIdx].following.includes(targetUserId);

  if (isFollowing) {
    users[currentIdx].following = users[currentIdx].following.filter(id => id !== targetUserId);
    users[targetIdx].followers = users[targetIdx].followers.filter(id => id !== currentUserId);
  } else {
    users[currentIdx].following.push(targetUserId);
    users[targetIdx].followers.push(currentUserId);

    addNotification({
      user_id: targetUserId,
      actor_id: currentUserId,
      type: 'follow',
    });
  }

  setItem(STORAGE_KEYS.REAL_USERS, users);
  syncWithServer();
  return { isFollowing: !isFollowing, targetUser: users[targetIdx] };
};

/* ==========================================================================
   POSTS & STATUS UPDATES ENGINE
   ========================================================================== */

export const getRealPosts = (): Post[] => {
  const posts = getItem<Post[]>(STORAGE_KEYS.POSTS, []);
  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);

  // Hydrate user data
  return posts.map(p => ({
    ...p,
    user: users.find(u => u.id === p.user_id) || {
      id: p.user_id,
      email: '',
      first_name: 'Member',
      last_name: '',
      display_name: 'Aether Member',
      username: 'member',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      bio: '',
      dlicom_address: '',
      is_verified: true,
      followers: [],
      following: [],
      total_votes_received: 0,
      created_at: new Date().toISOString(),
    }
  }));
};

export const createRealPost = (data: {
  title?: string;
  description: string;
  image_data?: string;
  video_data?: string;
  media_type?: 'image' | 'video' | 'text';
  tagged_users?: string[];
  tags?: string[];
  authorId: string;
}): Post => {
  const posts = getItem<Post[]>(STORAGE_KEYS.POSTS, []);
  const postId = `post_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const determinedType: 'image' | 'video' | 'text' = data.video_data 
    ? 'video' 
    : data.image_data 
    ? 'image' 
    : 'text';

  const newPost: Post = {
    id: postId,
    user_id: data.authorId,
    title: data.title || '',
    description: data.description,
    image_data: data.image_data || '',
    video_data: data.video_data || '',
    media_type: data.media_type || determinedType,
    tagged_users: data.tagged_users || [],
    tags: data.tags || [],
    votes_up: 0,
    votes_down: 0,
    net_votes: 0,
    created_at: new Date().toISOString(),
  };

  posts.unshift(newPost);
  setItem(STORAGE_KEYS.POSTS, posts);

  // Notify tagged users
  if (data.tagged_users && data.tagged_users.length > 0) {
    const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
    data.tagged_users.forEach(uname => {
      const taggedUser = users.find(u => u.username.toLowerCase() === uname.toLowerCase());
      if (taggedUser && taggedUser.id !== data.authorId) {
        addNotification({
          user_id: taggedUser.id,
          actor_id: data.authorId,
          post_id: postId,
          type: 'tag',
        });
      }
    });
  }

  window.dispatchEvent(
    new CustomEvent('aether_post_broadcast', {
      detail: { post: newPost, authorId: data.authorId }
    })
  );

  syncWithServer();
  return newPost;
};

export const deleteRealPost = (postId: string, userId: string): boolean => {
  const posts = getItem<Post[]>(STORAGE_KEYS.POSTS, []);
  const idx = posts.findIndex(p => p.id === postId && p.user_id === userId);
  if (idx === -1) return false;

  posts.splice(idx, 1);
  setItem(STORAGE_KEYS.POSTS, posts);

  // Clean up votes and notifications for this post
  const votes = getItem<VoteRecord[]>(STORAGE_KEYS.VOTES, []).filter(v => v.post_id !== postId);
  setItem(STORAGE_KEYS.VOTES, votes);

  const notifs = getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []).filter(n => n.post_id !== postId);
  setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);

  // Recalculate author's total votes
  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  const authorIdx = users.findIndex(u => u.id === userId);
  if (authorIdx !== -1) {
    const authorPosts = posts.filter(p => p.user_id === userId);
    users[authorIdx].total_votes_received = authorPosts.reduce((acc, p) => acc + p.net_votes, 0);
    setItem(STORAGE_KEYS.REAL_USERS, users);
  }

  syncWithServer();
  return true;
};

export const updateRealPostText = (
  postId: string, 
  userId: string, 
  description: string, 
  title?: string
): Post | null => {
  const posts = getItem<Post[]>(STORAGE_KEYS.POSTS, []);
  const idx = posts.findIndex(p => p.id === postId && p.user_id === userId);
  if (idx === -1) return null;

  posts[idx] = {
    ...posts[idx],
    description: description.trim(),
    title: title ? title.trim() : posts[idx].title,
  };

  setItem(STORAGE_KEYS.POSTS, posts);
  syncWithServer();
  return posts[idx];
};

/* ==========================================================================
   DUAL UPVOTE / DOWNVOTE ENGINE
   ========================================================================== */

export const getVotesList = (): VoteRecord[] => {
  return getItem<VoteRecord[]>(STORAGE_KEYS.VOTES, []);
};

export const votePostAction = (
  postId: string,
  userId: string,
  voteType: 'up' | 'down'
): { userVote: 'up' | 'down' | null; netVotes: number; votesUp: number; votesDown: number } => {
  const posts = getItem<Post[]>(STORAGE_KEYS.POSTS, []);
  const votes = getItem<VoteRecord[]>(STORAGE_KEYS.VOTES, []);
  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);

  const postIdx = posts.findIndex(p => p.id === postId);
  if (postIdx === -1) {
    throw new Error('Post not found');
  }

  const existingVoteIdx = votes.findIndex(v => v.post_id === postId && v.user_id === userId);
  let finalUserVote: 'up' | 'down' | null = null;

  if (existingVoteIdx !== -1) {
    const prevVote = votes[existingVoteIdx];
    if (prevVote.type === voteType) {
      // Toggle off
      votes.splice(existingVoteIdx, 1);
      if (voteType === 'up') posts[postIdx].votes_up = Math.max(0, posts[postIdx].votes_up - 1);
      if (voteType === 'down') posts[postIdx].votes_down = Math.max(0, posts[postIdx].votes_down - 1);
      finalUserVote = null;
    } else {
      // Switch from up to down or vice-versa
      votes[existingVoteIdx].type = voteType;
      if (voteType === 'up') {
        posts[postIdx].votes_up += 1;
        posts[postIdx].votes_down = Math.max(0, posts[postIdx].votes_down - 1);
      } else {
        posts[postIdx].votes_down += 1;
        posts[postIdx].votes_up = Math.max(0, posts[postIdx].votes_up - 1);
      }
      finalUserVote = voteType;
    }
  } else {
    // New vote
    votes.push({
      id: `vote_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      user_id: userId,
      post_id: postId,
      type: voteType,
      created_at: new Date().toISOString(),
    });

    if (voteType === 'up') posts[postIdx].votes_up += 1;
    if (voteType === 'down') posts[postIdx].votes_down += 1;
    finalUserVote = voteType;

    // Send notification to author
    if (posts[postIdx].user_id !== userId) {
      addNotification({
        user_id: posts[postIdx].user_id,
        actor_id: userId,
        post_id: postId,
        type: voteType === 'up' ? 'vote_up' : 'vote_down',
      });
    }
  }

  posts[postIdx].net_votes = posts[postIdx].votes_up - posts[postIdx].votes_down;

  // Recalculate author's total votes
  const authorId = posts[postIdx].user_id;
  const authorPosts = posts.filter(p => p.user_id === authorId);
  const totalVotesReceived = authorPosts.reduce((acc, p) => acc + p.net_votes, 0);

  const authorIdx = users.findIndex(u => u.id === authorId);
  if (authorIdx !== -1) {
    users[authorIdx].total_votes_received = totalVotesReceived;
    setItem(STORAGE_KEYS.REAL_USERS, users);
  }

  setItem(STORAGE_KEYS.POSTS, posts);
  setItem(STORAGE_KEYS.VOTES, votes);
  syncWithServer();

  return {
    userVote: finalUserVote,
    netVotes: posts[postIdx].net_votes,
    votesUp: posts[postIdx].votes_up,
    votesDown: posts[postIdx].votes_down,
  };
};

/* ==========================================================================
   REAL LEADERBOARD (REAL USERS ONLY)
   ========================================================================== */

export const getRealLeaderboard = (): Array<Profile & { rank: number; posts_count: number }> => {
  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []).filter(u => !FAKE_MOCK_IDS.includes(u.id));
  const posts = getItem<Post[]>(STORAGE_KEYS.POSTS, []);

  // Calculate actual posts and real net votes
  const list = users.map(user => {
    const userPosts = posts.filter(p => p.user_id === user.id);
    const netVotes = userPosts.reduce((acc, p) => acc + p.net_votes, 0);
    return {
      ...user,
      total_votes_received: netVotes,
      posts_count: userPosts.length,
    };
  });

  // Sort descending by net votes
  list.sort((a, b) => b.total_votes_received - a.total_votes_received || b.posts_count - a.posts_count);

  return list.map((u, i) => ({
    ...u,
    rank: i + 1,
  }));
};

/* ==========================================================================
   NOTIFICATIONS ENGINE
   ========================================================================== */

export const addNotification = (item: {
  user_id: string;
  actor_id: string;
  post_id?: string;
  type: NotificationItem['type'];
}): void => {
  const list = getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  const newNotif: NotificationItem = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    user_id: item.user_id,
    actor_id: item.actor_id,
    post_id: item.post_id,
    type: item.type,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  list.unshift(newNotif);
  setItem(STORAGE_KEYS.NOTIFICATIONS, list);
  syncWithServer();
};

export const getNotificationsForRealUser = (userId: string): NotificationItem[] => {
  const notifs = getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  const posts = getItem<Post[]>(STORAGE_KEYS.POSTS, []);

  return notifs
    .filter(n => n.user_id === userId)
    .map(n => ({
      ...n,
      actor: users.find(u => u.id === n.actor_id),
      post: n.post_id ? posts.find(p => p.id === n.post_id) : undefined,
    }));
};

export const markAllNotificationsRead = (userId: string): void => {
  const notifs = getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  notifs.forEach(n => {
    if (n.user_id === userId) n.is_read = true;
  });
  setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
  syncWithServer();
};

/* ==========================================================================
   THEME MODE
   ========================================================================== */

export const getThemeMode = (): ThemeMode => {
  return getItem<ThemeMode>(STORAGE_KEYS.THEME_MODE, 'dark');
};

export const setThemeMode = (mode: ThemeMode): void => {
  setItem(STORAGE_KEYS.THEME_MODE, mode);
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
};
