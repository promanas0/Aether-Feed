import React, { useState, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Video as VideoIcon,
  Tag, 
  X, 
  Send, 
  Sparkles,
  Hash,
  Play
} from 'lucide-react';
import type { Profile, ToastMessage } from '../../types';
import { compressPostImage } from '../../lib/imageUtils';
import { isUserPostingRestricted } from '../../lib/storage';

interface CreatePostBoxProps {
  currentUser: Profile;
  allUsers: Profile[];
  onSubmitPost: (data: {
    title: string;
    description: string;
    image_data: string;
    video_data?: string;
    media_type?: 'image' | 'video' | 'text';
    tagged_users: string[];
    tags: string[];
  }) => void;
  addToast: (title: string, desc?: string, type?: ToastMessage['type']) => void;
}

export const CreatePostBox: React.FC<CreatePostBoxProps> = ({
  currentUser,
  allUsers,
  onSubmitPost,
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
  const [isPublishing, setIsPublishing] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Handle Photo selection with Auto-Compression
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

  // Handle Video selection
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        addToast('Invalid File', 'Please select a valid video file (MP4, WebM, MOV).', 'info');
        return;
      }

      // Check size limit for local storage convenience (e.g. up to 50MB)
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

    const finalTitle = titleTrimmed || (descTrimmed.length > 60 ? `${descTrimmed.slice(0, 60)}...` : descTrimmed);
    const finalDescription = descTrimmed || titleTrimmed;

    onSubmitPost({
      title: finalTitle,
      description: finalDescription,
      image_data: imageData || '',
      video_data: videoData || '',
      media_type: videoData ? 'video' : imageData ? 'image' : 'text',
      tagged_users: selectedTaggedUsers,
      tags: hashtags,
    });

    // Reset Form
    setPostTitle('');
    setPostDescription('');
    setImageData(null);
    setVideoData(null);
    setMediaFileName('');
    setSelectedTaggedUsers([]);
    setHashtags([]);
    setShowTagSelector(false);
    setIsPublishing(false);
  };

  return (
    <div className="bg-[#1C2541] border border-[#334155] rounded-3xl p-4 sm:p-5 shadow-lg mb-6">
      <form onSubmit={handleSubmit}>
        
        {/* User Avatar + Separate Inputs Area */}
        <div className="flex items-start gap-3">
          <img
            src={currentUser.avatar_url}
            alt={currentUser.display_name}
            className="w-10 h-10 rounded-2xl object-cover border border-[#334155] shrink-0"
          />

          <div className="flex-1 min-w-0 space-y-2">
            {/* 1. Post Title (Separate Field) */}
            <input
              type="text"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="Post Title / Subject (e.g. Aether Feed Announcement, Alpha...)"
              className="w-full px-3 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-400 focus:outline-none transition-all"
            />

            {/* 2. Post Description / Status (Separate Field) */}
            <textarea
              rows={3}
              value={postDescription}
              onChange={(e) => setPostDescription(e.target.value)}
              placeholder="Post Description: What's on your mind? Share details, context, thoughts..."
              className="w-full px-3 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none resize-none leading-relaxed transition-all"
            />

            {/* Attached Photo Preview */}
            {imageData && (
              <div className="relative mt-2 rounded-2xl overflow-hidden border border-[#334155] bg-[#0B132B] max-h-60 group">
                <img
                  src={imageData}
                  alt="Attached preview"
                  className="w-full max-h-60 object-contain mx-auto"
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
              <div className="relative mt-2 rounded-2xl overflow-hidden border border-[#334155] bg-[#0B132B] max-h-60 group">
                <video
                  src={videoData}
                  controls
                  playsInline
                  className="w-full max-h-60 rounded-xl"
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

            {/* Selected Tags Display */}
            {(selectedTaggedUsers.length > 0 || hashtags.length > 0) && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-[#334155]/60 text-xs font-mono">
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
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#0B132B] text-slate-300 border border-[#334155] rounded-lg text-[11px]"
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

            {/* Tag Selector Drawer */}
            {showTagSelector && (
              <div className="mt-3 p-3 bg-[#0B132B] border border-[#334155] rounded-2xl space-y-3 animate-in fade-in">
                
                {/* Member Tagging */}
                <div>
                  <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-blue-400" />
                    <span>Tag Registered Members:</span>
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

                {/* Custom Hashtags Input */}
                <div>
                  <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Hash className="w-3 h-3 text-blue-400" />
                    <span>Add #Hashtags (Press Enter):</span>
                  </p>
                  <input
                    type="text"
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    onKeyDown={handleAddHashtag}
                    placeholder="Type hashtag and hit enter..."
                    className="w-full px-3 py-1.5 bg-[#1C2541] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

              </div>
            )}

          </div>
        </div>

        {/* Hidden Inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />

        <input
          ref={videoInputRef}
          type="file"
          accept="video/*,video/mp4,video/webm,video/ogg,video/quicktime"
          onChange={handleVideoChange}
          className="hidden"
        />

        {/* Bottom Toolbar & Publish Button */}
        <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-[#334155]/60">
          
          {/* Media & Tag Attachment Actions */}
          <div className="flex items-center gap-2">
            
            {/* Photo Upload Button */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B132B] hover:bg-[#1E293B] border border-[#334155] hover:border-blue-500 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Attach Photo"
            >
              <ImageIcon className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">Photo</span>
            </button>

            {/* Video Upload Button */}
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B132B] hover:bg-[#1E293B] border border-[#334155] hover:border-blue-500 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Attach Video"
            >
              <VideoIcon className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Video</span>
            </button>

            {/* Tag Members / Add Hashtags Button */}
            <button
              type="button"
              onClick={() => setShowTagSelector(!showTagSelector)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                showTagSelector || selectedTaggedUsers.length > 0 || hashtags.length > 0
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                  : 'bg-[#0B132B] hover:bg-[#1E293B] border-[#334155] text-slate-300 hover:text-white'
              }`}
              title="Tag Members / Add Hashtags"
            >
              <Tag className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Tags</span>
            </button>

          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPublishing || (!postTitle.trim() && !postDescription.trim() && !imageData && !videoData)}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-glow transition-all active:scale-95 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post</span>
          </button>

        </div>

      </form>
    </div>
  );
};
