// File: src/components/springBoard/ReleasesTab.jsx
import React, { useEffect, useState, useContext, useCallback } from 'react';
import axiosInstance from '../../services/axiosinstance';
import { AuthContext } from '../../context/auth-context';

const ReleasesTab = ({ projectId, reloadKey }) => {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    overdue: 0
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.post(
        '/projects/milestones/list/',
        { project_id: projectId, page_size: 50 },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      
      const milestones = res?.data?.status ? (res?.data?.records || []) : [];
      setItems(milestones);
      
      // Calculate statistics
      const now = new Date();
      const statsData = {
        total: milestones.length,
        completed: milestones.filter(m => m.status === 'COMPLETED').length,
        inProgress: milestones.filter(m => m.status === 'IN_PROGRESS').length,
        pending: milestones.filter(m => m.status === 'PENDING').length,
        overdue: milestones.filter(m => {
          const dueDate = new Date(m.target_date || m.due_date);
          return m.status !== 'COMPLETED' && dueDate < now;
        }).length
      };
      setStats(statsData);
    } catch {
      setItems([]);
      setStats({ total: 0, completed: 0, inProgress: 0, pending: 0, overdue: 0 });
    } finally {
      setLoading(false);
    }
  }, [projectId, user?.token]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  const getStatusConfig = (status) => {
    const statusConfig = {
      'PENDING': { color: '#757575', bg: '#f5f5f5', icon: '⏳' },
      'IN_PROGRESS': { color: '#1976d2', bg: '#e3f2fd', icon: '🚀' },
      'COMPLETED': { color: '#388e3c', bg: '#e8f5e8', icon: '✅' },
      'CANCELLED': { color: '#d32f2f', bg: '#ffebee', icon: '❌' }
    };
    
    return statusConfig[status] || statusConfig['PENDING'];
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

  const isOverdue = (milestone) => {
    if (milestone.status === 'COMPLETED') return false;
    const dueDate = new Date(milestone.target_date || milestone.due_date);
    return dueDate < new Date();
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return '#388e3c';
    if (percentage >= 70) return '#689f38';
    if (percentage >= 50) return '#f57c00';
    if (percentage >= 25) return '#ff9800';
    return '#f44336';
  };

  return (
    <div className="releases-tab">
      <div className="releases-header">
        <div className="header-content">
          <h3>Releases & Milestones</h3>
          <div className="releases-stats">
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
            <div className="stat-card pending">
              <span className="stat-number">{stats.pending}</span>
              <span className="stat-label">Pending</span>
            </div>
            {stats.overdue > 0 && (
              <div className="stat-card overdue">
                <span className="stat-number">{stats.overdue}</span>
                <span className="stat-label">Overdue</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="releases-table-container">
        <table className="releases-table">
          <thead>
            <tr>
              <th>Release</th>
              <th>Status</th>
              <th>Target Date</th>
              <th>Progress</th>
              <th>Health</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="5" className="loading-cell">
                  <div className="loading-content">
                    <div className="loading-spinner"></div>
                    <span>Loading releases…</span>
                  </div>
                </td>
              </tr>
            )}

            {!loading && items.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-cell">
                  <div className="empty-content">
                    <span className="empty-icon">🚀</span>
                    <span>No releases found</span>
                  </div>
                </td>
              </tr>
            )}

            {!loading && items.map(m => {
              const statusConfig = getStatusConfig(m.status);
              const progress = m.completion_percentage ?? 0;
              const overdue = isOverdue(m);
              
              return (
                <tr 
                  key={m.id} 
                  className={`release-row ${overdue ? 'overdue' : ''}`}
                >
                  <td className="release-cell">
                    <div className="release-content">
                      <div className="release-info">
                        <span className="release-title">{m.title || m.name}</span>
                        {m.description && (
                          <span className="release-description">{m.description}</span>
                        )}
                      </div>
                      {overdue && (
                        <div className="overdue-indicator" title="Overdue">
                          ⚠️
                        </div>
                      )}
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
                      <span className="status-text">{m.status}</span>
                    </div>
                  </td>
                  
                  <td className="date-cell">
                    <div className="date-content">
                      <span className="target-date">
                        {formatDate(m.target_date || m.due_date)}
                      </span>
                      {overdue && (
                        <span className="overdue-text">Overdue</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="progress-cell">
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ 
                            width: `${progress}%`,
                            backgroundColor: getProgressColor(progress)
                          }}
                        />
                      </div>
                      <span className="progress-text">{progress}%</span>
                    </div>
                  </td>
                  
                  <td className="health-cell">
                    <div className="health-indicator">
                      {progress >= 90 ? (
                        <span className="health-excellent" title="Excellent">🟢</span>
                      ) : progress >= 70 ? (
                        <span className="health-good" title="Good">🟡</span>
                      ) : progress >= 50 ? (
                        <span className="health-warning" title="At Risk">🟠</span>
                      ) : (
                        <span className="health-critical" title="Critical">🔴</span>
                      )}
                    </div>
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

export default ReleasesTab;
