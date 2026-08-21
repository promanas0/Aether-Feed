import emailjs from '@emailjs/browser';

const EMAIL_CONFIG_KEY = 'aether_email_service_config_v1';

export interface EmailServiceConfig {
  provider: 'emailjs' | 'resend' | 'supabase';
  emailjsServiceId: string;
  emailjsTemplateId: string;
  emailjsPublicKey: string;
  resendApiKey: string;
  senderName: string;
}

export const getStoredEmailConfig = (): EmailServiceConfig => {
  const defaultEmailjsServiceId = (import.meta as any).env?.VITE_EMAILJS_SERVICE_ID || 'service_m41wswe';
  const defaultEmailjsTemplateId = (import.meta as any).env?.VITE_EMAILJS_TEMPLATE_ID || 'template_t3lyaoh';
  const defaultEmailjsPublicKey = (import.meta as any).env?.VITE_EMAILJS_PUBLIC_KEY || 'lUxvD8jEw-LlgVT83';
  const defaultResendApiKey = (import.meta as any).env?.VITE_RESEND_API_KEY || '';

  try {
    const saved = localStorage.getItem(EMAIL_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.emailjsPublicKey || parsed.resendApiKey)) {
        return parsed;
      }
    }
  } catch {}

  return {
    provider: 'emailjs',
    emailjsServiceId: defaultEmailjsServiceId,
    emailjsTemplateId: defaultEmailjsTemplateId,
    emailjsPublicKey: defaultEmailjsPublicKey,
    resendApiKey: defaultResendApiKey,
    senderName: 'Aether Feed',
  };
};

export const saveEmailConfig = (config: EmailServiceConfig): void => {
  localStorage.setItem(EMAIL_CONFIG_KEY, JSON.stringify(config));
};

/**
 * Send real 6-digit verification OTP code directly to user's real email inbox
 */
export const sendRealVerificationEmail = async (params: {
  toEmail: string;
  toName: string;
  otpCode: string;
}): Promise<{ success: boolean; message: string }> => {
  const config = getStoredEmailConfig();
  const { toEmail, toName, otpCode } = params;

  console.log(`[Aether Email Service] Dispatching real OTP verification to ${toEmail}...`);

  // 1. If EmailJS is configured
  if (config.emailjsServiceId && config.emailjsTemplateId && config.emailjsPublicKey) {
    try {
      emailjs.init(config.emailjsPublicKey);
      const templateParams = {
        to_name: toName,
        to_email: toEmail,
        otp_code: otpCode,
        app_name: 'Aether Feed (by Dlicom)',
        message: `Your 6-digit Aether Feed verification code is: ${otpCode}. Valid for 10 minutes.`,
      };

      const response = await emailjs.send(
        config.emailjsServiceId,
        config.emailjsTemplateId,
        templateParams,
        config.emailjsPublicKey
      );

      console.log('[EmailJS Real Email Success]:', response.status, response.text);
      return {
        success: true,
        message: `Real verification email sent to ${toEmail}. Please check your inbox and spam folder.`,
      };
    } catch (err: any) {
      console.error('[EmailJS Send Error]:', err);
      return {
        success: false,
        message: `EmailJS dispatch error: ${err?.text || err?.message || 'Check Service ID and Template ID'}.`,
      };
    }
  }

  // 2. If Resend API Key is configured
  if (config.resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'Aether Feed <onboarding@resend.dev>',
          to: [toEmail],
          subject: `${otpCode} is your Aether Feed verification code`,
          html: `
            <div style="font-family: sans-serif; background: #0B132B; color: #ffffff; padding: 24px; border-radius: 12px;">
              <h2 style="color: #3B82F6; margin-top: 0;">Aether Feed (by Dlicom)</h2>
              <p>Hello <strong>${toName}</strong>,</p>
              <p>Your 6-digit account verification code is:</p>
              <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #60A5FA; background: #1C2541; padding: 14px; text-align: center; border-radius: 8px; border: 1px solid #334155;">
                ${otpCode}
              </div>
              <p style="color: #94A3B8; font-size: 12px; margin-top: 20px;">
                This code is valid for 10 minutes. If you did not request this, please ignore this email.
              </p>
            </div>
          `,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Resend API failed');
      }

      console.log('[Resend Real Email Success]:', json);
      return {
        success: true,
        message: `Real verification email delivered to ${toEmail} via Resend.`,
      };
    } catch (err: any) {
      console.error('[Resend Send Error]:', err);
      return {
        success: false,
        message: `Resend API error: ${err.message}`,
      };
    }
  }

  // 3. Fallback: Log clearly to console for development
  console.info(
    `[Aether Dev Dispatcher] Email service credentials not yet configured. Simulated code for ${toEmail}: ${otpCode}`
  );

  return {
    success: true,
    message: `Verification code generated. Configure free EmailJS/Resend in Email Settings to deliver real emails to ${toEmail}.`,
  };
};
