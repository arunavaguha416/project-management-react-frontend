import React, { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../../services/axiosinstance';
import { useNavigate } from 'react-router-dom';
import IssueDetailsModal from './IssueDetailsModal';

const BacklogTab = ({ projectId, sprintId, onMoved, reloadKey }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionOk, setActionOk] = useState('');
  const [openTaskId, setOpenTaskId] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setActionError('');
      setActionOk('');
      const res = await axiosInstance.post('/projects/backlog/list/', {
        project_id: projectId,
        page_size: 50
      });
      setItems(res?.data?.status ? (res?.data?.records || []) : []);
    } catch (err) {
      setItems([]);
      setActionError(err?.response?.data?.message || 'Failed to load backlog');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  const addToSprint = async (taskId) => {
    setActionError('');
    setActionOk('');
    if (!sprintId) {
      setActionError('No active sprint to add into.');
      return;
    }

    try {
      setMovingId(taskId);
      const res = await axiosInstance.put('/projects/task/move/', {
        id: taskId,
        status: 'TODO',
        sprint_id: sprintId
      });

      if (!res?.data?.status) {
        setActionError(res?.data?.message || 'Failed to add task to sprint');
        return;
      }

      setActionOk('Task added to sprint.');
      await load();
      if (onMoved) onMoved();
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Request failed.');
    } finally {
      setMovingId(null);
    }
  };

  const openTaskModal = (t, evt) => {
    if (evt?.shiftKey) {
      navigate(`/projects/${projectId}/tasks/${t.id}`);
      return;
    }
    setOpenTaskId(t.id);
  };

  const openPageNewTab = (t, e) => {
    e.stopPropagation();
    e.preventDefault();
    const absolute = `${window.location.origin}/projects/${projectId}/tasks/${t.id}`;
    window.open(absolute, '_blank', 'noopener,noreferrer');
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL': return '#d32f2f';
      case 'HIGH': return '#f57c00';
      case 'MEDIUM': return '#1976d2';
      case 'LOW': return '#388e3c';
      default: return '#757575';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL': return '🔴';
      case 'HIGH': return '🟠';
      case 'MEDIUM': return '🟡';
      case 'LOW': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <div className="backlog-tab">
      <div className="backlog-header">
        <h3>Product Backlog</h3>
        {!sprintId && (
          <div className="no-sprint-notice">
            <span className="notice-icon">⚠️</span>
            <span>No active sprint. Start a sprint to move items.</span>
          </div>
        )}
      </div>

      {actionError && (
        <div className="action-message error-message">
          <span className="message-icon">❌</span>
          {actionError}
        </div>
      )}

      {actionOk && (
        <div className="action-message success-message">
          <span className="message-icon">✅</span>
          {actionOk}
        </div>
      )}

      <div className="backlog-table-container">
        <table className="backlog-table">
          <thead>
            <tr>
              <th>Issue</th>
              <th>Priority</th>
              <th>Assignee</th>
              <th>Status</th>
              <th>Due</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="6" className="loading-cell">
                  <div className="loading-content">
                    <div className="loading-spinner"></div>
                    <span>Loading backlog…</span>
                  </div>
                </td>
              </tr>
            )}

            {!loading && items.length === 0 && (
              <tr>
                <td colSpan="6" className="empty-cell">
                  <div className="empty-content">
                    <span className="empty-icon">📝</span>
                    <span>No backlog items</span>
                  </div>
                </td>
              </tr>
            )}

            {!loading && items.map(t => (
              <tr 
                key={t.id} 
                className={`backlog-row ${movingId === t.id ? 'moving' : ''}`}
                onClick={(e) => openTaskModal(t, e)}
              >
                <td className="issue-cell">
                  <div className="issue-content">
                    <span className="issue-title">{t.title}</span>
                    <button 
                      className="external-link-btn"
                      onClick={(e) => openPageNewTab(t, e)}
                      title="Open in new tab"
                    >
                      ↗
                    </button>
                  </div>
                </td>
                
                <td className="priority-cell">
                  <div 
                    className="priority-badge"
                    style={{ 
                      color: getPriorityColor(t.priority),
                      borderColor: getPriorityColor(t.priority) 
                    }}
                  >
                    <span className="priority-icon">{getPriorityIcon(t.priority)}</span>
                    <span className="priority-text">{t.priority || 'MEDIUM'}</span>
                  </div>
                </td>
                
                <td className="assignee-cell">
                  <div className="assignee-content">
                    <span className="assignee-avatar">👤</span>
                    <span className="assignee-name">{t.assignee_name || 'Unassigned'}</span>
                  </div>
                </td>
                
                <td className="status-cell">
                  <span className="status-badge">{t.status}</span>
                </td>
                
                <td className="due-cell">
                  <span className="due-date">{t.due_date || '-'}</span>
                </td>
                
                <td className="actions-cell">
                  <button
                    className={`add-to-sprint-btn ${!sprintId ? 'disabled' : ''} ${movingId === t.id ? 'loading' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      addToSprint(t.id);
                    }}
                    disabled={!sprintId || movingId === t.id}
                    title={!sprintId ? 'No active sprint' : 'Add to current sprint'}
                  >
                    {movingId === t.id ? (
                      <>
                        <div className="btn-spinner"></div>
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <span className="btn-icon">➕</span>
                        <span className="btn-text">Add to Sprint</span>
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {openTaskId && (
        <IssueDetailsModal
          taskId={openTaskId}
          projectId={projectId}
          onClose={() => setOpenTaskId('')}
          onChanged={load}
        />
      )}
    </div>
  );
};

export default BacklogTab;
