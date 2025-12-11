'use client';

import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import {
  MoreVertical,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import Badge from '@/components/ui/badge';
import { useMeetingsStore } from '@/lib/stores/meetings-store';

interface Meeting {
  id: string;
  outlookEventId: string | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  subject: string | null;
  organizerEmail: string;
  status: string;
  statusReason: string | null;
  qualityScore: number | null;
  notes: string | null;
  bookerName: string;
  ownerName: string;
}

interface ListViewProps {
  meetings: Meeting[];
}

const statusLabels: Record<string, string> = {
  BOOKED: 'Bokad',
  COMPLETED: 'Genomförd',
  NO_SHOW: 'No-show',
  CANCELED: 'Avbokad',
  RESCHEDULED: 'Ombokad',
};

const statusVariants: Record<string, 'booked' | 'completed' | 'no-show' | 'canceled' | 'rescheduled'> = {
  BOOKED: 'booked',
  COMPLETED: 'completed',
  NO_SHOW: 'no-show',
  CANCELED: 'canceled',
  RESCHEDULED: 'rescheduled',
};

export default function ListView({ meetings }: ListViewProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'startTime', desc: true }
  ]);
  const { selectedIds, toggleSelect, isSelected } = useMeetingsStore();
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<Meeting>[]>(
    () => [
      {
        id: 'select',
        size: 40,
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="rounded border-gray-300 text-telink-violet focus:ring-telink-violet"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={isSelected(row.original.id)}
            onChange={() => toggleSelect(row.original.id)}
            className="rounded border-gray-300 text-telink-violet focus:ring-telink-violet"
          />
        ),
      },
      {
        accessorKey: 'subject',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-2 hover:text-telink-violet transition-colors font-semibold"
          >
            Ämne
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUpDown className="h-4 w-4 opacity-50" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <div className="max-w-md">
            <div className="font-medium text-gray-900 truncate">
              {row.original.subject || 'Inget ämne'}
            </div>
            {row.original.notes && (
              <div className="text-sm text-gray-500 truncate">
                {row.original.notes}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'startTime',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-2 hover:text-telink-violet transition-colors font-semibold"
          >
            Datum & Tid
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUpDown className="h-4 w-4 opacity-50" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const startTime = new Date(row.original.startTime);
          const endTime = new Date(row.original.endTime);

          return (
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-gray-400" />
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {format(startTime, 'd MMM yyyy', { locale: sv })}
                </div>
                <div className="text-xs text-gray-500">
                  {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                </div>
              </div>
            </div>
          );
        },
        sortingFn: 'datetime',
      },
      {
        accessorKey: 'ownerName',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-2 hover:text-telink-violet transition-colors font-semibold"
          >
            Ägare
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUpDown className="h-4 w-4 opacity-50" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-telink-violet flex items-center justify-center text-white text-sm font-semibold">
              {row.original.ownerName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-gray-900">{row.original.ownerName}</span>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge variant={statusVariants[status] || 'rescheduled'} size="md">
              {statusLabels[status] || status}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'qualityScore',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-2 hover:text-telink-violet transition-colors font-semibold"
          >
            Kvalitet
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUpDown className="h-4 w-4 opacity-50" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const score = row.original.qualityScore;
          if (score === null) {
            return <span className="text-sm text-gray-400">-</span>;
          }
          return (
            <div className="flex items-center gap-1">
              {'⭐'.repeat(score)}
              <span className="text-sm text-gray-600 ml-1">({score})</span>
            </div>
          );
        },
      },
      {
        id: 'actions',
        size: 60,
        cell: ({ row }) => (
          <div className="relative">
            <button
              onClick={() => setActionMenuOpen(actionMenuOpen === row.original.id ? null : row.original.id)}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <MoreVertical className="h-4 w-4 text-gray-600" />
            </button>

            {actionMenuOpen === row.original.id && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Redigera
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Markera som genomförd
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Markera som no-show
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600">
                    <Trash2 className="h-4 w-4" />
                    Ta bort
                  </button>
                </div>
              </div>
            )}
          </div>
        ),
      },
    ],
    [actionMenuOpen, isSelected, toggleSelect]
  );

  const table = useReactTable({
    data: meetings,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Empty state
  if (meetings.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Inga möten hittades
          </h3>
          <p className="text-gray-500">
            Det finns inga möten som matchar dina filter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Visar <span className="font-medium">{meetings.length}</span> möten
            </div>
            <div className="text-sm text-gray-500">
              {selectedIds.size > 0 && (
                <span className="font-medium text-telink-violet">
                  {selectedIds.size} valda
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
