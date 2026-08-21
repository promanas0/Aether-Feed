import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Lock, 
  Mail, 
  ArrowRight, 
  Check, 
  X, 
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowLeft,
  UserPlus,
  LogIn,
  Sun,
  Moon
} from 'lucide-react';
import { 
  createPendingRegistration, 
  verifyAndCreateUser, 
  authenticateUser,
  syncWithServer
} from '../../lib/storage';
import { sendRealVerificationEmail } from '../../lib/emailService';
import { EmailConfigModal } from './EmailConfigModal';
import type { Profile, ToastMessage, ThemeMode } from '../../types';

interface LandingPageProps {
  onAuthSuccess: (user: Profile) => void;
  addToast: (title: string, desc?: string, type?: ToastMessage['type']) => void;
  themeMode?: ThemeMode;
  onThemeToggle?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onAuthSuccess, 
  addToast, 
  themeMode = 'dark', 
  onThemeToggle 
}) => {
  // Views: 'home' (just buttons) | 'signin' | 'signup' | 'otp'
  const [viewState, setViewState] = useState<'home' | 'signin' | 'signup'>('home');
  
  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPass, setShowSignInPass] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Sign Up State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [showSignUpPass, setShowSignUpPass] = useState(false);

  // OTP Verification Step
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isEmailConfigOpen, setIsEmailConfigOpen] = useState(false);

  useEffect(() => {
    // Initial fetch from central server database
    syncWithServer();
  }, []);

  // Password Strength Calculation
  const hasMinLength = signUpPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(signUpPassword);
  const hasNumber = /[0-9]/.test(signUpPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(signUpPassword);
  const isPasswordStrong = hasMinLength && hasUpper && hasNumber && hasSpecial;

  // Handle Sign In Submit
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail.trim() || !signInPassword.trim()) {
      addToast('Validation Error', 'Please enter email and password.', 'info');
      return;
    }

    setIsSigningIn(true);
    const res = await authenticateUser(signInEmail.trim(), signInPassword.trim());
    setIsSigningIn(false);

    if (res.success && res.user) {
      addToast('Welcome Back', `Signed in as ${res.user.display_name}.`, 'success');
      onAuthSuccess(res.user);
    } else {
      addToast('Authentication Failed', res.message, 'info');
    }
  };

  // Handle Sign Up Submit -> Dispatches Real Email
  const handleSignUpStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !signUpEmail.trim()) {
      addToast('Incomplete Form', 'Please complete all required fields.', 'info');
      return;
    }

    if (!isPasswordStrong) {
      addToast('Weak Password', 'Please meet all password security requirements.', 'info');
      return;
    }

    setIsSendingEmail(true);

    const { otp_code } = createPendingRegistration({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: signUpEmail.trim(),
      password_hash: signUpPassword.trim(),
    });

    // Send real email via EmailJS / Resend
    const emailResult = await sendRealVerificationEmail({
      toEmail: signUpEmail.trim(),
      toName: `${firstName.trim()} ${lastName.trim()}`,
      otpCode: otp_code,
    });

    setIsSendingEmail(false);
    setIsVerifyingOtp(true);
    setOtpDigits(['', '', '', '', '', '']);

    if (emailResult.success) {
      addToast('Verification Code Sent', emailResult.message, 'success');
    } else {
      addToast('Email Dispatch Notice', emailResult.message, 'info');
    }
  };

  // Handle OTP Box Inputs
  const handleOtpChange = (index: number, val: string) => {
    if (!/^[0-9]?$/.test(val)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = val;
    setOtpDigits(newDigits);

    // Auto-advance
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-box-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-box-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Handle Complete OTP Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const entered = otpDigits.join('');
    if (entered.length < 6) {
      addToast('Incomplete Code', 'Please enter all 6 digits of the code.', 'info');
      return;
    }

    const res = await verifyAndCreateUser(signUpEmail, entered);
    if (res.success && res.user) {
      addToast('Account Verified', `Welcome to Aether Feed, ${res.user.display_name}!`, 'success');
      onAuthSuccess(res.user);
    } else {
      addToast('Verification Error', res.message, 'info');
    }
  };

  const handleResendOtp = async () => {
    setIsSendingEmail(true);
    const { otp_code } = createPendingRegistration({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: signUpEmail.trim(),
      password_hash: signUpPassword.trim(),
    });

    const res = await sendRealVerificationEmail({
      toEmail: signUpEmail.trim(),
      toName: `${firstName.trim()} ${lastName.trim()}`,
      otpCode: otp_code,
    });

    setIsSendingEmail(false);
    addToast('Code Resent', res.message, res.success ? 'success' : 'info');
  };

  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white font-sans">
      
      {/* Minimal Top Bar */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button
          onClick={() => {
            setViewState('home');
            setIsVerifyingOtp(false);
          }}
          className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
        >
          <img
            src="/logo.jpg"
            alt="Aether Feed Logo"
            className="w-8 h-8 rounded-xl object-cover shadow-glow-sm border border-blue-500/40"
          />
          <span className="text-base font-extrabold text-white tracking-tight">
            Aether Feed
          </span>
        </button>

        <div className="flex items-center gap-2">
          {onThemeToggle && (
            <button
              onClick={onThemeToggle}
              title={themeMode === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              className="p-2 rounded-xl border border-[#334155] bg-[#1C2541] hover:bg-[#2A3756] text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              {themeMode === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-blue-400" />
              )}
            </button>
          )}

          <button
            onClick={() => setIsEmailConfigOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-[#1C2541] border border-[#334155] transition-all cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-blue-400" />
            <span>Email Setup</span>
          </button>
        </div>
      </header>

      {/* Main Centered Minimal Clean Screen */}
      <main className="max-w-md w-full mx-auto px-4 py-8 flex-1 flex flex-col items-center justify-center">
        
        {/* STATE 1: Pure Minimal Home (Only Sign In & Create Account options) */}
        {viewState === 'home' && !isVerifyingOtp && (
          <div className="w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Big Brand Logo */}
            <img
              src="/logo.jpg"
              alt="Aether Feed Logo"
              className="w-18 h-18 rounded-2xl object-cover shadow-glow mx-auto border-2 border-blue-500/40"
            />

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Aether Feed
              </h1>
            </div>

            {/* 2 Big Clean Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => setViewState('signin')}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-bold shadow-glow transition-all active:scale-95 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Account</span>
              </button>

              <button
                onClick={() => setViewState('signup')}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-[#1C2541] hover:bg-[#2A3756] text-white border border-[#334155] rounded-2xl text-sm font-bold transition-all active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-blue-400" />
                <span>Create New Account</span>
              </button>
            </div>

          </div>
        )}

        {/* STATE 2: Clean Sign In Box */}
        {viewState === 'signin' && !isVerifyingOtp && (
          <div className="w-full bg-[#1C2541] border border-[#334155] rounded-3xl p-6 sm:p-8 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
            
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => setViewState('home')}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Sign In
              </h2>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="name@email.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showSignInPass ? 'text' : 'password'}
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2.5 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPass(!showSignInPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showSignInPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-glow transition-all active:scale-95 cursor-pointer"
              >
                {isSigningIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-400 pt-2">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setViewState('signup')}
                  className="text-blue-400 hover:underline font-semibold"
                >
                  Create Account
                </button>
              </p>
            </form>

          </div>
        )}

        {/* STATE 3: Clean Create Account Box */}
        {viewState === 'signup' && !isVerifyingOtp && (
          <div className="w-full bg-[#1C2541] border border-[#334155] rounded-3xl p-6 sm:p-8 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
            
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => setViewState('home')}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Create Account
              </h2>
            </div>

            <form onSubmit={handleSignUpStart} className="space-y-3.5">
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
                    placeholder="First"
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
                    placeholder="Last"
                    className="w-full px-3 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="your.email@gmail.com"
                    className="w-full pl-9 pr-3 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showSignUpPass ? 'text' : 'password'}
                    required
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="Min 8 chars, uppercase, number, symbol"
                    className="w-full pl-9 pr-9 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPass(!showSignUpPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showSignUpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Checklist */}
                <div className="grid grid-cols-2 gap-1.5 mt-2 text-[10px] font-mono">
                  <div className={`flex items-center gap-1 ${hasMinLength ? 'text-blue-400' : 'text-slate-500'}`}>
                    {hasMinLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>8+ Characters</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasUpper ? 'text-blue-400' : 'text-slate-500'}`}>
                    {hasUpper ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>Uppercase (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasNumber ? 'text-blue-400' : 'text-slate-500'}`}>
                    {hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>Number (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasSpecial ? 'text-blue-400' : 'text-slate-500'}`}>
                    {hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>Symbol (!@#$)</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSendingEmail || !isPasswordStrong || !firstName || !lastName || !signUpEmail}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-glow transition-all active:scale-95"
              >
                {isSendingEmail ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending Real Email...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-400 pt-2">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setViewState('signin')}
                  className="text-blue-400 hover:underline font-semibold"
                >
                  Sign In
                </button>
              </p>
            </form>

          </div>
        )}

        {/* STATE 4: 6-Digit Email Verification Code */}
        {isVerifyingOtp && (
          <div className="w-full bg-[#1C2541] border border-[#334155] rounded-3xl p-6 sm:p-8 shadow-xl animate-in fade-in duration-200">
            
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto mb-3 border border-blue-500/40">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Check Your Email Inbox
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Verification code sent to: <br />
                  <strong className="text-blue-400 font-mono text-xs">{signUpEmail}</strong>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  (Check your Inbox & Spam folder)
                </p>
              </div>

              {/* 6 Digit Inputs */}
              <div className="flex justify-between gap-2 my-4">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-box-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-12 text-center text-lg font-bold font-mono bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-white focus:outline-none transition-all"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={otpDigits.join('').length < 6}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-glow transition-all"
              >
                <span>Verify Code & Enter</span>
                <Check className="w-4 h-4 stroke-[3]" />
              </button>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-[#334155]">
                <button
                  type="button"
                  onClick={() => setIsVerifyingOtp(false)}
                  className="hover:text-white"
                >
                  &larr; Back
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isSendingEmail}
                  className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                >
                  {isSendingEmail && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>Resend Code</span>
                </button>
              </div>
            </form>

          </div>
        )}

      </main>

      {/* Email Config Modal */}
      <EmailConfigModal
        isOpen={isEmailConfigOpen}
        onClose={() => setIsEmailConfigOpen(false)}
        onSuccessToast={(msg) => addToast('Email Setup Complete', msg, 'success')}
      />

      {/* Minimal Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 font-mono">
        <p>Aether Feed</p>
      </footer>

    </div>
  );
};
