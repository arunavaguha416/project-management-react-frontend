// src/components/springBoard/SprintButton.jsx
import React, { useState, useCallback, useContext } from 'react';
import axiosInstance from '../../services/axiosinstance';
import { AuthContext } from '../../context/auth-context';
import InitialsModal from './InitialsModal';

const SprintButton = ({ 
  projectId, 
  activeSprintId, 
  isSprintActive, 
  onSprintChange,
  reloadAll 
}) => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [showInitialsModal, setShowInitialsModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Start sprint with initials (for first-time projects)
  const startSprintWithInitials = useCallback(async (initials) => {
    try {
      setLoading(true);
      const res = await axiosInstance.post(
        '/projects/sprints/start/',
        {
          project_id: projectId,
          initials: initials
        },
        user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : undefined
      );

      if (res?.data?.status) {
        setStatusMsg('Sprint started successfully!');
        setShowInitialsModal(false);
        onSprintChange?.(res.data.records.id, true, res.data.records.name);
        reloadAll?.();
        
        setTimeout(() => setStatusMsg(''), 3000);
      } else {
        throw new Error(res?.data?.message || 'Failed to start sprint');
      }
    } catch (error) {
      console.error('Start sprint error:', error);
      setStatusMsg(error?.response?.data?.message || error.message || 'Failed to start sprint');
      setTimeout(() => setStatusMsg(''), 5000);
    } finally {
      setLoading(false);
    }
  }, [projectId, user?.token, onSprintChange, reloadAll]);

  // End current sprint
  const endCurrentSprint = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.post(
        '/projects/sprints/end/',
        {
          sprint_id: activeSprintId
        },
        user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : undefined
      );

      if (res?.data?.status) {
        setStatusMsg('Sprint ended successfully!');
        onSprintChange?.('', false, '');
        reloadAll?.();
        
        setTimeout(() => setStatusMsg(''), 3000);
      } else {
        throw new Error(res?.data?.message || 'Failed to end sprint');
      }
    } catch (error) {
      console.error('End sprint error:', error);
      setStatusMsg(error?.response?.data?.message || error.message || 'Failed to end sprint');
      setTimeout(() => setStatusMsg(''), 5000);
    } finally {
      setLoading(false);
    }
  }, [activeSprintId, user?.token, onSprintChange, reloadAll]);

  // Check if project has any previous sprints and start accordingly
  const checkAndStartSprint = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try to start without initials first
      const res = await axiosInstance.post(
        '/projects/sprints/start/',
        {
          project_id: projectId
        },
        user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : undefined
      );

      if (res?.data?.status) {
        setStatusMsg('Sprint started successfully!');
        onSprintChange?.(res.data.records.id, true, res.data.records.name);
        reloadAll?.();
        setTimeout(() => setStatusMsg(''), 3000);
      } else {
        // If it fails because initials are needed, show the modal
        if (res?.data?.message?.toLowerCase().includes('initials')) {
          setShowInitialsModal(true);
        } else {
          throw new Error(res?.data?.message || 'Failed to start sprint');
        }
      }
    } catch (error) {
      // If error mentions initials, show the modal
      if (error?.response?.data?.message?.toLowerCase().includes('initials')) {
        setShowInitialsModal(true);
      } else {
        console.error('Start sprint error:', error);
        setStatusMsg(error?.response?.data?.message || error.message || 'Failed to start sprint');
        setTimeout(() => setStatusMsg(''), 5000);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, user?.token, onSprintChange, reloadAll]);

  // Main button click handler
  const handleButtonClick = () => {
    if (isSprintActive) {
      endCurrentSprint();
    } else {
      checkAndStartSprint();
    }
  };

  const buttonText = isSprintActive ? 'End Sprint' : 'Start Sprint';
  const buttonColor = isSprintActive ? '#d32f2f' : '#1976d2';

  return (
    <>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <button
          onClick={handleButtonClick}
          disabled={loading || !projectId}
          style={{
            padding: '8px 16px',
            backgroundColor: loading ? '#ccc' : buttonColor,
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading || !projectId ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            minWidth: '100px'
          }}
        >
          {loading ? 'Processing...' : buttonText}
        </button>
        
        {/* Removed Sprint Name Display */}
        
        {/* Status message */}
        {statusMsg && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            padding: '8px 12px',
            backgroundColor: statusMsg.includes('success') ? '#4caf50' : '#f44336',
            color: 'white',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            zIndex: 100
          }}>
            {statusMsg}
          </div>
        )}
      </div>

      {/* Initials Modal */}
      <InitialsModal
        isOpen={showInitialsModal}
        onClose={() => setShowInitialsModal(false)}
        onSubmit={startSprintWithInitials}
        loading={loading}
      />
    </>
  );
};

export default SprintButton;
