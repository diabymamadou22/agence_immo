import React from 'react';
import { Tenant } from '../../types';
import { getTenantLateStatus } from '../../utils/formatters';
import { AlertTriangle, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';

interface RentStatusPastilleProps {
  tenant: Tenant;
  size?: 'sm' | 'md';
  showBadge?: boolean;
  showDaysOnly?: boolean;
  className?: string;
}

export const RentStatusPastille: React.FC<RentStatusPastilleProps> = ({
  tenant,
  size = 'md',
  showBadge = true,
  showDaysOnly = false,
  className = '',
}) => {
  const statusInfo = getTenantLateStatus(tenant);

  const dotSizeClasses = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  const pingSizeClasses = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {/* Visual Pastille Dot */}
      <span className="relative flex shrink-0 items-center justify-center" title={`${statusInfo.label} : ${statusInfo.description}`}>
        {/* Pulsing Ripple Effect for Overdue > 5 days */}
        {statusInfo.isOver5Days && (
          <span
            className={`animate-ping absolute inline-flex ${pingSizeClasses} rounded-full opacity-75 ${statusInfo.pingColor}`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full ${dotSizeClasses} ${statusInfo.dotColor} shadow-2xs`}
        />
      </span>

      {/* Optional Formatted Badge */}
      {showBadge && (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider border shadow-2xs transition-all ${statusInfo.badgeBg}`}
          title={statusInfo.description}
        >
          {statusInfo.isCritical ? (
            <ShieldAlert className="w-3 h-3 text-rose-700 shrink-0 animate-pulse" />
          ) : statusInfo.isOver5Days ? (
            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
          ) : statusInfo.isLate ? (
            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
          )}

          <span className="font-extrabold whitespace-nowrap">
            {showDaysOnly ? statusInfo.badgeText : statusInfo.badgeText}
          </span>
        </span>
      )}
    </div>
  );
};
