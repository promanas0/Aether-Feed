import React, { useState } from 'react';
import { User, AtSign, AlignLeft, Check, Sparkles, Image as ImageIcon } from 'lucide-react';
import { AVATAR_PRESETS } from '../../lib/initialData';
import { Profile } from '../../types';

interface ProfileSetupProps {
  isOpen: boolean;
  onComplete: (data: {
    username: string;
    display_name: string;
    avatar_url: string;
    bio: string;
  }) => void;
  existingUsernames: Set<string>;
}

export const ProfileSetupModal: React.FC<ProfileSetupProps> = ({
  isOpen,
  onComplete,
  existingUsernames,
}) => {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_PRESETS[0]);
  const [selectedAvatarIdx, setSelectedAvatarIdx] = useState(0);

  if (!isOpen) return null;

  const isUsernameTaken = existingUsernames.has(username.toLowerCase().trim());
  const isUsernameValid = username.trim().length >= 3 && /^[a-zA-Z0-9_]+$/.test(username.trim());

  const handleSelectPreset = (idx: number) => {
    setSelectedAvatarIdx(idx);
    setAvatarUrl(AVATAR_PRESETS[idx]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUsernameValid || isUsernameTaken || !displayName.trim()) return;

    onComplete({
      username: username.toLowerCase().trim(),
      display_name: displayName.trim(),
      avatar_url: avatarUrl,
      bio: bio.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B132B]/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#1C2541] border border-[#334155] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[#334155] bg-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-glow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Profile Setup &bull; /setup-profile
              </h2>
              <p className="text-xs text-slate-400">
                Configure your creator identity before entering the feed
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Avatar Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Avatar or Provide URL
            </label>
            <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
              {AVATAR_PRESETS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleSelectPreset(idx)}
                  className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    selectedAvatarIdx === idx
                      ? 'border-blue-500 shadow-glow-sm scale-105'
                      : 'border-[#334155] hover:border-slate-400 opacity-80'
                  }`}
                >
                  <img src={preset} alt="" className="w-full h-full object-cover" />
                  {selectedAvatarIdx === idx && (
                    <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="relative">
              <ImageIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => {
                  setAvatarUrl(e.target.value);
                  setSelectedAvatarIdx(-1);
                }}
                placeholder="Custom Avatar Image URL (optional)..."
                className="w-full pl-9 pr-3.5 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
              />
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Display Name <span className="text-blue-400">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Elena Rostova"
                className="w-full pl-9 pr-3.5 py-2.5 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans transition-all"
              />
            </div>
          </div>

          {/* Unique Username Handle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-200">
                Unique Handle (@username) <span className="text-blue-400">*</span>
              </label>
              {username && (
                <span className={`text-[10px] font-mono ${
                  isUsernameTaken ? 'text-rose-400 font-bold' : isUsernameValid ? 'text-blue-400 font-semibold' : 'text-amber-400'
                }`}>
                  {isUsernameTaken ? 'Username is already taken' : isUsernameValid ? 'Available' : 'Min 3 chars (letters, numbers, _)'}
                </span>
              )}
            </div>
            <div className="relative">
              <AtSign className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="elena_rostova"
                className={`w-full pl-9 pr-3.5 py-2.5 bg-[#0B132B] border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none font-mono transition-all ${
                  isUsernameTaken
                    ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/50'
                    : 'border-[#334155] focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Short Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Short Bio / Design Rationale
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Lead Interface Architect exploring deep cobalt geometry and dark UI systems."
                className="w-full px-3.5 py-2.5 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans resize-none transition-all"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-[#334155]">
            <button
              type="submit"
              disabled={!isUsernameValid || isUsernameTaken || !displayName.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-glow transition-all active:scale-95"
            >
              <span>Complete Setup & Land on Dashboard</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
