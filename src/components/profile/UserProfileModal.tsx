import { X, ArrowUpCircle, Calendar, Filter, Image as ImageIcon } from 'lucide-react';
import type { Profile, Post } from '../../types';
import { VerifiedBadge } from '../ui/VerifiedBadge';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  posts: Post[];
  isCurrentUser: boolean;
  onFilterPostsByThisUser: (profile: Profile) => void;
  onOpenLightbox: (imageUrl: string, title: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  posts,
  isCurrentUser,
  onFilterPostsByThisUser,
  onOpenLightbox,
}) => {
  if (!isOpen || !profile) return null;

  const userPosts = posts.filter(p => p.user_id === profile.id);

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B132B]/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-[#1C2541] border border-[#334155] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Profile Banner */}
        <div className="h-28 bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-[#0B132B]/80 hover:bg-[#0B132B] text-slate-300 hover:text-white rounded-xl backdrop-blur-md transition-colors"
            aria-label="Close profile"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Card Header */}
        <div className="px-6 pb-4 pt-0 relative bg-[#1E293B] border-b border-[#334155]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-3">
            <div className="flex items-end gap-3.5">
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-[#1E293B] shadow-lg"
              />
              <div className="mb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-tight">
                    {profile.display_name}
                  </h2>
                  <VerifiedBadge user={profile} />
                  {isCurrentUser && (
                    <span className="px-2 py-0.5 bg-blue-600/30 border border-blue-500/40 text-blue-300 text-[10px] font-mono rounded-md">
                      You
                    </span>
                  )}
                </div>
                <p className="text-xs text-blue-400 font-mono">
                  @{profile.username}
                </p>
              </div>
            </div>

            {/* Quick Filter Action */}
            <button
              onClick={() => {
                onFilterPostsByThisUser(profile);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-glow-sm transition-all"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Show in Feed</span>
            </button>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-xs text-slate-300 leading-relaxed max-w-xl mb-3">
              {profile.bio}
            </p>
          )}

          {/* Stats Bar */}
          <div className="flex items-center gap-6 text-xs text-slate-400 pt-2 border-t border-[#334155]/60">
            <div className="flex items-center gap-1.5">
              <ArrowUpCircle className="w-4 h-4 text-blue-400" />
              <span>
                <strong className="text-white font-mono">{profile.total_votes_received.toLocaleString()}</strong> votes received
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-slate-400" />
              <span>
                <strong className="text-white font-mono">{userPosts.length}</strong> posts
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>Member</span>
            </div>
          </div>
        </div>

        {/* User Artworks Feed Preview */}
        <div className="p-6 overflow-y-auto flex-1">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3.5">
            Broadcasted Artworks ({userPosts.length})
          </h4>

          {userPosts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              This creator hasn't published any artworks yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {userPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => post.image_data && onOpenLightbox(post.image_data, post.title || 'Post')}
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-[#334155] cursor-pointer bg-[#0B132B] p-2 flex flex-col justify-between"
                >
                  {post.image_data ? (
                    <img
                      src={post.image_data}
                      alt={post.title || 'Post'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded"
                    />
                  ) : (
                    <p className="text-[11px] text-slate-300 line-clamp-3">{post.description}</p>
                  )}
                  <div className="mt-1 flex items-center justify-between text-[10px] text-blue-300 font-mono">
                    <span className="truncate">{post.title || 'Status'}</span>
                    <span>▲ {post.net_votes}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
