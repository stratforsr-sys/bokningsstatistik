'use client';

import { useState } from 'react';
import UserMultiSelect from '@/components/users/user-multi-select';
import Button from '@/components/ui/button';
import { X, Filter } from 'lucide-react';

export interface PersonFilterProps {
  selectedUserIds: string[];
  onFilterChange: (userIds: string[]) => void;
  className?: string;
}

export default function PersonFilter({
  selectedUserIds,
  onFilterChange,
  className = '',
}: PersonFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tempSelection, setTempSelection] = useState<string[]>(selectedUserIds);

  const handleApplyFilter = () => {
    onFilterChange(tempSelection);
    setIsExpanded(false);
  };

  const handleClearFilter = () => {
    setTempSelection([]);
    onFilterChange([]);
  };

  const handleCancel = () => {
    setTempSelection(selectedUserIds);
    setIsExpanded(false);
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">
            Filtrera per person
          </h3>
          {selectedUserIds.length > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-telink-violet text-white">
              {selectedUserIds.length} valda
            </span>
          )}
        </div>
        {!isExpanded && selectedUserIds.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilter}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            Rensa filter
          </Button>
        )}
      </div>

      {/* Expandable Filter Section */}
      {!isExpanded && selectedUserIds.length === 0 && (
        <Button
          variant="outline"
          onClick={() => setIsExpanded(true)}
          className="w-full"
        >
          <Filter className="h-4 w-4 mr-2" />
          Välj personer att filtrera på
        </Button>
      )}

      {!isExpanded && selectedUserIds.length > 0 && (
        <Button
          variant="outline"
          onClick={() => setIsExpanded(true)}
          className="w-full"
        >
          Ändra filter
        </Button>
      )}

      {isExpanded && (
        <div className="space-y-4">
          <UserMultiSelect
            label="Välj personer"
            value={tempSelection}
            onChange={setTempSelection}
            placeholder="Välj en eller flera personer..."
            helperText="Statistiken kommer att visa data för de valda personerna"
            showInactive={true}
          />

          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={handleApplyFilter}
              className="flex-1"
              disabled={tempSelection.length === 0}
            >
              <Filter className="h-4 w-4 mr-2" />
              Tillämpa filter
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Avbryt
            </Button>
          </div>

          {tempSelection.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => setTempSelection([])}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4 mr-1" />
              Rensa urval
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
