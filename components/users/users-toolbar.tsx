'use client';

import { Search, Plus } from 'lucide-react';
import { UserRole } from '@prisma/client';
import Button from '@/components/ui/button';

interface UsersToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  roleFilter: UserRole | 'ALL';
  onRoleFilterChange: (role: UserRole | 'ALL') => void;
  statusFilter: boolean | 'ALL';
  onStatusFilterChange: (status: boolean | 'ALL') => void;
  onCreateUser: () => void;
}

export default function UsersToolbar({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  onCreateUser,
}: UsersToolbarProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Sök användare..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="
                w-full pl-10 pr-4 py-2 text-sm
                border border-gray-300 rounded-md
                focus:outline-none focus:ring-2 focus:ring-telink-violet focus:ring-offset-2
                focus:border-telink-violet
              "
            />
          </div>
        </div>

        {/* Role Filter */}
        <div className="w-full sm:w-40">
          <select
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value as UserRole | 'ALL')}
            className="
              w-full px-3 py-2 text-sm
              border border-gray-300 rounded-md
              focus:outline-none focus:ring-2 focus:ring-telink-violet focus:ring-offset-2
              focus:border-telink-violet
            "
          >
            <option value="ALL">Alla roller</option>
            <option value="USER">USER</option>
            <option value="MANAGER">MANAGER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-40">
          <select
            value={String(statusFilter)}
            onChange={(e) => {
              const value = e.target.value;
              onStatusFilterChange(value === 'ALL' ? 'ALL' : value === 'true');
            }}
            className="
              w-full px-3 py-2 text-sm
              border border-gray-300 rounded-md
              focus:outline-none focus:ring-2 focus:ring-telink-violet focus:ring-offset-2
              focus:border-telink-violet
            "
          >
            <option value="ALL">Alla status</option>
            <option value="true">Aktiva</option>
            <option value="false">Inaktiva</option>
          </select>
        </div>

        {/* Create Button */}
        <div className="w-full sm:w-auto">
          <Button
            onClick={onCreateUser}
            variant="primary"
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ny användare
          </Button>
        </div>
      </div>
    </div>
  );
}
