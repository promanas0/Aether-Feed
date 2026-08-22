import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Check, 
  Send, 
  ExternalLink, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck,
  Radio
} from 'lucide-react';
import { 
  getStoredEmailConfig, 
  saveEmailConfig, 
  sendRealVerificationEmail, 
  EmailServiceConfig 
} from '../../lib/emailService';

interface EmailConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast: (msg: string) => void;
}

export const EmailConfigModal: React.FC<EmailConfigModalProps> = ({
  isOpen,
  onClose,
  onSuccessToast,
}) => {
  const [provider, setProvider] = useState<'emailjs' | 'resend'>('emailjs');
  const [emailjsServiceId, setEmailjsServiceId] = useState('');
  const [emailjsTemplateId, setEmailjsTemplateId] = useState('');
  const [emailjsPublicKey, setEmailjsPublicKey] = useState('');
  const [resendApiKey, setResendApiKey] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const cfg = getStoredEmailConfig();
      setProvider(cfg.provider === 'resend' ? 'resend' : 'emailjs');
      setEmailjsServiceId(cfg.emailjsServiceId);
      setEmailjsTemplateId(cfg.emailjsTemplateId);
      setEmailjsPublicKey(cfg.emailjsPublicKey);
      setResendApiKey(cfg.resendApiKey);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const config: EmailServiceConfig = {
      provider,
      emailjsServiceId: emailjsServiceId.trim(),
      emailjsTemplateId: emailjsTemplateId.trim(),
      emailjsPublicKey: emailjsPublicKey.trim(),
      resendApiKey: resendApiKey.trim(),
      senderName: 'Aether Feed by Dlicom',
    };
    saveEmailConfig(config);
    onSuccessToast('Email service configuration saved successfully!');
    onClose();
  };

  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      setTestResult({ success: false, message: 'Please provide a test email address.' });
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    // Save temporary config before sending
    saveEmailConfig({
      provider,
      emailjsServiceId: emailjsServiceId.trim(),
      emailjsTemplateId: emailjsTemplateId.trim(),
      emailjsPublicKey: emailjsPublicKey.trim(),
      resendApiKey: resendApiKey.trim(),
      senderName: 'Aether Feed by Dlicom',
    });

    const testOtp = String(Math.floor(100000 + Math.random() * 900000));
    const res = await sendRealVerificationEmail({
      toEmail: testEmail.trim(),
      toName: 'Dlicom User',
      otpCode: testOtp,
    });

    setIsSendingTest(false);
    setTestResult(res);
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B132B]/90 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl bg-[#1C2541] border border-[#334155] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#334155] bg-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-xl shadow-glow-sm">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Real Email Dispatcher Setup (EmailJS / Resend)
              </h2>
              <p className="text-[11px] text-slate-400">
                Connect free real email delivery to send OTP codes to real inboxes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#334155]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Provider Toggle */}
          <div className="grid grid-cols-2 p-1 bg-[#0B132B] border border-[#334155] rounded-xl">
            <button
              type="button"
              onClick={() => setProvider('emailjs')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                provider === 'emailjs'
                  ? 'bg-blue-600 text-white shadow-glow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              EmailJS (Free &bull; Browser Direct)
            </button>
            <button
              type="button"
              onClick={() => setProvider('resend')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                provider === 'resend'
                  ? 'bg-blue-600 text-white shadow-glow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Resend API (3,000 Free Emails)
            </button>
          </div>

          {provider === 'emailjs' ? (
            <div className="space-y-3">
              <div className="p-3 bg-[#0F172A] border border-[#334155] rounded-xl text-[11px] text-slate-300 space-y-1">
                <p className="font-bold text-blue-400">
                  EmailJS Free 2-Minute Setup (Sends from your Gmail):
                </p>
                <ol className="list-decimal pl-4 space-y-0.5 text-slate-400 font-sans">
                  <li>Visit <a href="https://www.emailjs.com" target="_blank" rel="noreferrer" className="text-blue-400 underline inline-flex items-center gap-0.5">emailjs.com <ExternalLink className="w-2.5 h-2.5" /></a> (Free account).</li>
                  <li>Add Email Service (connect your Gmail/Outlook) &rarr; Copy <strong>Service ID</strong>.</li>
                  <li>Create Email Template with <code className="text-blue-300">{"{{otp_code}}"}</code> &rarr; Copy <strong>Template ID</strong>.</li>
                  <li>Go to Account &rarr; Copy <strong>Public Key</strong>.</li>
                </ol>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  EmailJS Service ID
                </label>
                <input
                  type="text"
                  value={emailjsServiceId}
                  onChange={(e) => setEmailjsServiceId(e.target.value)}
                  placeholder="e.g. service_xyz123"
                  className="w-full px-3.5 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  EmailJS Template ID
                </label>
                <input
                  type="text"
                  value={emailjsTemplateId}
                  onChange={(e) => setEmailjsTemplateId(e.target.value)}
                  placeholder="e.g. template_abc456"
                  className="w-full px-3.5 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  EmailJS Public Key
                </label>
                <input
                  type="text"
                  value={emailjsPublicKey}
                  onChange={(e) => setEmailjsPublicKey(e.target.value)}
                  placeholder="e.g. user_pk_987654..."
                  className="w-full px-3.5 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white font-mono"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-[#0F172A] border border-[#334155] rounded-xl text-[11px] text-slate-300 space-y-1">
                <p className="font-bold text-blue-400">Resend API Setup:</p>
                <p className="text-slate-400">
                  Create a free key at <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-blue-400 underline">resend.com</a> and paste your API key below.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Resend API Key
                </label>
                <input
                  type="text"
                  value={resendApiKey}
                  onChange={(e) => setResendApiKey(e.target.value)}
                  placeholder="re_123456789..."
                  className="w-full px-3.5 py-2 bg-[#0B132B] border border-[#334155] focus:border-blue-500 rounded-xl text-xs text-white font-mono"
                />
              </div>
            </div>
          )}

          {/* Test Real Email Box */}
          <div className="p-3.5 bg-[#0B132B] border border-[#334155] rounded-2xl space-y-2">
            <label className="block text-xs font-bold text-slate-300">
              Send Test Real Verification Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your.real.email@gmail.com"
                className="flex-1 px-3 py-1.5 bg-[#1C2541] border border-[#334155] rounded-xl text-xs text-white"
              />
              <button
                type="button"
                onClick={handleSendTest}
                disabled={isSendingTest || !testEmail}
                className="flex items-center gap-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                {isSendingTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{isSendingTest ? 'Sending...' : 'Test Send'}</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-blue-950/50 border border-blue-600/40 text-blue-300'
                    : 'bg-rose-950/50 border border-rose-600/40 text-rose-300'
                }`}
              >
                {testResult.success ? (
                  <Check className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{testResult.success ? 'Delivered' : 'Delivery Error'}</p>
                  <p className="text-[11px] opacity-90 mt-0.5">{testResult.message}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#0B132B] hover:bg-[#1E293B] text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-glow"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save Configuration</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
