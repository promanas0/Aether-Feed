import React, { useState, useRef, useEffect } from 'react';
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
  Sparkles,
  Search,
  ChevronLeft,
  Sliders,
  Settings as SettingsIcon,
  Languages,
  CheckCircle2,
  ArrowRight
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
import { DlicomRolesHub } from './DlicomRolesHub';
import { 
  SUPPORTED_LANGUAGES, 
  getSavedLanguage, 
  setSavedLanguage, 
  getTranslation,
  type SupportedLanguage 
} from '../../lib/i18n';

interface SettingsViewProps {
  currentUser: Profile;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  onUpdateProfile: (updates: Partial<Profile>) => void;
  onSignOut: () => void;
  onBackToHome?: () => void;
  onOpenAccountSwitcher?: () => void;
  onSwitchAccount?: (userId: string) => void;
  onAddAccount?: () => void;
  addToast: (title: string, desc?: string, type?: ToastMessage['type']) => void;
}

export type SettingsTabId = 
  | 'hub'
  | 'info' 
  | 'cloud' 
  | 'rules' 
  | 'language'
  | 'security' 
  | 'appearance' 
  | 'resources'
  | 'account';

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  themeMode,
  onThemeChange,
  onUpdateProfile,
  onSignOut,
  onBackToHome,
  onOpenAccountSwitcher,
  onSwitchAccount,
  onAddAccount,
  addToast,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('hub');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(() => getSavedLanguage());

  // Profile Form States
  const [firstName, setFirstName] = useState(currentUser.first_name || '');
  const [lastName, setLastName] = useState(currentUser.last_name || '');
  const [displayName, setDisplayName] = useState(currentUser.display_name || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [location, setLocation] = useState(currentUser.location || '');
  const [website, setWebsite] = useState(currentUser.website || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url || '');
  const [bannerUrl, setBannerUrl] = useState(currentUser.banner_url || '');
  const [bannerSize, setBannerSize] = useState<'compact' | 'standard' | 'tall'>(currentUser.banner_size || 'standard');

  // Crop Modal States
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [rawAvatarToCrop, setRawAvatarToCrop] = useState<string | null>(null);

  // Cloud Sync States
  const [supaUrl, setSupaUrl] = useState('');
  const [supaKey, setSupaKey] = useState('');
  const [isTestingSupa, setIsTestingSupa] = useState(false);
  const [supaStatus, setSupaStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Password & OTP States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const config = getStoredSupabaseConfig();
    if (config) {
      setSupaUrl(config.url);
      setSupaKey(config.anonKey);
    }
  }, []);

  const handleLanguageChange = (code: SupportedLanguage) => {
    setSavedLanguage(code);
    setCurrentLang(code);
    addToast('Language Updated', `Active language set to ${SUPPORTED_LANGUAGES.find(l => l.code === code)?.name}.`, 'success');
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const raw = event.target?.result as string;
        setRawAvatarToCrop(raw);
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressBanner(file);
        setBannerUrl(compressed);
        addToast('Banner Uploaded', 'Remember to save profile changes.', 'info');
      } catch (err) {
        addToast('Upload Error', 'Could not process banner image.', 'info');
      }
    }
  };

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      display_name: displayName.trim() || currentUser.username,
      bio: bio.trim(),
      location: location.trim(),
      website: website.trim(),
      avatar_url: avatarUrl,
      banner_url: bannerUrl,
      banner_size: bannerSize,
    });
    addToast('Profile Saved', 'Your public profile details have been updated.', 'success');
  };

  const handleSaveCloudSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingSupa(true);
    setSupaStatus(null);

    const test = await testSupabaseConnection(supaUrl.trim(), supaKey.trim());
    setIsTestingSupa(false);

    if (test.success) {
      saveSupabaseConfig({
        url: supaUrl.trim(),
        anonKey: supaKey.trim(),
        isEnabled: true,
      });
      setSupaStatus({ success: true, message: 'Connected to Supabase! Realtime cloud sync is active.' });
      addToast('Cloud Sync Connected', 'Supabase configuration saved.', 'success');
      await syncWithServer();
    } else {
      setSupaStatus({ success: false, message: test.message });
      addToast('Connection Failed', test.message, 'info');
    }
  };

  const handleSendOtp = async () => {
    if (!currentUser.email) {
      addToast('Email Missing', 'No email associated with this account.', 'info');
      return;
    }

    try {
      setIsSendingOtp(true);
      const { otp_code } = createPasswordChangeOtp(currentUser.id, currentUser.email);
      const res = await sendRealVerificationEmail({
        toEmail: currentUser.email,
        toName: currentUser.display_name,
        otpCode: otp_code,
      });

      setOtpSent(true);
      if (res.success) {
        addToast('Verification Code Sent', `Security OTP sent to ${currentUser.email}.`, 'success');
      } else {
        addToast('Verification Code Generated', `Security OTP code: ${otp_code}`, 'info');
      }
    } catch (err: any) {
      addToast('Error', err?.message || 'Failed to send OTP.', 'info');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyAndUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      addToast('Password Too Short', 'Password must be at least 6 characters.', 'info');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('Password Mismatch', 'New passwords do not match.', 'info');
      return;
    }

    try {
      setIsVerifyingOtp(true);
      const ok = verifyPasswordChangeOtp(currentUser.id, otpCode.trim(), newPassword);
      if (ok) {
        addToast('Password Changed', 'Your password has been securely updated.', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setOtpCode('');
        setOtpSent(false);
      } else {
        addToast('Verification Failed', 'Invalid or expired OTP code.', 'info');
      }
    } catch (err: any) {
      addToast('Error', err?.message || 'Could not update password.', 'info');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toLowerCase() !== currentUser.username.toLowerCase()) {
      addToast('Confirmation Error', `Type "${currentUser.username}" exactly to confirm deletion.`, 'info');
      return;
    }

    setIsDeletingAccount(true);
    try {
      const success = await deleteUserAccount(currentUser.id);
      if (success) {
        addToast('Account Deleted', 'Your account has been deleted permanently.', 'info');
        onSignOut();
        // Auto refresh instantly to wipe memory, clear sessions, and show Landing Page
        setTimeout(() => {
          window.location.reload();
        }, 120);
      }
    } catch (err: any) {
      addToast('Error', err?.message || 'Could not delete account.', 'info');
      setIsDeletingAccount(false);
    }
  };

  // If user is viewing the full interactive 3 Roles Page (Screenshot 1)
  if (activeTab === 'rules') {
    return (
      <DlicomRolesHub
        themeMode={themeMode}
        onThemeToggle={() => onThemeChange(themeMode === 'dark' ? 'light' : 'dark')}
        onBackToSettings={() => setActiveTab('hub')}
        lang={currentLang}
      />
    );
  }

  // Sidebar Grouped Navigation Items (Matches Facebook Settings Layout in Screenshot 2)
  const navGroups = [
    {
      groupTitle: 'Your account',
      items: [
        { id: 'info' as SettingsTabId, label: 'Profile Details', desc: 'Password, security, personal details, media', icon: User },
        { id: 'security' as SettingsTabId, label: 'Security & Password', desc: 'Update password, session verification', icon: Lock },
        { id: 'cloud' as SettingsTabId, label: 'Cloud Database Sync', desc: 'Supabase real-time cloud connection', icon: Database },
      ]
    },
    {
      groupTitle: 'Tools and resources',
      items: [
        { id: 'rules' as SettingsTabId, label: 'Ecosystem Rules & 3 Roles', desc: 'Dliever, Dcoded, DCO and Golden Mark', icon: BookOpen },
        { id: 'resources' as SettingsTabId, label: 'Official Dlicom Resources', desc: 'Official platform links and documentation', icon: Globe },
      ]
    },
    {
      groupTitle: 'Preferences',
      items: [
        { id: 'language' as SettingsTabId, label: 'Language & Region', desc: 'Select language from 11 global options', icon: Languages },
        { id: 'appearance' as SettingsTabId, label: 'Appearance & Theme', desc: 'Dark mode and high contrast options', icon: Sun },
        { id: 'account' as SettingsTabId, label: 'Account Sessions', desc: 'Switch profiles and active login sessions', icon: Users },
      ]
    }
  ];

  return (
    <div className="w-full bg-[#0B132B] text-white min-h-screen pb-16 flex flex-col">
      
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 w-full border-b border-[#334155]/80 bg-[#0B132B]/95 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="p-2 rounded-xl border border-[#334155] bg-[#1C2541] hover:bg-[#2A3756] text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-blue-400" />
            <h1 className="text-base sm:text-lg font-bold text-white tracking-wide">
              {getTranslation('settingsTitle', currentLang)}
            </h1>
          </div>
        </div>

        {/* Right Header: Theme Toggle */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onThemeChange(themeMode === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl border border-[#334155] bg-[#1C2541] hover:bg-[#2A3756] text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Toggle Theme"
          >
            {themeMode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
          </button>
        </div>
      </header>

      {/* 2-Pane Settings Workspace (Matches Screenshot 2) */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-6 flex-1">
        
        {/* LEFT SIDEBAR: Categorized Settings Navigation */}
        <aside className="w-full lg:w-80 shrink-0 space-y-4">
          
          <div className="p-4 bg-[#141E33] border border-[#334155] rounded-3xl space-y-4 shadow-xl">
            
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search settings..."
                className="w-full pl-9 pr-3 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            {/* Overview / Hub Button */}
            <button
              onClick={() => setActiveTab('hub')}
              className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'hub'
                  ? 'bg-blue-600 text-white shadow-glow-sm'
                  : 'bg-[#1C2541] text-slate-300 hover:text-white hover:bg-[#2A3756]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span>Settings Overview</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Navigation Groups (Facebook Style) */}
            <div className="space-y-4 pt-2 border-t border-[#334155]/60">
              {navGroups.map((group, gIdx) => (
                <div key={gIdx} className="space-y-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    {group.groupTitle}
                  </p>
                  <div className="space-y-1">
                    {group.items
                      .filter(item => 
                        !searchQuery.trim() || 
                        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.desc.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                          <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full p-2.5 rounded-xl flex items-center gap-3 text-left transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 font-bold'
                                : 'text-slate-300 hover:text-white hover:bg-[#1C2541]'
                            }`}
                          >
                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate">{item.label}</p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>

          </div>

        </aside>

        {/* RIGHT MAIN CONTENT: Selected Tab OR Settings Hub */}
        <main className="flex-1 min-w-0">
          
          {/* TAB 0: Settings Hub (Matches Screenshot 2) */}
          {activeTab === 'hub' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Find the setting that you need Banner */}
              <div className="p-6 bg-[#141E33] border border-[#334155] rounded-3xl space-y-3 shadow-xl">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  Find the setting that you need
                </h2>
                <div className="relative max-w-xl">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search across all profile, security, roles, and language settings..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Most Visited Settings Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1">
                  Most visited settings
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  
                  {/* Card 1: 3 Roles & Path */}
                  <div
                    onClick={() => setActiveTab('rules')}
                    className="p-5 bg-[#141E33] border border-[#334155] hover:border-blue-500 rounded-3xl cursor-pointer transition-all hover:-translate-y-1 space-y-3 flex flex-col group shadow-lg"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                        Ecosystem Rules & 3 Roles
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Explore Dliever, Dcoded, DCO, and Golden Checkmark qualification threads.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                      <span>Open 3 Roles</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  {/* Card 2: Cloud Sync */}
                  <div
                    onClick={() => setActiveTab('cloud')}
                    className="p-5 bg-[#141E33] border border-[#334155] hover:border-blue-500 rounded-3xl cursor-pointer transition-all hover:-translate-y-1 space-y-3 flex flex-col group shadow-lg"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                      <Database className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                        Cloud Database Sync
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Connect Supabase project to synchronize posts and DMs in real time.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                      <span>Configure Supabase</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  {/* Card 3: Language & Region */}
                  <div
                    onClick={() => setActiveTab('language')}
                    className="p-5 bg-[#141E33] border border-[#334155] hover:border-blue-500 rounded-3xl cursor-pointer transition-all hover:-translate-y-1 space-y-3 flex flex-col group shadow-lg"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                      <Languages className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                        Language & Region
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Choose your preferred language from 11 worldwide translations.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                      <span>Change Language</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  {/* Card 4: Dark Mode */}
                  <div
                    onClick={() => setActiveTab('appearance')}
                    className="p-5 bg-[#141E33] border border-[#334155] hover:border-blue-500 rounded-3xl cursor-pointer transition-all hover:-translate-y-1 space-y-3 flex flex-col group shadow-lg"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                      <Sun className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                        Appearance & Dark Mode
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Toggle dark mode and customize visual contrast themes.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                      <span>Manage Appearance</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  {/* Card 5: Security */}
                  <div
                    onClick={() => setActiveTab('security')}
                    className="p-5 bg-[#141E33] border border-[#334155] hover:border-blue-500 rounded-3xl cursor-pointer transition-all hover:-translate-y-1 space-y-3 flex flex-col group shadow-lg"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                        Security & Password
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Update account credentials and manage session authentication.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                      <span>Review Security</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  {/* Card 6: Profile */}
                  <div
                    onClick={() => setActiveTab('info')}
                    className="p-5 bg-[#141E33] border border-[#334155] hover:border-blue-500 rounded-3xl cursor-pointer transition-all hover:-translate-y-1 space-y-3 flex flex-col group shadow-lg"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                        Profile Details
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Edit avatar, cover banner, display name, bio, and social links.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                      <span>Edit Profile</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                </div>
              </div>

              {/* Looking for something else? Section */}
              <div className="space-y-3 pt-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1">
                  Looking for something else?
                </h3>

                <div className="space-y-3">
                  
                  <div 
                    onClick={() => setActiveTab('resources')}
                    className="p-4 bg-[#141E33] border border-[#334155] hover:border-blue-500 rounded-2xl flex items-center justify-between cursor-pointer transition-all hover:bg-[#1C2541]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          Official Dlicom Resources & Links
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Visit dlicom.io, official docs, and platform contracts.
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>

                  <div 
                    onClick={() => setActiveTab('account')}
                    className="p-4 bg-[#141E33] border border-[#334155] hover:border-blue-500 rounded-2xl flex items-center justify-between cursor-pointer transition-all hover:bg-[#1C2541]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          Account Centre & Multi-Session Switcher
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Add multiple creator profiles and switch accounts with one click.
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TAB 1: Profile Details */}
          {activeTab === 'info' && (
            <div className="p-6 bg-[#141E33] border border-[#334155] rounded-3xl space-y-6 shadow-xl animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-[#334155]">
                <div>
                  <h3 className="text-base font-bold text-white">Profile Details</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Update public name, avatar, bio, and banners.</p>
                </div>
                <button
                  onClick={() => setActiveTab('hub')}
                  className="px-3 py-1.5 bg-[#1C2541] hover:bg-[#2A3756] border border-[#334155] rounded-xl text-xs font-semibold text-slate-300"
                >
                  Overview
                </button>
              </div>

              {/* Photo Uploads */}
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

              {/* Form Fields */}
              <form onSubmit={handleSaveInfo} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Manas"
                      className="w-full px-3 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Mandal"
                      className="w-full px-3 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. the god"
                    className="w-full px-3 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Bio</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell the community about your craft..."
                    className="w-full px-3 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Neo Tokyo"
                      className="w-full px-3 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Website URL</label>
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
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-glow-sm"
                >
                  Save Profile Changes
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: Multi-Language & Region (NEW) */}
          {activeTab === 'language' && (
            <div className="p-6 bg-[#141E33] border border-[#334155] rounded-3xl space-y-6 shadow-xl animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-[#334155]">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Languages className="w-5 h-5 text-emerald-400" />
                    <span>Language & Region</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select your preferred language across the entire platform.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('hub')}
                  className="px-3 py-1.5 bg-[#1C2541] hover:bg-[#2A3756] border border-[#334155] rounded-xl text-xs font-semibold text-slate-300"
                >
                  Overview
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = currentLang === lang.code;

                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-sm'
                          : 'bg-[#0B132B] border-[#334155] hover:border-slate-500 text-slate-300 hover:text-white'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-bold">{lang.nativeName}</p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{lang.name}</p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="p-4 bg-[#0B132B] border border-[#334155] rounded-2xl text-xs text-slate-400 font-mono">
                Active language: <span className="text-emerald-400 font-bold">{SUPPORTED_LANGUAGES.find(l => l.code === currentLang)?.nativeName} ({SUPPORTED_LANGUAGES.find(l => l.code === currentLang)?.name})</span>. Instant dynamic interface translation is enabled.
              </div>
            </div>
          )}

          {/* TAB 3: Cloud Database Sync */}
          {activeTab === 'cloud' && (
            <div className="p-6 bg-[#141E33] border border-[#334155] rounded-3xl space-y-6 shadow-xl animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-[#334155]">
                <div>
                  <h3 className="text-base font-bold text-white">Cloud Database Synchronization</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Connect your Supabase project to synchronize posts, votes, comments, and messages in real time.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('hub')}
                  className="px-3 py-1.5 bg-[#1C2541] hover:bg-[#2A3756] border border-[#334155] rounded-xl text-xs font-semibold text-slate-300"
                >
                  Overview
                </button>
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

          {/* TAB 4: Security & Password */}
          {activeTab === 'security' && (
            <div className="p-6 bg-[#141E33] border border-[#334155] rounded-3xl space-y-6 shadow-xl animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-[#334155]">
                <div>
                  <h3 className="text-base font-bold text-white">Security & Password</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Protect your account with OTP security.</p>
                </div>
                <button
                  onClick={() => setActiveTab('hub')}
                  className="px-3 py-1.5 bg-[#1C2541] hover:bg-[#2A3756] border border-[#334155] rounded-xl text-xs font-semibold text-slate-300"
                >
                  Overview
                </button>
              </div>

              {/* Password Update Card */}
              <div className="p-5 bg-[#0B132B] border border-[#334155] rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Update Account Password
                </h4>

                {!otpSent ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400">
                      To change your password, we will generate a security OTP code for your verified email ({currentUser.email || 'your registered email'}).
                    </p>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isSendingOtp}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-2"
                    >
                      {isSendingOtp ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending Security Code...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Verification OTP</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyAndUpdatePassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        6-Digit Security OTP
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="123456"
                        className="w-full px-3 py-2 bg-[#1E293B] border border-[#334155] focus:border-blue-500 rounded-xl text-sm font-mono tracking-widest text-white text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full px-3 py-2 bg-[#1E293B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full px-3 py-2 bg-[#1E293B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={isVerifyingOtp}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        {isVerifyingOtp ? 'Verifying...' : 'Set New Password'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="px-4 py-2 bg-[#1E293B] text-slate-300 hover:text-white rounded-xl text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Danger Zone: Delete Account */}
              <div className="p-5 bg-rose-950/20 border border-rose-500/30 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                  Delete Account
                </h4>
                <p className="text-xs text-slate-400">
                  Permanently delete your profile, posts, and message history. Type <span className="font-mono text-white font-bold">{currentUser.username}</span> below to confirm.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={currentUser.username}
                    className="px-3 py-2 bg-[#0B132B] border border-rose-500/40 rounded-xl text-xs text-white flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText.trim().toLowerCase() !== currentUser.username.toLowerCase() || isDeletingAccount}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-30 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 min-w-[120px]"
                  >
                    {isDeletingAccount ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <span>Delete Forever</span>
                    )}
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: Appearance & Theme */}
          {activeTab === 'appearance' && (
            <div className="p-6 bg-[#141E33] border border-[#334155] rounded-3xl space-y-6 shadow-xl animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-[#334155]">
                <div>
                  <h3 className="text-base font-bold text-white">Appearance & Theme</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Customize your interface visual mode.</p>
                </div>
                <button
                  onClick={() => setActiveTab('hub')}
                  className="px-3 py-1.5 bg-[#1C2541] hover:bg-[#2A3756] border border-[#334155] rounded-xl text-xs font-semibold text-slate-300"
                >
                  Overview
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => onThemeChange('dark')}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer space-y-2 ${
                    themeMode === 'dark'
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-glow-sm'
                      : 'bg-[#0B132B] border-[#334155] text-slate-400 hover:text-white'
                  }`}
                >
                  <Moon className="w-6 h-6 text-blue-400" />
                  <p className="text-sm font-bold text-white">Dark Mode (Default)</p>
                  <p className="text-xs text-slate-400">Deep sapphire and midnight navy palette.</p>
                </button>

                <button
                  onClick={() => onThemeChange('light')}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer space-y-2 ${
                    themeMode === 'light'
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-glow-sm'
                      : 'bg-[#0B132B] border-[#334155] text-slate-400 hover:text-white'
                  }`}
                >
                  <Sun className="w-6 h-6 text-amber-400" />
                  <p className="text-sm font-bold text-white">Light Mode</p>
                  <p className="text-xs text-slate-400">Bright clean slate and crisp white background.</p>
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: Official Resources */}
          {activeTab === 'resources' && (
            <div className="p-6 bg-[#141E33] border border-[#334155] rounded-3xl space-y-6 shadow-xl animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-[#334155]">
                <div>
                  <h3 className="text-base font-bold text-white">Official Dlicom Resources</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Explore the official ecosystem portals and apps.</p>
                </div>
                <button
                  onClick={() => setActiveTab('hub')}
                  className="px-3 py-1.5 bg-[#1C2541] hover:bg-[#2A3756] border border-[#334155] rounded-xl text-xs font-semibold text-slate-300"
                >
                  Overview
                </button>
              </div>

              <div className="space-y-3">
                <a
                  href="https://dlicom.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-[#0B132B] border border-[#334155] hover:border-blue-500 rounded-2xl flex items-center justify-between text-left group transition-all"
                >
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                      Dlicom Official Portal (dlicom.io)
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Main entry point for ecosystem tools, identity card generator, and community events.
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-blue-400" />
                </a>

                <a
                  href="https://github.com/promanas0/Aether-Feed"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-[#0B132B] border border-[#334155] hover:border-blue-500 rounded-2xl flex items-center justify-between text-left group transition-all"
                >
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                      Aether Feed Open Source Repository
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Review smart contracts, schema DDL, and community issues on GitHub.
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-blue-400" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 7: Account Sessions */}
          {activeTab === 'account' && (
            <div className="p-6 bg-[#141E33] border border-[#334155] rounded-3xl space-y-6 shadow-xl animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-[#334155]">
                <div>
                  <h3 className="text-base font-bold text-white">Account Sessions</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Manage multi-account profiles saved on this browser.</p>
                </div>
                <button
                  onClick={() => setActiveTab('hub')}
                  className="px-3 py-1.5 bg-[#1C2541] hover:bg-[#2A3756] border border-[#334155] rounded-xl text-xs font-semibold text-slate-300"
                >
                  Overview
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-[#0B132B] border border-[#334155] rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentUser.avatar_url}
                      alt={currentUser.display_name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">{currentUser.display_name} (Active)</p>
                      <p className="text-[11px] text-slate-400 font-mono">@{currentUser.username}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    Active Session
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">
                  {onOpenAccountSwitcher && (
                    <button
                      onClick={onOpenAccountSwitcher}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-glow-sm"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Switch Profile</span>
                    </button>
                  )}
                  {onAddAccount && (
                    <button
                      onClick={onAddAccount}
                      className="px-4 py-2 bg-[#1C2541] hover:bg-[#2A3756] border border-[#334155] text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add Another Account</span>
                    </button>
                  )}
                  <button
                    onClick={onSignOut}
                    className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>

      </div>

      {/* Avatar Crop Modal */}
      {isCropModalOpen && rawAvatarToCrop && (
        <AvatarCropModal
          isOpen={isCropModalOpen}
          imageSrc={rawAvatarToCrop}
          onClose={() => setIsCropModalOpen(false)}
          onCropComplete={(croppedDataUrl) => {
            setAvatarUrl(croppedDataUrl);
            setIsCropModalOpen(false);
            addToast('Avatar Cropped', 'Click "Save Profile Changes" to confirm.', 'info');
          }}
        />
      )}

    </div>
  );
};
