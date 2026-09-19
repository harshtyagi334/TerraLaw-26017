import React from 'react';
import { Activity } from 'lucide-react';

interface ProjectHealthBadgeProps {
  riskScore: number;
  compact?: boolean;
}

export const ProjectHealthBadge: React.FC<ProjectHealthBadgeProps> = ({ riskScore, compact = false }) => {
  const health = riskScore >= 80
    ? { label: 'Critical', color: 'bg-red-100 text-red-800 border-red-200' }
    : riskScore >= 65
      ? { label: 'High Risk', color: 'bg-orange-100 text-orange-800 border-orange-200' }
      : riskScore >= 35
        ? { label: 'Moderate Risk', color: 'bg-amber-100 text-amber-800 border-amber-200' }
        : { label: 'Healthy', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };

  return (
    <span className={`inline-flex items-center gap-1.5 border rounded px-2 py-1 text-[11px] font-bold ${health.color}`} title={`Project Health: ${health.label}`}>
      <Activity className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {health.label}
    </span>
  );
};
