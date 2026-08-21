import React from 'react';
import { ShieldCheck, Crown } from 'lucide-react';
import type { Profile } from '../../types';
import { isUserAdmin } from '../../lib/storage';

interface VerifiedBadgeProps {
  user?: Profile | { email?: string; is_verified?: boolean; [key: string]: any } | null;
  isVerified?: boolean;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showAdminLabel?: boolean;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  user,
  isVerified,
  className = '',
  size = 'sm',
  showAdminLabel = false,
}) => {
  const userEmail = typeof user === 'string' ? user : user?.email;
  const isAdmin = isUserAdmin(userEmail || (user as any));
  const verified = isVerified ?? user?.is_verified ?? false;

  if (!isAdmin && !verified) return null;

  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  if (isAdmin) {
    return (
      <span 
        className={`inline-flex items-center gap-1 shrink-0 ${className}`} 
        title="Verified Aether Admin / Team"
      >
        <ShieldCheck 
          className={`${sizeClasses} text-amber-400 fill-amber-400/20 drop-shadow-[0_0_8px_rgba(251,191,36,0.85)] animate-pulse`} 
        />
        {showAdminLabel && (
          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/50 flex items-center gap-0.5 shadow-sm">
            <Crown className="w-2.5 h-2.5" />
            Admin
          </span>
        )}
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
