# Aether Feed

A modern, minimal social media application engineered for real-time community engagement, authentic content sharing, and rich media communication.

---

## Overview

Aether Feed is a focused social platform built with React, TypeScript, Vite, and Tailwind CSS. The platform emphasizes clean aesthetics, real email-verified user accounts, zero synthetic/mock data, and multi-format content creation including text status updates, photos, and high-definition video playback.

---

## Core Features

### 1. Authentication and Security
- Real Email Verification: 6-digit OTP delivery using EmailJS service.
- Clean Landing Screen: Two-step access flow for account sign-in and new registration.
- Password Security: Strength analysis and password reset verification codes sent directly to user inboxes.
- Session Management: Secure client-side session handling.

### 2. Post and Media Publishing
- Text Status Updates: Express thoughts, questions, or ideas.
- Photo Attachments: Upload images directly from local device directories.
- Video Publishing: Native video upload support (MP4, WebM, MOV, OGG) with in-feed responsive playback controls.
- Mentions and Hashtags: Tag registered community members (@username) and organize topics with custom hashtags (#tag).
- Quick Compose Modals: Create posts through the inline composer or the dedicated floating action button.

### 3. Post Interaction and Lifecycle Management
- Three-Dot Context Menu: Every post includes a dedicated option menu in the card header.
  - Text-Only Editing: Edit post title and description while keeping published media secure.
  - Post Details and Metadata: Inspect publication timestamps, word counts, character counts, and unique post identifiers.
  - Multi-Channel Sharing: Share post references via WhatsApp, X (Twitter), Telegram, direct link copying, or native device share sheets.
  - Author Deletion: Authors can permanently remove their posts with inline confirmation.
- Dual Voting System: Upvote and downvote mechanics with real-time net score calculations.

### 4. Search and Discovery
- Unified Search Engine: Search across registered user profiles and post titles/descriptions simultaneously.
- Live Search Flyout: Instant dropdown preview showing matching members and post content while typing.
- Dedicated Search Shelves: In-feed member discovery shelf displaying matching profiles with quick follow actions.

### 5. Profile and Social Graph
- User Profiles: Customizable avatars, cover banners, bio descriptions, location, and portfolio links.
- Interactive Followers and Following Lists: Inspect community connections with live Follow, Follow Back, and Unfollow controls.
- Activity Tabs: Filter a member's profile by their published posts, upvoted content, and biographical details.
- Community Leaderboard: Real-time ranking of top contributors based on authentic upvote metrics.

### 6. Design and Navigation
- Dual Visual Themes: Seamless switching between Slate Navy Dark Mode and Clean Light Mode.
- Responsive Layout: Two-column desktop layout paired with a mobile bottom navigation bar.
- Performance and Motion: Smooth view transitions, momentum touch scrolling, and tactile button feedback.

---

## System Architecture

```
+----------------------------------------------------------------------------------------+
|                                    AETHER FEED HEADER                                  |
|   [Brand Logo]         [Unified Search Bar]        [+ Post]  [Theme]  [Bell]  [User]   |
+-------------------+--------------------------------------------------------------------+
|   LEFT SIDEBAR    |                            MAIN STREAM                             |
|                   |                                                                    |
|   Home Feed       |   +------------------------------------------------------------+   |
|   Following Feed  |   | Create Post Composer: Status Text | Photo | Video | Tags   |   |
|   Leaderboard     |   +------------------------------------------------------------+   |
|   My Profile      |                                                                    |
|   Settings        |   +------------------------------------------------------------+   |
|   Log Out         |   | Post Card (Author Info | 3-Dots Menu)                      |   |
|                   |   | Status Text / Title                                        |   |
|                   |   | [ Photo Preview or In-Feed HTML5 Video Player ]            |   |
|                   |   | [▲ Upvote]  [Net Score]  [▼ Downvote]  [Share Button]      |   |
|                   |   +------------------------------------------------------------+   |
+-------------------+--------------------------------------------------------------------+
|                      MOBILE BOTTOM NAVIGATION BAR (Mobile & Tablet)                    |
|                [Home]    [Following]    [+ Compose]    [Rankings]    [Profile]         |
+----------------------------------------------------------------------------------------+
```

---

## Technology Stack

- Frontend Framework: React 18
- Language: TypeScript
- Bundler and Dev Server: Vite
- Styling: Tailwind CSS and Vanilla CSS design tokens
- Icons: Lucide React
- Email Service: EmailJS Browser SDK
- Storage Engine: LocalStorage persistence with storage sync dispatchers

---

## Directory Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── LandingPage.tsx
│   │   └── EmailConfigModal.tsx
│   ├── feed/
│   │   ├── CreatePostBox.tsx
│   │   ├── CreatePostModal.tsx
│   │   ├── EditPostModal.tsx
│   │   ├── PostCard.tsx
│   │   ├── PostDetailsModal.tsx
│   │   ├── SharePostModal.tsx
│   │   └── ImageLightboxModal.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── LeftSidebar.tsx
│   │   ├── MobileBottomNav.tsx
│   │   └── NotificationFlyout.tsx
│   ├── leaderboard/
│   │   └── RealLeaderboardView.tsx
│   ├── profile/
│   │   ├── UserProfileView.tsx
│   │   └── FollowersListModal.tsx
│   ├── settings/
│   │   └── SettingsModal.tsx
│   └── ui/
│       └── Toast.tsx
├── lib/
│   ├── emailService.ts
│   └── storage.ts
├── types/
│   └── index.ts
├── App.tsx
├── index.css
└── main.tsx
```

---

## Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd "Aether Feed"
```

2. Install dependencies:
```bash
npm install
```

3. Configure Environment Variables:
Create a `.env` file in the project root:
```env
VITE_EMAILJS_SERVICE_ID=service_m41wswe
VITE_EMAILJS_TEMPLATE_ID=template_t3lyaoh
VITE_EMAILJS_PUBLIC_KEY=lUxvD8jEw-LlgVT83
```

4. Start the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

---

## License

This project is licensed under the MIT License.
