import React, { useState, useRef } from 'react';
import { 
  User, 
  Shield, 
  Sun, 
  Moon, 
  LogOut, 
  Check, 
  Upload, 
  Lock, 
  Eye, 
  EyeOff, 
  Mail, 
  KeyRound, 
  RefreshCw, 
  Send,
  Trash2,
  AlertTriangle,
  Users,
  UserPlus,
  BookOpen,
  Globe,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Compass,
  Layers,
  Database,
  ChevronDown,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import type { Profile, ThemeMode, ToastMessage } from '../../types';
import { 
  createPasswordChangeOtp, 
  verifyPasswordChangeOtp, 
  deleteUserAccount,
  getSavedAccounts,
  switchAccountSession,
  syncWithServer
} from '../../lib/storage';
import { 
  getStoredSupabaseConfig, 
  saveSupabaseConfig, 
  testSupabaseConnection 
} from '../../lib/supabaseClient';
import { sendRealVerificationEmail } from '../../lib/emailService';
import { compressAvatar, compressBanner } from '../../lib/imageUtils';
import { AvatarCropModal } from '../profile/AvatarCropModal';

interface SettingsViewProps {
  currentUser: Profile;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  onUpdateProfile: (updates: Partial<Profile>) => void;
  onSignOut: () => void;
  onOpenAccountSwitcher?: () => void;
  onSwitchAccount?: (userId: string) => void;
  onAddAccount?: () => void;
  addToast: (title: string, desc?: string, type?: ToastMessage['type']) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  themeMode,
  onThemeChange,
  onUpdateProfile,
  onSignOut,
  onOpenAccountSwitcher,
  onSwitchAccount,
  onAddAccount,
  addToast,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'cloud' | 'rules' | 'resources' | 'security' | 'appearance' | 'account'>('info');

  // Supabase Cloud Sync State
  const [supaUrl, setSupaUrl] = useState(() => getStoredSupabaseConfig().url);
  const [supaKey, setSupaKey] = useState(() => getStoredSupabaseConfig().anonKey);
  const [isTestingSupa, setIsTestingSupa] = useState(false);
  const [supaStatus, setSupaStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Profile Info State
  const [firstName, setFirstName] = useState(currentUser.first_name || '');
  const [lastName, setLastName] = useState(currentUser.last_name || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [location, setLocation] = useState(currentUser.location || '');
  const [website, setWebsite] = useState(currentUser.website || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url);
  const [bannerUrl, setBannerUrl] = useState(currentUser.banner_url || '');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [rawAvatarToCrop, setRawAvatarToCrop] = useState('');

  // Email Update State
  const [accountEmail, setAccountEmail] = useState(currentUser.email || '');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Account Management State
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  // Rules Accordion State
  const [expandedRule, setExpandedRule] = useState<string | null>('golden');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Handle Avatar Selection from Local Device
  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawData = event.target?.result as string;
        setRawAvatarToCrop(rawData);
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyCroppedAvatar = async (croppedDataUrl: string) => {
    try {
      const compressed = await compressAvatar(croppedDataUrl);
      setAvatarUrl(compressed);
      onUpdateProfile({ avatar_url: compressed });
      addToast('Profile Avatar Updated', 'Avatar updated across the application.', 'success');
    } catch {
      setAvatarUrl(croppedDataUrl);
      onUpdateProfile({ avatar_url: croppedDataUrl });
    }
  };

  // Handle Banner Selection from Local Device
  const handleBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressBanner(file);
        setBannerUrl(compressed);
        onUpdateProfile({ banner_url: compressed });
        addToast('Cover Banner Updated', 'Banner updated across your profile.', 'success');
      } catch {
        const reader = new FileReader();
        reader.onload = (event) => {
          const res = event.target?.result as string;
          setBannerUrl(res);
          onUpdateProfile({ banner_url: res });
          addToast('Cover Banner Updated', 'Banner saved.', 'success');
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Save Profile Info
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateProfile({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      display_name: `${firstName.trim()} ${lastName.trim()}`.trim() || currentUser.username,
      bio: bio.trim(),
      location: location.trim(),
      website: website.trim(),
      email: accountEmail.trim().toLowerCase(),
      avatar_url: avatarUrl,
      banner_url: bannerUrl,
    });
    addToast('Profile Updated', 'Your profile details have been saved.', 'success');
  };

  // Supabase Cloud Sync Save & Test
  const handleSaveCloudSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supaUrl.trim() || !supaKey.trim()) {
      addToast('Missing Details', 'Please enter both Supabase Project URL and Anon API Key.', 'info');
      return;
    }

    try {
      setIsTestingSupa(true);
      setSupaStatus(null);
      saveSupabaseConfig({
        url: supaUrl.trim(),
        anonKey: supaKey.trim(),
        isEnabled: true,
      });
      const testRes = await testSupabaseConnection(supaUrl.trim(), supaKey.trim());
      setSupaStatus(testRes);

      if (testRes.success) {
        await syncWithServer();
        addToast('Cloud Sync Active', 'Connected to Supabase Cloud database.', 'success');
      } else {
        addToast('Connection Failed', testRes.message, 'info');
      }
    } catch (err: any) {
      setSupaStatus({ success: false, message: err?.message || 'Connection error' });
      addToast('Connection Error', err?.message || 'Check your keys', 'info');
    } finally {
      setIsTestingSupa(false);
    }
  };

  // Handle Send Password Change OTP
  const handleSendOtp = async () => {
    if (!currentPassword) {
      addToast('Validation Error', 'Enter your current password first.', 'info');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      addToast('Validation Error', 'New password must be at least 6 characters.', 'info');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('Validation Error', 'New passwords do not match.', 'info');
      return;
    }

    try {
      setIsSendingOtp(true);
      const { otp_code } = createPasswordChangeOtp(currentUser.id, currentUser.email);
      await sendRealVerificationEmail({
        toEmail: currentUser.email,
        toName: currentUser.display_name,
        otpCode: otp_code,
      });
      setOtpSent(true);
      addToast('Verification Code Sent', `Security OTP sent to ${currentUser.email}`, 'success');
    } catch (err: any) {
      addToast('Delivery Notice', 'Security code prepared. Check your email.', 'info');
      setOtpSent(true);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle Verify OTP & Commit Password Change
  const handleVerifyOtpAndChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      addToast('Validation Error', 'Enter the 6-digit security OTP.', 'info');
      return;
    }

    try {
      setIsVerifyingOtp(true);
      const success = await verifyPasswordChangeOtp(currentUser.id, otpCode.trim(), newPassword);
      if (success) {
        addToast('Password Changed', 'Password updated successfully.', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setOtpCode('');
        setOtpSent(false);
      } else {
        addToast('Invalid Code', 'The OTP is incorrect or expired. Try again.', 'info');
      }
    } catch (err: any) {
      addToast('Error', err?.message || 'Could not update password.', 'info');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== currentUser.username) {
      addToast('Confirmation Error', `Type "${currentUser.username}" exactly to confirm deletion.`, 'info');
      return;
    }

    const success = await deleteUserAccount(currentUser.id);
    if (success) {
      addToast('Account Deleted', 'Your account has been deleted.', 'info');
      onSignOut();
    }
  };

  const navItems = [
    { id: 'info', label: 'Profile Details', icon: User },
    { id: 'cloud', label: 'Cloud Database Sync', icon: Database },
    { id: 'rules', label: 'Ecosystem Rules & Roles', icon: BookOpen },
    { id: 'resources', label: 'Official Dlicom Resources', icon: Globe },
    { id: 'security', label: 'Security & Password', icon: Lock },
    { id: 'appearance', label: 'Appearance & Theme', icon: Sun },
    { id: 'account', label: 'Account Sessions', icon: Users },
  ] as const;

  return (
    <div className="bg-[#1C2541] border border-[#334155] rounded-3xl overflow-hidden shadow-xl flex flex-col md:flex-row min-h-[600px] my-2">
      
      {/* Left Vertical Sidebar Navigation */}
      <div className="w-full md:w-64 border-r border-[#334155] bg-[#0B132B] p-3 flex flex-col gap-1 shrink-0">
        <div className="p-3 mb-2 border-b border-[#334155]/60">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Settings & Workspace
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Manage your preferences</p>
        </div>

        <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer text-left ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#1E293B]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Main Content Area */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#0F172A]/40">
        
        {/* TAB 1: Profile Details */}
        {activeTab === 'info' && (
          <form onSubmit={handleSaveInfo} className="space-y-5 max-w-2xl">
            <div>
              <h3 className="text-sm font-bold text-white">Profile Details</h3>
              <p className="text-xs text-slate-400 mt-0.5">Update your public name, bio, and media assets.</p>
            </div>

            {/* Photo Uploads from Local Device */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#0B132B] border border-[#334155] rounded-2xl">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Profile Avatar
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-700"
                  />
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFile}
                    className="hidden"
                  />
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="px-3 py-1.5 bg-[#1E293B] hover:bg-[#2A3756] border border-[#334155] rounded-xl text-xs font-semibold text-slate-200 cursor-pointer"
                    >
                      Upload Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRawAvatarToCrop(avatarUrl);
                        setIsCropModalOpen(true);
                      }}
                      className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-xl text-[11px] font-semibold text-blue-300 cursor-pointer"
                    >
                      Adjust Size
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Cover Banner
                </label>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="w-full h-14 rounded-2xl border border-dashed border-[#334155] hover:border-blue-500 bg-[#1E293B]/50 flex items-center justify-center gap-2 text-xs text-slate-400 font-semibold cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-blue-400" />
                  <span>Upload Banner</span>
                </button>
              </div>
            </div>

            {/* Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            {/* Email & Username */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Account Email
                </label>
                <input
                  type="email"
                  required
                  value={accountEmail}
                  onChange={(e) => setAccountEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  disabled
                  value={`@${currentUser.username}`}
                  className="w-full px-3 py-2 bg-[#0B132B]/60 border border-[#334155]/60 text-slate-500 rounded-xl text-xs cursor-not-allowed font-mono"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Bio
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the community about yourself..."
                className="w-full px-3 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white resize-none"
              />
            </div>

            {/* Location & Website */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full px-3 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Website / Portfolio
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Save Profile Changes
            </button>
          </form>
        )}

        {/* TAB 2: Cloud Database Sync */}
        {activeTab === 'cloud' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <h3 className="text-sm font-bold text-white">Cloud Database Synchronization</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Connect your Supabase project to synchronize posts, votes, comments, and messages in real time.
              </p>
            </div>

            <form onSubmit={handleSaveCloudSync} className="p-5 bg-[#0B132B] border border-[#334155] rounded-2xl space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  required
                  value={supaUrl}
                  onChange={(e) => setSupaUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3 py-2 bg-[#1E293B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Supabase Anon Key
                </label>
                <input
                  type="password"
                  required
                  value={supaKey}
                  onChange={(e) => setSupaKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                  className="w-full px-3 py-2 bg-[#1E293B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white font-mono"
                />
              </div>

              {supaStatus && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  supaStatus.success ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                }`}>
                  {supaStatus.success ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
                  <span>{supaStatus.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isTestingSupa}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-2"
              >
                {isTestingSupa ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Testing Connection...</span>
                  </>
                ) : (
                  <span>Test & Save Cloud Sync</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: Ecosystem Rules & Roles (Interactive Accordion) */}
        {activeTab === 'rules' && (
          <div className="space-y-4 max-w-2xl">
            <div>
              <h3 className="text-sm font-bold text-white">Ecosystem Rules & Roles</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any section below to view detailed guidelines and role requirements.
              </p>
            </div>

            {/* Accordion 1: Golden Checkmark */}
            <div className="border border-[#334155] rounded-2xl bg-[#0B132B] overflow-hidden">
              <button
                onClick={() => setExpandedRule(expandedRule === 'golden' ? null : 'golden')}
                className="w-full p-4 flex items-center justify-between text-left font-bold text-xs text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>Golden Checkmark Guidelines</span>
                </div>
                {expandedRule === 'golden' ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              </button>

              {expandedRule === 'golden' && (
                <div className="p-4 border-t border-[#334155]/60 bg-[#0F172A]/60 text-xs text-slate-300 space-y-2.5 leading-relaxed">
                  <p>
                    The Golden Checkmark is a premier verification badge awarded to distinguished creators and leaders on Aether Feed.
                  </p>
                  <div className="space-y-1.5 pl-3 border-l-2 border-blue-500">
                    <p><strong>Privileges:</strong> Full posting access to Aether Chat, highlighted verified presence across feeds, and priority content visibility.</p>
                    <p><strong>How to Earn:</strong> Build net upvotes by publishing quality visual and technical content, maintain respectful community interactions, and receive direct approval from platform administrators.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 2: DLIVER Role */}
            <div className="border border-[#334155] rounded-2xl bg-[#0B132B] overflow-hidden">
              <button
                onClick={() => setExpandedRule(expandedRule === 'dliver' ? null : 'dliver')}
                className="w-full p-4 flex items-center justify-between text-left font-bold text-xs text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <span>DLIVER Role (Content & Delivery Tier)</span>
                </div>
                {expandedRule === 'dliver' ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              </button>

              {expandedRule === 'dliver' && (
                <div className="p-4 border-t border-[#334155]/60 bg-[#0F172A]/60 text-xs text-slate-300 space-y-2.5 leading-relaxed">
                  <p>
                    DLIVER represents the content distribution and active creator tier within the Dlicom SocialFi ecosystem on Base.
                  </p>
                  <div className="space-y-1.5 pl-3 border-l-2 border-emerald-500">
                    <p><strong>Responsibilities:</strong> Distribute high-value SocialFi media, run telemetry workflows, and participate in community content campaigns.</p>
                    <p><strong>Reward Model:</strong> Earn creator tips and social engagement rewards via on-chain smart contracts on Base network.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 3: DECODED Role */}
            <div className="border border-[#334155] rounded-2xl bg-[#0B132B] overflow-hidden">
              <button
                onClick={() => setExpandedRule(expandedRule === 'decoded' ? null : 'decoded')}
                className="w-full p-4 flex items-center justify-between text-left font-bold text-xs text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span>DECODED Role (Technical Builders & Analysts)</span>
                </div>
                {expandedRule === 'decoded' ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              </button>

              {expandedRule === 'decoded' && (
                <div className="p-4 border-t border-[#334155]/60 bg-[#0F172A]/60 text-xs text-slate-300 space-y-2.5 leading-relaxed">
                  <p>
                    DECODED is assigned to developers, smart contract auditors, and node telemetry engineers contributing technical infrastructure to Dlicom.
                  </p>
                  <div className="space-y-1.5 pl-3 border-l-2 border-cyan-500">
                    <p><strong>Focus Areas:</strong> Smart contract telemetry, self-custody wallet integrations, encrypted messaging protocols, and dApp tooling.</p>
                    <p><strong>Recognition:</strong> Technical recognition badges and priority review for ecosystem developer grants.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 4: DCO Role */}
            <div className="border border-[#334155] rounded-2xl bg-[#0B132B] overflow-hidden">
              <button
                onClick={() => setExpandedRule(expandedRule === 'dco' ? null : 'dco')}
                className="w-full p-4 flex items-center justify-between text-left font-bold text-xs text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>DCO Role (Dlicom Community Officers)</span>
                </div>
                {expandedRule === 'dco' ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              </button>

              {expandedRule === 'dco' && (
                <div className="p-4 border-t border-[#334155]/60 bg-[#0F172A]/60 text-xs text-slate-300 space-y-2.5 leading-relaxed">
                  <p>
                    Dlicom Community Officers (DCO) are senior community leaders responsible for moderation, conflict resolution, and platform integrity.
                  </p>
                  <div className="space-y-1.5 pl-3 border-l-2 border-amber-500">
                    <p><strong>Governance:</strong> Enforce community guidelines, manage spam reports, and coordinate platform safety.</p>
                    <p><strong>Appointment:</strong> Appointed through verified community standing and admin consensus.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 5: General Platform Rules */}
            <div className="border border-[#334155] rounded-2xl bg-[#0B132B] overflow-hidden">
              <button
                onClick={() => setExpandedRule(expandedRule === 'general' ? null : 'general')}
                className="w-full p-4 flex items-center justify-between text-left font-bold text-xs text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <span>General Content & Voting Ethics</span>
                </div>
                {expandedRule === 'general' ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              </button>

              {expandedRule === 'general' && (
                <div className="p-4 border-t border-[#334155]/60 bg-[#0F172A]/60 text-xs text-slate-300 space-y-2.5 leading-relaxed">
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    <li>Only share original or properly attributed visual and written content.</li>
                    <li>Upvote content based on genuine quality and contribution value.</li>
                    <li>Prohibited: automated bot voting, hateful speech, and fraudulent schemes.</li>
                    <li>Violations may result in posting timeouts or permanent account suspension.</li>
                  </ul>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 4: Official Dlicom Resources */}
        {activeTab === 'resources' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <h3 className="text-sm font-bold text-white">Official Dlicom Resources</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Official links, documentation, and architecture notes for Dlicom SocialFi on Base.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <a
                href="https://dlicom.io/"
                target="_blank"
                rel="noreferrer"
                className="p-4 bg-[#0B132B] hover:bg-[#1E293B] border border-[#334155] rounded-2xl flex items-center justify-between group transition-colors"
              >
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                    Official Website
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">https://dlicom.io/</p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
              </a>

              <a
                href="https://dlicom.io/"
                target="_blank"
                rel="noreferrer"
                className="p-4 bg-[#0B132B] hover:bg-[#1E293B] border border-[#334155] rounded-2xl flex items-center justify-between group transition-colors"
              >
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                    DLI Token & Presale
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">SocialFi on Base Network</p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
              </a>
            </div>

            <div className="p-4 bg-[#0B132B] border border-[#334155] rounded-2xl text-xs text-slate-300 space-y-2 leading-relaxed">
              <h4 className="font-bold text-white">About Dlicom Ecosystem</h4>
              <p>
                Dlicom ($DLI) is an AI-powered, privacy-first SocialFi platform on the Base network featuring self-custody EVM wallets, encrypted communication, creator monetization, and community-driven content feeds.
              </p>
            </div>
          </div>
        )}

        {/* TAB 5: Security & Password */}
        {activeTab === 'security' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <h3 className="text-sm font-bold text-white">Security & Password</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Update your account password using two-factor email verification.
              </p>
            </div>

            {!otpSent ? (
              <div className="p-5 bg-[#0B132B] border border-[#334155] rounded-2xl space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1E293B] border border-[#334155] rounded-xl text-xs text-white pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    New Password (Min. 6 characters)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1E293B] border border-[#334155] rounded-xl text-xs text-white pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1E293B] border border-[#334155] rounded-xl text-xs text-white pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isSendingOtp}
                  onClick={handleSendOtp}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingOtp ? 'Sending Security Code...' : 'Send Security OTP to Email'}</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtpAndChangePassword} className="p-5 bg-[#0B132B] border border-[#334155] rounded-2xl space-y-4">
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-300">
                  Enter the 6-digit OTP code sent to <strong>{currentUser.email}</strong>.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full px-3 py-2 bg-[#1E293B] border border-[#334155] rounded-xl text-sm font-mono text-center tracking-widest text-white"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isVerifyingOtp}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    {isVerifyingOtp ? 'Updating Password...' : 'Verify & Save Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="px-4 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 6: Appearance & Theme */}
        {activeTab === 'appearance' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <h3 className="text-sm font-bold text-white">Appearance & Theme</h3>
              <p className="text-xs text-slate-400 mt-0.5">Customize your interface lighting mode.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => onThemeChange('dark')}
                className={`p-5 rounded-2xl border text-left flex flex-col gap-3 transition-all cursor-pointer ${
                  themeMode === 'dark'
                    ? 'bg-blue-600/20 border-blue-500 text-white'
                    : 'bg-[#0B132B] border-[#334155] text-slate-400 hover:text-white'
                }`}
              >
                <Moon className="w-6 h-6 text-blue-400" />
                <div>
                  <h4 className="font-bold text-xs">Dark Mode</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Deep slate & navy palette</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onThemeChange('light')}
                className={`p-5 rounded-2xl border text-left flex flex-col gap-3 transition-all cursor-pointer ${
                  themeMode === 'light'
                    ? 'bg-blue-600/20 border-blue-500 text-white'
                    : 'bg-[#0B132B] border-[#334155] text-slate-400 hover:text-white'
                }`}
              >
                <Sun className="w-6 h-6 text-amber-400" />
                <div>
                  <h4 className="font-bold text-xs">Light Mode</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Clean high-contrast theme</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* TAB 7: Account Sessions */}
        {activeTab === 'account' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-sm font-bold text-white">Account Sessions</h3>
              <p className="text-xs text-slate-400 mt-0.5">Manage active sessions or sign out.</p>
            </div>

            {/* Switch / Add Account */}
            <div className="p-4 bg-[#0B132B] border border-[#334155] rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-white">Saved Account Switcher</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onOpenAccountSwitcher}
                  className="px-4 py-2 bg-[#1E293B] hover:bg-[#2A3756] border border-[#334155] rounded-xl text-xs font-semibold text-slate-200 cursor-pointer flex items-center gap-2"
                >
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span>Switch Account</span>
                </button>
                <button
                  type="button"
                  onClick={onAddAccount}
                  className="px-4 py-2 bg-[#1E293B] hover:bg-[#2A3756] border border-[#334155] rounded-xl text-xs font-semibold text-slate-200 cursor-pointer flex items-center gap-2"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Add Another Account</span>
                </button>
              </div>
            </div>

            {/* Sign Out */}
            <div className="p-4 bg-[#0B132B] border border-[#334155] rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">Sign Out of Session</h4>
                <p className="text-[11px] text-slate-400">End your current session on this device.</p>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Danger Zone: Delete Account */}
            <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-rose-400">Danger Zone</h4>
              <p className="text-[11px] text-slate-400">
                Permanently delete your account, posts, votes, and messages from the platform.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(true)}
                className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </button>
            </div>

            {/* Delete Confirm Modal */}
            {showDeleteConfirmModal && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-[#1C2541] border border-rose-500/40 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                  <h4 className="text-sm font-bold text-rose-400">Confirm Permanent Deletion</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    This action cannot be undone. To confirm, type your username <strong className="text-white font-mono">@{currentUser.username}</strong> below:
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={currentUser.username}
                    className="w-full px-3 py-2 bg-[#0B132B] border border-[#334155] rounded-xl text-xs text-white font-mono"
                  />
                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirmModal(false)}
                      className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
                    >
                      Permanently Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Avatar Cropper Modal */}
      {isCropModalOpen && (
        <AvatarCropModal
          isOpen={isCropModalOpen}
          imageSrc={rawAvatarToCrop}
          onCropComplete={handleApplyCroppedAvatar}
          onClose={() => setIsCropModalOpen(false)}
        />
      )}

    </div>
  );
};
