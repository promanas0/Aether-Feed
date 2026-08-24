import React, { useState, useRef } from 'react';
import { 
  X, 
  Image as ImageIcon, 
  Video as VideoIcon,
  Tag, 
  Hash, 
  Send, 
  Sparkles, 
  FileText,
  Plus,
  BarChart2,
  Trash2
} from 'lucide-react';
import type { Profile, ToastMessage, PollData } from '../../types';
import { compressPostImage } from '../../lib/imageUtils';
import { isUserPostingRestricted } from '../../lib/storage';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    image_data: string;
    video_data?: string;
    media_type?: 'image' | 'video' | 'text';
    tagged_users: string[];
    tags: string[];
    poll?: PollData;
  }) => void;
  currentUser: Profile;
  allUsers: Profile[];
  addToast: (title: string, desc?: string, type?: ToastMessage['type']) => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
  allUsers,
  addToast,
}) => {
  const [postTitle, setPostTitle] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<string | null>(null);
  const [mediaFileName, setMediaFileName] = useState('');
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [selectedTaggedUsers, setSelectedTaggedUsers] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [isPublishing, setIsPublishing] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Photo selection from Local Device Folder with Auto-Compression
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        addToast('Invalid File', 'Please select an image file (PNG, JPG, WEBP).', 'info');
        return;
      }

      try {
        const compressed = await compressPostImage(file);
        setImageData(compressed);
        setVideoData(null);
        setMediaFileName(file.name);
        addToast('Photo Attached', `${file.name} optimized and ready.`, 'success');
      } catch {
        const reader = new FileReader();
        reader.onload = (event) => {
          setImageData(event.target?.result as string);
          setVideoData(null);
          setMediaFileName(file.name);
          addToast('Photo Attached', `${file.name} ready to publish.`, 'success');
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Handle Video selection from Local Device Folder
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        addToast('Invalid File', 'Please select a valid video file (MP4, WebM, MOV).', 'info');
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        addToast('File Too Large', 'Please select a video under 50MB.', 'info');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setVideoData(event.target?.result as string);
        setImageData(null);
        setMediaFileName(file.name);
        addToast('Video Attached', `${file.name} ready to publish.`, 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddHashtag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = hashtagInput.trim().replace(/^#/, '').toLowerCase();
      if (val && !hashtags.includes(val)) {
        setHashtags([...hashtags, val]);
        setHashtagInput('');
      }
    }
  };

  const handleRemoveHashtag = (tagToRemove: string) => {
    setHashtags(hashtags.filter(t => t !== tagToRemove));
  };

  const toggleTagUser = (username: string) => {
    if (selectedTaggedUsers.includes(username)) {
      setSelectedTaggedUsers(selectedTaggedUsers.filter(u => u !== username));
    } else {
      setSelectedTaggedUsers([...selectedTaggedUsers, username]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const restriction = isUserPostingRestricted(currentUser);
    if (restriction.restricted) {
      addToast('Posting Restricted', restriction.reason || 'You cannot create posts right now.', 'info');
      return;
    }

    const titleTrimmed = postTitle.trim();
    const descTrimmed = postDescription.trim();

    if (!titleTrimmed && !descTrimmed && !imageData && !videoData) {
      addToast('Empty Post', 'Please write a post title, description, or attach media.', 'info');
      return;
    }

    setIsPublishing(true);

    let pollData: PollData | undefined = undefined;
    if (showPollCreator) {
      const validOptions = pollOptions.map(opt => opt.trim()).filter(Boolean);
      if (validOptions.length >= 2) {
        pollData = {
          options: validOptions.map((text, idx) => ({
            id: `opt_${idx + 1}_${Math.random().toString(36).substring(2, 6)}`,
            text,
            votes: [],
          })),
          total_votes: 0,
        };
      }
    }

    const finalTitle = titleTrimmed || (descTrimmed.length > 60 ? `${descTrimmed.slice(0, 60)}...` : descTrimmed);
    const finalDescription = descTrimmed || titleTrimmed;

    onSubmit({
      title: finalTitle,
      description: finalDescription,
      image_data: imageData || '',
      video_data: videoData || '',
      media_type: videoData ? 'video' : imageData ? 'image' : 'text',
      tagged_users: selectedTaggedUsers,
      tags: hashtags,
      poll: pollData,
    });

    // Reset Form & Close
    setPostTitle('');
    setPostDescription('');
    setImageData(null);
    setVideoData(null);
    setMediaFileName('');
    setSelectedTaggedUsers([]);
    setHashtags([]);
    setShowPollCreator(false);
    setPollOptions(['', '']);
    setIsPublishing(false);
    onClose();
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B132B]/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-[#1C2541] border border-[#334155] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#334155] bg-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/30 flex items-center justify-center text-blue-400">
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Create Post
              </h3>
              <p className="text-[11px] text-slate-400">
                Share a post with title, description, and media
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#334155] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          
          {/* User Preview */}
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatar_url}
              alt={currentUser.display_name}
              className="w-10 h-10 rounded-xl object-cover border border-[#334155]"
            />
            <div>
              <h4 className="text-xs font-bold text-white leading-tight">
                {currentUser.display_name}
              </h4>
              <p className="text-[11px] text-blue-400 font-mono">
                @{currentUser.username}
              </p>
            </div>
          </div>

          {/* 1. Dedicated Post Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Post Title / Heading
            </label>
            <input
              type="text"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="e.g. Launching Aether Feed, Art Highlight, Alpha Drop..."
              className="w-full bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white placeholder-slate-400 focus:outline-none transition-all"
            />
          </div>

          {/* 2. Dedicated Post Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Post Description / Content
            </label>
            <textarea
              rows={4}
              value={postDescription}
              onChange={(e) => setPostDescription(e.target.value)}
              placeholder="Write your complete post description, explanation, or story..."
              className="w-full bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl p-3.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none resize-none leading-relaxed transition-all"
            />
          </div>

          {/* Attached Photo Preview */}
          {imageData && (
            <div className="relative rounded-2xl overflow-hidden border border-[#334155] bg-[#0B132B] max-h-56">
              <img
                src={imageData}
                alt="Attached preview"
                className="w-full max-h-56 object-contain mx-auto"
              />
              <button
                type="button"
                onClick={() => {
                  setImageData(null);
                  setMediaFileName('');
                }}
                className="absolute top-2 right-2 p-1.5 bg-[#0B132B]/80 hover:bg-rose-600 text-white rounded-xl backdrop-blur-md transition-colors cursor-pointer"
                title="Remove Photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Attached Video Preview */}
          {videoData && (
            <div className="relative rounded-2xl overflow-hidden border border-[#334155] bg-[#0B132B] max-h-56">
              <video
                src={videoData}
                controls
                playsInline
                className="w-full max-h-56 rounded-xl"
              />
              <button
                type="button"
                onClick={() => {
                  setVideoData(null);
                  setMediaFileName('');
                }}
                className="absolute top-2 right-2 p-1.5 bg-[#0B132B]/80 hover:bg-rose-600 text-white rounded-xl backdrop-blur-md transition-colors cursor-pointer"
                title="Remove Video"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Media Attach Triggers */}
          <div className="flex items-center gap-2">
            
            {/* Photo Upload */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#0B132B] hover:bg-[#1E293B] border border-[#334155] hover:border-blue-500 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-blue-400" />
              <span>Attach Photo</span>
            </button>

            {/* Video Upload */}
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*,video/mp4,video/webm,video/ogg,video/quicktime"
              onChange={handleVideoChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#0B132B] hover:bg-[#1E293B] border border-[#334155] hover:border-blue-500 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <VideoIcon className="w-4 h-4 text-emerald-400" />
              <span>Attach Video</span>
            </button>

            {/* Poll Button */}
            <button
              type="button"
              onClick={() => setShowPollCreator(!showPollCreator)}
              className={`px-4 py-2.5 border rounded-2xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                showPollCreator
                  ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                  : 'bg-[#0B132B] hover:bg-[#1E293B] border-[#334155] text-slate-300 hover:text-white'
              }`}
              title="Add a Community Poll"
            >
              <BarChart2 className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Poll</span>
            </button>

            {/* Tag Button */}
            <button
              type="button"
              onClick={() => setShowTagSelector(!showTagSelector)}
              className={`px-4 py-2.5 border rounded-2xl text-xs font-semibold transition-colors cursor-pointer ${
                showTagSelector || selectedTaggedUsers.length > 0 || hashtags.length > 0
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                  : 'bg-[#0B132B] hover:bg-[#1E293B] border-[#334155] text-slate-300 hover:text-white'
              }`}
              title="Tag members & hashtags"
            >
              <Tag className="w-4 h-4 text-indigo-400" />
            </button>

          </div>

          {/* Interactive Poll Builder */}
          {showPollCreator && (
            <div className="p-4 bg-[#0B132B] border border-purple-500/40 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Community Poll Options
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPollCreator(false)}
                  className="text-xs text-slate-400 hover:text-rose-400 cursor-pointer"
                >
                  Remove Poll
                </button>
              </div>

              <div className="space-y-2">
                {pollOptions.map((optText, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-purple-400 w-5 text-center">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={optText}
                      onChange={(e) => {
                        const updated = [...pollOptions];
                        updated[idx] = e.target.value;
                        setPollOptions(updated);
                      }}
                      placeholder={`Option ${idx + 1} (e.g. Yes / No / Feature Name)`}
                      className="flex-1 px-3 py-2 bg-[#1C2541] border border-[#334155] focus:border-purple-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-[#1C2541] rounded-lg transition-colors cursor-pointer"
                        title="Delete option"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {pollOptions.length < 4 && (
                <button
                  type="button"
                  onClick={() => setPollOptions([...pollOptions, ''])}
                  className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 pt-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Option ({pollOptions.length}/4)</span>
                </button>
              )}
            </div>
          )}

          {/* Selected Tag Badges */}
          {(selectedTaggedUsers.length > 0 || hashtags.length > 0) && (
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#0B132B] rounded-2xl border border-[#334155]/60 text-xs font-mono">
              {selectedTaggedUsers.map((uname) => (
                <span
                  key={uname}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-950/70 text-blue-300 border border-blue-600/50 rounded-lg text-[11px]"
                >
                  <span>@{uname}</span>
                  <button
                    type="button"
                    onClick={() => toggleTagUser(uname)}
                    className="hover:text-white cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {hashtags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#1C2541] text-slate-300 border border-[#334155] rounded-lg text-[11px]"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveHashtag(tag)}
                    className="hover:text-white cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Tags Drawer */}
          {showTagSelector && (
            <div className="p-3 bg-[#0B132B] border border-[#334155] rounded-2xl space-y-3 animate-in fade-in">
              <div>
                <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Tag Members:
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {allUsers.map((u) => {
                    const isTagged = selectedTaggedUsers.includes(u.username);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleTagUser(u.username)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-colors cursor-pointer ${
                          isTagged
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-[#1C2541] text-slate-300 hover:text-white border border-[#334155]'
                        }`}
                      >
                        @{u.username}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Add #Hashtags (Press Enter):
                </p>
                <input
                  type="text"
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyDown={handleAddHashtag}
                  placeholder="Type tag and hit Enter..."
                  className="w-full px-3 py-1.5 bg-[#1C2541] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#334155]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#0B132B] hover:bg-[#1E293B] text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isPublishing || (!postTitle.trim() && !postDescription.trim() && !imageData && !videoData)}
              className="flex items-center gap-1.5 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-glow transition-all active:scale-95 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publish Post</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
