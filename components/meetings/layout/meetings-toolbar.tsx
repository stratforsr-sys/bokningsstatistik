'use client';

import { Search, Filter, X } from 'lucide-react';
import { useMeetingsStore } from '@/lib/stores/meetings-store';
import { useState } from 'react';

const STATUS_OPTIONS = [
  { value: '', label: 'Alla status' },
  { value: 'BOOKED', label: 'Bokad' },
  { value: 'COMPLETED', label: 'Genomförd' },
  { value: 'NO_SHOW', label: 'No-show' },
  { value: 'CANCELED', label: 'Avbokad' },
  { value: 'RESCHEDULED', label: 'Ombokad' },
];

export default function MeetingsToolbar() {
  const { filters, updateFilter, resetFilters } = useMeetingsStore();
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Search and Filter Toggle */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Sök möten..."
              value={filters.query || ''}
              onChange={(e) => updateFilter('query', e.target.value || undefined)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-telink-violet focus:border-transparent"
            />
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
              hasActiveFilters
                ? 'border-telink-violet bg-telink-violet text-white'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filter
            {hasActiveFilters && (
              <span className="bg-white text-telink-violet rounded-full px-2 py-0.5 text-xs font-semibold">
                {Object.keys(filters).length}
              </span>
            )}
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="h-4 w-4" />
              Rensa
            </button>
          )}
        </div>

        {/* Expandable Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => updateFilter('status', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-telink-violet focus:border-transparent"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Från datum
                </label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => updateFilter('startDate', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-telink-violet focus:border-transparent"
                />
              </div>

              {/* End Date Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Till datum
                </label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => updateFilter('endDate', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-telink-violet focus:border-transparent"
                />
              </div>

              {/* Quality Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Min kvalitet
                </label>
                <select
                  value={filters.qualityMin || ''}
                  onChange={(e) => updateFilter('qualityMin', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-telink-violet focus:border-transparent"
                >
                  <option value="">Alla</option>
                  <option value="1">★ 1+</option>
                  <option value="2">★★ 2+</option>
                  <option value="3">★★★ 3+</option>
                  <option value="4">★★★★ 4+</option>
                  <option value="5">★★★★★ 5</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
