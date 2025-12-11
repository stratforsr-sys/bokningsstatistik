'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';

interface MeetingFiltersProps {
  onFilterChange: (filters: {
    status?: string;
    startDate?: string;
    endDate?: string;
    query?: string;
  }) => void;
  initialFilters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    query?: string;
  };
}

const STATUS_OPTIONS = [
  { value: '', label: 'Alla statusar' },
  { value: 'BOOKED', label: 'Bokad' },
  { value: 'COMPLETED', label: 'Genomförd' },
  { value: 'NO_SHOW', label: 'No-show' },
  { value: 'CANCELED', label: 'Avbokad' },
  { value: 'RESCHEDULED', label: 'Ombokad' },
];

export default function MeetingFilters({
  onFilterChange,
  initialFilters = {},
}: MeetingFiltersProps) {
  const [status, setStatus] = useState(initialFilters.status || '');
  const [startDate, setStartDate] = useState(initialFilters.startDate || '');
  const [endDate, setEndDate] = useState(initialFilters.endDate || '');
  const [query, setQuery] = useState(initialFilters.query || '');

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    onFilterChange({
      status: newStatus || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      query: query || undefined,
    });
  };

  const handleStartDateChange = (newStartDate: string) => {
    setStartDate(newStartDate);
    onFilterChange({
      status: status || undefined,
      startDate: newStartDate || undefined,
      endDate: endDate || undefined,
      query: query || undefined,
    });
  };

  const handleEndDateChange = (newEndDate: string) => {
    setEndDate(newEndDate);
    onFilterChange({
      status: status || undefined,
      startDate: startDate || undefined,
      endDate: newEndDate || undefined,
      query: query || undefined,
    });
  };

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    onFilterChange({
      status: status || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      query: newQuery || undefined,
    });
  };

  const handleReset = () => {
    setStatus('');
    setStartDate('');
    setEndDate('');
    setQuery('');
    onFilterChange({});
  };

  const hasActiveFilters = status || startDate || endDate || query;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sök
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Sök ämne, ägare..."
              className="pl-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-telink-violet focus:border-transparent"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-telink-violet focus:border-transparent"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Från datum
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-telink-violet focus:border-transparent"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Till datum
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-telink-violet focus:border-transparent"
          />
        </div>
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <X className="h-4 w-4" />
            Återställ filter
          </button>
        </div>
      )}
    </div>
  );
}
