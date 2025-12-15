'use client';

import { UserStats } from '@/lib/hooks/use-stats-by-person';
import { TrendingUp, TrendingDown, Users, CheckCircle, XCircle, Star } from 'lucide-react';

export interface KPICardsProps {
  stats: UserStats[];
  className?: string;
}

export default function KPICards({ stats, className = '' }: KPICardsProps) {
  // Calculate aggregate KPIs
  const totalMeetings = stats.reduce((sum, s) => sum + s.asBooker.total, 0);
  const totalCompleted = stats.reduce((sum, s) => sum + s.asBooker.completed, 0);
  const totalNoShow = stats.reduce((sum, s) => sum + s.asBooker.noShow, 0);

  const avgShowRate = totalMeetings > 0 ? (totalCompleted / totalMeetings) : 0;

  const qualityScores = stats
    .filter(s => s.asSeller.avgQualityScore !== null)
    .map(s => ({ score: s.asSeller.avgQualityScore!, count: s.asSeller.qualityScoreCount }));

  const avgQuality = qualityScores.length > 0
    ? qualityScores.reduce((sum, s) => sum + (s.score * s.count), 0) /
      qualityScores.reduce((sum, s) => sum + s.count, 0)
    : null;

  const activeUsers = stats.filter(s => s.user.isActive).length;

  // Benchmarks (industry standards)
  const showRateBenchmark = 0.80;
  const qualityBenchmark = 4.0;

  const cards = [
    {
      title: 'Totalt Möten',
      value: totalMeetings.toString(),
      subtitle: `${stats.length} ${stats.length === 1 ? 'person' : 'personer'}`,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgLight: 'bg-blue-50',
    },
    {
      title: 'Show Rate (Team)',
      value: `${Math.round(avgShowRate * 100)}%`,
      subtitle: `Mål: ${Math.round(showRateBenchmark * 100)}%`,
      icon: avgShowRate >= showRateBenchmark ? TrendingUp : TrendingDown,
      color: avgShowRate >= showRateBenchmark ? 'bg-green-500' : 'bg-orange-500',
      textColor: avgShowRate >= showRateBenchmark ? 'text-green-600' : 'text-orange-600',
      bgLight: avgShowRate >= showRateBenchmark ? 'bg-green-50' : 'bg-orange-50',
      trend: avgShowRate >= showRateBenchmark ? 'positive' : 'negative',
    },
    {
      title: 'Genomförda Möten',
      value: totalCompleted.toString(),
      subtitle: `${Math.round((totalCompleted / totalMeetings) * 100)}% av alla`,
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgLight: 'bg-green-50',
    },
    {
      title: 'No-Shows',
      value: totalNoShow.toString(),
      subtitle: `${Math.round((totalNoShow / totalMeetings) * 100)}% av alla`,
      icon: XCircle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgLight: 'bg-red-50',
    },
    {
      title: 'Kvalitetsbetyg',
      value: avgQuality !== null ? avgQuality.toFixed(1) : 'N/A',
      subtitle: avgQuality !== null ? `Mål: ${qualityBenchmark.toFixed(1)}` : 'Ingen data',
      icon: Star,
      color: avgQuality && avgQuality >= qualityBenchmark ? 'bg-yellow-500' : 'bg-gray-400',
      textColor: avgQuality && avgQuality >= qualityBenchmark ? 'text-yellow-600' : 'text-gray-600',
      bgLight: avgQuality && avgQuality >= qualityBenchmark ? 'bg-yellow-50' : 'bg-gray-50',
      trend: avgQuality && avgQuality >= qualityBenchmark ? 'positive' : 'neutral',
    },
    {
      title: 'Aktiva Användare',
      value: activeUsers.toString(),
      subtitle: `av ${stats.length} totalt`,
      icon: Users,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgLight: 'bg-purple-50',
    },
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 ${className}`}>
      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <div
            key={index}
            className={`${card.bgLight} rounded-lg p-6 border-2 ${card.textColor.replace('text-', 'border-').replace('600', '200')} shadow-sm hover:shadow-md transition-all duration-200`}
          >
            {/* Icon */}
            <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
              <Icon className="h-6 w-6 text-white" />
            </div>

            {/* Title */}
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              {card.title}
            </h3>

            {/* Value */}
            <div className={`text-3xl font-bold ${card.textColor} mb-1`}>
              {card.value}
            </div>

            {/* Subtitle */}
            <p className="text-xs text-gray-500">
              {card.subtitle}
            </p>

            {/* Trend Indicator */}
            {card.trend && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                {card.trend === 'positive' ? (
                  <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                    <TrendingUp className="h-3 w-3" />
                    <span>Över målet</span>
                  </div>
                ) : card.trend === 'negative' ? (
                  <div className="flex items-center gap-1 text-orange-600 text-xs font-medium">
                    <TrendingDown className="h-3 w-3" />
                    <span>Under målet</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
