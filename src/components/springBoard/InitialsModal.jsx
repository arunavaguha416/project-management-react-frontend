// src/components/springBoard/InitialsModal.jsx
import React, { useState } from 'react';

const InitialsModal = ({ isOpen, onClose, onSubmit, loading }) => {
  const [initials, setInitials] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanInitials = initials.trim().toUpperCase();
    
    if (cleanInitials.length !== 3) {
      setError('Please enter exactly 3 letters');
      return;
    }
    
    if (!/^[A-Z]{3}$/.test(cleanInitials)) {
      setError('Please use only letters (A-Z)');
      return;
    }
    
    setError('');
    onSubmit(cleanInitials);
  };

  const handleClose = () => {
    if (!loading) {
      setInitials('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        width: '400px',
        maxWidth: '90vw'
      }}>
        <form onSubmit={handleSubmit}>
          <h3 style={{ marginTop: 0, marginBottom: '16px' }}>
            Start First Sprint
          </h3>
          
          <p style={{ color: '#666', marginBottom: '16px' }}>
            Enter 3-letter initials for your sprint naming (e.g., "USA" for "USA Sprint 1")
          </p>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              Sprint Initials *
            </label>
            <input
              type="text"
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase())}
              placeholder="e.g. USA"
              maxLength={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                textTransform: 'uppercase'
              }}
              disabled={loading}
              autoFocus
            />
            {error && (
              <div style={{ color: '#d32f2f', fontSize: '14px', marginTop: '4px' }}>
                {error}
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              style={{
                padding: '8px 16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || initials.length !== 3}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: loading || initials.length !== 3 ? '#ccc' : '#1976d2',
                color: 'white',
                cursor: loading || initials.length !== 3 ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Starting...' : 'Start Sprint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InitialsModal;
