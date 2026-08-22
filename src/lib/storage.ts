import type { Profile, Post, VoteRecord, NotificationItem, ThemeMode } from '../types';
import { getSupabaseClient } from './supabaseClient';

const STORAGE_KEYS = {
  REAL_USERS: 'aether_real_users_v4',
  POSTS: 'aether_posts_v4',
  VOTES: 'aether_votes_v4',
  NOTIFICATIONS: 'aether_notifications_v4',
  CURRENT_USER_ID: 'aether_current_user_id_v4',
  THEME_MODE: 'aether_theme_mode_v4',
  PENDING_OTPS: 'aether_pending_otps_v4',
  INITIALIZED: 'aether_v4_initialized',
  SAVED_ACCOUNTS: 'aether_saved_accounts_v4',
  DELETED_POST_IDS: 'aether_deleted_post_ids_v4',
  ADMIN_EMAILS: 'aether_admin_emails_v4',
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

export const DLICOM_DEFAULT_AVATARS = [
  '/avatars/dlicom_default_1.jpg',
  '/avatars/dlicom_default_2.jpg',
  '/avatars/dlicom_default_3.jpg',
];

export const DEFAULT_DLICOM_AVATAR = '/avatars/dlicom_default_1.jpg';

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
    bio: p.bio || '',
    dlicom_address: p.dlicom_address || '',
    location: p.location || '',
    website: p.website || '',
    is_verified: p.is_verified ?? true,
    followers: parseArray(p.followers),
    following: parseArray(p.following),
    total_votes_received: p.total_votes_received || 0,
    password_hash: p.password_hash || '',
    created_at: p.created_at || new Date().toISOString(),
  };
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
    created_at: p.created_at || new Date().toISOString(),
  };
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
              setItem(STORAGE_KEYS.REAL_USERS, Array.from(mergedUserMap.values()));
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
          // A. Push ONLY Current User's Profile (Never bulk-push other users to prevent stale overwrites!)
          if (currentUser) {
            await supabase.from('profiles').upsert(sanitizeProfileForSupabase(currentUser));
          }

          // B. Pull ALL live profiles from Supabase
          const { data: supaProfiles, error: profError } = await supabase.from('profiles').select('*');
          if (!profError && supaProfiles && supaProfiles.length > 0) {
            const cleanSupaUsers = supaProfiles.filter((u: any) => !FAKE_MOCK_IDS.includes(u.id));
            const currentLocalUsers = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
            const localUserMap = new Map<string, Profile>();
            currentLocalUsers.forEach(u => localUserMap.set(u.id, u));

            const mergedUserMap = new Map<string, Profile>();

            cleanSupaUsers.forEach((su: any) => {
              const suProfile: Profile = {
                ...su,
                followers: Array.isArray(su.followers) ? su.followers : typeof su.followers === 'string' ? JSON.parse(su.followers || '[]') : [],
                following: Array.isArray(su.following) ? su.following : typeof su.following === 'string' ? JSON.parse(su.following || '[]') : [],
              };

              const localU = localUserMap.get(suProfile.id);
              if (localU) {
                // If this is currentUser, preserve local following/followers
                if (currentUser && suProfile.id === currentUser.id) {
                  mergedUserMap.set(suProfile.id, {
                    ...suProfile,
                    ...localU,
                    following: Array.isArray(localU.following) ? localU.following : suProfile.following,
                    followers: Array.isArray(localU.followers) ? localU.followers : suProfile.followers,
                  });
                } else {
                  // For other users, preserve local follower relationship if we just followed them
                  const localFollowers = Array.isArray(localU.followers) ? localU.followers : [];
                  const supaFollowers = Array.isArray(suProfile.followers) ? suProfile.followers : [];
                  const combinedFollowers = Array.from(new Set([...supaFollowers, ...localFollowers]));

                  mergedUserMap.set(suProfile.id, {
                    ...suProfile,
                    followers: combinedFollowers,
                  });
                }
              } else {
                mergedUserMap.set(suProfile.id, suProfile);
              }
            });

            // Preserve any local users not yet in Supabase
            currentLocalUsers.forEach(lu => {
              if (!mergedUserMap.has(lu.id)) {
                mergedUserMap.set(lu.id, lu);
              }
            });

            const finalUsers = Array.from(mergedUserMap.values());
            setItem(STORAGE_KEYS.REAL_USERS, finalUsers);

            // Update saved accounts if current profile changed
            if (currentUser) {
              const freshActive = finalUsers.find(u => u.id === currentUser.id);
              if (freshActive) {
                addOrUpdateSavedAccount(freshActive);
              }
            }
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

            const validSupaPosts = combinedPosts
              .filter((p: any) => !deletedIds.has(p.id))
              .map((p: any) => {
                const pVotes = validVotes.filter(v => v.post_id === p.id);
                const up = pVotes.filter(v => v.type === 'up').length;
                const down = pVotes.filter(v => v.type === 'down').length;
                return {
                  ...p,
                  votes_up: up,
                  votes_down: down,
                  net_votes: up - down,
                };
              });

            setItem(STORAGE_KEYS.POSTS, validSupaPosts);
          }
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

/**
 * Subscribe to Supabase Realtime Channel for instant cross-device live updates
 */
export const subscribeToSupabaseRealtime = (onSyncNeeded: () => void): (() => void) => {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  try {
    const channel = supabase
      .channel('public:aether_feed_realtime')
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
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

export const updateProfileData = (userId: string, updates: Partial<Profile>): Profile | null => {
  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  users[idx] = {
    ...users[idx],
    ...updates,
    updated_at: now,
    display_name: updates.first_name && updates.last_name
      ? `${updates.first_name} ${updates.last_name}`
      : (updates.display_name || users[idx].display_name),
  };

  setItem(STORAGE_KEYS.REAL_USERS, users);
  addOrUpdateSavedAccount(users[idx]);

  // Push updated profile to Supabase Cloud directly
  const supabase = getSupabaseClient();
  if (supabase) {
    supabase.from('profiles').upsert(sanitizeProfileForSupabase(users[idx])).then(
      () => {},
      (err: any) => console.warn('[Aether Supabase] Profile update error:', err)
    );
  }

  // Push to local server API
  try {
    fetch('/api/users/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: sanitizeProfileForSupabase(users[idx]) }),
    }).catch(() => {});
  } catch {}

  syncWithServer();
  window.dispatchEvent(new Event('aether_storage_sync'));
  return users[idx];
};

export const deleteUserAccount = async (userId: string): Promise<boolean> => {
  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []).filter(u => u.id !== userId);
  setItem(STORAGE_KEYS.REAL_USERS, users);

  removeSavedAccount(userId);

  const posts = getItem<Post[]>(STORAGE_KEYS.POSTS, []).filter(p => p.user_id !== userId);
  setItem(STORAGE_KEYS.POSTS, posts);

  const votes = getItem<VoteRecord[]>(STORAGE_KEYS.VOTES, []).filter(v => v.user_id !== userId);
  setItem(STORAGE_KEYS.VOTES, votes);

  const notifs = getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []).filter(
    n => n.user_id !== userId && n.actor_id !== userId
  );
  setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);

  setItem(STORAGE_KEYS.CURRENT_USER_ID, null);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('profiles').delete().eq('id', userId);
      await supabase.from('posts').delete().eq('user_id', userId);
      await supabase.from('votes').delete().eq('user_id', userId);
      await supabase.from('notifications').delete().eq('user_id', userId);
    } catch (err) {
      console.warn('[Aether Supabase] Delete user error:', err);
    }
  }

  await syncWithServer();
  window.dispatchEvent(new Event('aether_storage_sync'));
  return true;
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

  const currentFollowing = Array.isArray(users[currentIdx].following) ? [...users[currentIdx].following] : [];
  const targetFollowers = Array.isArray(users[targetIdx].followers) ? [...users[targetIdx].followers] : [];

  const isCurrentlyFollowing = currentFollowing.includes(targetUserId);

  if (isCurrentlyFollowing) {
    users[currentIdx].following = currentFollowing.filter(id => id !== targetUserId);
    users[targetIdx].followers = targetFollowers.filter(id => id !== currentUserId);
  } else {
    if (!currentFollowing.includes(targetUserId)) {
      users[currentIdx].following = [...currentFollowing, targetUserId];
    }
    if (!targetFollowers.includes(currentUserId)) {
      users[targetIdx].followers = [...targetFollowers, currentUserId];
    }

    addNotification({
      user_id: targetUserId,
      actor_id: currentUserId,
      type: 'follow',
    });
  }

  const now = new Date().toISOString();
  users[currentIdx].updated_at = now;
  users[targetIdx].updated_at = now;

  setItem(STORAGE_KEYS.REAL_USERS, users);
  addOrUpdateSavedAccount(users[currentIdx]);

  // Update Supabase Cloud DB
  const supabase = getSupabaseClient();
  if (supabase) {
    supabase
      .from('profiles')
      .upsert([
        sanitizeProfileForSupabase(users[currentIdx]),
        sanitizeProfileForSupabase(users[targetIdx]),
      ])
      .then(() => {}, (err) => console.warn('[Supabase Follow Upsert Error]', err));
  }

  // Update Local Server API
  try {
    fetch('/api/users/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: sanitizeProfileForSupabase(users[currentIdx]) }),
    }).catch(() => {});
    fetch('/api/users/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: sanitizeProfileForSupabase(users[targetIdx]) }),
    }).catch(() => {});
  } catch {}

  window.dispatchEvent(new Event('aether_storage_sync'));
  return { isFollowing: !isCurrentlyFollowing, targetUser: users[targetIdx] };
};

/* ==========================================================================
   POSTS & STATUS UPDATES ENGINE
   ========================================================================== */

export const getRealPosts = (): Post[] => {
  const deletedIds = getDeletedPostIds();
  const posts = getItem<Post[]>(STORAGE_KEYS.POSTS, []).filter(p => !deletedIds.has(p.id));
  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  const votes = getItem<VoteRecord[]>(STORAGE_KEYS.VOTES, []).filter(v => !deletedIds.has(v.post_id));

  return posts.map(p => {
    // Deterministically calculate votes from canonical votes list
    const postVotes = votes.filter(v => v.post_id === p.id);
    const votes_up = postVotes.filter(v => v.type === 'up').length;
    const votes_down = postVotes.filter(v => v.type === 'down').length;
    const net_votes = votes_up - votes_down;

    return {
      ...p,
      votes_up,
      votes_down,
      net_votes,
      user: users.find(u => u.id === p.user_id) || {
        id: p.user_id,
        email: '',
        first_name: 'Member',
        last_name: '',
        display_name: 'Aether Member',
        username: 'member',
        avatar_url: DEFAULT_DLICOM_AVATAR,
        bio: '',
        dlicom_address: '',
        is_verified: true,
        followers: [],
        following: [],
        total_votes_received: 0,
        created_at: new Date().toISOString(),
      }
    };
  });
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

  // Send to Supabase Cloud
  const supabase = getSupabaseClient();
  if (supabase) {
    supabase.from('posts').upsert(sanitizePostForSupabase(newPost)).then(
      ({ error }) => {
        if (error) console.warn('[Aether Supabase] Post upsert error:', error);
      },
      (err: any) => {
        console.warn('[Aether Supabase] Post upsert error:', err);
      }
    );
  }

  window.dispatchEvent(
    new CustomEvent('aether_post_broadcast', {
      detail: { post: newPost, authorId: data.authorId }
    })
  );

  window.dispatchEvent(new Event('aether_storage_sync'));
  return newPost;
};

export const deleteRealPost = (postId: string, userId?: string): boolean => {
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

  // 5. Delete from Supabase Cloud DB directly
  const supabase = getSupabaseClient();
  if (supabase) {
    supabase.from('posts').delete().eq('id', postId).then(() => {}, (err) => console.warn('[Supabase Delete Post]', err));
    supabase.from('votes').delete().eq('post_id', postId).then(() => {}, () => {});
    supabase.from('notifications').delete().eq('post_id', postId).then(() => {}, () => {});
  }

  // 6. Delete from local server storage
  try {
    fetch(`/api/posts?id=${encodeURIComponent(postId)}`, {
      method: 'DELETE',
    }).catch(() => {});
  } catch {}

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

  const supabase = getSupabaseClient();
  if (supabase) {
    supabase.from('posts').upsert(sanitizePostForSupabase(posts[idx])).then(() => {}, () => {});
  }

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

  const canonicalVoteId = `vote_${userId}_${postId}`;
  const existingVoteIdx = votes.findIndex(
    v => (v.post_id === postId && v.user_id === userId) || v.id === canonicalVoteId
  );
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
    supabase
      .from('posts')
      .update({
        votes_up: posts[postIdx].votes_up,
        votes_down: posts[postIdx].votes_down,
        net_votes: posts[postIdx].net_votes,
      })
      .eq('id', postId)
      .then(() => {}, (err: any) => console.warn('[Aether Supabase] Post vote update error:', err));

    if (finalUserVote === null) {
      supabase.from('votes').delete().eq('id', canonicalVoteId).then(() => {}, () => {});
      supabase.from('votes').delete().match({ user_id: userId, post_id: postId }).then(() => {}, () => {});
    } else {
      supabase.from('votes').upsert({
        id: canonicalVoteId,
        user_id: userId,
        post_id: postId,
        type: finalUserVote,
        created_at: new Date().toISOString(),
      }).then(() => {}, (err: any) => console.warn('[Aether Supabase] Vote record upsert error:', err));
    }

    supabase
      .from('profiles')
      .update({ total_votes_received: totalVotesReceived })
      .eq('id', authorId)
      .then(() => {}, () => {});
  }

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
  const email = typeof userOrEmail === 'string' ? userOrEmail : userOrEmail.email;
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();
  const adminList = getAdminEmails();
  return adminList.includes(cleanEmail);
};

export const addAdminEmail = (newEmail: string, actorEmail?: string): boolean => {
  if (actorEmail && !isUserAdmin(actorEmail)) return false;
  const clean = newEmail.toLowerCase().trim();
  if (!clean || !clean.includes('@')) return false;

  const current = getAdminEmails();
  if (current.includes(clean)) return false;

  current.push(clean);
  setItem(STORAGE_KEYS.ADMIN_EMAILS, current);
  return true;
};

export const removeAdminEmail = (targetEmail: string, actorEmail?: string): boolean => {
  if (actorEmail && !isUserAdmin(actorEmail)) return false;
  const clean = targetEmail.toLowerCase().trim();
  if (clean === ROOT_ADMIN_EMAIL.toLowerCase()) return false; // Root admin is permanent

  const current = getAdminEmails().filter(e => e !== clean);
  setItem(STORAGE_KEYS.ADMIN_EMAILS, current);
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
export const adminToggleVerifyUser = (targetUserId: string, actorEmail?: string): Profile | null => {
  if (actorEmail && !isUserAdmin(actorEmail)) return null;

  const users = getItem<Profile[]>(STORAGE_KEYS.REAL_USERS, []);
  const idx = users.findIndex(u => u.id === targetUserId);
  if (idx === -1) return null;

  users[idx] = {
    ...users[idx],
    is_verified: !users[idx].is_verified,
    updated_at: new Date().toISOString(),
  };

  setItem(STORAGE_KEYS.REAL_USERS, users);

  const supabase = getSupabaseClient();
  if (supabase) {
    supabase
      .from('profiles')
      .update({ is_verified: users[idx].is_verified })
      .eq('id', targetUserId)
      .then(() => {}, () => {});
  }

  syncWithServer();
  return users[idx];
};

