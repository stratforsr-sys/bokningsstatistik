import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import type { User, UserRole } from '../types';
import './Users.css';

export const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite form state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('USER');
  const [submitting, setSubmitting] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  // Edit modal state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('USER');

  // Delete modal state
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const userData = await api.getUsers();
      setUsers(userData);
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError('Kunde inte ladda användare');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail.trim()) {
      alert('Email är obligatoriskt');
      return;
    }

    setSubmitting(true);
    setInviteUrl(null);
    try {
      const response = await api.inviteUser({
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      });

      setInviteUrl(response.inviteUrl);
      setInviteEmail('');
      setInviteRole('USER');
      alert(`Invite skickad till ${response.invite.email}!\n\nKopiera länken och skicka till användaren.`);
      await loadUsers();
    } catch (err: any) {
      console.error('Error inviting user:', err);
      alert(err.message || 'Kunde inte skicka invite');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return { color: '#dc2626', bgColor: '#fee2e2' };
      case 'MANAGER':
        return { color: '#2563eb', bgColor: '#dbeafe' };
      case 'USER':
        return { color: '#16a34a', bgColor: '#dcfce7' };
      default:
        return { color: '#6b7280', bgColor: '#f3f4f6' };
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Admin';
      case 'MANAGER':
        return 'Manager';
      case 'USER':
        return 'Användare';
      default:
        return role;
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingUser) return;

    if (!editName.trim() || !editEmail.trim()) {
      alert('Namn och email är obligatoriska');
      return;
    }

    setSubmitting(true);
    try {
      const updatedUser = await api.updateUser(editingUser.id, {
        name: editName.trim(),
        email: editEmail.trim().toLowerCase(),
        role: editRole,
      });

      alert(`Användare uppdaterad: ${updatedUser.name}`);
      setEditingUser(null);
      setEditName('');
      setEditEmail('');
      setEditRole('USER');
      await loadUsers();
    } catch (err: any) {
      console.error('Error updating user:', err);
      alert(err.message || 'Kunde inte uppdatera användare');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    setDeleting(true);
    try {
      await api.deleteUser(deletingUser.id);
      alert(`Användare borttagen: ${deletingUser.name}\n\nAlla möten behålls med personens namn. Du kan bjuda in användaren igen senare.`);
      setDeletingUser(null);
      await loadUsers();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      alert(err.message || 'Kunde inte ta bort användare');
    } finally {
      setDeleting(false);
    }
  };

  // Visa inte sidan om användaren inte är ADMIN
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="users-page">
        <div className="container">
          <div className="error-banner">
            <p>Du har inte behörighet att visa denna sida. Endast administratörer har åtkomst till användarhantering.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="users-page">
      <header className="page-header">
        <div className="container">
          <div className="header-content">
            <div>
              <h1>Personer</h1>
              <p className="subtitle">Hantera mötesbokare, säljare och användare</p>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setShowInviteForm(!showInviteForm);
                setInviteUrl(null);
              }}
            >
              {showInviteForm ? 'Avbryt' : '+ Bjud in användare'}
            </Button>
          </div>
        </div>
      </header>

      <div className="container">
        {/* Invite Form */}
        {showInviteForm && (
          <div className="create-user-card">
            <h2>Bjud in ny användare</h2>
            <p className="form-description">
              Användaren får ett email med en länk för att skapa sitt konto och välja lösenord.
            </p>
            <form onSubmit={handleInviteSubmit} className="user-form">
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="invite-email">Email *</label>
                  <input
                    type="email"
                    id="invite-email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="anna@företag.se"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="invite-role">Roll</label>
                  <select
                    id="invite-role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as UserRole)}
                    className="form-select"
                  >
                    <option value="USER">Användare</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <small className="form-hint">
                    USER: Ser bara egna möten | MANAGER: Ser alla möten | ADMIN: Full behörighet
                  </small>
                </div>
              </div>

              <div className="form-actions">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowInviteForm(false);
                    setInviteUrl(null);
                  }}
                  disabled={submitting}
                >
                  Avbryt
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submitting}
                >
                  {submitting ? 'Skickar invite...' : 'Skicka invite'}
                </Button>
              </div>
            </form>

            {/* Show invite URL if created */}
            {inviteUrl && (
              <div className="invite-url-box">
                <p><strong>Invite-länk skapad!</strong></p>
                <p>Kopiera denna länk och skicka till användaren:</p>
                <div className="url-display">
                  <code>{inviteUrl}</code>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteUrl);
                      alert('Länk kopierad!');
                    }}
                  >
                    Kopiera
                  </Button>
                </div>
                <p className="form-hint">Länken går ut om 7 dagar.</p>
              </div>
            )}
          </div>
        )}

        {/* Users List */}
        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <Button variant="secondary" size="sm" onClick={loadUsers}>
              Försök igen
            </Button>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Laddar personer...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <p>Inga personer hittades</p>
            <Button variant="primary" size="sm" onClick={() => setShowInviteForm(true)}>
              Bjud in din första användare
            </Button>
          </div>
        ) : (
          <div className="users-grid">
            {users.map((user) => {
              const roleStyle = getRoleBadgeColor(user.role);
              return (
                <div key={user.id} className="user-card">
                  <div className="user-card-header">
                    <div className="user-avatar">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <h3>{user.name}</h3>
                      <p className="user-email">{user.email}</p>
                    </div>
                  </div>
                  <div className="user-card-body">
                    <div className="user-meta">
                      <span
                        className="role-badge"
                        style={{
                          color: roleStyle.color,
                          backgroundColor: roleStyle.bgColor,
                        }}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                      <span className="user-id" title="User ID (kopiera för att använda)">
                        ID: {user.id.slice(0, 8)}...
                      </span>
                    </div>
                    <div className="user-actions">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(user.id);
                          alert(`User ID kopierat: ${user.id}`);
                        }}
                      >
                        Kopiera ID
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        ✏️ Redigera
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingUser(user)}
                      >
                        🗑️ Ta bort
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Help Text */}
        {!showInviteForm && users.length > 0 && (
          <div className="help-card">
            <h3>Hur använder jag User ID?</h3>
            <p>
              När du skapar ett möte kan du använda User ID för att ange bokare och ägare.
              Klicka "Kopiera ID" på personen du vill använda, och klistra sedan in det i
              formuläret för att skapa möte.
            </p>
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="modal-overlay" onClick={() => setEditingUser(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Redigera person</h2>
                <button
                  className="modal-close"
                  onClick={() => setEditingUser(null)}
                  aria-label="Stäng"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleUpdateUser} className="user-form">
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="edit-name">Namn *</label>
                    <input
                      type="text"
                      id="edit-name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="t.ex. Anna Andersson"
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="edit-email">Email *</label>
                    <input
                      type="email"
                      id="edit-email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="anna@företag.se"
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="edit-role">Roll</label>
                    <select
                      id="edit-role"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as UserRole)}
                      className="form-select"
                    >
                      <option value="USER">Användare</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="form-actions">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingUser(null)}
                    disabled={submitting}
                  >
                    Avbryt
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={submitting}
                  >
                    {submitting ? 'Uppdaterar...' : 'Spara ändringar'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete User Modal */}
        {deletingUser && (
          <div className="modal-overlay" onClick={() => setDeletingUser(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Ta bort person</h2>
                <button
                  className="modal-close"
                  onClick={() => setDeletingUser(null)}
                  aria-label="Stäng"
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <p>Är du säker på att du vill ta bort <strong>{deletingUser.name}</strong>?</p>
                <p className="warning-text">
                  ⚠️ Användaren tas bort permanent, men alla deras möten behålls intakta med personens namn.
                </p>
                <p className="info-text">
                  ✅ Du kan bjuda in användaren igen senare om du vill.
                </p>
              </div>
              <div className="form-actions">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingUser(null)}
                  disabled={deleting}
                >
                  Avbryt
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleDeleteUser}
                  disabled={deleting}
                >
                  {deleting ? 'Tar bort...' : 'Ta bort användare'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
