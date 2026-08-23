import type { Profile, Post, VoteRecord, NotificationItem, ThemeMode, ChatMessage, PostComment, DirectMessage } from '../types';
import { getSupabaseClient } from './supabaseClient';

const STORAGE_KEYS = {
  REAL_USERS: 'aether_real_users_v4',
  POSTS: 'aether_posts_v4',
  POST_COMMENTS: 'aether_post_comments_v4',
  VOTES: 'aether_votes_v4',
  NOTIFICATIONS: 'aether_notifications_v4',
  CURRENT_USER_ID: 'aether_current_user_id_v4',
  THEME_MODE: 'aether_theme_mode_v4',
  PENDING_OTPS: 'aether_pending_otps_v4',
  INITIALIZED: 'aether_v4_initialized',
  SAVED_ACCOUNTS: 'aether_saved_accounts_v4',
  DELETED_POST_IDS: 'aether_deleted_post_ids_v4',
  ADMIN_EMAILS: 'aether_admin_emails_v4',
  VIP_CHAT: 'aether_vip_chat_v4',
  DIRECT_MESSAGES: 'aether_direct_messages_v4',
  PINNED_VIP_CHAT_MSG_ID: 'aether_pinned_vip_chat_msg_id_v4',
  PINNED_DM_MSG_IDS: 'aether_pinned_dm_msg_ids_v4',
  USER_PRESENCE: 'aether_user_presence_v4',
  DELETED_CHAT_MSG_IDS: 'aether_deleted_chat_msg_ids_v4',
  DELETED_DM_MSG_IDS: 'aether_deleted_dm_msg_ids_v4',
  DELETED_NOTIFICATION_IDS: 'aether_deleted_notification_ids_v4',
  BANNED_USER_IDS: 'aether_banned_user_ids_v4',
};

// Cross-tab instant broadcast channel
const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('aether_realtime_sync_channel')
  : null;

if (syncChannel) {
  syncChannel.onmessage = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('aether_storage_sync'));
    }
  };
}

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
    if (syncChannel) {
      syncChannel.postMessage('sync');
    }
  } catch (e) {
    console.error('Failed to write to localStorage', e);
  }
};

const FAKE_MOCK_IDS = ['usr_manas_01', 'usr_elena_02', 'usr_marcus_03'];

export const DLICOM_MASCOT_AVATARS = [
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><rect width="120" height="120" rx="28" fill="url(%23bg1)"/><circle cx="60" cy="45" r="22" fill="%231E293B" stroke="%233B82F6" stroke-width="3"/><path d="M42 45C42 35.0589 50.0589 27 60 27C69.9411 27 78 35.0589 78 45V48H42V45Z" fill="%233B82F6" fill-opacity="0.3"/><rect x="46" y="40" width="28" height="8" rx="4" fill="%2360A5FA"/><circle cx="60" cy="44" r="2" fill="%23FFFFFF"/><path d="M26 100C26 81.2223 41.2223 66 60 66C78.7777 66 94 81.2223 94 100V104H26V100Z" fill="%231E293B" stroke="%233B82F6" stroke-width="3"/><path d="M48 66L60 78L72 66" stroke="%2360A5FA" stroke-width="3" stroke-linecap="round"/><circle cx="60" cy="90" r="6" fill="%233B82F6"/><defs><linearGradient id="bg1" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse"><stop stop-color="%230F172A"/><stop offset="1" stop-color="%231E3A8A"/></linearGradient></defs></svg>`,

  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><rect width="120" height="120" rx="28" fill="url(%23bg2)"/><circle cx="60" cy="45" r="22" fill="%231E293B" stroke="%23F59E0B" stroke-width="3"/><rect x="44" y="38" width="32" height="10" rx="5" fill="%23FBBF24"/><path d="M26 100C26 81.2223 41.2223 66 60 66C78.7777 66 94 81.2223 94 100V104H26V100Z" fill="%231E293B" stroke="%23F59E0B" stroke-width="3"/><path d="M60 66V82" stroke="%23FBBF24" stroke-width="3" stroke-linecap="round"/><defs><linearGradient id="bg2" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse"><stop stop-color="%231E1B4B"/><stop offset="1" stop-color="%2378350F"/></linearGradient></defs></svg>`,

  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><rect width="120" height="120" rx="28" fill="url(%23bg3)"/><circle cx="60" cy="45" r="22" fill="%231E293B" stroke="%2310B981" stroke-width="3"/><rect x="46" y="40" width="28" height="8" rx="4" fill="%2334D399"/><path d="M26 100C26 81.2223 41.2223 66 60 66C78.7777 66 94 81.2223 94 100V104H26V100Z" fill="%231E293B" stroke="%2310B981" stroke-width="3"/><defs><linearGradient id="bg3" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse"><stop stop-color="%23064E3B"/><stop offset="1" stop-color="%230F172A"/></linearGradient></defs></svg>`
];

export const DLICOM_DEFAULT_AVATARS = DLICOM_MASCOT_AVATARS;
export const DEFAULT_DLICOM_AVATAR = DLICOM_MASCOT_AVATARS[0];

export const reconcileFollowGraph = (users: Profile[]): Profile[] => {
  const parseArray = (arr: any): string[] => {
    if (Array.isArray(arr)) return arr.map(String).filter(Boolean);
    if (typeof arr === 'string') {
      try {
        const parsed = JSON.parse(arr);
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      } catch {}
    }
    return [];
  };

  // Map: targetUserId -> Set of follower user IDs
  const followerMap = new Map<string, Set<string>>();
  users.forEach(u => {
    followerMap.set(u.id, new Set<string>());
  });

  // Populate strictly from each user's `following` list
  users.forEach(u => {
    const followingList = parseArray(u.following);
    followingList.forEach(targetId => {
      if (followerMap.has(targetId)) {
        followerMap.get(targetId)!.add(u.id);
      } else {
        followerMap.set(targetId, new Set<string>([u.id]));
      }
    });
  });

  return users.map(u => ({
    ...u,
    following: parseArray(u.following),
    followers: Array.from(followerMap.get(u.id) || []),
  }));
};

export const sanitizeProfileForSupabase = (p: Partial<Profile>) => {
  const parseArray = (arr: any): string[] => {
    if (Array.isArray(arr)) return arr.map(String);
    if (typeof arr === 'string') {
      try {
        const parsed = JSON.parse(arr);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {}
    }
    return [];
  };

  return {
    id: p.id,
    email: p.email,
    first_name: p.first_name || '',
    last_name: p.last_name || '',
    display_name: p.display_name || '',
    username: p.username || '',
    avatar_url: p.avatar_url || DEFAULT_DLICOM_AVATAR,
    banner_url: p.banner_url || '',
    banner_size: p.banner_size || 'standard',
    bio: p.bio || '',
    dlicom_address: p.dlicom_address || '',
    location: p.location || '',
    website: p.website || '',
    is_verified: p.is_verified ?? true,
    is_golden_verified: p.is_golden_verified ?? false,
    is_admin: p.is_admin ?? false,
    posting_timeout_until: p.posting_timeout_until || null,
    is_banned: p.is_banned ?? false,
    followers: parseArray(p.followers),
    following: parseArray(p.following),
    total_votes_received: p.total_votes_received || 0,
    password_hash: p.password_hash || '',
    updated_at: p.updated_at || new Date().toISOString(),
    created_at: p.created_at || new Date().toISOString(),
  };
};

/**
 * Robustly save user profile updates to Supabase Cloud DB and local API with fallback
 */
export const saveProfileToCloud = async (profile: Profile): Promise<boolean> => {
  const cleanData = sanitizeProfileForSupabase(profile);

  // 1. Local API Endpoint Update
  try {
    fetch('/api/users/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: cleanData }),
    }).catch(() => {});
  } catch {}

  // 2. Supabase Cloud DB Update
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    // Attempt 1: Full profile upsert
    const { error: fullErr } = await supabase
      .from('profiles')
      .upsert(cleanData, { onConflict: 'id' });

    if (!fullErr) {
      console.log('[Aether Supabase] Full profile updated/inserted in Cloud DB:', profile.username);
      return true;
    }

    console.warn('[Aether Supabase] Full profile upsert notice, trying core columns:', fullErr.message);

    // Attempt 2: Core standard columns (includes banner_url and banner_size)
    const coreData = {
      id: profile.id,
      email: profile.email || '',
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      display_name: profile.display_name || '',
      username: profile.username || '',
      avatar_url: profile.avatar_url || DEFAULT_DLICOM_AVATAR,
      banner_url: profile.banner_url || '',
      banner_size: profile.banner_size || 'standard',
      bio: profile.bio || '',
      is_verified: profile.is_verified ?? true,
      is_golden_verified: profile.is_golden_verified ?? false,
      is_admin: profile.is_admin ?? false,
      updated_at: profile.updated_at || new Date().toISOString(),
      created_at: profile.created_at || new Date().toISOString(),
    };

    const { error: coreErr } = await supabase
      .from('profiles')
      .upsert(coreData, { onConflict: 'id' });

    if (!coreErr) {
      console.log('[Aether Supabase] Core profile saved to Cloud DB:', profile.username);
      return true;
    }

    console.warn('[Aether Supabase] Core profile upsert notice, trying minimal columns with banner:', coreErr.message);

    // Attempt 3: Minimal fields guaranteed on any Supabase table
    const minimalData = {
      id: profile.id,
      display_name: profile.display_name || '',
      username: profile.username || '',
      avatar_url: profile.avatar_url || DEFAULT_DLICOM_AVATAR,
      banner_url: profile.banner_url || '',
      created_at: profile.created_at || new Date().toISOString(),
    };

    const { error: minErr } = await supabase
      .from('profiles')
      .upsert(minimalData, { onConflict: 'id' });

    if (minErr) {
      console.error('[Aether Supabase] Minimal profile upsert failed:', minErr.message);
      return false;
    }

    console.log('[Aether Supabase] Minimal profile saved to Cloud DB:', profile.username);
    return true;
  } catch (err) {
    console.error('[Aether Supabase] Critical saveProfileToCloud exception:', err);
    return false;
  }
};

export const sanitizePostForSupabase = (p: Post) => {
  return {
    id: p.id,
    user_id: p.user_id,
    title: p.title || '',
    image_data: p.image_data || '',
    video_data: p.video_data || '',
    media_type: p.media_type || 'text',
    description: p.description || '',
    tagged_users: p.tagged_users || [],
    tags: p.tags || [],
    votes_up: p.votes_up || 0,
    votes_down: p.votes_down || 0,
    net_votes: p.net_votes || 0,
    is_pinned_home: Boolean(p.is_pinned_home),
    is_pinned_profile: Boolean(p.is_pinned_profile),
    created_at: p.created_at || new Date().toISOString(),
  };
};

/**
 * Robustly save posts to Supabase Cloud DB with schema column fallback
 */
export const savePostToCloud = async (post: Post): Promise<boolean> => {
  const supabase = getSupabaseClient();

  // 1. Send to Local Server API Endpoint
  try {
    fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post }),
    }).catch(() => {});
  } catch {}

  if (!supabase) return false;

  const fullPayload = sanitizePostForSupabase(post);

  try {
    // Attempt 1: Full post upsert
    const { error: fullErr } = await supabase
      .from('posts')
      .upsert(fullPayload, { onConflict: 'id' });

    if (!fullErr) {
      console.log('[Aether Supabase] Post saved to Cloud DB:', post.id);
      return true;
    }

    console.warn('[Aether Supabase] Full post upsert notice, trying standard columns:', fullErr.message);

    // Attempt 2: Standard columns (removes video_data and media_type if non-existent in schema)
    const stdPayload = {
      id: post.id,
      user_id: post.user_id,
      title: post.title || '',
      image_data: post.image_data || '',
      description: post.description || '',
      votes_up: post.votes_up || 0,
      votes_down: post.votes_down || 0,
      net_votes: post.net_votes || 0,
      created_at: post.created_at || new Date().toISOString(),
    };

    const { error: stdErr } = await supabase
      .from('posts')
      .upsert(stdPayload, { onConflict: 'id' });

    if (!stdErr) {
      console.log('[Aether Supabase] Standard post saved to Cloud DB:', post.id);
      return true;
    }

    console.warn('[Aether Supabase] Standard post upsert notice, trying minimal columns:', stdErr.message);

    // Attempt 3: Core minimal columns only
    const minPayload = {
      id: post.id,
      user_id: post.user_id,
      title: post.title || '',
      description: post.description || '',
      created_at: post.created_at || new Date().toISOString(),
    };

    const { error: minErr } = await supabase
      .from('posts')
      .upsert(minPayload, { onConflict: 'id' });

    if (minErr) {
      console.error('[Aether Supabase] Minimal post upsert failed:', minErr.message);
      return false;
    }

    console.log('[Aether Supabase] Minimal post saved to Cloud DB:', post.id);
    return true;
  } catch (err) {
    console.error('[Aether Supabase] Critical savePostToCloud exception:', err);
    return false;
  }
};

/**
 * Robustly save comments and replies to Supabase Cloud DB with schema fallback
 */
export const saveCommentToCloud = async (comment: PostComment): Promise<boolean> => {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    // Attempt 1: Full payload (including parent_comment_id and reply metadata)
    const { error: fullErr } = await supabase.from('comments').upsert({
      id: comment.id,
      post_id: comment.post_id,
      user_id: comment.user_id,
      text: comment.text,
      parent_comment_id: comment.parent_comment_id || null,
      reply_to_user_id: comment.reply_to_user_id || null,
      reply_to_username: comment.reply_to_username || null,
      created_at: comment.created_at,
    }, { onConflict: 'id' });

    if (!fullErr) {
      console.log('[Aether Supabase] Comment & reply saved to Cloud DB:', comment.id);
      return true;
    }

    // Attempt 2: With parent_comment_id
    const { error: pErr } = await supabase.from('comments').upsert({
      id: comment.id,
      post_id: comment.post_id,
      user_id: comment.user_id,
      text: comment.text,
      parent_comment_id: comment.parent_comment_id || null,
      created_at: comment.created_at,
    }, { onConflict: 'id' });

    if (!pErr) {
      console.log('[Aether Supabase] Threaded comment saved to Cloud DB:', comment.id);
      return true;
    }

    // Attempt 3: Core minimal columns only
    const { error: minErr } = await supabase.from('comments').upsert({
      id: comment.id,
      post_id: comment.post_id,
      user_id: comment.user_id,
      text: comment.text,
      created_at: comment.created_at,
    }, { onConflict: 'id' });

    if (!minErr) {
      console.log('[Aether Supabase] Standard comment saved to Cloud DB:', comment.id);
      return true;
    }

    console.warn('[Aether Supabase] Comment save notice:', minErr.message);
    return false;
  } catch (err) {
    console.warn('[Aether Supabase] Comment cloud save exception:', err);
    return false;
  }
};

/* ==========================================================================
   MULTI-ACCOUNT SWITCHER ENGINE
   ========================================================================== */

export const getSavedAccounts = (): Profile[] => {
  const saved = getItem<Profile[]>(STORAGE_KEYS.SAVED_ACCOUNTS, []);
  const allUsers = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  const currentId = getItem<string | null>(STORAGE_KEYS.CURRENT_USER_ID, null);

  // Map by ID and clean out fake mock IDs
  const accountMap = new Map<string, Profile>();
  saved.filter(u => u && u.id && !FAKE_MOCK_IDS.includes(u.id)).forEach(u => accountMap.set(u.id, u));

  // If current active user exists and not in map, add them
  if (currentId) {
    const current = allUsers.find(u => u.id === currentId);
    if (current && !FAKE_MOCK_IDS.includes(current.id)) {
      accountMap.set(current.id, current);
    }
  }

  // Update saved accounts if new active was added
  const list = Array.from(accountMap.values());
  if (list.length !== saved.length) {
    setItem(STORAGE_KEYS.SAVED_ACCOUNTS, list);
  }
  return list;
};

export const addOrUpdateSavedAccount = (profile: Profile): void => {
  if (!profile || !profile.id || FAKE_MOCK_IDS.includes(profile.id)) return;
  const accounts = getSavedAccounts();
  const idx = accounts.findIndex(a => a.id === profile.id || a.email.toLowerCase() === profile.email.toLowerCase());
  if (idx !== -1) {
    accounts[idx] = { ...accounts[idx], ...profile };
  } else {
    accounts.unshift(profile);
  }
  setItem(STORAGE_KEYS.SAVED_ACCOUNTS, accounts);
};

export const removeSavedAccount = (userId: string): Profile | null => {
  const accounts = getSavedAccounts().filter(a => a.id !== userId);
  setItem(STORAGE_KEYS.SAVED_ACCOUNTS, accounts);

  const currentId = getItem<string | null>(STORAGE_KEYS.CURRENT_USER_ID, null);
  if (currentId === userId) {
    const nextUser = accounts[0] || null;
    setItem(STORAGE_KEYS.CURRENT_USER_ID, nextUser ? nextUser.id : null);
    syncWithServer();
    return nextUser;
  }
  return getCurrentUser();
};

export const switchAccountSession = (userId: string): Profile | null => {
  const allUsers = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  const saved = getSavedAccounts();
  const target = allUsers.find(u => u.id === userId) || saved.find(u => u.id === userId) || null;

  if (target) {
    setItem(STORAGE_KEYS.CURRENT_USER_ID, target.id);
    addOrUpdateSavedAccount(target);
    syncWithServer();
    return target;
  }
  return null;
};

/* ==========================================================================
   CROSS-DEVICE & CENTRAL CLOUD/SERVER SYNC ENGINE
   ========================================================================== */

let currentSyncPromise: Promise<boolean> | null = null;

const getDeletedPostIds = (): Set<string> => {
  const list = getItem<string[]>(STORAGE_KEYS.DELETED_POST_IDS, []);
  return new Set(list);
};

export const syncWithServer = async (): Promise<boolean> => {
  if (currentSyncPromise) {
    return currentSyncPromise;
  }

  currentSyncPromise = (async () => {
    try {
      const deletedIds = getDeletedPostIds();
      const currentUserId = getItem<string | null>(STORAGE_KEYS.CURRENT_USER_ID, null);
      const localUsers = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []).filter(u => !FAKE_MOCK_IDS.includes(u.id));
      const currentUser = currentUserId ? localUsers.find(u => u.id === currentUserId) || null : null;
      const localVotes = getItem<VoteRecord[]>(STORAGE_KEYS.VOTES, []).filter(v => !deletedIds.has(v.post_id));
      const localNotifs = getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
      const localOtps = getItem<any[]>(STORAGE_KEYS.PENDING_OTPS, []);

      // 1. Local Vite / API Sync (if available on local network)
      try {
        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: currentUser ? sanitizeProfileForSupabase(currentUser) : undefined,
            votes: localVotes,
            notifications: localNotifs,
            pending_otps: localOtps,
            deleted_post_ids: Array.from(deletedIds),
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const { users, posts, votes, notifications, pending_otps, deleted_post_ids } = result.data;

            // Merge server-reported deleted IDs
            if (Array.isArray(deleted_post_ids) && deleted_post_ids.length > 0) {
              const currentDeleted = getItem<string[]>(STORAGE_KEYS.DELETED_POST_IDS, []);
              const updatedDeleted = Array.from(new Set([...currentDeleted, ...deleted_post_ids]));
              if (updatedDeleted.length !== currentDeleted.length) {
                setItem(STORAGE_KEYS.DELETED_POST_IDS, updatedDeleted);
                deleted_post_ids.forEach(id => deletedIds.add(id));
              }
            }

            if (Array.isArray(users)) {
              const cleanUsers = users.filter((u: any) => !FAKE_MOCK_IDS.includes(u.id));
              const mergedUserMap = new Map<string, Profile>();
              cleanUsers.forEach((u: Profile) => mergedUserMap.set(u.id, u));
              if (currentUser) {
                const existing: Partial<Profile> = mergedUserMap.get(currentUser.id) || {};
                mergedUserMap.set(currentUser.id, {
                  ...existing,
                  ...currentUser,
                  following: Array.isArray(currentUser.following) ? currentUser.following : existing.following || [],
                  followers: Array.isArray(currentUser.followers) ? currentUser.followers : existing.followers || [],
                } as Profile);
              }
              const finalLocalUsers = reconcileFollowGraph(Array.from(mergedUserMap.values()));
              setItem(STORAGE_KEYS.REAL_USERS, finalLocalUsers);
            }

            if (Array.isArray(votes)) {
              const voteMap = new Map<string, VoteRecord>();
              [...votes, ...localVotes].forEach((v: any) => {
                if (v && v.user_id && v.post_id && !deletedIds.has(v.post_id)) {
                  const key = `${v.user_id}_${v.post_id}`;
                  voteMap.set(key, { ...v, id: `vote_${key}` });
                }
              });
              setItem(STORAGE_KEYS.VOTES, Array.from(voteMap.values()));
            }

            if (Array.isArray(posts)) {
              const cleanPosts = posts.filter(p => !deletedIds.has(p.id));
              setItem(STORAGE_KEYS.POSTS, cleanPosts);
            }

            if (Array.isArray(notifications)) {
              setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
            }
            if (Array.isArray(pending_otps)) {
              setItem(STORAGE_KEYS.PENDING_OTPS, pending_otps);
            }
          }
        }
      } catch {
        // Local API fallback
      }

      // 2. Supabase Cloud DB Synchronization (Global Cross-Device Source of Truth)
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          // Pull ALL live profiles from Supabase
          const { data: supaProfiles, error: profError } = await supabase.from('profiles').select('*');
          let finalUsers: Profile[] = [];
          if (!profError && supaProfiles && supaProfiles.length > 0) {
            const cleanSupaUsers = supaProfiles.filter((u: any) => !FAKE_MOCK_IDS.includes(u.id));
            const currentLocalUsers = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
            const localUserMap = new Map<string, Profile>();
            currentLocalUsers.forEach(u => localUserMap.set(u.id, u));

            const mergedUserMap = new Map<string, Profile>();

            cleanSupaUsers.forEach((su: any) => {
              const localU = localUserMap.get(su.id);
              if (!localU) {
                const suProfile: Profile = {
                  ...su,
                  banner_url: su.banner_url || '',
                  banner_size: su.banner_size || 'standard',
                  followers: Array.isArray(su.followers) ? su.followers : typeof su.followers === 'string' ? JSON.parse(su.followers || '[]') : [],
                  following: Array.isArray(su.following) ? su.following : typeof su.following === 'string' ? JSON.parse(su.following || '[]') : [],
                  is_golden_verified: su.is_golden_verified !== undefined ? Boolean(su.is_golden_verified) : false,
                  is_admin: su.is_admin !== undefined ? Boolean(su.is_admin) : false,
                  is_verified: su.is_verified !== undefined ? Boolean(su.is_verified) : true,
                };
                mergedUserMap.set(suProfile.id, suProfile);
              } else {
                const localUpdated = localU.updated_at ? new Date(localU.updated_at).getTime() : 0;
                const supaUpdated = su.updated_at ? new Date(su.updated_at).getTime() : 0;
                const preferLocal = localUpdated > supaUpdated;

                // Smart banner reconciliation: If su has banner and local doesn't, pick su banner
                const resolvedBannerUrl = (!localU.banner_url && su.banner_url)
                  ? su.banner_url
                  : (preferLocal
                      ? (localU.banner_url !== undefined ? localU.banner_url : (su.banner_url || ''))
                      : (su.banner_url !== undefined ? su.banner_url : (localU.banner_url || '')));

                const resolvedBannerSize = (!localU.banner_size && su.banner_size)
                  ? su.banner_size
                  : (preferLocal
                      ? (localU.banner_size || su.banner_size || 'standard')
                      : (su.banner_size || localU.banner_size || 'standard'));

                const suProfile: Profile = {
                  ...su,
                  ...localU,
                  ...(preferLocal ? {
                    display_name: localU.display_name || su.display_name,
                    first_name: localU.first_name ?? su.first_name,
                    last_name: localU.last_name ?? su.last_name,
                    avatar_url: localU.avatar_url || su.avatar_url,
                    banner_url: resolvedBannerUrl,
                    banner_size: resolvedBannerSize,
                    bio: localU.bio !== undefined ? localU.bio : (su.bio || ''),
                    location: localU.location !== undefined ? localU.location : (su.location || ''),
                    website: localU.website !== undefined ? localU.website : (su.website || ''),
                  } : {
                    display_name: su.display_name || localU.display_name,
                    first_name: su.first_name ?? localU.first_name,
                    last_name: su.last_name ?? localU.last_name,
                    avatar_url: su.avatar_url || localU.avatar_url,
                    banner_url: resolvedBannerUrl,
                    banner_size: resolvedBannerSize,
                    bio: su.bio !== undefined ? su.bio : (localU.bio || ''),
                    location: su.location !== undefined ? su.location : (localU.location || ''),
                    website: su.website !== undefined ? su.website : (localU.website || ''),
                  }),
                  followers: Array.isArray(su.followers) ? su.followers : typeof su.followers === 'string' ? JSON.parse(su.followers || '[]') : localU.followers || [],
                  following: Array.isArray(su.following) ? su.following : typeof su.following === 'string' ? JSON.parse(su.following || '[]') : localU.following || [],
                  is_golden_verified: su.is_golden_verified !== undefined ? Boolean(su.is_golden_verified) : Boolean(localU.is_golden_verified),
                  is_admin: su.is_admin !== undefined ? Boolean(su.is_admin) : Boolean(localU.is_admin),
                  is_verified: su.is_verified !== undefined ? Boolean(su.is_verified) : Boolean(localU.is_verified),
                };

                mergedUserMap.set(suProfile.id, suProfile);
              }
            });

            // Preserve any local users not yet in Supabase
            currentLocalUsers.forEach(lu => {
              if (!mergedUserMap.has(lu.id)) {
                mergedUserMap.set(lu.id, lu);
              }
            });

            // Reconcile complete bidirectional follow graph across all users
            finalUsers = reconcileFollowGraph(Array.from(mergedUserMap.values()));
            setItem(STORAGE_KEYS.REAL_USERS, finalUsers);

            // Update saved accounts if current profile changed
            if (currentUser) {
              const freshActive = finalUsers.find(u => u.id === currentUser.id);
              if (freshActive) {
                addOrUpdateSavedAccount(freshActive);
              }
            }
          } else {
            finalUsers = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
          }

          // C. Pull ALL live votes from Supabase
          const { data: supaVotes } = await supabase.from('votes').select('*');
          let validVotes: VoteRecord[] = [];
          if (supaVotes && Array.isArray(supaVotes)) {
            const voteMap = new Map<string, VoteRecord>();
            supaVotes.forEach((v: any) => {
              if (v && v.user_id && v.post_id && !deletedIds.has(v.post_id)) {
                const key = `${v.user_id}_${v.post_id}`;
                voteMap.set(key, { ...v, id: `vote_${key}` });
              }
            });
            validVotes = Array.from(voteMap.values());
            setItem(STORAGE_KEYS.VOTES, validVotes);
          } else {
            validVotes = getItem<VoteRecord[]>(STORAGE_KEYS.VOTES, []).filter(v => !deletedIds.has(v.post_id));
          }

          // D. Pull ALL live posts from Supabase
          const { data: supaPosts, error: postsError } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });

          if (!postsError && supaPosts) {
            const supaPostMap = new Map<string, any>();
            supaPosts.forEach((p: any) => supaPostMap.set(p.id, p));

            // Keep any local posts created by currentUser that are still pending / in-flight
            const localPosts = getItem<Post[]>(STORAGE_KEYS.POSTS, []);
            const pendingLocalPosts = localPosts.filter(
              lp => !deletedIds.has(lp.id) && !supaPostMap.has(lp.id) && lp.user_id === currentUserId
            );

            const combinedPosts = [...pendingLocalPosts, ...supaPosts];

            const allComments = getItem<PostComment[]>(STORAGE_KEYS.POST_COMMENTS, []);
            const validSupaPosts = combinedPosts
              .filter((p: any) => !deletedIds.has(p.id) && p.description !== '[DELETED]' && p.title !== '[DELETED]' && !p.is_deleted)
              .map((p: any) => {
                const pVotes = validVotes.filter(v => v.post_id === p.id);
                const up = pVotes.filter(v => v.type === 'up').length;
                const down = pVotes.filter(v => v.type === 'down').length;
                const freshAuthor = finalUsers.find(u => u.id === p.user_id);
                const cCount = allComments.filter(c => c.post_id === p.id).length;
                const localP = localPosts.find(lp => lp.id === p.id);
                return {
                  ...p,
                  is_pinned_home: p.is_pinned_home !== undefined ? Boolean(p.is_pinned_home) : Boolean(localP?.is_pinned_home),
                  is_pinned_profile: p.is_pinned_profile !== undefined ? Boolean(p.is_pinned_profile) : Boolean(localP?.is_pinned_profile),
                  votes_up: up,
                  votes_down: down,
                  net_votes: up - down,
                  comments_count: cCount,
                  user: freshAuthor || p.user,
                };
              });

            setItem(STORAGE_KEYS.POSTS, validSupaPosts);
          }

          // E. Pull live notifications from Supabase
          const deletedNotifIds = new Set(getItem<string[]>(STORAGE_KEYS.DELETED_NOTIFICATION_IDS, []));
          const { data: supaNotifs } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false });

          if (supaNotifs && Array.isArray(supaNotifs)) {
            const currentLocalNotifs = getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []).filter(n => !deletedNotifIds.has(n.id));
            const notifMap = new Map<string, NotificationItem>();
            
            supaNotifs
              .filter((n: any) => !deletedNotifIds.has(n.id))
              .forEach((n: any) => notifMap.set(n.id, n));

            currentLocalNotifs.forEach((localN: any) => {
              if (deletedNotifIds.has(localN.id)) return;
              const remote = notifMap.get(localN.id);
              if (remote) {
                // If marked read locally, preserve read status
                notifMap.set(localN.id, {
                  ...remote,
                  is_read: localN.is_read || remote.is_read,
                });
              } else {
                notifMap.set(localN.id, localN);
              }
            });
            setItem(STORAGE_KEYS.NOTIFICATIONS, Array.from(notifMap.values()));
          }

          // F. Pull comments from Supabase
          try {
            const { data: supaComments } = await supabase
              .from('comments')
              .select('*')
              .order('created_at', { ascending: true });

            if (supaComments && Array.isArray(supaComments)) {
              const localComments = getItem<PostComment[]>(STORAGE_KEYS.POST_COMMENTS, []);
              const cMap = new Map<string, PostComment>();

              supaComments.forEach((c: any) => {
                cMap.set(c.id, {
                  id: c.id,
                  post_id: c.post_id,
                  user_id: c.user_id,
                  text: c.text,
                  created_at: c.created_at,
                  parent_comment_id: c.parent_comment_id || null,
                  reply_to_user_id: c.reply_to_user_id || null,
                  reply_to_username: c.reply_to_username || undefined,
                });
              });

              localComments.forEach(c => {
                if (!cMap.has(c.id)) cMap.set(c.id, c);
              });

              setItem(STORAGE_KEYS.POST_COMMENTS, Array.from(cMap.values()));
            }
          } catch {}

          // G. Pull direct messages from Supabase
          try {
            const deletedDmIds = new Set(getItem<string[]>(STORAGE_KEYS.DELETED_DM_MSG_IDS, []));
            const { data: supaDms } = await supabase
              .from('direct_messages')
              .select('*')
              .order('created_at', { ascending: true });

            if (supaDms && Array.isArray(supaDms)) {
              const localDms = getItem<DirectMessage[]>(STORAGE_KEYS.DIRECT_MESSAGES, []);
              const dmMap = new Map<string, DirectMessage>();

              supaDms.forEach((d: any) => {
                if (!deletedDmIds.has(d.id) && !d.is_deleted) {
                  dmMap.set(d.id, d);
                }
              });

              // Only preserve recent local DMs (< 30s) that are still in-flight
              const now = Date.now();
              localDms.forEach(d => {
                if (!deletedDmIds.has(d.id) && !d.is_deleted && !dmMap.has(d.id)) {
                  const age = now - new Date(d.created_at).getTime();
                  if (age < 30000) {
                    dmMap.set(d.id, d);
                  }
                }
              });

              setItem(STORAGE_KEYS.DIRECT_MESSAGES, Array.from(dmMap.values()));
            }
          } catch {}

          // H. Pull VIP chat messages from Supabase
          try {
            const deletedChatIds = new Set(getItem<string[]>(STORAGE_KEYS.DELETED_CHAT_MSG_IDS, []));
            const { data: supaVipMsgs } = await supabase
              .from('vip_messages')
              .select('*')
              .order('created_at', { ascending: true });

            if (supaVipMsgs && Array.isArray(supaVipMsgs)) {
              const localVip = getItem<ChatMessage[]>(STORAGE_KEYS.VIP_CHAT, []);
              const vMap = new Map<string, ChatMessage>();

              supaVipMsgs.forEach((m: any) => {
                if (!deletedChatIds.has(m.id) && !m.is_deleted) {
                  vMap.set(m.id, m);
                }
              });

              // Only preserve recent local messages (< 30s) that are still in-flight
              const now = Date.now();
              localVip.forEach(m => {
                if (!deletedChatIds.has(m.id) && !m.is_deleted && !vMap.has(m.id)) {
                  const age = now - new Date(m.created_at).getTime();
                  if (age < 30000) {
                    vMap.set(m.id, m);
                  }
                }
              });

              setItem(STORAGE_KEYS.VIP_CHAT, Array.from(vMap.values()));
            }
          } catch {}
        } catch (supaErr) {
          console.warn('[Aether Supabase] Sync notice:', supaErr);
        }
      }

      window.dispatchEvent(new Event('aether_storage_sync'));
      return true;
    } catch (e) {
      // Offline fallback
    } finally {
      currentSyncPromise = null;
    }
    return false;
  })();

  return currentSyncPromise;
};

let activeRealtimeChannel: any = null;

export const broadcastRealtimeEvent = async (event: string, payload: any): Promise<void> => {
  try {
    if (activeRealtimeChannel) {
      await activeRealtimeChannel.send({
        type: 'broadcast',
        event,
        payload,
      });
    } else {
      const supabase = getSupabaseClient();
      if (supabase) {
        const tempChannel = supabase.channel('aether_global_realtime_broadcast');
        await tempChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            tempChannel.send({
              type: 'broadcast',
              event,
              payload,
            }).then(() => {
              supabase.removeChannel(tempChannel);
            });
          }
        });
      }
    }
  } catch (err) {
    console.warn('[Aether Broadcast Warning]:', err);
  }
};

/**
 * Subscribe to Supabase Realtime Channel for instant cross-device live updates
 */
export const subscribeToSupabaseRealtime = (onSyncNeeded: () => void): (() => void) => {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  try {
    const channel = supabase
      .channel('aether_global_realtime_broadcast', {
        config: {
          broadcast: { self: false },
        },
      })
      // 1. Table Postgres changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        () => {
          syncWithServer().then(() => onSyncNeeded());
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          syncWithServer().then(() => onSyncNeeded());
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes' },
        () => {
          syncWithServer().then(() => onSyncNeeded());
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          syncWithServer().then(() => onSyncNeeded());
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'direct_messages' },
        () => {
          syncWithServer().then(() => onSyncNeeded());
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vip_messages' },
        () => {
          syncWithServer().then(() => onSyncNeeded());
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        () => {
          syncWithServer().then(() => onSyncNeeded());
        }
      )
      // 2. Instant Realtime Broadcast Events (sub-50ms message delivery across devices)
      .on('broadcast', { event: 'new_direct_message' }, ({ payload }) => {
        if (!payload || !payload.id) return;
        const currentUserId = getItem<string | null>(STORAGE_KEYS.CURRENT_USER_ID, null);
        if (!currentUserId) return;

        if (payload.receiver_id === currentUserId || payload.sender_id === currentUserId) {
          const dms = getItem<DirectMessage[]>(STORAGE_KEYS.DIRECT_MESSAGES, []);
          if (!dms.some(m => m.id === payload.id)) {
            dms.push(payload);
            setItem(STORAGE_KEYS.DIRECT_MESSAGES, dms);
            window.dispatchEvent(new Event('aether_storage_sync'));
            onSyncNeeded();
          }
        }
      })
      .on('broadcast', { event: 'read_direct_message' }, ({ payload }) => {
        if (!payload) return;
        const currentUserId = getItem<string | null>(STORAGE_KEYS.CURRENT_USER_ID, null);
        if (!currentUserId) return;

        if (payload.senderId === currentUserId) {
          const dms = getItem<DirectMessage[]>(STORAGE_KEYS.DIRECT_MESSAGES, []);
          let modified = false;
          dms.forEach(m => {
            if (m.sender_id === currentUserId && m.receiver_id === payload.viewerId && !m.is_read) {
              m.is_read = true;
              modified = true;
            }
          });
          if (modified) {
            setItem(STORAGE_KEYS.DIRECT_MESSAGES, dms);
            window.dispatchEvent(new Event('aether_storage_sync'));
            onSyncNeeded();
          }
        }
      })
      .on('broadcast', { event: 'new_vip_message' }, ({ payload }) => {
        if (!payload || !payload.id) return;
        const chatMsgs = getItem<ChatMessage[]>(STORAGE_KEYS.VIP_CHAT, []);
        if (!chatMsgs.some(m => m.id === payload.id)) {
          chatMsgs.push(payload);
          if (chatMsgs.length > 300) chatMsgs.shift();
          setItem(STORAGE_KEYS.VIP_CHAT, chatMsgs);
          window.dispatchEvent(new Event('aether_storage_sync'));
          onSyncNeeded();
        }
      })
      .on('broadcast', { event: 'delete_message' }, ({ payload }) => {
        if (!payload || !payload.message_id) return;
        if (payload.type === 'dm') {
          const dms = getItem<DirectMessage[]>(STORAGE_KEYS.DIRECT_MESSAGES, []);
          const updated = dms.filter(m => m.id !== payload.message_id);
          setItem(STORAGE_KEYS.DIRECT_MESSAGES, updated);
        } else if (payload.type === 'vip') {
          const vips = getItem<ChatMessage[]>(STORAGE_KEYS.VIP_CHAT, []);
          const updated = vips.filter(m => m.id !== payload.message_id);
          setItem(STORAGE_KEYS.VIP_CHAT, updated);
        }
        window.dispatchEvent(new Event('aether_storage_sync'));
        onSyncNeeded();
      })
      .on('broadcast', { event: 'new_comment' }, ({ payload }) => {
        if (!payload || !payload.id) return;
        const comments = getItem<PostComment[]>(STORAGE_KEYS.POST_COMMENTS, []);
        if (!comments.some(c => c.id === payload.id)) {
          comments.push(payload);
          setItem(STORAGE_KEYS.POST_COMMENTS, comments);

          // Update post comments count if exists
          const posts = getItem<Post[]>(STORAGE_KEYS.POSTS, []);
          const pIdx = posts.findIndex(p => p.id === payload.post_id);
          if (pIdx !== -1) {
            posts[pIdx].comments_count = (posts[pIdx].comments_count || 0) + 1;
            setItem(STORAGE_KEYS.POSTS, posts);
          }

          window.dispatchEvent(new Event('aether_storage_sync'));
          onSyncNeeded();
        }
      })
      .on('broadcast', { event: 'delete_comment' }, ({ payload }) => {
        if (!payload || !payload.comment_id) return;
        const comments = getItem<PostComment[]>(STORAGE_KEYS.POST_COMMENTS, []);
        const updated = comments.filter(c => c.id !== payload.comment_id);
        setItem(STORAGE_KEYS.POST_COMMENTS, updated);

        if (payload.post_id) {
          const posts = getItem<Post[]>(STORAGE_KEYS.POSTS, []);
          const pIdx = posts.findIndex(p => p.id === payload.post_id);
          if (pIdx !== -1) {
            posts[pIdx].comments_count = Math.max(0, (posts[pIdx].comments_count || 1) - 1);
            setItem(STORAGE_KEYS.POSTS, posts);
          }
        }

        window.dispatchEvent(new Event('aether_storage_sync'));
        onSyncNeeded();
      })
      .on('broadcast', { event: 'pin_post' }, ({ payload }) => {
        if (!payload || !payload.post_id) return;
        const posts = getItem<Post[]>(STORAGE_KEYS.POSTS, []);
        const idx = posts.findIndex(p => p.id === payload.post_id);
        if (idx !== -1) {
          if (payload.is_pinned_home !== undefined) {
            posts[idx].is_pinned_home = payload.is_pinned_home;
          }
          if (payload.is_pinned_profile !== undefined) {
            posts[idx].is_pinned_profile = payload.is_pinned_profile;
          }
          setItem(STORAGE_KEYS.POSTS, posts);
          window.dispatchEvent(new Event('aether_storage_sync'));
          onSyncNeeded();
        }
      })
      .subscribe((status) => {
        console.log('[Supabase Realtime Channel Status]:', status);
      });

    activeRealtimeChannel = channel;

    return () => {
      supabase.removeChannel(channel);
      activeRealtimeChannel = null;
    };
  } catch (err) {
    console.warn('[Aether Realtime] Subscription error:', err);
    return () => {};
  }
};

/**
 * Initialize Storage with zero fake users and auto-sync
 */
export const initializeV3Storage = (): void => {
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

  // Ensure current user is in saved accounts
  const currentUser = getCurrentUser();
  if (currentUser) {
    addOrUpdateSavedAccount(currentUser);
  }

  // Initial server and cloud sync
  syncWithServer();
};

/* ==========================================================================
   AUTHENTICATION & REAL REGISTRATION FLOW
   ========================================================================== */

/**
 * Check whether an account already exists with this email address
 * across LocalStorage, Supabase Cloud DB, and the local Server API.
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail) return false;

  // 1. Check LocalStorage
  const localUsers = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  if (localUsers.some(u => (u.email || '').toLowerCase().trim() === cleanEmail)) {
    return true;
  }

  // 2. Check Supabase Cloud DB
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, email')
        .ilike('email', cleanEmail)
        .limit(1);
      if (data && data.length > 0) {
        return true;
      }
    } catch {}
  }

  // 3. Check Local Server API
  try {
    const res = await fetch('/api/users');
    if (res.ok) {
      const json = await res.json();
      if (json.users && Array.isArray(json.users)) {
        if (json.users.some((u: any) => (u.email || '').toLowerCase().trim() === cleanEmail)) {
          return true;
        }
      }
    }
  } catch {}

  return false;
};

export const createPendingRegistration = (data: {
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
}): { otp_code: string } => {
  const cleanEmail = data.email.toLowerCase().trim();
  const localUsers = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  const alreadyExists = localUsers.some(u => (u.email || '').toLowerCase().trim() === cleanEmail);
  if (alreadyExists) {
    throw new Error('An account already exists with this email address. Please sign in instead.');
  }

  const pending = getItem<Array<any>>(STORAGE_KEYS.PENDING_OTPS, []);
  const otp_code = String(Math.floor(100000 + Math.random() * 900000));
  const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const filtered = pending.filter(p => p.email.toLowerCase() !== cleanEmail);
  filtered.push({
    ...data,
    email: cleanEmail,
    otp_code,
    expires_at,
  });

  setItem(STORAGE_KEYS.PENDING_OTPS, filtered);
  syncWithServer();

  console.info(`[Aether Auth] 6-Digit OTP code for ${data.email}: ${otp_code}`);
  return { otp_code };
};

export const verifyAndCreateUser = async (
  email: string,
  otpCode: string
): Promise<{ success: boolean; user?: Profile; message: string }> => {
  const pending = getItem<Array<any>>(STORAGE_KEYS.PENDING_OTPS, []);
  const found = pending.find(
    p => p.email.toLowerCase() === email.toLowerCase().trim() && p.otp_code === otpCode.trim()
  );

  if (!found) {
    return { success: false, message: 'Invalid verification code. Please check your email inbox.' };
  }

  if (new Date(found.expires_at).getTime() < Date.now()) {
    return { success: false, message: 'Verification code has expired. Please request a new code.' };
  }

  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  let existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

  if (existingUser) {
    setItem(STORAGE_KEYS.CURRENT_USER_ID, existingUser.id);
    addOrUpdateSavedAccount(existingUser);
    await syncWithServer();
    return { success: true, user: existingUser, message: 'Account verified successfully!' };
  }

  const baseUsername = `${found.first_name}_${found.last_name}`.toLowerCase().replace(/[^a-z0-9_]/g, '');
  const username = baseUsername || `user_${Date.now().toString().slice(-4)}`;
  const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const newProfile: Profile = {
    id: userId,
    email: found.email,
    first_name: found.first_name,
    last_name: found.last_name,
    display_name: `${found.first_name} ${found.last_name}`,
    username,
    avatar_url: DEFAULT_DLICOM_AVATAR,
    bio: `Hey, I just joined Aether Feed!`,
    dlicom_address: '',
    location: '',
    website: '',
    is_verified: true,
    followers: [],
    following: [],
    total_votes_received: 0,
    created_at: now,
    updated_at: now,
    password_hash: found.password_hash,
  };

  users.unshift(newProfile);
  setItem(STORAGE_KEYS.REAL_USERS, users);
  setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
  addOrUpdateSavedAccount(newProfile);

  const updatedPending = pending.filter(p => p.email.toLowerCase() !== email.toLowerCase().trim());
  setItem(STORAGE_KEYS.PENDING_OTPS, updatedPending);

  // Send direct registration to Supabase Cloud
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('profiles').upsert(sanitizeProfileForSupabase(newProfile));
    } catch (err) {
      console.warn('[Aether Supabase] Profile upsert error:', err);
    }
  }

  // Direct server registration
  try {
    await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: newProfile }),
    });
  } catch {}

  await syncWithServer();
  return { success: true, user: newProfile, message: 'Account verified and created successfully!' };
};

export const authenticateUser = async (
  email: string,
  password: string
): Promise<{ success: boolean; user?: Profile; message: string }> => {
  const cleanEmail = email.toLowerCase().trim();
  const cleanPass = password.trim();

  // 1. Supabase Cloud Database Authentication
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: supaUsers, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', cleanEmail)
        .limit(1);

      if (!error && supaUsers && supaUsers.length > 0) {
        const supaUser = supaUsers[0];
        if (supaUser.password_hash && supaUser.password_hash !== cleanPass) {
          return { success: false, message: 'Incorrect password. Please try again.' };
        }

        const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []).filter(u => !FAKE_MOCK_IDS.includes(u.id));
        const idx = users.findIndex(u => u.id === supaUser.id || u.email.toLowerCase() === cleanEmail);
        if (idx !== -1) {
          users[idx] = { ...users[idx], ...supaUser };
        } else {
          users.unshift(supaUser);
        }
        setItem(STORAGE_KEYS.REAL_USERS, users);
        setItem(STORAGE_KEYS.CURRENT_USER_ID, supaUser.id);
        addOrUpdateSavedAccount(supaUser);
        syncWithServer();
        return { success: true, user: supaUser, message: 'Signed in successfully.' };
      }
    } catch (err) {
      console.warn('[Aether Supabase] Auth query fallback:', err);
    }
  }

  // 2. Direct Server Authentication
  try {
    const serverRes = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: cleanPass }),
    });

    if (serverRes.ok) {
      const data = await serverRes.json();
      if (data.success && data.user) {
        const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []).filter(u => !FAKE_MOCK_IDS.includes(u.id));
        const idx = users.findIndex(u => u.id === data.user.id || u.email.toLowerCase() === cleanEmail);
        if (idx !== -1) {
          users[idx] = { ...users[idx], ...data.user };
        } else {
          users.unshift(data.user);
        }
        setItem(STORAGE_KEYS.REAL_USERS, users);
        setItem(STORAGE_KEYS.CURRENT_USER_ID, data.user.id);
        addOrUpdateSavedAccount(data.user);
        syncWithServer();
        return { success: true, user: data.user, message: 'Signed in successfully.' };
      } else if (data.message && data.message.includes('Incorrect password')) {
        return { success: false, message: data.message };
      }
    }
  } catch {}

  // 3. Local State Fallback / Sync
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
  addOrUpdateSavedAccount(user);
  syncWithServer();
  return { success: true, user, message: 'Signed in successfully.' };
};

export const getCurrentUser = (): Profile | null => {
  const currentId = getItem<string | null>(STORAGE_KEYS.CURRENT_USER_ID, null);
  if (!currentId) return null;
  const users = getRealUsers();
  return users.find(u => u.id === currentId) || null;
};

export const setCurrentUserSession = (userId: string | null): void => {
  setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
  if (userId) {
    const user = getCurrentUser();
    if (user) addOrUpdateSavedAccount(user);
  }
  syncWithServer();
};

export const getRealUsers = (): Profile[] => {
  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  const clean = users.filter(u => !FAKE_MOCK_IDS.includes(u.id));
  return reconcileFollowGraph(clean);
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
    return { success: false, message: 'Invalid verification code.' };
  }

  if (new Date(found.expires_at).getTime() < Date.now()) {
    return { success: false, message: 'Verification code has expired. Please request a new code.' };
  }

  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  const idx = users.findIndex(u => u.id === userId);
  if (idx !== -1) {
    users[idx].password_hash = newPassword.trim();
    users[idx].updated_at = new Date().toISOString();
    setItem(STORAGE_KEYS.REAL_USERS, users);
    addOrUpdateSavedAccount(users[idx]);

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('profiles').upsert(users[idx]).then(() => {}, () => {});
    }
  }

  setItem(STORAGE_KEYS.PENDING_OTPS, pending.filter(p => p !== found));
  syncWithServer();
  return { success: true, message: 'Password updated successfully!' };
};

export const updateProfileData = async (userId: string, updates: Partial<Profile>): Promise<Profile | null> => {
  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  const updatedUser: Profile = {
    ...users[idx],
    ...updates,
    updated_at: now,
    display_name: updates.first_name && updates.last_name
      ? `${updates.first_name} ${updates.last_name}`
      : (updates.display_name || users[idx].display_name),
  };

  users[idx] = updatedUser;
  setItem(STORAGE_KEYS.REAL_USERS, users);
  addOrUpdateSavedAccount(updatedUser);

  // Cascade author update to all existing posts in LocalStorage
  const posts = getItem<Post[]>(STORAGE_KEYS.POSTS, []);
  let hasPostChanges = false;
  const updatedPosts = posts.map(p => {
    if (p.user_id === userId) {
      hasPostChanges = true;
      return {
        ...p,
        user: updatedUser,
      };
    }
    return p;
  });
  if (hasPostChanges) {
    setItem(STORAGE_KEYS.POSTS, updatedPosts);
  }

  // Cascade sender update to VIP Chat messages in LocalStorage
  const chatMsgs = getItem<ChatMessage[]>(STORAGE_KEYS.VIP_CHAT, []);
  let hasChatChanges = false;
  const updatedChat = chatMsgs.map(m => {
    if (m.user_id === userId) {
      hasChatChanges = true;
      return {
        ...m,
        sender_name: updatedUser.display_name,
        sender_avatar: updatedUser.avatar_url,
        is_golden: Boolean(updatedUser.is_golden_verified),
      };
    }
    return m;
  });
  if (hasChatChanges) {
    setItem(STORAGE_KEYS.VIP_CHAT, updatedChat);
  }

  // Push updated profile to Supabase Cloud & Local API with fallback
  await saveProfileToCloud(updatedUser);
  await syncWithServer();
  window.dispatchEvent(new Event('aether_storage_sync'));
  if (syncChannel) {
    syncChannel.postMessage('sync');
  }
  return updatedUser;
};

export const deleteUserAccount = async (userId: string): Promise<boolean> => {
  // 1. Remove from local registered users
  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []).filter(u => u.id !== userId);
  setItem(STORAGE_KEYS.REAL_USERS, users);

  // 2. Remove from multi-account switcher
  removeSavedAccount(userId);

  // 3. Remove user posts
  const posts = getItem<Post[]>(STORAGE_KEYS.POSTS, []).filter(p => p.user_id !== userId);
  setItem(STORAGE_KEYS.POSTS, posts);

  // 4. Remove user votes
  const votes = getItem<VoteRecord[]>(STORAGE_KEYS.VOTES, []).filter(v => v.user_id !== userId);
  setItem(STORAGE_KEYS.VOTES, votes);

  // 5. Remove user comments
  const comments = getItem<PostComment[]>(STORAGE_KEYS.POST_COMMENTS, []).filter(c => c.user_id !== userId);
  setItem(STORAGE_KEYS.POST_COMMENTS, comments);

  // 6. Remove user VIP chat messages
  const vipChat = getItem<ChatMessage[]>(STORAGE_KEYS.VIP_CHAT, []).filter(m => m.user_id !== userId);
  setItem(STORAGE_KEYS.VIP_CHAT, vipChat);

  // 7. Remove user direct messages
  const dms = getItem<DirectMessage[]>(STORAGE_KEYS.DIRECT_MESSAGES, []).filter(
    m => m.sender_id !== userId && m.receiver_id !== userId
  );
  setItem(STORAGE_KEYS.DIRECT_MESSAGES, dms);

  // 8. Remove user notifications
  const notifs = getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []).filter(
    n => n.user_id !== userId && n.actor_id !== userId
  );
  setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);

  // 9. Clear active session if it belongs to this user
  const currentId = getItem<string | null>(STORAGE_KEYS.CURRENT_USER_ID, null);
  if (currentId === userId || !currentId) {
    setItem(STORAGE_KEYS.CURRENT_USER_ID, null);
  }

  // 10. Purge from Supabase Cloud DB
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await Promise.all([
        supabase.from('profiles').delete().eq('id', userId),
        supabase.from('posts').delete().eq('user_id', userId),
        supabase.from('votes').delete().eq('user_id', userId),
        supabase.from('comments').delete().eq('user_id', userId),
        supabase.from('vip_messages').delete().eq('user_id', userId),
        supabase.from('notifications').delete().eq('user_id', userId),
        supabase.from('direct_messages').delete().eq('sender_id', userId),
        supabase.from('direct_messages').delete().eq('receiver_id', userId),
      ]);
    } catch (err) {
      console.warn('[Aether Supabase] Delete user error:', err);
    }
  }

  await syncWithServer();
  window.dispatchEvent(new Event('aether_storage_sync'));
  if (syncChannel) syncChannel.postMessage('sync');
  return true;
};

/* ==========================================================================
   FOLLOW / UNFOLLOW ENGINE
   ========================================================================== */

export const toggleFollowUser = async (targetUserId: string, currentUserId: string): Promise<{ isFollowing: boolean; targetUser: Profile }> => {
  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  const currentIdx = users.findIndex(u => u.id === currentUserId);
  const targetIdx = users.findIndex(u => u.id === targetUserId);

  if (currentIdx === -1 || targetIdx === -1) {
    throw new Error('User not found');
  }

  const currentFollowing = Array.isArray(users[currentIdx].following) ? [...users[currentIdx].following] : [];
  const isCurrentlyFollowing = currentFollowing.includes(targetUserId);

  if (isCurrentlyFollowing) {
    users[currentIdx].following = currentFollowing.filter(id => id !== targetUserId);
  } else {
    users[currentIdx].following = Array.from(new Set([...currentFollowing, targetUserId]));

    addNotification({
      user_id: targetUserId,
      actor_id: currentUserId,
      type: 'follow',
    });
  }

  const now = new Date().toISOString();
  users[currentIdx].updated_at = now;

  // Reconcile complete follow graph across all users
  const reconciledUsers = reconcileFollowGraph(users);
  setItem(STORAGE_KEYS.REAL_USERS, reconciledUsers);

  const updatedCurrent = reconciledUsers.find(u => u.id === currentUserId) || reconciledUsers[currentIdx];
  const updatedTarget = reconciledUsers.find(u => u.id === targetUserId) || reconciledUsers[targetIdx];

  addOrUpdateSavedAccount(updatedCurrent);

  // Update Supabase Cloud DB with schema fallback
  await Promise.all([
    saveProfileToCloud(updatedCurrent),
    saveProfileToCloud(updatedTarget),
  ]);

  // Update Local Server API
  try {
    fetch('/api/users/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: sanitizeProfileForSupabase(updatedCurrent) }),
    }).catch(() => {});
    fetch('/api/users/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: sanitizeProfileForSupabase(updatedTarget) }),
    }).catch(() => {});
  } catch {}

  await syncWithServer();
  window.dispatchEvent(new Event('aether_storage_sync'));
  if (syncChannel) syncChannel.postMessage('sync');
  return { isFollowing: !isCurrentlyFollowing, targetUser: updatedTarget };
};

/* ==========================================================================
   POSTS & STATUS UPDATES ENGINE
   ========================================================================== */

export const getRealPosts = (): Post[] => {
  const deletedIds = getDeletedPostIds();
  const posts = getItem<Post[]>(STORAGE_KEYS.POSTS, []).filter(p => !deletedIds.has(p.id));
  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  const votes = getItem<VoteRecord[]>(STORAGE_KEYS.VOTES, []).filter(v => !deletedIds.has(v.post_id));

  // Build O(1) Hash Maps for ultra-fast lookup
  const userMap = new Map<string, Profile>();
  users.forEach(u => userMap.set(u.id, u));

  const votesMap = new Map<string, { up: number; down: number }>();
  votes.forEach(v => {
    let current = votesMap.get(v.post_id);
    if (!current) {
      current = { up: 0, down: 0 };
      votesMap.set(v.post_id, current);
    }
    if (v.type === 'up') current.up++;
    else if (v.type === 'down') current.down++;
  });

  return posts.map(p => {
    const vCounts = votesMap.get(p.id) || { up: 0, down: 0 };
    const net_votes = vCounts.up - vCounts.down;
    const author = userMap.get(p.user_id);

    return {
      ...p,
      votes_up: vCounts.up,
      votes_down: vCounts.down,
      net_votes,
    user: author || p.user,
    };
  });
};

export const createRealPost = async (data: {
  title: string;
  description: string;
  image_data: string;
  video_data?: string;
  media_type?: 'image' | 'video' | 'text';
  authorId: string;
  tagged_users?: string[];
  tags?: string[];
}): Promise<Post> => {
  const posts = getItem<Post[]>(STORAGE_KEYS.POSTS, []);
  const author = getRealUsers().find(u => u.id === data.authorId);

  const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newPost: Post = {
    id: postId,
    user_id: data.authorId,
    user: author,
    title: data.title.trim(),
    description: data.description.trim(),
    image_data: data.image_data,
    video_data: data.video_data,
    media_type: data.media_type || (data.video_data ? 'video' : 'image'),
    tagged_users: data.tagged_users || [],
    tags: data.tags || [],
    votes_up: 0,
    votes_down: 0,
    net_votes: 0,
    created_at: new Date().toISOString(),
  };

  posts.unshift(newPost);
  setItem(STORAGE_KEYS.POSTS, posts);

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

  // Direct Server Dispatch
  try {
    fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post: newPost }),
    }).catch(() => {});
  } catch {}

  // Send to Supabase Cloud with schema fallback
  await savePostToCloud(newPost);
  await syncWithServer();

  window.dispatchEvent(
    new CustomEvent('aether_post_broadcast', {
      detail: { post: newPost, authorId: data.authorId }
    })
  );

  window.dispatchEvent(new Event('aether_storage_sync'));
  if (syncChannel) syncChannel.postMessage('sync');
  return newPost;
};

export const deleteRealPost = async (postId: string, userId?: string): Promise<boolean> => {
  // 1. Mark as deleted in tombstone set so sync never restores it
  const deletedList = getItem<string[]>(STORAGE_KEYS.DELETED_POST_IDS, []);
  if (!deletedList.includes(postId)) {
    deletedList.push(postId);
    setItem(STORAGE_KEYS.DELETED_POST_IDS, deletedList);
  }

  // 2. Remove from local posts list
  const posts = getItem<Post[]>(STORAGE_KEYS.POSTS, []);
  const idx = posts.findIndex(p => p.id === postId && (p.user_id === userId || !userId));
  if (idx !== -1) {
    posts.splice(idx, 1);
    setItem(STORAGE_KEYS.POSTS, posts);
  }

  // 3. Remove votes and notifications
  const votes = getItem<VoteRecord[]>(STORAGE_KEYS.VOTES, []).filter(v => v.post_id !== postId);
  setItem(STORAGE_KEYS.VOTES, votes);

  const notifs = getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []).filter(n => n.post_id !== postId);
  setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);

  // 4. Recalculate author's total votes
  if (userId) {
    const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
    const authorIdx = users.findIndex(u => u.id === userId);
    if (authorIdx !== -1) {
      const authorPosts = posts.filter(p => p.user_id === userId);
      users[authorIdx].total_votes_received = authorPosts.reduce((acc, p) => acc + p.net_votes, 0);
      setItem(STORAGE_KEYS.REAL_USERS, users);
    }
  }

  // 5. Delete from Supabase Cloud DB directly + soft marker
  const supabase = getSupabaseClient();
  if (supabase) {
    // Soft mark post as deleted in description field so all devices filter it out even if SQL DELETE is blocked by RLS
    await supabase.from('posts').update({
      title: '[DELETED]',
      description: '[DELETED]',
    }).eq('id', postId).then(() => {}, () => {});

    await supabase.from('posts').delete().eq('id', postId).then(() => {}, (err) => console.warn('[Supabase Delete Post]', err));
    await supabase.from('votes').delete().eq('post_id', postId).then(() => {}, () => {});
    await supabase.from('notifications').delete().eq('post_id', postId).then(() => {}, () => {});
  }

  // 6. Delete from local server storage
  try {
    fetch(`/api/posts?id=${encodeURIComponent(postId)}`, {
      method: 'DELETE',
    }).catch(() => {});
  } catch {}

  await syncWithServer();
  window.dispatchEvent(new Event('aether_storage_sync'));
  if (syncChannel) syncChannel.postMessage('sync');
  return true;
};

export const updateRealPostText = async (
  postId: string, 
  userId: string, 
  description: string, 
  title?: string
): Promise<Post | null> => {
  const posts = getItem<Post[]>(STORAGE_KEYS.POSTS, []);
  const idx = posts.findIndex(p => p.id === postId && (p.user_id === userId || isUserAdmin(userId)));
  if (idx === -1) return null;

  const now = new Date().toISOString();
  posts[idx] = {
    ...posts[idx],
    description: description.trim(),
    title: title ? title.trim() : posts[idx].title,
    updated_at: now,
  };

  setItem(STORAGE_KEYS.POSTS, posts);
  await savePostToCloud(posts[idx]);
  await syncWithServer();
  window.dispatchEvent(new Event('aether_storage_sync'));
  if (syncChannel) syncChannel.postMessage('sync');
  return posts[idx];
};

export const togglePinHomePost = async (
  postId: string, 
  adminId: string
): Promise<{ success: boolean; isPinned: boolean }> => {
  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  const admin = users.find(u => u.id === adminId);
  if (!admin || !isUserAdmin(admin)) {
    return { success: false, isPinned: false };
  }

  const posts = getItem<Post[]>(STORAGE_KEYS.POSTS, []);
  const idx = posts.findIndex(p => p.id === postId);
  if (idx === -1) return { success: false, isPinned: false };

  const currentPin = Boolean(posts[idx].is_pinned_home);
  const newPinState = !currentPin;
  posts[idx] = {
    ...posts[idx],
    is_pinned_home: newPinState,
    updated_at: new Date().toISOString(),
  };

  setItem(STORAGE_KEYS.POSTS, posts);

  // Sync to local server
  try {
    fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post: posts[idx] }),
    }).catch(() => {});
  } catch {}

  // Sync to Supabase Cloud
  const supabase = getSupabaseClient();
  if (supabase) {
    supabase.from('posts').update({
      is_pinned_home: newPinState,
    }).eq('id', postId).then(() => {}, (err) => console.warn('[Supabase Pin Update]', err));
  }

  await broadcastRealtimeEvent('pin_post', {
    post_id: postId,
    is_pinned_home: newPinState,
    is_pinned_profile: posts[idx].is_pinned_profile,
  });

  window.dispatchEvent(new Event('aether_storage_sync'));
  if (syncChannel) syncChannel.postMessage('sync');

  return { success: true, isPinned: newPinState };
};

export const togglePinProfilePost = async (
  postId: string, 
  userId: string
): Promise<{ success: boolean; isPinned: boolean }> => {
  const posts = getItem<Post[]>(STORAGE_KEYS.POSTS, []);
  const idx = posts.findIndex(p => p.id === postId && p.user_id === userId);
  if (idx === -1) return { success: false, isPinned: false };

  const currentPin = Boolean(posts[idx].is_pinned_profile);
  const newPinState = !currentPin;
  posts[idx] = {
    ...posts[idx],
    is_pinned_profile: newPinState,
    updated_at: new Date().toISOString(),
  };

  setItem(STORAGE_KEYS.POSTS, posts);

  // Sync to local server
  try {
    fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post: posts[idx] }),
    }).catch(() => {});
  } catch {}

  // Sync to Supabase Cloud
  const supabase = getSupabaseClient();
  if (supabase) {
    supabase.from('posts').update({
      is_pinned_profile: newPinState,
    }).eq('id', postId).then(() => {}, (err) => console.warn('[Supabase Pin Profile Update]', err));
  }

  await broadcastRealtimeEvent('pin_post', {
    post_id: postId,
    is_pinned_home: posts[idx].is_pinned_home,
    is_pinned_profile: newPinState,
  });

  window.dispatchEvent(new Event('aether_storage_sync'));
  if (syncChannel) syncChannel.postMessage('sync');

  return { success: true, isPinned: newPinState };
};

/* ==========================================================================
   DUAL UPVOTE / DOWNVOTE ENGINE
   ========================================================================== */

export const getVotesList = (): VoteRecord[] => {
  return getItem<VoteRecord[]>(STORAGE_KEYS.VOTES, []);
};

export const votePostAction = async (
  postId: string,
  userId: string,
  voteType: 'up' | 'down'
): Promise<{
  userVote: 'up' | 'down' | null;
  netVotes: number;
  votesUp: number;
  votesDown: number;
}> => {
  const posts = getItem<Post[]>(STORAGE_KEYS.POSTS, []);
  const votes = getItem<VoteRecord[]>(STORAGE_KEYS.VOTES, []);
  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);

  const postIdx = posts.findIndex(p => p.id === postId);
  if (postIdx === -1) {
    throw new Error('Post not found');
  }

  const canonicalVoteId = `vote_${userId}_${postId}`;
  const existingVoteIdx = votes.findIndex(v => (v.user_id === userId && v.post_id === postId) || v.id === canonicalVoteId);

  let finalUserVote: 'up' | 'down' | null = null;

  if (existingVoteIdx !== -1) {
    const prevVote = votes[existingVoteIdx];
    if (prevVote.type === voteType) {
      // Toggle off
      votes.splice(existingVoteIdx, 1);
      finalUserVote = null;
    } else {
      // Change vote direction
      votes[existingVoteIdx] = {
        id: canonicalVoteId,
        user_id: userId,
        post_id: postId,
        type: voteType,
        created_at: new Date().toISOString(),
      };
      finalUserVote = voteType;
    }
  } else {
    // New vote
    votes.push({
      id: canonicalVoteId,
      user_id: userId,
      post_id: postId,
      type: voteType,
      created_at: new Date().toISOString(),
    });
    finalUserVote = voteType;

    if (posts[postIdx].user_id !== userId) {
      addNotification({
        user_id: posts[postIdx].user_id,
        actor_id: userId,
        post_id: postId,
        type: voteType === 'up' ? 'vote_up' : 'vote_down',
      });
    }
  }

  // Deterministically compute exact post vote counts from updated votes array
  const postVotes = votes.filter(v => v.post_id === postId);
  posts[postIdx].votes_up = postVotes.filter(v => v.type === 'up').length;
  posts[postIdx].votes_down = postVotes.filter(v => v.type === 'down').length;
  posts[postIdx].net_votes = posts[postIdx].votes_up - posts[postIdx].votes_down;

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

  // Local server sync
  if (finalUserVote === null) {
    fetch(`/api/votes?id=${encodeURIComponent(canonicalVoteId)}&post_id=${encodeURIComponent(postId)}&user_id=${encodeURIComponent(userId)}`, {
      method: 'DELETE'
    }).catch(() => {});
  } else {
    fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: canonicalVoteId,
        user_id: userId,
        post_id: postId,
        type: finalUserVote,
        created_at: new Date().toISOString(),
      })
    }).catch(() => {});
  }

  // Supabase Cloud DB sync
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase
      .from('posts')
      .update({
        votes_up: posts[postIdx].votes_up,
        votes_down: posts[postIdx].votes_down,
        net_votes: posts[postIdx].net_votes,
      })
      .eq('id', postId).then(() => {}, (err: any) => console.warn('[Aether Supabase] Post vote update error:', err));

    if (finalUserVote === null) {
      await supabase.from('votes').delete().eq('id', canonicalVoteId).then(() => {}, () => {});
      await supabase.from('votes').delete().match({ user_id: userId, post_id: postId }).then(() => {}, () => {});
    } else {
      await supabase.from('votes').upsert({
        id: canonicalVoteId,
        user_id: userId,
        post_id: postId,
        type: finalUserVote,
        created_at: new Date().toISOString(),
      }).then(() => {}, (err: any) => console.warn('[Aether Supabase] Vote record upsert error:', err));
    }

    await supabase
      .from('profiles')
      .update({ total_votes_received: totalVotesReceived })
      .eq('id', authorId)
      .then(() => {}, () => {});
  }

  await syncWithServer();
  window.dispatchEvent(new Event('aether_storage_sync'));
  if (syncChannel) syncChannel.postMessage('sync');

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

  const list = users.map(user => {
    const userPosts = posts.filter(p => p.user_id === user.id);
    const netVotes = userPosts.reduce((acc, p) => acc + p.net_votes, 0);
    return {
      ...user,
      total_votes_received: netVotes,
      posts_count: userPosts.length,
    };
  });

  list.sort((a, b) => b.total_votes_received - a.total_votes_received || b.posts_count - a.posts_count);

  return list.map((u, i) => ({
    ...u,
    rank: i + 1,
  }));
};

/* ==========================================================================
   NOTIFICATIONS ENGINE
   ========================================================================== */

/* ==========================================================================
   WEB & MOBILE PUSH NOTIFICATIONS ENGINE
   ========================================================================== */

export const getPushNotificationPermissionStatus = (): 'granted' | 'denied' | 'default' | 'unsupported' => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

export const requestPushNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      sendNativePushNotification(
        'Aether Notifications Active',
        'You will now receive direct real-time alerts on your device for posts, replies, upvotes, and messages.',
        '/logo.jpg'
      );
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[Push Notification Permission Error]', err);
    return false;
  }
};

export const sendNativePushNotification = (
  title: string,
  body: string,
  icon: string = '/logo.jpg',
  tag?: string
): void => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const options: NotificationOptions = {
      body,
      icon,
      badge: '/logo.jpg',
      tag: tag || `aether-${Date.now()}`,
      silent: false,
    };

    if ('vibrate' in navigator) {
      // @ts-ignore
      options.vibrate = [200, 100, 200];
    }

    const n = new Notification(title, options);
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch (err) {
    console.warn('[Native Push Notification Error]', err);
  }
};

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
    post_id: item.post_id || undefined,
    type: item.type,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  list.unshift(newNotif);
  setItem(STORAGE_KEYS.NOTIFICATIONS, list);

  // Send native mobile / browser push notification if recipient is active or logged in
  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  const actor = users.find(u => u.id === item.actor_id);
  const currentUser = getCurrentUser();

  if (currentUser && currentUser.id === item.user_id && item.actor_id !== currentUser.id) {
    const actorName = actor?.display_name || 'Someone';
    let notifTitle = 'Aether Feed';
    let notifBody = 'You have a new update';

    if (item.type === 'vote_up') {
      notifTitle = 'New Upvote! ▲';
      notifBody = `${actorName} upvoted your artwork.`;
    } else if (item.type === 'vote_down') {
      notifTitle = 'Vote Update ▼';
      notifBody = `${actorName} voted on your artwork.`;
    } else if (item.type === 'comment') {
      notifTitle = 'New Comment / Reply 💬';
      notifBody = `${actorName} commented on your post.`;
    } else if (item.type === 'follow') {
      notifTitle = 'New Follower 🌟';
      notifBody = `${actorName} started following your profile.`;
    } else if (item.type === 'new_post') {
      notifTitle = 'New Artwork Broadcast 🎨';
      notifBody = `${actorName} shared a new post.`;
    }

    sendNativePushNotification(notifTitle, notifBody, actor?.avatar_url || '/logo.jpg');
  }

  // Send to Supabase Cloud
  const supabase = getSupabaseClient();
  if (supabase) {
    supabase.from('notifications').upsert({
      id: newNotif.id,
      user_id: newNotif.user_id,
      actor_id: newNotif.actor_id,
      post_id: newNotif.post_id || null,
      type: newNotif.type,
      is_read: newNotif.is_read,
      created_at: newNotif.created_at,
    }).then(() => {}, (err) => console.warn('[Supabase Notification Upsert Error]', err));
  }

  window.dispatchEvent(new Event('aether_storage_sync'));
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

export const markNotificationAsRead = (notifId: string): void => {
  const notifs = getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  const idx = notifs.findIndex(n => n.id === notifId);
  if (idx !== -1) {
    notifs[idx].is_read = true;
    setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
  }
  const supabase = getSupabaseClient();
  if (supabase) {
    supabase.from('notifications').update({ is_read: true }).eq('id', notifId).then(() => {}, () => {});
  }
  window.dispatchEvent(new Event('aether_storage_sync'));
  if (syncChannel) syncChannel.postMessage('sync');
};

export const markAllNotificationsRead = (userId: string): void => {
  const notifs = getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  let changed = false;
  notifs.forEach(n => {
    if (n.user_id === userId && !n.is_read) {
      n.is_read = true;
      changed = true;
    }
  });
  if (changed) {
    setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
  }
  const supabase = getSupabaseClient();
  if (supabase) {
    supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).then(() => {}, () => {});
  }
  window.dispatchEvent(new Event('aether_storage_sync'));
  if (syncChannel) syncChannel.postMessage('sync');
};

export const clearReadNotifications = (userId: string): void => {
  const notifs = getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  const clearedIds: string[] = [];
  const remaining = notifs.filter(n => {
    if (n.user_id === userId && n.is_read) {
      clearedIds.push(n.id);
      return false;
    }
    return true;
  });

  // Persist cleared IDs so Supabase background sync never restores them
  const deletedList = getItem<string[]>(STORAGE_KEYS.DELETED_NOTIFICATION_IDS, []);
  clearedIds.forEach(id => {
    if (!deletedList.includes(id)) deletedList.push(id);
  });
  setItem(STORAGE_KEYS.DELETED_NOTIFICATION_IDS, deletedList);
  setItem(STORAGE_KEYS.NOTIFICATIONS, remaining);

  const supabase = getSupabaseClient();
  if (supabase && clearedIds.length > 0) {
    supabase.from('notifications').delete().in('id', clearedIds).then(() => {}, () => {});
  }

  window.dispatchEvent(new Event('aether_storage_sync'));
  if (syncChannel) syncChannel.postMessage('sync');
};

export const deleteNotification = (notifId: string): void => {
  const deletedList = getItem<string[]>(STORAGE_KEYS.DELETED_NOTIFICATION_IDS, []);
  if (!deletedList.includes(notifId)) {
    deletedList.push(notifId);
    setItem(STORAGE_KEYS.DELETED_NOTIFICATION_IDS, deletedList);
  }

  const notifs = getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  const remaining = notifs.filter(n => n.id !== notifId);
  setItem(STORAGE_KEYS.NOTIFICATIONS, remaining);

  const supabase = getSupabaseClient();
  if (supabase) {
    supabase.from('notifications').delete().eq('id', notifId).then(() => {}, () => {});
  }

  window.dispatchEvent(new Event('aether_storage_sync'));
  if (syncChannel) syncChannel.postMessage('sync');
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

/* ==========================================================================
   ADMIN CONSOLE & SCAMMER / BOT MODERATION ENGINE
   ========================================================================== */

export const ROOT_ADMIN_EMAIL = 'promanas018@gmail.com';

export const getAdminEmails = (): string[] => {
  const saved = getItem<string[]>(STORAGE_KEYS.ADMIN_EMAILS, []);
  const set = new Set<string>(saved.map(e => e.toLowerCase().trim()));
  set.add(ROOT_ADMIN_EMAIL.toLowerCase());
  return Array.from(set);
};

export const isUserAdmin = (userOrEmail?: Profile | string | null): boolean => {
  if (!userOrEmail) return false;

  if (typeof userOrEmail === 'object') {
    if (userOrEmail.is_admin === true) return true;
    const email = userOrEmail.email;
    if (email && email.toLowerCase().trim() === ROOT_ADMIN_EMAIL.toLowerCase()) return true;
    if (email && getAdminEmails().includes(email.toLowerCase().trim())) return true;
    return false;
  }

  const cleanEmail = userOrEmail.toLowerCase().trim();
  if (cleanEmail === ROOT_ADMIN_EMAIL.toLowerCase()) return true;
  if (getAdminEmails().includes(cleanEmail)) return true;

  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  const found = users.find(u => (u.email || '').toLowerCase().trim() === cleanEmail);
  return Boolean(found && found.is_admin);
};

export const addAdminEmail = async (newEmail: string, actorEmail?: string): Promise<boolean> => {
  if (actorEmail && !isUserAdmin(actorEmail)) return false;
  const clean = newEmail.toLowerCase().trim();
  if (!clean || !clean.includes('@')) return false;

  const current = getAdminEmails();
  if (!current.includes(clean)) {
    current.push(clean);
    setItem(STORAGE_KEYS.ADMIN_EMAILS, current);
  }

  // Update target user's is_admin flag in REAL_USERS and push to Supabase Cloud DB
  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  const idx = users.findIndex(u => (u.email || '').toLowerCase().trim() === clean);
  if (idx !== -1) {
    users[idx] = {
      ...users[idx],
      is_admin: true,
      updated_at: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.REAL_USERS, users);
    await saveProfileToCloud(users[idx]);
  }

  await syncWithServer();
  window.dispatchEvent(new Event('aether_storage_sync'));
  if (syncChannel) syncChannel.postMessage('sync');
  return true;
};

export const removeAdminEmail = async (targetEmail: string, actorEmail?: string): Promise<boolean> => {
  if (actorEmail && !isUserAdmin(actorEmail)) return false;
  const clean = targetEmail.toLowerCase().trim();
  if (clean === ROOT_ADMIN_EMAIL.toLowerCase()) return false;

  const current = getAdminEmails().filter(e => e !== clean);
  setItem(STORAGE_KEYS.ADMIN_EMAILS, current);

  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  const idx = users.findIndex(u => (u.email || '').toLowerCase().trim() === clean);
  if (idx !== -1) {
    users[idx] = {
      ...users[idx],
      is_admin: false,
      updated_at: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.REAL_USERS, users);
    await saveProfileToCloud(users[idx]);
  }

  await syncWithServer();
  window.dispatchEvent(new Event('aether_storage_sync'));
  if (syncChannel) syncChannel.postMessage('sync');
  return true;
};

/**
 * Ban / Wipe Scammer or Bot Account Completely
 * Purges profile, all their posts, votes, and notifications platform-wide.
 */
export const adminBanUser = (targetUserId: string, actorEmail?: string): { success: boolean; message: string } => {
  if (actorEmail && !isUserAdmin(actorEmail)) {
    return { success: false, message: 'Unauthorized: Admin privileges required.' };
  }

  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  const targetUser = users.find(u => u.id === targetUserId);
  if (!targetUser) {
    return { success: false, message: 'User not found.' };
  }

  if (targetUser.email.toLowerCase().trim() === ROOT_ADMIN_EMAIL.toLowerCase()) {
    return { success: false, message: 'Cannot ban the Root Super Admin.' };
  }

  // 1. Remove from local real users
  const filteredUsers = users.filter(u => u.id !== targetUserId);
  setItem(STORAGE_KEYS.REAL_USERS, filteredUsers);

  // 2. Remove from saved accounts
  const savedAccounts = getItem<Profile[]>(STORAGE_KEYS.SAVED_ACCOUNTS, []).filter(u => u.id !== targetUserId);
  setItem(STORAGE_KEYS.SAVED_ACCOUNTS, savedAccounts);

  // 3. Find and purge all posts by this user
  const posts = getItem<Post[]>(STORAGE_KEYS.POSTS, []);
  const userPosts = posts.filter(p => p.user_id === targetUserId);
  const userPostIds = new Set(userPosts.map(p => p.id));

  const remainingPosts = posts.filter(p => p.user_id !== targetUserId);
  setItem(STORAGE_KEYS.POSTS, remainingPosts);

  // 4. Mark all their posts as deleted
  const deletedIds = getItem<string[]>(STORAGE_KEYS.DELETED_POST_IDS, []);
  const updatedDeletedIds = Array.from(new Set([...deletedIds, ...Array.from(userPostIds)]));
  setItem(STORAGE_KEYS.DELETED_POST_IDS, updatedDeletedIds);

  // 5. Purge all votes by or on this user's posts
  const votes = getItem<VoteRecord[]>(STORAGE_KEYS.VOTES, []).filter(
    v => v.user_id !== targetUserId && !userPostIds.has(v.post_id)
  );
  setItem(STORAGE_KEYS.VOTES, votes);

  // 6. Purge notifications
  const notifs = getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []).filter(
    n => n.user_id !== targetUserId && n.actor_id !== targetUserId
  );
  setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);

  // 7. Delete from Supabase Cloud DB
  const supabase = getSupabaseClient();
  if (supabase) {
    supabase.from('profiles').delete().eq('id', targetUserId).then(() => {}, () => {});
    supabase.from('posts').delete().eq('user_id', targetUserId).then(() => {}, () => {});
    supabase.from('votes').delete().eq('user_id', targetUserId).then(() => {}, () => {});
    supabase.from('notifications').delete().eq('user_id', targetUserId).then(() => {}, () => {});
    supabase.from('notifications').delete().eq('actor_id', targetUserId).then(() => {}, () => {});
  }

  // 8. Delete from local server API
  userPostIds.forEach(pid => {
    fetch(`/api/posts?id=${encodeURIComponent(pid)}`, { method: 'DELETE' }).catch(() => {});
  });

  syncWithServer();
  return { success: true, message: `User @${targetUser.username} has been permanently banned and wiped.` };
};

/**
 * Toggle Verified Checkmark badge for any user
 */
export const adminToggleVerifyUser = async (targetUserId: string, actorEmail?: string): Promise<Profile | null> => {
  if (actorEmail && !isUserAdmin(actorEmail)) return null;

  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  const idx = users.findIndex(u => u.id === targetUserId);
  if (idx === -1) return null;

  const updatedUser: Profile = {
    ...users[idx],
    is_verified: !users[idx].is_verified,
    updated_at: new Date().toISOString(),
  };

  users[idx] = updatedUser;
  setItem(STORAGE_KEYS.REAL_USERS, users);
  await saveProfileToCloud(updatedUser);
  await syncWithServer();
  window.dispatchEvent(new Event('aether_storage_sync'));
  if (syncChannel) syncChannel.postMessage('sync');
  return updatedUser;
};

/**
 * Toggle Golden Checkmark (VIP Badge) for any user
 * Note: Granting Golden Checkmark does NOT give Admin privileges!
 */
export const adminToggleGoldenVerifyUser = async (targetUserId: string, actorEmail?: string): Promise<Profile | null> => {
  if (actorEmail && !isUserAdmin(actorEmail)) return null;

  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  const idx = users.findIndex(u => u.id === targetUserId);
  if (idx === -1) return null;

  const nextGolden = !users[idx].is_golden_verified;
  const updatedUser: Profile = {
    ...users[idx],
    is_golden_verified: nextGolden,
    updated_at: new Date().toISOString(),
  };

  users[idx] = updatedUser;
  setItem(STORAGE_KEYS.REAL_USERS, users);
  await saveProfileToCloud(updatedUser);
  await syncWithServer();
  window.dispatchEvent(new Event('aether_storage_sync'));
  if (syncChannel) syncChannel.postMessage('sync');
  return updatedUser;
};

/**
 * Set Posting Timeout for a user (24h, 7d, 30d, Indefinite, or null to remove)
 */
export const adminSetPostingTimeout = async (
  targetUserId: string,
  timeoutUntil: string | null,
  actorEmail?: string
): Promise<Profile | null> => {
  if (actorEmail && !isUserAdmin(actorEmail)) return null;

  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  const idx = users.findIndex(u => u.id === targetUserId);
  if (idx === -1) return null;

  const updatedUser: Profile = {
    ...users[idx],
    posting_timeout_until: timeoutUntil || undefined,
    updated_at: new Date().toISOString(),
  };

  users[idx] = updatedUser;
  setItem(STORAGE_KEYS.REAL_USERS, users);
  await saveProfileToCloud(updatedUser);
  await syncWithServer();
  window.dispatchEvent(new Event('aether_storage_sync'));
  if (syncChannel) syncChannel.postMessage('sync');
  return updatedUser;
};

/**
 * Unban a previously banned user
 */
export const adminUnbanUser = (targetUserId: string, actorEmail?: string): { success: boolean; message: string } => {
  if (actorEmail && !isUserAdmin(actorEmail)) {
    return { success: false, message: 'Unauthorized: Admin privileges required.' };
  }

  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  const idx = users.findIndex(u => u.id === targetUserId);
  if (idx === -1) {
    return { success: false, message: 'User not found.' };
  }

  users[idx] = {
    ...users[idx],
    is_banned: false,
    updated_at: new Date().toISOString(),
  };

  setItem(STORAGE_KEYS.REAL_USERS, users);

  const bannedIds = getItem<string[]>(STORAGE_KEYS.BANNED_USER_IDS, []).filter(id => id !== targetUserId);
  setItem(STORAGE_KEYS.BANNED_USER_IDS, bannedIds);

  const supabase = getSupabaseClient();
  if (supabase) {
    supabase.from('profiles').update({ is_banned: false }).eq('id', targetUserId).then(() => {}, () => {});
  }

  syncWithServer();
  return { success: true, message: `User @${users[idx].username} has been unbanned successfully.` };
};

/**
 * Check whether a user is restricted from creating posts or comments
 */
export const isUserPostingRestricted = (user?: Profile | null): { restricted: boolean; reason?: string } => {
  if (!user) return { restricted: true, reason: 'You must be logged in to post.' };

  if (user.is_banned) {
    return { restricted: true, reason: 'Your account is currently banned by Admin.' };
  }

  if (user.posting_timeout_until) {
    if (user.posting_timeout_until === 'indefinite') {
      return { restricted: true, reason: 'Your posting privileges have been indefinitely restricted by Admin.' };
    }
    const timeoutDate = new Date(user.posting_timeout_until).getTime();
    if (!isNaN(timeoutDate) && timeoutDate > Date.now()) {
      const formattedDate = new Date(user.posting_timeout_until).toLocaleString();
      return {
        restricted: true,
        reason: `Your posting privileges are timed out until ${formattedDate}.`,
      };
    }
  }

  return { restricted: false };
};

/* ==========================================================================
   VIP GOLDEN CHAT ENGINE
   ========================================================================== */

export const getVipChatMessages = (): ChatMessage[] => {
  const messages = getItem<ChatMessage[]>(STORAGE_KEYS.VIP_CHAT, []);
  const deletedForMe = new Set(getItem<string[]>(STORAGE_KEYS.DELETED_CHAT_MSG_IDS, []));
  const pinnedId = getItem<string | null>(STORAGE_KEYS.PINNED_VIP_CHAT_MSG_ID, null);
  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);

  return messages
    .filter(m => !deletedForMe.has(m.id) && !m.is_deleted)
    .map(m => ({
      ...m,
      is_pinned: m.id === pinnedId,
      user: users.find(u => u.id === m.user_id) || m.user || {
        id: m.user_id,
        email: '',
        first_name: 'Golden',
        last_name: 'Member',
        display_name: 'Golden Member',
        username: 'golden_member',
        avatar_url: DEFAULT_DLICOM_AVATAR,
        bio: '',
        dlicom_address: '',
        is_verified: true,
        is_golden_verified: true,
        followers: [],
        following: [],
        total_votes_received: 0,
        created_at: new Date().toISOString(),
      },
    }))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
};

export const getPinnedVipChatMessage = (): ChatMessage | null => {
  const pinnedId = getItem<string | null>(STORAGE_KEYS.PINNED_VIP_CHAT_MSG_ID, null);
  if (!pinnedId) return null;
  const messages = getVipChatMessages();
  return messages.find(m => m.id === pinnedId) || null;
};

export const togglePinVipChatMessage = (messageId: string): boolean => {
  const currentPinnedId = getItem<string | null>(STORAGE_KEYS.PINNED_VIP_CHAT_MSG_ID, null);
  const nextPinnedId = currentPinnedId === messageId ? null : messageId;
  setItem(STORAGE_KEYS.PINNED_VIP_CHAT_MSG_ID, nextPinnedId);
  broadcastRealtimeEvent('pin_vip_message', { pinned_id: nextPinnedId });
  window.dispatchEvent(new Event('aether_storage_sync'));
  if (syncChannel) syncChannel.postMessage('sync');
  return nextPinnedId !== null;
};

export const sendVipChatMessage = async (data: {
  user_id: string;
  text: string;
  image_data?: string;
  code_snippet?: string;
}): Promise<ChatMessage> => {
  const messages = getItem<ChatMessage[]>(STORAGE_KEYS.VIP_CHAT, []);
  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  const user = users.find(u => u.id === data.user_id);

  const newMsg: ChatMessage = {
    id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    user_id: data.user_id,
    text: data.text.trim(),
    image_data: data.image_data || undefined,
    code_snippet: data.code_snippet || undefined,
    created_at: new Date().toISOString(),
    is_read: true,
    user,
  };

  messages.push(newMsg);
  if (messages.length > 300) {
    messages.shift();
  }

  setItem(STORAGE_KEYS.VIP_CHAT, messages);

  // 1. Instant Realtime Broadcast to all connected clients
  broadcastRealtimeEvent('new_vip_message', newMsg);

  // 2. Persist to Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    supabase.from('vip_messages').upsert({
      id: newMsg.id,
      user_id: newMsg.user_id,
      text: newMsg.text,
      image_data: newMsg.image_data || null,
      code_snippet: newMsg.code_snippet || null,
      created_at: newMsg.created_at,
    }).then(() => {}, (err) => console.warn('[Supabase VIP Chat notice]', err));
  }

  window.dispatchEvent(new Event('aether_storage_sync'));
  if (syncChannel) syncChannel.postMessage('sync');
  return newMsg;
};

export const deleteVipChatMessage = async (
  messageId: string, 
  actorId: string,
  mode: 'everyone' | 'me' = 'everyone'
): Promise<boolean> => {
  // Always mark deleted locally so it never resurfaces in this session
  const deletedChatIds = getItem<string[]>(STORAGE_KEYS.DELETED_CHAT_MSG_IDS, []);
  if (!deletedChatIds.includes(messageId)) {
    deletedChatIds.push(messageId);
    setItem(STORAGE_KEYS.DELETED_CHAT_MSG_IDS, deletedChatIds);
  }

  // Remove immediately from local VIP_CHAT cache
  const messages = getItem<ChatMessage[]>(STORAGE_KEYS.VIP_CHAT, []);
  const updated = messages.filter(m => m.id !== messageId);
  setItem(STORAGE_KEYS.VIP_CHAT, updated);

  if (mode === 'everyone') {
    // Instant broadcast deletion across all open tabs and devices
    broadcastRealtimeEvent('delete_message', { message_id: messageId, type: 'vip' });

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('vip_messages').delete().eq('id', messageId).then(() => {}, () => {});
    }
  }

  window.dispatchEvent(new Event('aether_storage_sync'));
  if (syncChannel) syncChannel.postMessage('sync');
  return true;
};

/* ==========================================================================
   POST COMMENTS ENGINE (REAL-TIME WORKING)
   ========================================================================== */

export const getPostComments = (postId: string): PostComment[] => {
  const comments = getItem<PostComment[]>(STORAGE_KEYS.POST_COMMENTS, []);
  const users = getRealUsers();
  const userMap = new Map<string, Profile>();
  users.forEach(u => userMap.set(u.id, u));

  return comments
    .filter(c => c.post_id === postId)
    .map(c => ({
      ...c,
      user: userMap.get(c.user_id) || c.user,
      reply_to_user: c.reply_to_user_id ? userMap.get(c.reply_to_user_id) : undefined,
    }))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
};

export const addPostComment = async (
  postId: string,
  userId: string,
  text: string,
  parentCommentId?: string | null,
  replyToUserId?: string | null,
  replyToUsername?: string
): Promise<PostComment | null> => {
  const cleanText = text.trim();
  if (!cleanText) return null;

  const users = getRealUsers();
  const author = users.find(u => u.id === userId);
  if (!author) return null;

  const comments = getItem<PostComment[]>(STORAGE_KEYS.POST_COMMENTS, []);
  const commentId = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const replyUser = replyToUserId ? users.find(u => u.id === replyToUserId) : undefined;

  const newComment: PostComment = {
    id: commentId,
    post_id: postId,
    user_id: userId,
    text: cleanText,
    created_at: new Date().toISOString(),
    user: author,
    parent_comment_id: parentCommentId || null,
    reply_to_user_id: replyToUserId || null,
    reply_to_username: replyToUsername || (replyUser ? replyUser.username : undefined),
    reply_to_user: replyUser,
  };

  comments.push(newComment);
  setItem(STORAGE_KEYS.POST_COMMENTS, comments);

  // Update post's comments_count
  const posts = getItem<Post[]>(STORAGE_KEYS.POSTS, []);
  const pIdx = posts.findIndex(p => p.id === postId);
  if (pIdx !== -1) {
    posts[pIdx].comments_count = (posts[pIdx].comments_count || 0) + 1;
    setItem(STORAGE_KEYS.POSTS, posts);

    // Notify post author if commenter is not post author
    if (posts[pIdx].user_id !== userId) {
      addNotification({
        user_id: posts[pIdx].user_id,
        actor_id: userId,
        post_id: postId,
        type: 'comment',
      });
    }

    // If this is a reply to another comment author and they are different from post author and current user, notify them too!
    if (replyToUserId && replyToUserId !== userId && replyToUserId !== posts[pIdx].user_id) {
      addNotification({
        user_id: replyToUserId,
        actor_id: userId,
        post_id: postId,
        type: 'comment',
      });
    }
  }

  // 1. Instant Realtime Broadcast to all connected clients & tabs
  broadcastRealtimeEvent('new_comment', newComment);

  // 2. Persist to Supabase Cloud DB with multi-level schema fallback
  await saveCommentToCloud(newComment);

  await syncWithServer();
  window.dispatchEvent(new Event('aether_storage_sync'));
  if (syncChannel) syncChannel.postMessage('sync');
  return newComment;
};

export const deletePostComment = async (
  commentId: string,
  actorUserId: string
): Promise<boolean> => {
  const comments = getItem<PostComment[]>(STORAGE_KEYS.POST_COMMENTS, []);
  const cIdx = comments.findIndex(c => c.id === commentId);
  if (cIdx === -1) return false;

  const targetComment = comments[cIdx];
  const users = getRealUsers();
  const actor = users.find(u => u.id === actorUserId);
  const isAdmin = isUserAdmin(actor);

  if (!isAdmin && targetComment.user_id !== actorUserId) {
    return false;
  }

  comments.splice(cIdx, 1);
  setItem(STORAGE_KEYS.POST_COMMENTS, comments);

  // Decrement post comments_count
  const posts = getItem<Post[]>(STORAGE_KEYS.POSTS, []);
  const pIdx = posts.findIndex(p => p.id === targetComment.post_id);
  if (pIdx !== -1) {
    posts[pIdx].comments_count = Math.max(0, (posts[pIdx].comments_count || 1) - 1);
    setItem(STORAGE_KEYS.POSTS, posts);
  }

  // 1. Instant Realtime Broadcast
  broadcastRealtimeEvent('delete_comment', { comment_id: commentId, post_id: targetComment.post_id });

  // 2. Supabase delete
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.from('comments').delete().eq('id', commentId);
  }

  await syncWithServer();
  window.dispatchEvent(new Event('aether_storage_sync'));
  if (syncChannel) syncChannel.postMessage('sync');
  return true;
};

/* ==========================================================================
   DIRECT MESSAGES (1-ON-1 DM) ENGINE
   ========================================================================== */

export const getDirectMessages = (userA: string, userB: string): DirectMessage[] => {
  const dms = getItem<DirectMessage[]>(STORAGE_KEYS.DIRECT_MESSAGES, []);
  const deletedForMe = new Set(getItem<string[]>(STORAGE_KEYS.DELETED_DM_MSG_IDS, []));
  const pairKey = [userA, userB].sort().join('_');
  const pinnedMap = getItem<Record<string, string>>(STORAGE_KEYS.PINNED_DM_MSG_IDS, {});
  const pinnedId = pinnedMap[pairKey];
  const users = getRealUsers();
  const userMap = new Map<string, Profile>();
  users.forEach(u => userMap.set(u.id, u));

  return dms
    .filter(m => 
      !deletedForMe.has(m.id) &&
      !m.is_deleted &&
      ((m.sender_id === userA && m.receiver_id === userB) ||
       (m.sender_id === userB && m.receiver_id === userA))
    )
    .map(m => ({
      ...m,
      is_pinned: m.id === pinnedId,
      sender: userMap.get(m.sender_id),
      receiver: userMap.get(m.receiver_id),
    }))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
};

export const getPinnedDirectMessage = (userA: string, userB: string): DirectMessage | null => {
  const pairKey = [userA, userB].sort().join('_');
  const pinnedMap = getItem<Record<string, string>>(STORAGE_KEYS.PINNED_DM_MSG_IDS, {});
  const pinnedId = pinnedMap[pairKey];
  if (!pinnedId) return null;
  const dms = getDirectMessages(userA, userB);
  return dms.find(m => m.id === pinnedId) || null;
};

export const togglePinDirectMessage = (messageId: string, userA: string, userB: string): boolean => {
  const pairKey = [userA, userB].sort().join('_');
  const pinnedMap = getItem<Record<string, string>>(STORAGE_KEYS.PINNED_DM_MSG_IDS, {});
  let isNowPinned = false;
  if (pinnedMap[pairKey] === messageId) {
    delete pinnedMap[pairKey];
  } else {
    pinnedMap[pairKey] = messageId;
    isNowPinned = true;
  }
  setItem(STORAGE_KEYS.PINNED_DM_MSG_IDS, pinnedMap);
  broadcastRealtimeEvent('pin_dm_message', { pairKey, pinned_id: pinnedMap[pairKey] || null });
  window.dispatchEvent(new Event('aether_storage_sync'));
  if (syncChannel) syncChannel.postMessage('sync');
  return isNowPinned;
};

/**
 * Update active presence heartbeat for a user
 */
export const updateUserPresence = (userId: string): void => {
  if (!userId) return;
  const presenceMap = getItem<Record<string, number>>(STORAGE_KEYS.USER_PRESENCE, {});
  presenceMap[userId] = Date.now();
  setItem(STORAGE_KEYS.USER_PRESENCE, presenceMap);
  broadcastRealtimeEvent('presence_heartbeat', { user_id: userId, timestamp: Date.now() });
};

/**
 * Check whether a user is online (active within last 3 minutes or current session user)
 */
export const isUserOnline = (userId: string, currentUserId?: string): boolean => {
  if (!userId) return false;
  if (currentUserId && userId === currentUserId) return true;
  const presenceMap = getItem<Record<string, number>>(STORAGE_KEYS.USER_PRESENCE, {});
  const lastActive = presenceMap[userId];
  if (!lastActive) {
    return false;
  }
  // Online threshold: 3 minutes (180,000 ms)
  return Date.now() - lastActive < 180000;
};

export const getDmConversations = (currentUserId: string): Array<{
  contact: Profile;
  lastMessage: DirectMessage;
  unreadCount: number;
}> => {
  const dms = getItem<DirectMessage[]>(STORAGE_KEYS.DIRECT_MESSAGES, []);
  const deletedForMe = new Set(getItem<string[]>(STORAGE_KEYS.DELETED_DM_MSG_IDS, []));
  const users = getRealUsers();
  const userMap = new Map<string, Profile>();
  users.forEach(u => userMap.set(u.id, u));

  const relevant = dms.filter(m => 
    !deletedForMe.has(m.id) &&
    !m.is_deleted &&
    (m.sender_id === currentUserId || m.receiver_id === currentUserId)
  );

  const contactMap = new Map<string, { lastMsg: DirectMessage; unread: number }>();

  relevant.forEach(m => {
    const otherId = m.sender_id === currentUserId ? m.receiver_id : m.sender_id;
    const existing = contactMap.get(otherId);
    const isUnread = m.receiver_id === currentUserId && !m.is_read;

    if (!existing || new Date(m.created_at).getTime() > new Date(existing.lastMsg.created_at).getTime()) {
      contactMap.set(otherId, {
        lastMsg: m,
        unread: (existing?.unread || 0) + (isUnread ? 1 : 0),
      });
    } else if (isUnread) {
      existing.unread += 1;
    }
  });

  const list: Array<{ contact: Profile; lastMessage: DirectMessage; unreadCount: number }> = [];
  contactMap.forEach((val, contactId) => {
    const contact = userMap.get(contactId);
    if (contact && contact.id !== currentUserId) {
      list.push({
        contact,
        lastMessage: val.lastMsg,
        unreadCount: val.unread,
      });
    }
  });

  return list.sort((a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime());
};

export const sendDirectMessage = async (
  senderId: string,
  receiverId: string,
  text: string
): Promise<DirectMessage | null> => {
  const clean = text.trim();
  if (!clean || senderId === receiverId) return null;

  const users = getRealUsers();
  const sender = users.find(u => u.id === senderId);
  const receiver = users.find(u => u.id === receiverId);
  if (!sender || !receiver) return null;

  const dms = getItem<DirectMessage[]>(STORAGE_KEYS.DIRECT_MESSAGES, []);
  const msgId = `dm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newDm: DirectMessage = {
    id: msgId,
    sender_id: senderId,
    receiver_id: receiverId,
    text: clean,
    created_at: new Date().toISOString(),
    is_read: false,
    sender,
    receiver,
  };

  dms.push(newDm);
  setItem(STORAGE_KEYS.DIRECT_MESSAGES, dms);

  // 1. Instant Realtime Broadcast to receiver
  broadcastRealtimeEvent('new_direct_message', newDm);

  // 2. Sync to Supabase Cloud DB
  const supabase = getSupabaseClient();
  if (supabase) {
    supabase.from('direct_messages').upsert({
      id: newDm.id,
      sender_id: newDm.sender_id,
      receiver_id: newDm.receiver_id,
      text: newDm.text,
      created_at: newDm.created_at,
      is_read: false,
    }, { onConflict: 'id' }).then(() => {}, (err) => {
      console.warn('[Aether Supabase] DM save notice:', err);
    });
  }

  window.dispatchEvent(new Event('aether_storage_sync'));
  if (syncChannel) syncChannel.postMessage('sync');
  return newDm;
};

export const markDirectMessagesAsRead = async (
  currentUserId: string,
  contactUserId: string
): Promise<void> => {
  const dms = getItem<DirectMessage[]>(STORAGE_KEYS.DIRECT_MESSAGES, []);
  let hasChanges = false;

  dms.forEach(m => {
    if (m.receiver_id === currentUserId && m.sender_id === contactUserId && !m.is_read) {
      m.is_read = true;
      hasChanges = true;
    }
  });

  if (hasChanges) {
    setItem(STORAGE_KEYS.DIRECT_MESSAGES, dms);
    window.dispatchEvent(new Event('aether_storage_sync'));
    if (syncChannel) syncChannel.postMessage('sync');

    // 1. Broadcast to sender that messages have been read (triggers double blue ticks)
    broadcastRealtimeEvent('read_direct_message', {
      viewerId: currentUserId,
      senderId: contactUserId,
    });

    // 2. Persist to Supabase
    const supabase = getSupabaseClient();
    if (supabase) {
      supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('receiver_id', currentUserId)
        .eq('sender_id', contactUserId)
        .then(() => {}, () => {});
    }
  }
};

export const deleteDirectMessage = async (
  messageId: string,
  mode: 'everyone' | 'me',
  userId: string
): Promise<boolean> => {
  // Always mark deleted locally so it never resurfaces in this session
  const deletedDmIds = getItem<string[]>(STORAGE_KEYS.DELETED_DM_MSG_IDS, []);
  if (!deletedDmIds.includes(messageId)) {
    deletedDmIds.push(messageId);
    setItem(STORAGE_KEYS.DELETED_DM_MSG_IDS, deletedDmIds);
  }

  // Remove immediately from local DIRECT_MESSAGES cache
  const dms = getItem<DirectMessage[]>(STORAGE_KEYS.DIRECT_MESSAGES, []);
  const updated = dms.filter(m => m.id !== messageId);
  setItem(STORAGE_KEYS.DIRECT_MESSAGES, updated);

  if (mode === 'everyone') {
    // Broadcast deletion across all connected tabs & devices
    broadcastRealtimeEvent('delete_message', { message_id: messageId, type: 'dm' });

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('direct_messages').delete().eq('id', messageId).then(() => {}, () => {});
    }
  }

  window.dispatchEvent(new Event('aether_storage_sync'));
  if (syncChannel) syncChannel.postMessage('sync');
  return true;
};
