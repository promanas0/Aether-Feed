export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  username: string;
  avatar_url: string;
  banner_url?: string;
  bio: string;
  dlicom_address: string; // e.g., 0x71C4...98A2 or dlicom.id/username
  location?: string;
  website?: string;
  is_verified: boolean;
  is_golden_verified?: boolean; // Exclusive Golden Checkmark badge
  is_admin?: boolean; // Admin privileges flag
  posting_timeout_until?: string; // Timeout ISO date string or 'indefinite'
  is_banned?: boolean; // Account banned status
  followers: string[]; // User IDs who follow this user
  following: string[]; // User IDs this user follows
  total_votes_received: number;
  created_at: string;
  updated_at?: string;
  password_hash?: string;
  posts_count?: number;
}

export interface Post {
  id: string;
  user_id: string;
  title?: string;
  image_data?: string; // Optional for text status posts or photos from folder
  video_data?: string; // Optional video attachment (e.g. mp4, webm)
  media_type?: 'image' | 'video' | 'text';
  description: string;
  tagged_users?: string[]; // User IDs or usernames tagged
  tags?: string[]; // Hashtags (e.g., ['dlicom', 'web3', 'design'])
  votes_up: number;
  votes_down: number;
  net_votes: number; // votes_up - votes_down
  created_at: string;
  updated_at?: string;
  is_deleted?: boolean;
  user?: Profile;
}

export interface VoteRecord {
  id: string;
  user_id: string;
  post_id: string;
  type: 'up' | 'down';
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string; // Recipient
  actor_id: string; // Sender / poster / voter / follower
  post_id?: string;
  type: 'new_post' | 'vote_up' | 'vote_down' | 'follow' | 'tag';
  is_read: boolean;
  created_at: string;
  actor?: Profile;
  post?: Post;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  text: string;
  image_data?: string;
  code_snippet?: string;
  created_at: string;
  user?: Profile;
}

export type ThemeMode = 'dark' | 'light';

export type ActiveView = 'feed' | 'following_feed' | 'profile' | 'leaderboard' | 'settings' | 'chat';

export type FeedFilter = 'trending' | 'latest' | 'top_voted';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'info' | 'success' | 'broadcast' | 'vote';
}

