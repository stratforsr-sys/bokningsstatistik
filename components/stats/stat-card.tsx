import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  className = '',
}: StatCardProps) {
  return (
    <div
      className={`stats-card bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-telink-violet">{value}</p>
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500">från förra perioden</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="rounded-full bg-telink-violet/10 p-3">
            <Icon className="h-6 w-6 text-telink-violet" />
          </div>
        )}
      </div>
    </div>
  );
}
