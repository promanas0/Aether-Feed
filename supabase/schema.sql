-- ==========================================================
-- AETHER FEED: Supabase / PostgreSQL Production Schema
-- Pure Blue Minimalist Social Architecture
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    total_votes_received INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for leaderboard performance (Rank 1 to 100 fast retrieval)
CREATE INDEX IF NOT EXISTS idx_profiles_total_votes ON public.profiles (total_votes_received DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);

-- 2. POSTS TABLE
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    description TEXT DEFAULT '',
    votes_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for feed sorting (Trending, Latest, Top Voted)
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_votes_count ON public.posts (votes_count DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts (user_id);

-- 3. VOTES TABLE (Anti-duplicate tracking)
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_post_vote UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_user_id ON public.votes (user_id);
CREATE INDEX IF NOT EXISTS idx_votes_post_id ON public.votes (post_id);

-- 4. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- recipient
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- sender / poster
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id, is_read, created_at DESC);

-- ==========================================================
-- REAL SIGNUP FIX: AUTOMATIC PROFILE CREATION TRIGGER
-- (Runs with SECURITY DEFINER to bypass RLS during auth signup)
-- ==========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name, avatar_url, bio, total_votes_received, created_at)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'username',
            LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTRING(NEW.id::TEXT, 1, 4)
        ),
        COALESCE(
            NEW.raw_user_meta_data->>'display_name',
            SPLIT_PART(NEW.email, '@', 1)
        ),
        COALESCE(
            NEW.raw_user_meta_data->>'avatar_url',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        ),
        COALESCE(
            NEW.raw_user_meta_data->>'bio',
            'Digital Creator on Aether Feed.'
        ),
        0,
        timezone('utc'::text, now())
    )
    ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        display_name = EXCLUDED.display_name;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger automatically attached to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================================
-- ATOMIC VOTE TALLYING TRIGGER
-- ==========================================================

CREATE OR REPLACE FUNCTION public.handle_vote_change()
RETURNS TRIGGER AS $$
DECLARE
    post_author_id UUID;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Increment post vote count
        UPDATE public.posts
        SET votes_count = votes_count + 1
        WHERE id = NEW.post_id
        RETURNING user_id INTO post_author_id;

        -- Increment profile total votes received
        IF post_author_id IS NOT NULL THEN
            UPDATE public.profiles
            SET total_votes_received = total_votes_received + 1
            WHERE id = post_author_id;
        END IF;

        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        -- Decrement post vote count
        UPDATE public.posts
        SET votes_count = GREATEST(0, votes_count - 1)
        WHERE id = OLD.post_id
        RETURNING user_id INTO post_author_id;

        -- Decrement profile total votes received
        IF post_author_id IS NOT NULL THEN
            UPDATE public.profiles
            SET total_votes_received = GREATEST(0, total_votes_received - 1)
            WHERE id = post_author_id;
        END IF;

        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_vote_change ON public.votes;
CREATE TRIGGER on_vote_change
AFTER INSERT OR DELETE ON public.votes
FOR EACH ROW EXECUTE FUNCTION public.handle_vote_change();

-- ==========================================================
-- GLOBAL BROADCAST NOTIFICATION ON NEW POST
-- ==========================================================

CREATE OR REPLACE FUNCTION public.handle_new_post_broadcast()
RETURNS TRIGGER AS $$
BEGIN
    -- Broadcast notification to all other active profiles
    INSERT INTO public.notifications (user_id, actor_id, post_id, is_read, created_at)
    SELECT p.id, NEW.user_id, NEW.id, false, timezone('utc'::text, now())
    FROM public.profiles p
    WHERE p.id <> NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_post_broadcast ON public.posts;
CREATE TRIGGER on_new_post_broadcast
AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.handle_new_post_broadcast();

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can view, user can update or insert their own
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Posts: Anyone can view, authenticated users can insert/delete own
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts are viewable by everyone" ON public.posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
CREATE POLICY "Authenticated users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Votes: Anyone can view, authenticated users can insert/delete own vote
DROP POLICY IF EXISTS "Votes are viewable by everyone" ON public.votes;
CREATE POLICY "Votes are viewable by everyone" ON public.votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can cast vote once" ON public.votes;
CREATE POLICY "Users can cast vote once" ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their vote" ON public.votes;
CREATE POLICY "Users can remove their vote" ON public.votes FOR DELETE USING (auth.uid() = user_id);

-- Notifications: Users can only view and update their own notifications
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can mark their notifications as read" ON public.notifications;
CREATE POLICY "Users can mark their notifications as read" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
