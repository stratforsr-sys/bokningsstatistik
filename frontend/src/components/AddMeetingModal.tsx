import React, { useState } from 'react';
import { Button } from './Button';
import './AddMeetingModal.css';

interface AddMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (link: string) => Promise<void>;
}

/**
 * AddMeetingModal - Modal för att lägga till möte via Outlook/Teams-länk
 *
 * UXAgent: Enkel modal med ett inputfält och två knappar
 * BookingUXAgent: Minimalistisk design för snabb bokningsinmatning
 */
export const AddMeetingModal: React.FC<AddMeetingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [link, setLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!link.trim()) {
      setError('Vänligen ange en länk');
      return;
    }

    // Validera att det ser ut som en Outlook/Teams-länk
    if (
      !link.includes('outlook.office365.com') &&
      !link.includes('teams.microsoft.com')
    ) {
      setError('Länken måste vara från Outlook eller Teams');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(link);
      setLink('');
      onClose();
    } catch (error: any) {
      setError(error.message || 'Kunde inte lägga till mötet. Försök igen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setLink('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Lägg till möte</h2>
          <button
            className="modal-close"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Stäng"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="meeting-link" className="form-label">
                Outlook/Teams-länk
              </label>
              <input
                type="url"
                id="meeting-link"
                className="form-input"
                placeholder="https://outlook.office365.com/... eller https://teams.microsoft.com/..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
              <p className="form-help">
                Klistra in länken från din Outlook-kalender eller Teams-möte
              </p>
            </div>

            {error && (
              <div className="alert alert-error">
                <span className="alert-icon">⚠️</span>
                <p>{error}</p>
              </div>
            )}

            <div className="info-box">
              <h4>📝 Hur hittar jag länken?</h4>
              <ul>
                <li>
                  <strong>Outlook:</strong> Öppna mötet → Kopiera länk till mötet
                </li>
                <li>
                  <strong>Teams:</strong> Öppna mötet → Kopiera Teams-länk
                </li>
              </ul>
            </div>
          </div>

          <div className="modal-footer">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Avbryt
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !link.trim()}
            >
              {isSubmitting ? 'Lägger till...' : 'Lägg till möte'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
