import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Search, 
  MessageSquare, 
  Trash2, 
  EyeOff, 
  MoreVertical, 
  User, 
  ChevronLeft,
  Check,
  CheckCheck
} from 'lucide-react';
import type { Profile, DirectMessage, ToastMessage } from '../../types';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { 
  DEFAULT_DLICOM_AVATAR, 
  getDirectMessages, 
  getDmConversations, 
  sendDirectMessage, 
  deleteDirectMessage,
  markDirectMessagesAsRead,
  syncWithServer,
  isUserAdmin 
} from '../../lib/storage';

interface DirectMessagesViewProps {
  currentUser: Profile;
  allUsers: Profile[];
  initialRecipientId?: string | null;
  addToast: (title: string, desc?: string, type?: ToastMessage['type']) => void;
  onOpenProfile: (user: Profile) => void;
}

export const DirectMessagesView: React.FC<DirectMessagesViewProps> = ({
  currentUser,
  allUsers,
  initialRecipientId,
  addToast,
  onOpenProfile,
}) => {
  const isAdmin = isUserAdmin(currentUser);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [conversations, setConversations] = useState<Array<{
    contact: Profile;
    lastMessage: DirectMessage;
    unreadCount: number;
  }>>(() => getDmConversations(currentUser.id));
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeMenuMsgId, setActiveMenuMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Set initial selected user if provided via prop
  useEffect(() => {
    if (initialRecipientId) {
      const target = allUsers.find(u => u.id === initialRecipientId);
      if (target && target.id !== currentUser.id) {
        setSelectedUser(target);
      }
    } else if (!selectedUser && conversations.length > 0) {
      setSelectedUser(conversations[0].contact);
    }
  }, [initialRecipientId, allUsers, conversations, currentUser.id]);

  // Load messages & mark as read when selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      markDirectMessagesAsRead(currentUser.id, selectedUser.id);
      setMessages(getDirectMessages(currentUser.id, selectedUser.id));
      setConversations(getDmConversations(currentUser.id));
      scrollToBottom();
    } else {
      setMessages([]);
    }
  }, [selectedUser, currentUser.id]);

  // Sync listener & live polling
  useEffect(() => {
    const handleSync = () => {
      setConversations(getDmConversations(currentUser.id));
      if (selectedUser) {
        markDirectMessagesAsRead(currentUser.id, selectedUser.id);
        setMessages(getDirectMessages(currentUser.id, selectedUser.id));
      }
    };

    const pollInterval = setInterval(async () => {
      await syncWithServer();
      handleSync();
    }, 1200);

    window.addEventListener('aether_storage_sync', handleSync);
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('aether_storage_sync', handleSync);
    };
  }, [currentUser.id, selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedUser || !inputText.trim() || isSending) return;

    try {
      setIsSending(true);
      await sendDirectMessage(currentUser.id, selectedUser.id, inputText.trim());
      setInputText('');
      setMessages(getDirectMessages(currentUser.id, selectedUser.id));
      setConversations(getDmConversations(currentUser.id));
      scrollToBottom();
    } catch (err) {
      addToast('Send Failed', 'Could not send direct message.', 'info');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteForEveryone = async (msgId: string) => {
    setActiveMenuMsgId(null);
    if (!selectedUser) return;
    const ok = await deleteDirectMessage(msgId, 'everyone', currentUser.id);
    if (ok) {
      setMessages(getDirectMessages(currentUser.id, selectedUser.id));
      setConversations(getDmConversations(currentUser.id));
      addToast('Message Deleted', 'Message removed for everyone.', 'info');
    }
  };

  const handleDeleteForMe = async (msgId: string) => {
    setActiveMenuMsgId(null);
    if (!selectedUser) return;
    const ok = await deleteDirectMessage(msgId, 'me', currentUser.id);
    if (ok) {
      setMessages(getDirectMessages(currentUser.id, selectedUser.id));
      setConversations(getDmConversations(currentUser.id));
      addToast('Message Hidden', 'Message removed from your view.', 'info');
    }
  };

  // Filtered search list for finding new contacts
  const filteredUsers = allUsers.filter(u => 
    u.id !== currentUser.id &&
    (u.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     u.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-[#1C2541] border border-[#334155] rounded-3xl overflow-hidden shadow-xl flex flex-col md:flex-row h-[calc(100vh-8rem)] min-h-[520px]">
      
      {/* Left Pane: Conversations & User Search */}
      <div className={`w-full md:w-80 border-r border-[#334155] bg-[#0B132B] flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Header & Search Bar */}
        <div className="p-4 border-b border-[#334155]/60 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span>Direct Messages</span>
            </h2>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people to message..."
              className="w-full bg-[#1E293B] border border-[#334155] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Conversation List / Search Results */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#334155]/30">
          {searchQuery.trim() ? (
            <div className="p-2 space-y-1">
              <p className="text-[11px] font-semibold text-slate-400 px-3 py-1 uppercase tracking-wider">
                Search Results ({filteredUsers.length})
              </p>
              {filteredUsers.length === 0 ? (
                <p className="text-xs text-slate-500 p-4 text-center">No members found.</p>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setSelectedUser(user);
                      setSearchQuery('');
                    }}
                    className={`w-full p-2.5 rounded-2xl flex items-center gap-3 text-left transition-colors cursor-pointer ${
                      selectedUser?.id === user.id ? 'bg-blue-600/20 text-white' : 'hover:bg-[#1E293B] text-slate-300'
                    }`}
                  >
                    <img
                      src={user.avatar_url || DEFAULT_DLICOM_AVATAR}
                      alt={user.display_name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-white truncate">{user.display_name}</span>
                        <VerifiedBadge isVerified={user.is_verified} isGoldenVerified={user.is_golden_verified} size="xs" />
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">@{user.username}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-slate-500 space-y-2">
                  <User className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-xs">No conversations yet. Use the search bar above to start a message.</p>
                </div>
              ) : (
                conversations.map(({ contact, lastMessage, unreadCount }) => (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedUser(contact)}
                    className={`w-full p-3 rounded-2xl flex items-center gap-3 text-left transition-colors cursor-pointer ${
                      selectedUser?.id === contact.id ? 'bg-blue-600/20 text-white border border-blue-500/30' : 'hover:bg-[#1E293B] text-slate-300'
                    }`}
                  >
                    <img
                      src={contact.avatar_url || DEFAULT_DLICOM_AVATAR}
                      alt={contact.display_name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-700 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="font-bold text-xs text-white truncate">{contact.display_name}</span>
                          <VerifiedBadge isVerified={contact.is_verified} isGoldenVerified={contact.is_golden_verified} size="xs" />
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          {new Date(lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-xs text-slate-400 truncate">{lastMessage.text}</p>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

      </div>

      {/* Right Pane: 1-on-1 Chat Thread */}
      <div className={`flex-1 flex flex-col bg-[#0F172A]/50 ${!selectedUser ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {selectedUser ? (
          <>
            {/* Direct Message Contact Header */}
            <div className="p-3.5 bg-[#0B132B] border-b border-[#334155] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-[#1E293B] cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <img
                  src={selectedUser.avatar_url || DEFAULT_DLICOM_AVATAR}
                  alt={selectedUser.display_name}
                  onClick={() => onOpenProfile(selectedUser)}
                  className="w-9 h-9 rounded-full object-cover border border-slate-700 cursor-pointer"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span 
                      onClick={() => onOpenProfile(selectedUser)}
                      className="font-bold text-sm text-white hover:text-blue-400 cursor-pointer"
                    >
                      {selectedUser.display_name}
                    </span>
                    <VerifiedBadge isVerified={selectedUser.is_verified} isGoldenVerified={selectedUser.is_golden_verified} size="xs" />
                  </div>
                  <p className="text-[11px] text-slate-400">@{selectedUser.username}</p>
                </div>
              </div>

              <button
                onClick={() => onOpenProfile(selectedUser)}
                className="px-3 py-1.5 bg-[#1E293B] hover:bg-[#2A3756] border border-[#334155] rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                View Profile
              </button>
            </div>

            {/* Direct Messages List */}
            <div 
              className="flex-1 p-4 overflow-y-auto space-y-3.5"
              onClick={() => setActiveMenuMsgId(null)}
            >
              {messages.length === 0 ? (
                <div className="p-12 text-center my-auto space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">
                    This is the start of your direct conversation with {selectedUser.display_name}.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === currentUser.id;
                  const canDeleteEveryone = isMe || isAdmin;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-sm sm:max-w-md ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      <div className="group relative">
                        <div
                          className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words ${
                            isMe
                              ? 'bg-blue-600 text-white rounded-tr-none shadow-sm'
                              : 'bg-[#1E293B] text-slate-200 border border-[#334155] rounded-tl-none'
                          }`}
                        >
                          {msg.text}
                        </div>

                        {/* Options button */}
                        <div className={`absolute top-1 ${isMe ? '-left-7' : '-right-7'}`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuMsgId(activeMenuMsgId === msg.id ? null : msg.id);
                            }}
                            className="p-1 text-slate-500 hover:text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Options"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {/* Options Menu */}
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

                      <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-slate-400 font-mono">
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && (
                          msg.is_read ? (
                            <span title="Read / Seen" className="inline-flex items-center">
                              <CheckCheck className="w-3.5 h-3.5 text-blue-400 shrink-0 stroke-[2.5]" />
                            </span>
                          ) : (
                            <span title="Delivered" className="inline-flex items-center">
                              <CheckCheck className="w-3.5 h-3.5 text-slate-500 shrink-0 stroke-2" />
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Direct Message Input Composer */}
            <form onSubmit={handleSendMessage} className="p-3 bg-[#0B132B] border-t border-[#334155] flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Message @${selectedUser.username}...`}
                className="flex-1 bg-[#1E293B] border border-[#334155] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition-all font-bold cursor-pointer shrink-0 shadow-sm"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>
          </>
        ) : (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <MessageSquare className="w-12 h-12 mx-auto text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-300">Select a conversation</h3>
            <p className="text-xs max-w-xs mx-auto">
              Choose a person from the list on the left or search for any member to start messaging.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
