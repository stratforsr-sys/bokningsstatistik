'use client';

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { Edit, Key, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { User } from '@/lib/hooks/use-users';
import UserAvatar from './user-avatar';
import UserStatusBadge from './user-status-badge';
import Badge from '@/components/ui/badge';
import Spinner from '@/components/ui/spinner';
import { useState } from 'react';

interface UsersTableProps {
  users: User[];
  loading: boolean;
  onEdit: (user: User) => void;
  onResetPassword: (user: User) => void;
  onDelete: (user: User) => void;
}

export default function UsersTable({
  users,
  loading,
  onEdit,
  onResetPassword,
  onDelete,
}: UsersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  // Define columns
  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Användare',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <UserAvatar name={row.original.name} size="md" />
            <div className="min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {row.original.name}
              </div>
              <div className="text-sm text-gray-500 truncate">
                {row.original.email}
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Roll',
        cell: ({ row }) => (
          <Badge variant={row.original.role.toLowerCase() as any} size="sm">
            {row.original.role}
          </Badge>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => <UserStatusBadge isActive={row.original.isActive} />,
      },
      {
        accessorKey: 'createdAt',
        header: 'Skapad',
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">
            {new Date(row.original.createdAt).toLocaleDateString('sv-SE')}
          </span>
        ),
      },
      {
        accessorKey: '_count',
        header: 'Möten',
        cell: ({ row }) => {
          const booked = row.original._count.bookedMeetings;
          const owned = row.original._count.ownedMeetings;
          const total = booked + owned;

          return (
            <span className="text-sm text-gray-600">
              {total > 0 ? total : '-'}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Åtgärder',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(row.original)}
              className="p-2 text-gray-600 hover:text-telink-violet hover:bg-gray-100 rounded-md transition-colors"
              title="Redigera användare"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onResetPassword(row.original)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-md transition-colors"
              title="Återställ lösenord"
            >
              <Key className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(row.original)}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-md transition-colors"
              title="Inaktivera användare"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [onEdit, onResetPassword, onDelete]
  );

  const table = useReactTable({
    data: users,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Loading state
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Empty state
  if (users.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500 mb-4">Inga användare hittades</p>
        <p className="text-sm text-gray-400">
          Försök ändra dina filter eller skapa en ny användare
        </p>
      </div>
    );
  }

  // Table
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? 'cursor-pointer select-none flex items-center gap-2'
                            : ''
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: <ArrowUp className="h-4 w-4" />,
                          desc: <ArrowDown className="h-4 w-4" />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-50 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-6 py-4 whitespace-nowrap text-sm"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
