import React, { useState, useRef } from 'react';
import { 
  X, 
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
  Award,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Cpu,
  Layers,
  Compass,
  Cloud,
  Database
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

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
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
  const [tab, setTab] = useState<'info' | 'cloud' | 'rules' | 'resources' | 'security' | 'appearance' | 'account'>('info');

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

  // Security & Password Change State (with Email Code)
  const [newPassword, setNewPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [passwordOtpDigits, setPasswordOtpDigits] = useState(['', '', '', '', '', '']);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleTestAndSaveSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingSupa(true);
    setSupaStatus(null);

    const res = await testSupabaseConnection(supaUrl.trim(), supaKey.trim());
    setIsTestingSupa(false);
    setSupaStatus(res);

    if (res.success) {
      saveSupabaseConfig({
        url: supaUrl.trim(),
        anonKey: supaKey.trim(),
        isEnabled: true,
      });
      addToast('Supabase Connected', 'Cloud database real-time sync is now 100% active!', 'success');
      syncWithServer();
    } else {
      addToast('Connection Failed', res.message, 'info');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toUpperCase() !== 'DELETE') {
      addToast('Confirmation Error', 'Please type DELETE to confirm.', 'info');
      return;
    }

    setIsDeletingAccount(true);
    try {
      await deleteUserAccount(currentUser.id);
      addToast('Account Deleted', 'Your profile and data have been permanently removed.', 'info');
      onClose();
      onSignOut();
    } catch (e) {
      addToast('Delete Failed', 'Could not delete account. Please try again.', 'info');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Handle Local Avatar File Upload with Crop / Sizing Adjuster
  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setRawAvatarToCrop(event.target?.result as string);
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Local Banner File Upload with Instant Compression
  const handleBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressBanner(file);
        setBannerUrl(compressed);
        addToast('Banner Loaded', 'Cover banner optimized.', 'success');
      } catch {
        const reader = new FileReader();
        reader.onload = (event) => {
          setBannerUrl(event.target?.result as string);
          addToast('Banner Updated', 'Cover photo loaded from device.', 'success');
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Save Profile Info
  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      bio: bio.trim(),
      location: location.trim(),
      website: website.trim(),
      avatar_url: avatarUrl,
      banner_url: bannerUrl,
    });
    addToast('Profile Saved', 'Profile details updated.', 'success');
    onClose();
  };

  // Save Email Address
  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountEmail.trim()) return;
    onUpdateProfile({
      email: accountEmail.trim(),
    });
    addToast('Email Updated', 'Account email address updated.', 'success');
  };

  // Password Security Strength
  const isPassLengthValid = newPassword.length >= 8;

  // Send OTP for Password Change
  const handleSendPasswordOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPassLengthValid) {
      addToast('Password Too Short', 'Password must be at least 8 characters long.', 'info');
      return;
    }

    setIsSendingCode(true);

    const { otp_code } = createPasswordChangeOtp(currentUser.id, currentUser.email);

    const res = await sendRealVerificationEmail({
      toEmail: currentUser.email,
      toName: currentUser.display_name,
      otpCode: otp_code,
    });

    setIsSendingCode(false);
    setIsOtpSent(true);
    setPasswordOtpDigits(['', '', '', '', '', '']);

    if (res.success) {
      addToast('Code Sent', `6-digit security code sent to ${currentUser.email}.`, 'success');
    } else {
      addToast('Email Dispatch', res.message, 'info');
    }
  };

  // Handle Password OTP change
  const handleOtpBoxChange = (index: number, val: string) => {
    if (!/^[0-9]?$/.test(val)) return;
    const newArr = [...passwordOtpDigits];
    newArr[index] = val;
    setPasswordOtpDigits(newArr);

    if (val && index < 5) {
      const nextInput = document.getElementById(`pass-otp-box-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Confirm Password Change with Code
  const handleConfirmPasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = passwordOtpDigits.join('');
    if (entered.length < 6) {
      addToast('Incomplete Code', 'Please enter all 6 digits of the code.', 'info');
      return;
    }

    const res = verifyPasswordChangeOtp(currentUser.id, entered, newPassword.trim());
    if (res.success) {
      addToast('Password Updated', 'Your account password has been changed securely.', 'success');
      setNewPassword('');
      setIsOtpSent(false);
      onClose();
    } else {
      addToast('Verification Error', res.message, 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B132B]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#1C2541] border border-[#334155] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#334155] bg-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white tracking-tight">
              Settings & Preferences
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#334155] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 7 Tabs Bar */}
        <div className="grid grid-cols-4 sm:grid-cols-7 border-b border-[#334155] bg-[#1C2541] text-xs font-semibold">
          <button
            onClick={() => setTab('info')}
            className={`py-3 text-center border-b-2 transition-all ${
              tab === 'info' ? 'border-blue-500 text-white bg-[#1E293B]' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Profile Info
          </button>
          <button
            onClick={() => setTab('cloud')}
            className={`py-3 text-center border-b-2 transition-all flex items-center justify-center gap-1 ${
              tab === 'cloud' ? 'border-emerald-500 text-emerald-300 bg-[#1E293B]' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Cloud Sync</span>
          </button>
          <button
            onClick={() => setTab('rules')}
            className={`py-3 text-center border-b-2 transition-all ${
              tab === 'rules' ? 'border-amber-500 text-amber-300 bg-[#1E293B]' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Rules & Roles
          </button>
          <button
            onClick={() => setTab('resources')}
            className={`py-3 text-center border-b-2 transition-all ${
              tab === 'resources' ? 'border-blue-500 text-white bg-[#1E293B]' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Resources
          </button>
          <button
            onClick={() => setTab('security')}
            className={`py-3 text-center border-b-2 transition-all ${
              tab === 'security' ? 'border-blue-500 text-white bg-[#1E293B]' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Security
          </button>
          <button
            onClick={() => setTab('appearance')}
            className={`py-3 text-center border-b-2 transition-all ${
              tab === 'appearance' ? 'border-blue-500 text-white bg-[#1E293B]' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Appearance
          </button>
          <button
            onClick={() => setTab('account')}
            className={`py-3 text-center border-b-2 transition-all ${
              tab === 'account' ? 'border-rose-500 text-rose-300 bg-[#1E293B]' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Account
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* TAB 1: Profile Info */}
          {tab === 'info' && (
            <form onSubmit={handleSaveInfo} className="space-y-4">
              
              {/* Photo Uploads from Local Device */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[#334155]">
                {/* Avatar */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Profile Avatar (from Device)
                  </label>
                  <div className="flex items-center gap-3">
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500/50"
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
                        className="px-3 py-1.5 bg-[#0B132B] hover:bg-[#1E293B] border border-[#334155] rounded-xl text-xs font-semibold text-blue-300 cursor-pointer text-center"
                      >
                        Upload Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRawAvatarToCrop(avatarUrl);
                          setIsCropModalOpen(true);
                        }}
                        className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 rounded-xl text-[11px] font-semibold text-blue-200 cursor-pointer text-center"
                      >
                        Adjust / Fit Size
                      </button>
                    </div>
                  </div>
                </div>

                {/* Banner */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Cover Banner (from Device)
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
                    className="w-full h-14 rounded-2xl border border-dashed border-[#334155] hover:border-blue-500 bg-[#0B132B] flex items-center justify-center gap-1.5 text-xs text-slate-400 font-semibold"
                  >
                    <Upload className="w-4 h-4 text-blue-400" />
                    <span>Upload Banner</span>
                  </button>
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-2 gap-3">
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

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Short Bio
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white resize-none"
                />
              </div>

              {/* Location & Website */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Mumbai, India"
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
                    placeholder="https://mysite.com"
                    className="w-full px-3 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#334155] flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-glow"
                >
                  Save Profile Details
                </button>
              </div>

            </form>
          )}

          {/* TAB 2: Supabase Cloud Sync */}
          {tab === 'cloud' && (
            <div className="space-y-6 text-xs animate-in fade-in duration-200">
              <div className="p-5 bg-[#0B132B] rounded-2xl border border-emerald-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Cloud className="w-5 h-5" />
                    <h4 className="text-sm font-bold text-white tracking-wide">
                      Supabase Cloud Database & Real-Time Cross-Device Sync
                    </h4>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold rounded-lg flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Cloud Engine
                  </span>
                </div>
                
                <p className="text-slate-300 leading-relaxed">
                  Enter your official Supabase Project URL and Anon Public Key below to enable 100% real-time cross-device synchronization for posts, profile changes, golden checkmarks, and admin permissions across all devices.
                </p>

                <form onSubmit={handleTestAndSaveSupabase} className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Supabase Project URL
                    </label>
                    <input
                      type="url"
                      required
                      value={supaUrl}
                      onChange={(e) => setSupaUrl(e.target.value)}
                      placeholder="https://your-project.supabase.co"
                      className="w-full px-3 py-2 bg-[#1C2541] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Supabase Anon Public API Key (JWT Key starting with eyJ...)
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={supaKey}
                      onChange={(e) => setSupaKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full px-3 py-2 bg-[#1C2541] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white font-mono"
                    />
                  </div>

                  {supaStatus && (
                    <div className={`p-3 rounded-xl border text-xs font-medium ${
                      supaStatus.success 
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                    }`}>
                      {supaStatus.message}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isTestingSupa}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-glow flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isTestingSupa ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Testing Connection...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Test & Save Cloud Sync</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Guide Box */}
              <div className="p-4 bg-[#1E293B] rounded-2xl border border-[#334155] space-y-2">
                <h5 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  How to copy your Supabase Anon JWT Key in 3 seconds:
                </h5>
                <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>Log into your Supabase Dashboard (<a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-400 underline">supabase.com</a>).</li>
                  <li>Go to <strong>Project Settings &rarr; API</strong>.</li>
                  <li>Under <strong>Project API Keys</strong>, copy the key labeled <code className="px-1 py-0.5 bg-[#0B132B] rounded text-emerald-300 font-mono">anon</code> <code className="px-1 py-0.5 bg-[#0B132B] rounded text-emerald-300 font-mono">public</code> (starts with <code className="text-emerald-300 font-mono">eyJ...</code>).</li>
                  <li>Paste the key into the input above and click <strong>Test & Save Cloud Sync</strong>!</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB: Rules & Ecosystem Roles */}
          {tab === 'rules' && (
            <div className="space-y-6 text-xs animate-in fade-in duration-200">
              
              {/* Section 1: DApp Usage Guidelines */}
              <div className="p-4 bg-[#0B132B] border border-[#334155] rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span>How to Use Aether Feed DApp</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Aether Feed is Dlicom’s visual social telemetry network. Follow these core principles to maximize your experience:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-[#1C2541] border border-[#334155] rounded-xl space-y-1">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      <span>High-Quality Content</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Share clean images, technical code snippets, and original insights. Avoid spam or low-effort duplicate posts.
                    </p>
                  </div>

                  <div className="p-3 bg-[#1C2541] border border-[#334155] rounded-xl space-y-1">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>Upvote & Curate</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Upvote valuable posts to boost creator rank on the Global Leaderboard. Downvote off-topic or misleading content.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: How to Earn Golden Checkmark */}
              <div className="p-4 bg-[#0B132B] border border-amber-500/40 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>How to Earn Golden Checkmark</span>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold rounded-md">
                    VIP Badge
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  The <strong className="text-amber-300">Golden Checkmark</strong> is a prestigious community distinction awarded to active contributors and verified leaders.
                </p>
                <ul className="space-y-2 text-slate-300 pl-1">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span><strong>Build Upvote Reputation:</strong> Maintain high engagement and earn votes from community members.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span><strong>Provide Ecosystem Value:</strong> Share Dlicom development updates, technical guides, or node telemetry.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span><strong>Admin Review:</strong> Dlicom Admins evaluate top contributors and activate Golden Checkmarks directly from the Admin Panel.</span>
                  </li>
                </ul>
              </div>

              {/* Section 3: Dlicom Ecosystem Roles */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>Dlicom Ecosystem Community Roles</span>
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  
                  {/* DLIVER Role */}
                  <div className="p-4 bg-gradient-to-r from-[#0B132B] to-[#1C2541] border border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/50 flex items-center justify-center shrink-0">
                        <Compass className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-white">DLIVER Role</h4>
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold rounded">
                            Deliverer & Contributor
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Assigned to active network deliverers who distribute content, run telemetry nodes, and complete ecosystem tasks.
                        </p>
                      </div>
                    </div>
                    <div className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-mono shrink-0">
                      Earn by: Node Delivery & Content Tasks
                    </div>
                  </div>

                  {/* DECODED Role */}
                  <div className="p-4 bg-gradient-to-r from-[#0B132B] to-[#1C2541] border border-cyan-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/50 flex items-center justify-center shrink-0">
                        <Terminal className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-white">DECODED Role</h4>
                          <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold rounded">
                            Tech Analyst & Dev
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Assigned to developers, protocol analysts, and smart contract decoders building tools on Dlicom infrastructure.
                        </p>
                      </div>
                    </div>
                    <div className="text-[11px] text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1.5 rounded-xl font-mono shrink-0">
                      Earn by: Code Audits & Tech Content
                    </div>
                  </div>

                  {/* DCO Role */}
                  <div className="p-4 bg-gradient-to-r from-[#0B132B] to-[#1C2541] border border-amber-500/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/50 flex items-center justify-center shrink-0">
                        <Shield className="w-6 h-6 text-amber-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-white">DCO Role</h4>
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold rounded">
                            Dlicom Community Officer
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Dlicom Community Officer rank held by node operators, moderators, and ecosystem leaders governing network consensus.
                        </p>
                      </div>
                    </div>
                    <div className="text-[11px] text-amber-300 bg-amber-950/60 border border-amber-500/30 px-3 py-1.5 rounded-xl font-mono shrink-0">
                      Earn by: Community Leadership & Governance
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TAB: Dlicom Resources */}
          {tab === 'resources' && (
            <div className="space-y-5 text-xs animate-in fade-in duration-200">
              <div className="p-4 bg-[#0B132B] border border-[#334155] rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span>Official Dlicom Ecosystem Directory</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Access official Dlicom platforms, documentation, GitHub repositories, and community channels.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                <a
                  href="https://dlicom.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 bg-[#0B132B] hover:bg-[#1E293B] border border-[#334155] hover:border-blue-500 rounded-2xl flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                        Official Website
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono">dlicom.id</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </a>

                <a
                  href="https://id.dlicom.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 bg-[#0B132B] hover:bg-[#1E293B] border border-[#334155] hover:border-blue-500 rounded-2xl flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                        Dlicom ID Portal
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono">id.dlicom.org</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </a>

                <a
                  href="https://github.com/promanas0/Aether-Feed"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 bg-[#0B132B] hover:bg-[#1E293B] border border-[#334155] hover:border-blue-500 rounded-2xl flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                      <Terminal className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                        GitHub Repository
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono">Aether-Feed Repository</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </a>

                <a
                  href="https://docs.dlicom.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 bg-[#0B132B] hover:bg-[#1E293B] border border-[#334155] hover:border-blue-500 rounded-2xl flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                        Documentation & Guides
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono">docs.dlicom.org</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </a>

                <a
                  href="https://t.me/dlicom_official"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 bg-[#0B132B] hover:bg-[#1E293B] border border-[#334155] hover:border-blue-500 rounded-2xl flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                      <Send className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                        Telegram Community
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono">@dlicom_official</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </a>

                <a
                  href="https://explorer.dlicom.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 bg-[#0B132B] hover:bg-[#1E293B] border border-[#334155] hover:border-blue-500 rounded-2xl flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                        Telemetry Explorer
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono">explorer.dlicom.org</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </a>

              </div>

              <div className="p-3 bg-[#0B132B]/60 border border-[#334155] rounded-xl text-center text-slate-400 text-[11px]">
                💡 More official ecosystem links can be added by contacting Dlicom Admins.
              </div>

            </div>
          )}

          {/* TAB 2: Security (Email & OTP Password Change) */}
          {tab === 'security' && (
            <div className="space-y-6">
              
              {/* Email Address Management */}
              <form onSubmit={handleSaveEmail} className="p-4 bg-[#0B132B] rounded-2xl border border-[#334155] space-y-3">
                <div className="flex items-center gap-2 text-blue-400">
                  <Mail className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Registered Account Email
                  </h4>
                </div>

                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#1C2541] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-glow-sm"
                  >
                    Save Email
                  </button>
                </div>
              </form>

              {/* Password Change with Real Email Code (OTP) */}
              <div className="p-4 bg-[#0B132B] rounded-2xl border border-[#334155] space-y-4">
                <div className="flex items-center gap-2 text-blue-400">
                  <Lock className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Change Password (with Email Verification Code)
                  </h4>
                </div>

                {!isOtpSent ? (
                  <form onSubmit={handleSendPasswordOtp} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        New Strong Password (8+ characters)
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPass ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="w-full px-3.5 py-2 bg-[#1C2541] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSendingCode || !isPassLengthValid}
                      className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-glow-sm cursor-pointer"
                    >
                      {isSendingCode ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending Code...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send 6-Digit Code to My Email</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleConfirmPasswordChange} className="space-y-3">
                    <div className="p-3 bg-[#1C2541] border border-blue-500/40 rounded-xl text-xs text-slate-300">
                      <p className="font-semibold text-white flex items-center gap-1.5 mb-1">
                        <KeyRound className="w-4 h-4 text-blue-400" />
                        <span>Enter 6-digit verification code sent to {currentUser.email}</span>
                      </p>
                      <p className="text-[11px] text-slate-400">(Check Inbox & Spam folder)</p>
                    </div>

                    <div className="flex gap-2 justify-center py-2">
                      {passwordOtpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`pass-otp-box-${idx}`}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                          className="w-10 h-11 text-center text-base font-bold font-mono bg-[#1C2541] border border-[#334155] focus:border-blue-500 rounded-xl text-white"
                        />
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsOtpSent(false)}
                        className="px-4 py-2 bg-[#1C2541] text-slate-300 rounded-xl text-xs font-semibold"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={passwordOtpDigits.join('').length < 6}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-glow-sm cursor-pointer"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Confirm & Update Password</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: Appearance (Dark / Light Theme Toggle) */}
          {tab === 'appearance' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Select Visual Theme
              </h4>

              <div className="grid grid-cols-2 gap-4">
                
                {/* Dark Theme Option */}
                <div
                  onClick={() => onThemeChange('dark')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    themeMode === 'dark'
                      ? 'border-blue-500 bg-blue-950/40 shadow-glow-sm'
                      : 'border-[#334155] bg-[#0B132B] opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Moon className="w-5 h-5 text-blue-400" />
                    {themeMode === 'dark' && <Check className="w-4 h-4 text-blue-400 stroke-[3]" />}
                  </div>
                  <h5 className="text-xs font-bold text-white">Dark Mode (Deep Blue)</h5>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    #0B132B / #1C2541 Slate Navy
                  </p>
                </div>

                {/* Light Theme Option */}
                <div
                  onClick={() => onThemeChange('light')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    themeMode === 'light'
                      ? 'border-blue-500 bg-slate-800 shadow-glow-sm'
                      : 'border-[#334155] bg-[#0B132B] opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Sun className="w-5 h-5 text-amber-400" />
                    {themeMode === 'light' && <Check className="w-4 h-4 text-blue-400 stroke-[3]" />}
                  </div>
                  <h5 className="text-xs font-bold text-white">Clean White / Light Mode</h5>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    #F8FAFC / Slate Clean
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: Multi-Account Switcher & Logout & Delete Account */}
          {tab === 'account' && (
            <div className="space-y-5">
              
              {/* Dedicated In-Settings Multi-Account Switcher Section */}
              <div className="p-5 bg-[#0B132B] border border-blue-500/30 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Multi-Account Switcher
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Switch between accounts saved on this device without logging out.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onAddAccount) {
                        onClose();
                        onAddAccount();
                      } else if (onOpenAccountSwitcher) {
                        onClose();
                        onOpenAccountSwitcher();
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Account</span>
                  </button>
                </div>

                {/* List of Saved Accounts on this Device */}
                <div className="space-y-2 pt-1">
                  {(() => {
                    const savedList = getSavedAccounts();
                    return savedList.map((acc) => {
                      const isActive = acc.id === currentUser.id;

                      return (
                        <div
                          key={acc.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                            isActive
                              ? 'bg-blue-950/40 border-blue-500/50 shadow-glow-sm'
                              : 'bg-[#1C2541] border-[#334155] hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={acc.avatar_url}
                              alt={acc.display_name}
                              className={`w-9 h-9 rounded-xl object-cover shrink-0 border ${
                                isActive ? 'border-blue-400 shadow-glow-sm' : 'border-slate-600'
                              }`}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-white truncate">
                                  {acc.display_name}
                                </p>
                                {isActive && (
                                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 font-mono truncate">
                                @{acc.username}
                              </p>
                            </div>
                          </div>

                          <div>
                            {isActive ? (
                              <span className="text-[11px] font-semibold text-slate-400 px-3 py-1.5 rounded-lg bg-[#0B132B] border border-[#334155]">
                                Current Session
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const switched = switchAccountSession(acc.id);
                                  if (switched) {
                                    addToast('Account Switched', `Now active as @${switched.username} (${switched.display_name})`, 'success');
                                    onSwitchAccount?.(switched.id);
                                    onClose();
                                  }
                                }}
                                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-glow-sm transition-all cursor-pointer"
                              >
                                Switch &rarr;
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Sign Out Card */}
              <div className="p-4 bg-[#1C2541] border border-[#334155] rounded-2xl">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">
                  Sign Out of Aether Feed
                </h4>
                <p className="text-xs text-slate-400 mb-4">
                  Logging out will end your active session and return you to the Landing Page.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSignOut();
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#2A3756] hover:bg-[#334155] border border-[#475569] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-blue-400" />
                  <span>Log Out</span>
                </button>
              </div>

              {/* Danger Zone: Delete Account */}
              <div className="p-4 bg-rose-950/30 border border-rose-600/40 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                    Danger Zone &bull; Delete Account
                  </h4>
                </div>
                <p className="text-xs text-slate-300 mb-4">
                  Permanently delete your profile, username (@{currentUser.username}), posts, upvotes, and cloud data. This action is irreversible.
                </p>

                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete My Account</span>
                  </button>
                ) : (
                  <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl space-y-3">
                    <p className="text-xs font-semibold text-rose-200">
                      To confirm permanent deletion, please type <span className="font-mono font-bold text-white bg-rose-900/80 px-1.5 py-0.5 rounded">DELETE</span> below:
                    </p>
                    <input
                      type="text"
                      placeholder="Type DELETE"
                      value={deleteConfirmationText}
                      onChange={(e) => setDeleteConfirmationText(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0B132B] border border-rose-500/60 focus:border-rose-400 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmationText('');
                        }}
                        className="px-4 py-2 bg-[#1C2541] hover:bg-[#2A3756] text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={deleteConfirmationText.trim().toUpperCase() !== 'DELETE' || isDeletingAccount}
                        onClick={handleDeleteAccount}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-glow-sm cursor-pointer"
                      >
                        {isDeletingAccount ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Deleting Account...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            <span>Permanently Delete Account</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Avatar Crop & Sizing Adjuster Modal */}
        {isCropModalOpen && (
          <AvatarCropModal
            isOpen={isCropModalOpen}
            imageSrc={rawAvatarToCrop || avatarUrl}
            onClose={() => setIsCropModalOpen(false)}
            onCropComplete={(croppedUrl) => {
              setAvatarUrl(croppedUrl);
              addToast('Profile Picture Fitted', 'Avatar adjusted and fitted perfectly.', 'success');
            }}
          />
        )}

      </div>
    </div>
  );
};
