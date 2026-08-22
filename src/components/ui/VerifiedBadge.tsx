import React from 'react';
import { ShieldCheck } from 'lucide-react';
import type { Profile } from '../../types';
import { isUserAdmin } from '../../lib/storage';

interface VerifiedBadgeProps {
  user?: Profile | { email?: string; is_verified?: boolean; is_golden_verified?: boolean; [key: string]: any } | null;
  isVerified?: boolean;
  isGoldenVerified?: boolean;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showAdminLabel?: boolean;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  user,
  isVerified,
  isGoldenVerified,
  className = '',
  size = 'sm',
}) => {
  const userEmail = typeof user === 'string' ? user : user?.email;
  const isAdmin = isUserAdmin(userEmail || (user as any));
  const isGolden = isGoldenVerified ?? user?.is_golden_verified ?? isAdmin;
  const verified = isVerified ?? user?.is_verified ?? false;

  if (!isGolden && !verified) return null;

  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  if (isGolden) {
    return (
      <span
        className={`inline-flex items-center shrink-0 ${className}`}
        title={isAdmin ? "Verified Admin / Team (Golden Checkmark)" : "Golden VIP Verified Member"}
      >
        <ShieldCheck
          className={`${sizeClasses} text-amber-400 fill-amber-400/20 drop-shadow-[0_0_8px_rgba(251,191,36,0.85)] animate-pulse`}
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center shrink-0 ${className}`}
      title="Verified Member"
    >
      <ShieldCheck
        className={`${sizeClasses} text-blue-400 fill-blue-400/20 drop-shadow-[0_0_6px_rgba(96,165,250,0.6)]`}
      />
    </span>
  );
};

