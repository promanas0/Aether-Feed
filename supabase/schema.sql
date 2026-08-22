-- ==========================================================
-- AETHER FEED: Supabase / PostgreSQL Production Schema
-- Compatible with Custom OTP Email Auth & Cross-Device Sync
-- ==========================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT DEFAULT '',
    last_name TEXT DEFAULT '',
    display_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    banner_url TEXT DEFAULT '',
    bio TEXT DEFAULT 'Hey, I just joined Aether Feed!',
    dlicom_address TEXT DEFAULT '',
    location TEXT DEFAULT '',
    website TEXT DEFAULT '',
    is_verified BOOLEAN DEFAULT true,
    followers JSONB DEFAULT '[]'::jsonb,
    following JSONB DEFAULT '[]'::jsonb,
    total_votes_received INTEGER NOT NULL DEFAULT 0,
    password_hash TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);
CREATE INDEX IF NOT EXISTS idx_profiles_votes ON public.profiles (total_votes_received DESC);

-- 2. POSTS TABLE
CREATE TABLE IF NOT EXISTS public.posts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT DEFAULT '',
    image_data TEXT DEFAULT '',
    video_data TEXT DEFAULT '',
    media_type TEXT DEFAULT 'text',
    description TEXT DEFAULT '',
    tagged_users JSONB DEFAULT '[]'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    votes_up INTEGER DEFAULT 0,
    votes_down INTEGER DEFAULT 0,
    net_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts (user_id);

-- 3. VOTES TABLE
CREATE TABLE IF NOT EXISTS public.votes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    post_id TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_votes_user_post ON public.votes (user_id, post_id);

-- 4. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    post_id TEXT,
    type TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications (user_id, is_read);

-- 5. DIRECT MESSAGES TABLE (1-ON-1 DMS)
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_dm_participants ON public.direct_messages (sender_id, receiver_id, created_at);

-- 6. VIP CHAT MESSAGES (AETHER LOUNGE)
CREATE TABLE IF NOT EXISTS public.vip_messages (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    text TEXT NOT NULL,
    image_data TEXT,
    code_snippet TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_vip_messages_created_at ON public.vip_messages (created_at ASC);

-- 7. POST COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments (post_id, created_at ASC);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR INSTANT ACCESS
-- ==========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on profiles" ON public.profiles;
CREATE POLICY "Allow all on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on posts" ON public.posts;
CREATE POLICY "Allow all on posts" ON public.posts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on votes" ON public.votes;
CREATE POLICY "Allow all on votes" ON public.votes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on notifications" ON public.notifications;
CREATE POLICY "Allow all on notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on direct_messages" ON public.direct_messages;
CREATE POLICY "Allow all on direct_messages" ON public.direct_messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on vip_messages" ON public.vip_messages;
CREATE POLICY "Allow all on vip_messages" ON public.vip_messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on comments" ON public.comments;
CREATE POLICY "Allow all on comments" ON public.comments FOR ALL USING (true) WITH CHECK (true);
