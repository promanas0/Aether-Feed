import React, { useState } from 'react';
import { X, Database, Copy, Check, Terminal, ExternalLink } from 'lucide-react';

interface SchemaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SQL_SCHEMA = `-- ==========================================================
-- AETHER FEED: Supabase / PostgreSQL Production Schema
-- Pure Blue Minimalist Social Architecture
-- ==========================================================

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

-- 3. VOTES TABLE (Anti-duplicate tracking)
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_post_vote UNIQUE(user_id, post_id)
);

-- 4. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- recipient
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- sender
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ATOMIC VOTE TRIGGER
CREATE OR REPLACE FUNCTION public.handle_vote_change()
RETURNS TRIGGER AS $$
DECLARE
    post_author_id UUID;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.posts SET votes_count = votes_count + 1 WHERE id = NEW.post_id RETURNING user_id INTO post_author_id;
        IF post_author_id IS NOT NULL THEN
            UPDATE public.profiles SET total_votes_received = total_votes_received + 1 WHERE id = post_author_id;
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.posts SET votes_count = GREATEST(0, votes_count - 1) WHERE id = OLD.post_id RETURNING user_id INTO post_author_id;
        IF post_author_id IS NOT NULL THEN
            UPDATE public.profiles SET total_votes_received = GREATEST(0, total_votes_received - 1) WHERE id = post_author_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`;

export const SchemaViewerModal: React.FC<SchemaViewerModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B132B]/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#1C2541] border border-[#334155] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#334155] bg-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Supabase / PostgreSQL Schema & Triggers
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                supabase/schema.sql
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-glow-sm transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy SQL'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#334155] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-4 bg-[#0B132B] overflow-y-auto flex-1 font-mono text-xs text-slate-300 leading-relaxed">
          <pre className="p-4 bg-[#0F172A] border border-[#334155] rounded-xl overflow-x-auto selection:bg-blue-600 selection:text-white">
            <code>{SQL_SCHEMA}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#1E293B] border-t border-[#334155] flex items-center justify-between text-[11px] text-slate-400">
          <span>Ready to execute directly in Supabase SQL Editor</span>
          <span className="font-mono text-blue-400">Full constraints & RLS enabled</span>
        </div>

      </div>
    </div>
  );
};
