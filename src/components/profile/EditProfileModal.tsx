import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Check, 
  User, 
  MapPin, 
  Globe, 
  Camera, 
  Sliders, 
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import type { Profile, ToastMessage } from '../../types';
import { compressAvatar, compressBanner } from '../../lib/imageUtils';
import { AvatarCropModal } from './AvatarCropModal';
import { DEFAULT_DLICOM_AVATAR } from '../../lib/storage';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Profile;
  onUpdateProfile: (updates: Partial<Profile>) => Promise<void> | void;
  addToast: (title: string, desc?: string, type?: ToastMessage['type']) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
  addToast,
}) => {
  const [firstName, setFirstName] = useState(currentUser.first_name || '');
  const [lastName, setLastName] = useState(currentUser.last_name || '');
  const [displayName, setDisplayName] = useState(currentUser.display_name || '');
  const [username, setUsername] = useState(currentUser.username || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [location, setLocation] = useState(currentUser.location || '');
  const [website, setWebsite] = useState(currentUser.website || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url || DEFAULT_DLICOM_AVATAR);
  const [bannerUrl, setBannerUrl] = useState(currentUser.banner_url || '');
  const [bannerSize, setBannerSize] = useState<'compact' | 'standard' | 'tall'>(currentUser.banner_size || 'standard');

  // Crop / Adjust Modal
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [rawAvatarToCrop, setRawAvatarToCrop] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressAvatar(file);
      setAvatarUrl(compressed);
      setRawAvatarToCrop(compressed);
      addToast('Photo Uploaded', 'Avatar preview updated.', 'success');
    } catch {
      addToast('Upload Error', 'Could not process avatar image.', 'info');
    }
  };

  const handleBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressBanner(file);
      setBannerUrl(compressed);
      addToast('Banner Uploaded', 'Cover banner updated.', 'success');
    } catch {
      addToast('Upload Error', 'Could not process cover banner.', 'info');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      addToast('Missing Name', 'Display Name cannot be empty.', 'info');
      return;
    }

    try {
      setIsSaving(true);
      await onUpdateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        display_name: displayName.trim(),
        username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || currentUser.username,
        bio: bio.trim(),
        location: location.trim(),
        website: website.trim(),
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
        banner_size: bannerSize,
      });

      addToast('Profile Updated', 'Your profile details have been saved.', 'success');
      onClose();
    } catch {
      addToast('Error', 'Failed to update profile.', 'info');
    } finally {
      setIsSaving(false);
    }
  };

  const bannerHeightClass = bannerSize === 'compact' ? 'h-24 sm:h-28' : bannerSize === 'tall' ? 'h-36 sm:h-48' : 'h-28 sm:h-36';

  return (
    <>
      <div 
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#0B132B]/85 backdrop-blur-md animate-in fade-in duration-200"
      >
        <div className="relative w-full max-w-lg bg-[#1C2541] border border-[#334155] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-in slide-in-from-bottom-4 duration-200">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#334155] bg-[#1E293B] flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Edit Profile
                </h3>
                <p className="text-[11px] text-slate-400">Update photo, banner, and bio</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#334155] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body with Smooth Touch Scrolling */}
          <form onSubmit={handleSave} className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 text-xs">
            
            {/* Visual Banner & Avatar Combined Hero Editor */}
            <div className="relative rounded-2xl overflow-hidden border border-[#334155] bg-[#0B132B] mb-2">
              {/* Banner Area */}
              <div className={`${bannerHeightClass} bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 relative group overflow-hidden transition-all duration-200`}>
                {bannerUrl ? (
                  <img src={bannerUrl} alt="Cover Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 gap-1.5">
                    <ImageIcon className="w-5 h-5 opacity-40" />
                    <span className="text-[11px]">No cover banner</span>
                  </div>
                )}

                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerFile}
                  className="hidden"
                />

                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                  {bannerUrl && (
                    <button
                      type="button"
                      onClick={() => setBannerUrl('')}
                      className="px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-xl text-[11px] font-semibold border border-rose-600/40 backdrop-blur-md transition-all cursor-pointer"
                      title="Remove banner"
                    >
                      Remove
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="px-3 py-1.5 bg-[#0B132B]/85 hover:bg-[#0B132B] text-white rounded-xl text-[11px] font-semibold border border-[#334155] backdrop-blur-md flex items-center gap-1.5 transition-all shadow-lg cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-blue-400" />
                    <span>{bannerUrl ? 'Change' : 'Upload'}</span>
                  </button>
                </div>
              </div>

              {/* Banner Height & Size Selector Bar */}
              <div className="px-3.5 py-2 bg-[#1C2541] border-t border-b border-[#334155] flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-slate-400">Banner Size:</span>
                <div className="flex items-center gap-1 bg-[#0B132B] p-1 rounded-xl border border-[#334155]">
                  {(['compact', 'standard', 'tall'] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setBannerSize(size)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold capitalize transition-all cursor-pointer ${
                        bannerSize === size
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Founder Presets */}
              <div className="px-3.5 py-2 bg-[#0B132B]/90 border-b border-[#334155] flex flex-wrap items-center justify-between gap-1.5">
                <span className="text-[10px] font-mono text-slate-400">Founder Banners:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBannerUrl('/official_founder_banner.jpg')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                      bannerUrl === '/official_founder_banner.jpg'
                        ? 'bg-blue-600 text-white border-blue-400 shadow-glow-sm'
                        : 'bg-[#1C2541] text-slate-300 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    Nexus v1
                  </button>
                  <button
                    type="button"
                    onClick={() => setBannerUrl('/official_founder_banner_v2.jpg')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                      bannerUrl === '/official_founder_banner_v2.jpg'
                        ? 'bg-blue-600 text-white border-blue-400 shadow-glow-sm'
                        : 'bg-[#1C2541] text-slate-300 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    Monarch v2
                  </button>
                </div>
              </div>

              {/* Avatar Floating in Corner */}
              <div className="p-3 bg-[#1E293B] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 -mt-10 sm:-mt-12">
                  <div className="relative group">
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-4 border-[#1E293B] shadow-xl bg-[#0B132B]"
                    />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>

                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFile}
                    className="hidden"
                  />

                  <div className="pt-8 sm:pt-10">
                    <p className="text-xs font-bold text-white">Profile Photo</p>
                    <p className="text-[11px] text-slate-400">PNG, JPG, or WEBP</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[11px] font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRawAvatarToCrop(avatarUrl);
                      setIsCropModalOpen(true);
                    }}
                    className="p-1.5 bg-[#0B132B] hover:bg-[#2A3756] border border-[#334155] text-slate-300 rounded-xl text-[11px] transition-colors cursor-pointer"
                    title="Crop / Adjust Size"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Names Row (Responsive 2-col or stacked on narrow phones) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Rahul"
                  className="w-full px-3 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Kar"
                  className="w-full px-3 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Display Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Public Name"
                className="w-full px-3 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Username handle
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500 font-mono">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="username"
                  className="w-full pl-7 pr-3 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Bio / Status
                </label>
                <span className="text-[10px] text-slate-500 font-mono">{bio.length}/280</span>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={280}
                rows={3}
                placeholder="Tell the community about yourself, your art, or ideas..."
                className="w-full px-3 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* Location & Website */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, Country"
                    className="w-full pl-8.5 pr-3 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Website / Link
                </label>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full pl-8.5 pr-3 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons Fixed at Bottom of Form */}
            <div className="pt-3 border-t border-[#334155] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#0B132B] hover:bg-[#1E293B] border border-[#334155] text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-glow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>

          </form>

        </div>
      </div>

      {/* Embedded Avatar Cropper Modal if requested */}
      {isCropModalOpen && (
        <AvatarCropModal
          isOpen={isCropModalOpen}
          imageSrc={rawAvatarToCrop || avatarUrl}
          onClose={() => setIsCropModalOpen(false)}
          onCropComplete={(croppedBase64) => {
            setAvatarUrl(croppedBase64);
            setIsCropModalOpen(false);
            addToast('Avatar Adjusted', 'New photo crop saved.', 'success');
          }}
        />
      )}
    </>
  );
};
