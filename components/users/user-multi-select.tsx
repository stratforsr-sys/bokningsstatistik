'use client';

import { useMemo } from 'react';
import MultiSelect, { MultiSelectOption } from '@/components/ui/multi-select';
import { useAvailableUsers } from '@/lib/hooks/use-users';
import { UserRole } from '@prisma/client';

export interface UserMultiSelectProps {
  label?: string;
  value: string[]; // Array of user IDs
  onChange: (value: string[]) => void;
  roleFilter?: UserRole | 'ALL';
  excludeUserIds?: string[]; // Don't show these users
  maxSelections?: number;
  required?: boolean;
  error?: string;
  helperText?: string;
  placeholder?: string;
  showInactive?: boolean; // Show inactive users
  className?: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  USER: 'Användare',
  MANAGER: 'Manager',
  ADMIN: 'Admin',
};

export default function UserMultiSelect({
  label = 'Välj användare',
  value,
  onChange,
  roleFilter = 'ALL',
  excludeUserIds = [],
  maxSelections,
  required = false,
  error,
  helperText,
  placeholder = 'Välj användare...',
  showInactive = false,
  className,
}: UserMultiSelectProps) {
  // ✅ Fetch users with the useAvailableUsers hook (accessible by all roles)
  const { users: usersData, loading, error: fetchError } = useAvailableUsers();

  // Transform users to MultiSelect options
  const options = useMemo<MultiSelectOption[]>(() => {
    if (!usersData || usersData.length === 0) return [];

    return usersData
      .filter((user) => {
        // Filter by role if specified
        if (roleFilter !== 'ALL' && user.role !== roleFilter) {
          return false;
        }

        // Filter by active status
        if (!showInactive && !user.isActive) {
          return false;
        }

        // Exclude specified user IDs
        if (excludeUserIds.includes(user.id)) {
          return false;
        }

        return true;
      })
      .map((user) => ({
        value: user.id,
        label: `${user.name} (${ROLE_LABELS[user.role]})`,
        disabled: !user.isActive,
      }))
      .sort((a, b) => {
        // Sort: active first, then alphabetically
        if (a.disabled === b.disabled) {
          return a.label.localeCompare(b.label, 'sv');
        }
        return a.disabled ? 1 : -1;
      });
  }, [usersData, roleFilter, excludeUserIds, showInactive]);

  // Combine errors
  const displayError = error || (fetchError ? 'Kunde inte ladda användare' : undefined);

  // Loading state
  if (loading) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="min-h-[42px] px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-telink-violet border-t-transparent rounded-full" />
          <span className="text-sm text-gray-500">Laddar användare...</span>
        </div>
        {helperText && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }

  // Error state
  if (fetchError && !usersData) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="min-h-[42px] px-3 py-2 bg-red-50 border border-red-300 rounded-lg">
          <p className="text-sm text-red-600">Kunde inte ladda användare</p>
        </div>
        {helperText && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }

  // Empty state
  if (options.length === 0) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="min-h-[42px] px-3 py-2 bg-yellow-50 border border-yellow-300 rounded-lg">
          <p className="text-sm text-yellow-700">
            Inga användare tillgängliga
            {roleFilter !== 'ALL' && ` med rollen ${ROLE_LABELS[roleFilter]}`}
          </p>
        </div>
        {helperText && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }

  // Render MultiSelect
  return (
    <MultiSelect
      label={label}
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      error={displayError}
      helperText={helperText}
      required={required}
      loading={loading}
      maxSelections={maxSelections}
      searchable={true}
      className={className}
    />
  );
}
