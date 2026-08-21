import type { Profile, Post } from '../types';

// Curated high quality avatars for selection
export const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
];

// Seed Real Verified Profiles
export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'usr_manas_01',
    email: 'manas@dlicom.io',
    first_name: 'Manas',
    last_name: 'Dlicom',
    display_name: 'Manas Dlicom',
    username: 'manas_dlicom',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    banner_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    bio: 'Founder & Lead Architect @ Dlicom App Ecosystem. Building decentralized visual social networks.',
    dlicom_address: '0x71C4B892Ea81B6D19fB23490Ad51E1a293F498A2',
    location: 'Mumbai, India',
    website: 'https://dlicom.io',
    is_verified: true,
    followers: ['usr_elena_02', 'usr_marcus_03'],
    following: ['usr_elena_02', 'usr_marcus_03'],
    total_votes_received: 1480,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'usr_elena_02',
    email: 'elena@dlicom.io',
    first_name: 'Elena',
    last_name: 'Rostova',
    display_name: 'Elena Rostova',
    username: 'elena_rostova',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    banner_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80',
    bio: 'Lead Interface Designer & 3D Vector Specialist. Exploring cobalt spatial UI systems.',
    dlicom_address: '0x99A1C54F11E2a849C9842F19E37B02A8841B9201',
    location: 'Berlin, Germany',
    website: 'https://rostova.design',
    is_verified: true,
    followers: ['usr_manas_01'],
    following: ['usr_manas_01'],
    total_votes_received: 1210,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'usr_marcus_03',
    email: 'marcus@dlicom.io',
    first_name: 'Marcus',
    last_name: 'Vance',
    display_name: 'Marcus Vance',
    username: 'marcus_vance',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    banner_url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&auto=format&fit=crop&q=80',
    bio: 'Brutalist architecture photographer and Web3 node validator.',
    dlicom_address: '0x33F890A92C1E418A984D120B883C7E991823AA41',
    location: 'Tokyo, Japan',
    website: 'https://vance.visuals',
    is_verified: true,
    followers: ['usr_manas_01'],
    following: ['usr_manas_01'],
    total_votes_received: 980,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  }
];

// Seed Real Posts
export const INITIAL_POSTS: Post[] = [
  {
    id: 'post_001',
    user_id: 'usr_manas_01',
    title: 'Aether Feed Architecture Launch in Deep Cobalt',
    image_data: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80',
    description: 'Welcome to the official Aether Feed dApp built by Dlicom. High-conversion Web2 social architecture with clean navy tokens and zero emojis.',
    tagged_users: ['elena_rostova', 'marcus_vance'],
    tags: ['dlicom', 'aether', 'architecture', 'web3'],
    votes_up: 48,
    votes_down: 2,
    net_votes: 46,
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 'post_002',
    user_id: 'usr_elena_02',
    title: 'Spatial Fluid Dynamics & Sapphire Vector Study',
    image_data: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    description: 'Generative fluid rendering captured directly from local simulation canvas. High contrast cobalt and slate depth layers.',
    tagged_users: ['manas_dlicom'],
    tags: ['design', 'dlicom', 'fluid', 'minimalism'],
    votes_up: 36,
    votes_down: 1,
    net_votes: 35,
    created_at: new Date(Date.now() - 9 * 3600000).toISOString(),
  }
];

export const FEATURED_FALLBACK_POSTS: Post[] = INITIAL_POSTS;
