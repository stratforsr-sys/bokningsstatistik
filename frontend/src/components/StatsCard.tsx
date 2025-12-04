import React from 'react';
import type { StatsCardProps } from '../types';
import './StatsCard.css';

/**
 * StatsCard - visar statistik för en period (Idag, Denna vecka, etc.)
 * Design inspirerad av Telink's moderna kort-layout
 */
export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  period,
  bokningar,
  avbokningar,
  ombokningar,
  noshows,
  genomforda,
  showRate,
  noShowRate,
  kvalitet,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="stats-card stats-card--loading">
        <div className="stats-card__header">
          <div className="skeleton skeleton--title"></div>
          <div className="skeleton skeleton--subtitle"></div>
        </div>
        <div className="stats-card__body">
          <div className="skeleton skeleton--stat"></div>
          <div className="skeleton skeleton--stat"></div>
          <div className="skeleton skeleton--stat"></div>
        </div>
      </div>
    );
  }

  // Färgkodning baserat på show rate (AnalyticsAgent)
  const getShowRateColor = (rate: number) => {
    if (rate >= 0.8) return 'success';
    if (rate >= 0.6) return 'warning';
    return 'error';
  };

  const getQualityColor = (score: number) => {
    if (score >= 4) return 'success';
    if (score >= 3) return 'warning';
    return 'error';
  };

  const showRateColor = getShowRateColor(showRate);
  const qualityColor = getQualityColor(kvalitet);

  return (
    <div className="stats-card">
      <div className="stats-card__header">
        <h3 className="stats-card__title">{title}</h3>
        <span className="stats-card__period">{period}</span>
      </div>

      <div className="stats-card__body">
        {/* Huvudstatistik */}
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-item__label">Bokningar</span>
            <span className="stat-item__value stat-item__value--large">{bokningar}</span>
          </div>

          <div className="stat-item">
            <span className="stat-item__label">Genomförda</span>
            <span className="stat-item__value stat-item__value--success">{genomforda}</span>
          </div>
        </div>

        {/* Sekundär statistik */}
        <div className="stats-grid stats-grid--secondary">
          <div className="stat-item stat-item--small">
            <span className="stat-item__label">Avbokningar</span>
            <span className="stat-item__value">{avbokningar}</span>
          </div>

          <div className="stat-item stat-item--small">
            <span className="stat-item__label">Ombokningar</span>
            <span className="stat-item__value">{ombokningar}</span>
          </div>

          <div className="stat-item stat-item--small">
            <span className="stat-item__label">No-shows</span>
            <span className="stat-item__value stat-item__value--error">{noshows}</span>
          </div>
        </div>

        {/* KPI-rader */}
        <div className="stats-kpis">
          <div className="kpi-item">
            <span className="kpi-item__label">Show Rate</span>
            <span className={`kpi-item__value kpi-item__value--${showRateColor}`}>
              {(showRate * 100).toFixed(1)}%
            </span>
          </div>

          <div className="kpi-item">
            <span className="kpi-item__label">No-show Rate</span>
            <span className="kpi-item__value kpi-item__value--error">
              {(noShowRate * 100).toFixed(1)}%
            </span>
          </div>

          {kvalitet > 0 && (
            <div className="kpi-item">
              <span className="kpi-item__label">Genomsnittlig kvalitet</span>
              <span className={`kpi-item__value kpi-item__value--${qualityColor}`}>
                {kvalitet.toFixed(1)} / 5
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
