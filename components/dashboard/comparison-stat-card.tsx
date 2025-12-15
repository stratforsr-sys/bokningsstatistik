'use client';

import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface ComparisonStatCardProps {
  label: string;
  icon: LucideIcon;
  personalValue: number | string;
  teamValue: number | string;
  suffix?: string;
  className?: string;
}

export default function ComparisonStatCard({
  label,
  icon: Icon,
  personalValue,
  teamValue,
  suffix = '',
  className = '',
}: ComparisonStatCardProps) {
  // Determine if user is above or below team average
  const personalNum = typeof personalValue === 'string' ? parseFloat(personalValue) : personalValue;
  const teamNum = typeof teamValue === 'string' ? parseFloat(teamValue) : teamValue;

  const isAbove = personalNum > teamNum;
  const isEqual = Math.abs(personalNum - teamNum) < 0.01;

  const getTrendIcon = () => {
    if (isEqual) return <Minus className="h-4 w-4 text-gray-600" />;
    if (isAbove) return <TrendingUp className="h-4 w-4 text-green-600" />;
    return <TrendingDown className="h-4 w-4 text-amber-600" />;
  };

  const getTrendText = () => {
    if (isEqual) return 'I nivå med teamet';
    if (isAbove) return 'Över genomsnittet';
    return 'Under genomsnittet';
  };

  const getTrendColor = () => {
    if (isEqual) return 'text-gray-600';
    if (isAbove) return 'text-green-600';
    return 'text-amber-600';
  };

  return (
    <div className={`glass-stat-card ${className}`}>
      {/* Icon */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-telink-violet to-purple-600 flex items-center justify-center shadow-md">
          <Icon className="h-6 w-6 text-white" />
        </div>
        {getTrendIcon()}
      </div>

      {/* Label */}
      <h3 className="text-sm font-medium text-gray-600 mb-3">
        {label}
      </h3>

      {/* Personal Value */}
      <div className="mb-3">
        <div className="text-3xl font-bold text-telink-violet">
          {personalValue}{suffix}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Ditt värde
        </div>
      </div>

      {/* Divider */}
      <div className="glass-divider my-3"></div>

      {/* Team Comparison */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-700">
            Team: {teamValue}{suffix}
          </div>
          <div className={`text-xs font-medium ${getTrendColor()} flex items-center gap-1 mt-1`}>
            {getTrendIcon()}
            <span>{getTrendText()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
