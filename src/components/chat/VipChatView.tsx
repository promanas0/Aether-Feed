import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Image as ImageIcon, 
  Code, 
  Trash2, 
  EyeOff,
  MoreVertical,
  X,
  MessageSquare,
  Lock
} from 'lucide-react';
import type { Profile, ChatMessage, ToastMessage } from '../../types';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { 
  isUserAdmin, 
  getVipChatMessages, 
  sendVipChatMessage, 
  deleteVipChatMessage 
} from '../../lib/storage';
import { compressPostImage } from '../../lib/imageUtils';

interface VipChatViewProps {
  currentUser: Profile;
  allUsers: Profile[];
  addToast: (title: string, desc?: string, type?: ToastMessage['type']) => void;
  onOpenProfile: (user: Profile) => void;
}

export const VipChatView: React.FC<VipChatViewProps> = ({
  currentUser,
  allUsers,
  addToast,
  onOpenProfile,
}) => {
  const isAdmin = isUserAdmin(currentUser);
  const isGolden = Boolean(currentUser.is_golden_verified || isAdmin);

  const [messages, setMessages] = useState<ChatMessage[]>(() => getVipChatMessages());
  const [textInput, setTextInput] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeMenuMsgId, setActiveMenuMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    setMessages(getVipChatMessages());
    scrollToBottom();

    const handleSync = () => {
      setMessages(getVipChatMessages());
    };

    window.addEventListener('aether_storage_sync', handleSync);
    return () => {
      window.removeEventListener('aether_storage_sync', handleSync);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressPostImage(file);
        setImageData(compressed);
        addToast('Image Attached', 'Ready to send in chat.', 'info');
      } catch {
        const reader = new FileReader();
        reader.onload = (event) => {
          setImageData(event.target?.result as string);
          addToast('Image Attached', 'Ready to send.', 'info');
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim() && !imageData && !codeSnippet.trim()) return;

    try {
      setIsSending(true);
      await sendVipChatMessage({
        user_id: currentUser.id,
        text: textInput.trim(),
        image_data: imageData || undefined,
        code_snippet: codeSnippet.trim() || undefined,
      });

      setTextInput('');
      setImageData(null);
      setCodeSnippet('');
      setShowCodeInput(false);
      setMessages(getVipChatMessages());
      scrollToBottom();
    } catch (err) {
      addToast('Send Failed', 'Could not post chat message.', 'info');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteForEveryone = async (msgId: string) => {
    setActiveMenuMsgId(null);
    const ok = await deleteVipChatMessage(msgId, currentUser.id, 'everyone');
    if (ok) {
      setMessages(getVipChatMessages());
      addToast('Message Deleted', 'Message deleted for everyone.', 'info');
    }
  };

  const handleDeleteForMe = async (msgId: string) => {
    setActiveMenuMsgId(null);
    const ok = await deleteVipChatMessage(msgId, currentUser.id, 'me');
    if (ok) {
      setMessages(getVipChatMessages());
      addToast('Message Hidden', 'Message deleted from your view.', 'info');
    }
  };

  const goldenMembers = allUsers.filter(u => u.is_golden_verified || isUserAdmin(u));

  return (
    <div className="bg-[#1C2541] border border-[#334155] rounded-3xl overflow-hidden shadow-xl flex flex-col h-[calc(100vh-8rem)] min-h-[520px]">
      
      {/* Aether Chat Header */}
      <div className="p-4 bg-[#0B132B] border-b border-[#334155] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Aether Chat
            </h2>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{goldenMembers.length} Verified Contributors</span>
            </p>
          </div>
        </div>

        {/* Member Avatars preview */}
        <div className="hidden sm:flex items-center -space-x-2 overflow-hidden">
          {goldenMembers.slice(0, 5).map((m) => (
            <img
              key={m.id}
              src={m.avatar_url}
              alt={m.display_name}
              title={m.display_name}
              onClick={() => onOpenProfile(m)}
              className="w-8 h-8 rounded-full border-2 border-[#0B132B] object-cover cursor-pointer hover:scale-110 transition-transform"
            />
          ))}
        </div>
      </div>

      {/* Messages Stream Container */}
      <div 
        className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#0F172A]/50"
        onClick={() => setActiveMenuMsgId(null)}
      >
        {messages.length === 0 ? (
          <div className="p-8 text-center my-auto">
            <MessageSquare className="w-10 h-10 text-slate-500 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">
              No messages in Aether Chat yet.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === currentUser.id;
            const author = msg.user || currentUser;
            const canDeleteEveryone = isMe || isAdmin;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-xl ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <img
                  src={author.avatar_url}
                  alt={author.display_name}
                  onClick={() => onOpenProfile(author)}
                  className="w-8 h-8 rounded-xl object-cover border border-slate-700 cursor-pointer shrink-0 mt-1"
                />

                <div className={`space-y-1 group relative ${isMe ? 'items-end text-right' : ''}`}>
                  <div className={`flex items-center gap-1.5 text-[11px] text-slate-400 ${isMe ? 'justify-end' : ''}`}>
                    <span
                      onClick={() => onOpenProfile(author)}
                      className="font-bold text-white hover:text-blue-400 cursor-pointer"
                    >
                      {author.display_name}
                    </span>
                    <VerifiedBadge
                      isVerified={author.is_verified}
                      isGoldenVerified={author.is_golden_verified}
                      size="xs"
                    />
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm shadow-sm relative ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-[#1E293B] text-slate-200 border border-[#334155] rounded-tl-none'
                    }`}
                  >
                    {/* Message Text */}
                    {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}

                    {/* Code Snippet Attachment */}
                    {msg.code_snippet && (
                      <div className="mt-2 p-2.5 bg-slate-950/80 border border-slate-700/60 rounded-xl font-mono text-[11px] text-emerald-300 overflow-x-auto">
                        <pre>{msg.code_snippet}</pre>
                      </div>
                    )}

                    {/* Image Attachment */}
                    {msg.image_data && (
                      <img
                        src={msg.image_data}
                        alt="Chat attachment"
                        className="mt-2 max-h-60 rounded-xl object-cover border border-slate-700/50"
                      />
                    )}

                    {/* Options Toggle Button */}
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuMsgId(activeMenuMsgId === msg.id ? null : msg.id);
                        }}
                        className="p-1 text-slate-400 hover:text-white rounded-md bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Options"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {/* Message Options Dropdown */}
                      {activeMenuMsgId === msg.id && (
                        <div 
                          className={`absolute ${isMe ? 'right-0' : 'left-0'} mt-1 w-44 bg-[#0F172A] border border-[#334155] rounded-xl shadow-2xl py-1 z-30 flex flex-col text-xs`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {canDeleteEveryone && (
                            <button
                              onClick={() => handleDeleteForEveryone(msg.id)}
                              className="flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-500/10 text-left transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete for Everyone</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteForMe(msg.id)}
                            className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-800 text-left transition-colors cursor-pointer"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Delete for Me</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Attachments Preview Bar */}
      {(imageData || showCodeInput) && isGolden && (
        <div className="p-3 bg-[#0B132B] border-t border-[#334155] flex flex-wrap gap-2 items-center">
          {imageData && (
            <div className="relative inline-block">
              <img src={imageData} alt="Preview" className="w-14 h-14 rounded-xl object-cover border border-blue-500/50" />
              <button
                onClick={() => setImageData(null)}
                className="absolute -top-1.5 -right-1.5 p-0.5 bg-rose-600 text-white rounded-full cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {showCodeInput && (
            <div className="w-full flex gap-2 items-start">
              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder="Paste code snippet..."
                className="flex-1 bg-[#1E293B] border border-emerald-500/40 rounded-xl p-2 text-xs font-mono text-emerald-300 focus:outline-none h-16 resize-none"
              />
              <button
                onClick={() => {
                  setShowCodeInput(false);
                  setCodeSnippet('');
                }}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Message Composer Bar / Read-Only Notice */}
      {isGolden ? (
        <form onSubmit={handleSendMessage} className="p-3 bg-[#0B132B] border-t border-[#334155] flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-slate-400 hover:text-blue-400 hover:bg-[#1E293B] rounded-xl transition-colors cursor-pointer"
            title="Attach Photo"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowCodeInput(!showCodeInput)}
            className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
              showCodeInput ? 'bg-emerald-600/30 text-emerald-400' : 'text-slate-400 hover:text-emerald-400 hover:bg-[#1E293B]'
            }`}
            title="Attach Code"
          >
            <Code className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type a message to the community..."
            className="flex-1 bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />

          <button
            type="submit"
            disabled={isSending || (!textInput.trim() && !imageData && !codeSnippet.trim())}
            className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition-all font-bold cursor-pointer shrink-0 shadow-sm"
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>
      ) : (
        <div className="p-3.5 bg-[#0B132B] border-t border-[#334155] flex items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Read-only mode. Golden Checkmark is required to send messages in Aether Chat.</span>
          </div>
        </div>
      )}

    </div>
  );
};
