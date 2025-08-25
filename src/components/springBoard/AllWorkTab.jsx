// File: src/components/springBoard/AllWorkTab.jsx
import React, { useEffect, useState, useContext, useCallback } from 'react';
import axiosInstance from '../../services/axiosinstance';
import { AuthContext } from '../../context/auth-context';
import { useNavigate } from 'react-router-dom';

const AllWorkTab = ({ projectId, reloadKey }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    todo: 0,
    blocked: 0
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.post(
        '/projects/tasks/list/',
        { project_id: projectId, page_size: 100 },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      
      const tasks = res?.data?.status ? (res?.data?.records || []) : [];
      setRows(tasks);
      
      // Calculate statistics
      const statsData = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'DONE').length,
        inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
        todo: tasks.filter(t => t.status === 'TODO').length,
        blocked: tasks.filter(t => t.status === 'BLOCKED').length
      };
      setStats(statsData);
    } catch {
      setRows([]);
      setStats({ total: 0, completed: 0, inProgress: 0, todo: 0, blocked: 0 });
    } finally {
      setLoading(false);
    }
  }, [projectId, user?.token]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      'TODO': { color: '#757575', bg: '#f5f5f5', icon: '📝' },
      'IN_PROGRESS': { color: '#1976d2', bg: '#e3f2fd', icon: '⚡' },
      'IN_REVIEW': { color: '#f57c00', bg: '#fff3e0', icon: '👀' },
      'DONE': { color: '#388e3c', bg: '#e8f5e8', icon: '✅' },
      'BLOCKED': { color: '#d32f2f', bg: '#ffebee', icon: '🚫' }
    };
    
    const config = statusConfig[status] || statusConfig['TODO'];
    return { ...config };
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

  const openTaskInNewTab = (taskId, e) => {
    e.stopPropagation();
    const absolute = `${window.location.origin}/projects/${projectId}/tasks/${taskId}`;
    window.open(absolute, '_blank', 'noopener,noreferrer');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="all-work-tab">
      <div className="all-work-header">
        <div className="header-content">
          <h3>All Work Items</h3>
          <div className="work-stats">
            <div className="stat-card total">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-card completed">
              <span className="stat-number">{stats.completed}</span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat-card in-progress">
              <span className="stat-number">{stats.inProgress}</span>
              <span className="stat-label">In Progress</span>
            </div>
            <div className="stat-card todo">
              <span className="stat-number">{stats.todo}</span>
              <span className="stat-label">To Do</span>
            </div>
            {stats.blocked > 0 && (
              <div className="stat-card blocked">
                <span className="stat-number">{stats.blocked}</span>
                <span className="stat-label">Blocked</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="all-work-table-container">
        <table className="all-work-table">
          <thead>
            <tr>
              <th>Issue</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Assignee</th>
              <th>Updated</th>
              <th>Sprint</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="6" className="loading-cell">
                  <div className="loading-content">
                    <div className="loading-spinner"></div>
                    <span>Loading work items…</span>
                  </div>
                </td>
              </tr>
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan="6" className="empty-cell">
                  <div className="empty-content">
                    <span className="empty-icon">📊</span>
                    <span>No work items found</span>
                  </div>
                </td>
              </tr>
            )}

            {!loading && rows.map(t => {
              const statusConfig = getStatusBadge(t.status);
              return (
                <tr 
                  key={t.id} 
                  className="work-row"
                  onClick={() => navigate(`/projects/${projectId}/tasks/${t.id}`)}
                >
                  <td className="issue-cell">
                    <div className="issue-content">
                      <span className="issue-title">{t.title}</span>
                      <button 
                        className="external-link-btn"
                        onClick={(e) => openTaskInNewTab(t.id, e)}
                        title="Open in new tab"
                      >
                        ↗
                      </button>
                    </div>
                  </td>
                  
                  <td className="status-cell">
                    <div 
                      className="status-badge"
                      style={{ 
                        color: statusConfig.color,
                        backgroundColor: statusConfig.bg 
                      }}
                    >
                      <span className="status-icon">{statusConfig.icon}</span>
                      <span className="status-text">{t.status}</span>
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
                  
                  <td className="updated-cell">
                    <span className="updated-date">{formatDate(t.updated_at)}</span>
                  </td>
                  
                  <td className="sprint-cell">
                    <span className="sprint-name">{t.sprint_name || 'Backlog'}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllWorkTab;
