import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import './InviteComplete.css';

export const InviteComplete = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError('Ingen invite-token hittades i URL:en');
    }
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validera
    if (password.length < 8) {
      setError('Lösenordet måste vara minst 8 tecken');
      return;
    }

    if (password !== confirmPassword) {
      setError('Lösenorden matchar inte');
      return;
    }

    if (!token) {
      setError('Ingen invite-token');
      return;
    }

    setLoading(true);

    try {
      await api.completeInvite({
        token,
        name,
        password,
      });

      // Uppdatera auth context
      await refreshUser();

      // Redirect till dashboard
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Kunde inte slutföra invite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="invite-container">
      <div className="invite-card">
        <div className="invite-header">
          <h1>Välkommen till Telink!</h1>
          <p>Skapa ditt konto för att komma igång</p>
        </div>

        <form onSubmit={handleSubmit} className="invite-form">
          <div className="form-group">
            <label htmlFor="name">Namn</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Förnamn Efternamn"
              required
              autoFocus
              disabled={loading || !token}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Lösenord</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minst 8 tecken"
              required
              disabled={loading || !token}
            />
            <small className="form-hint">Minst 8 tecken</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">Bekräfta lösenord</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Upprepa lösenordet"
              required
              disabled={loading || !token}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="invite-button"
            disabled={loading || !token}
          >
            {loading ? 'Skapar konto...' : 'Skapa konto'}
          </button>
        </form>

        <div className="invite-footer">
          <p>
            Har du redan ett konto? <a href="/login">Logga in här</a>
          </p>
        </div>
      </div>
    </div>
  );
};
