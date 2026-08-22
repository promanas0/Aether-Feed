import React, { useState, useEffect } from 'react';
import { X, Edit3, Check, FileText, Lock } from 'lucide-react';
import type { Post } from '../../types';

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  onSave: (postId: string, description: string, title?: string) => void;
  addToast: (title: string, desc?: string, type?: 'info' | 'success' | 'vote' | 'broadcast') => void;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({
  isOpen,
  onClose,
  post,
  onSave,
  addToast,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (post) {
      setTitle(post.title || '');
      setDescription(post.description || '');
    }
  }, [post]);

  if (!isOpen || !post) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      addToast('Validation', 'Post description cannot be empty.', 'info');
      return;
    }

    onSave(post.id, description.trim(), title.trim() || undefined);
    onClose();
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B132B]/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-[#1C2541] border border-[#334155] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#334155] bg-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Edit3 className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Edit Post Text
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#334155] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          
          {/* Notice about text only editing */}
          <div className="flex items-center gap-2 p-3 bg-blue-950/40 border border-blue-600/30 rounded-2xl text-[11px] text-blue-300">
            <Lock className="w-4 h-4 shrink-0 text-blue-400" />
            <span>Only text can be edited. Attached photo and metadata are locked.</span>
          </div>

          {/* Title (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Title / Subject (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title..."
              className="w-full px-3.5 py-2.5 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white"
            />
          </div>

          {/* Description / Content */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Post Description / Status
            </label>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Update your post text..."
              className="w-full px-3.5 py-2.5 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white resize-none leading-relaxed"
            />
          </div>

          {/* Read-only Photo Preview if present */}
          {post.image_data && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Attached Photo (Locked)
              </label>
              <div className="relative rounded-2xl overflow-hidden border border-[#334155] bg-[#0B132B] max-h-36">
                <img
                  src={post.image_data}
                  alt="Attached"
                  className="w-full h-36 object-contain opacity-70"
                />
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-[#334155]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#0B132B] hover:bg-[#1E293B] text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-glow-sm cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save Changes</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
