'use client';

import { useState, useMemo } from 'react';
import { UserRole } from '@prisma/client';
import { useUsers, User } from '@/lib/hooks/use-users';
import UsersToolbar from '@/components/users/users-toolbar';
import UsersTable from '@/components/users/users-table';
import CreateUserModal from '@/components/users/modals/create-user-modal';
import EditUserModal from '@/components/users/modals/edit-user-modal';
import ResetPasswordModal from '@/components/users/modals/reset-password-modal';
import DeleteUserModal from '@/components/users/modals/delete-user-modal';
import ErrorMessage from '@/components/ui/error-message';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useMemo(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function UsersClient() {
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<boolean | 'ALL'>('ALL');

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Selected user for modals
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch users with filters
  const { users, loading, error, mutate } = useUsers({
    query: debouncedSearchQuery,
    role: roleFilter,
    isActive: statusFilter,
  });

  // Handle edit user
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditModalOpen(true);
  };

  // Handle reset password
  const handleResetPassword = (user: User) => {
    setPasswordResetUser(user);
    setPasswordModalOpen(true);
  };

  // Handle delete user
  const handleDelete = (user: User) => {
    setDeletingUser(user);
    setDeleteModalOpen(true);
  };

  // Handle success callbacks
  const handleCreateSuccess = () => {
    mutate(); // Refresh users list
  };

  const handleEditSuccess = () => {
    mutate(); // Refresh users list
    setEditingUser(null);
  };

  const handlePasswordSuccess = () => {
    setPasswordResetUser(null);
  };

  const handleDeleteSuccess = () => {
    mutate(); // Refresh users list
    setDeletingUser(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Användare</h1>
        <p className="text-gray-600 mt-1">
          Hantera användare och behörigheter
        </p>
      </div>

      {/* Error State */}
      {error && (
        <ErrorMessage
          message={error instanceof Error ? error.message : error}
          variant="card"
          className="mb-6"
        />
      )}

      {/* Toolbar */}
      <UsersToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onCreateUser={() => setCreateModalOpen(true)}
      />

      {/* Users Table */}
      <UsersTable
        users={users}
        loading={loading}
        onEdit={handleEdit}
        onResetPassword={handleResetPassword}
        onDelete={handleDelete}
      />

      {/* Modals */}
      <CreateUserModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditUserModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingUser(null);
        }}
        onSuccess={handleEditSuccess}
        user={editingUser}
      />

      <ResetPasswordModal
        isOpen={passwordModalOpen}
        onClose={() => {
          setPasswordModalOpen(false);
          setPasswordResetUser(null);
        }}
        onSuccess={handlePasswordSuccess}
        user={passwordResetUser}
      />

      <DeleteUserModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingUser(null);
        }}
        onSuccess={handleDeleteSuccess}
        user={deletingUser}
      />
    </div>
  );
}
