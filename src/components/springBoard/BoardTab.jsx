import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axiosInstance from '../../services/axiosinstance';
import IssueDetailsModal from './IssueDetailsModal';

const STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'];

const Card = ({ t, onDragStart, onOpenModal, projectId }) => {
  const openPageNewTab = (e) => {
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
    <div
      className="kanban-card"
      draggable
      onDragStart={(e) => onDragStart(e, t)}
      onClick={() => onOpenModal(t)}
    >
      <div className="card-header">
        <div className="card-priority">
          <span 
            className="priority-icon"
            style={{ color: getPriorityColor(t.priority) }}
          >
            {getPriorityIcon(t.priority)}
          </span>
          <span className="card-id">#{t.id?.slice(-6)}</span>
        </div>
        <button 
          className="external-link-btn"
          onClick={openPageNewTab}
          title="Open in new tab"
        >
          ↗
        </button>
      </div>
      
      <div className="card-content">
        <h4 className="card-title">{t.title}</h4>
        {t.description && (
          <p className="card-description">{t.description}</p>
        )}
      </div>
      
      <div className="card-footer">
        <div className="assignee-info">
          <span className="assignee-avatar">👤</span>
          <span className="assignee-name">{t.assignee_name || 'Unassigned'}</span>
        </div>
        {t.story_points && (
          <div className="story-points">
            <span className="points-badge">{t.story_points}sp</span>
          </div>
        )}
      </div>
    </div>
  );
};

const Column = ({ status, tasks, onDrop, onDragOver, onOpenModal, projectId }) => {
  const getColumnConfig = (status) => {
    const configs = {
      'TODO': { title: 'To Do', color: '#757575', icon: '📝', bg: '#fafafa' },
      'IN_PROGRESS': { title: 'In Progress', color: '#1976d2', icon: '⚡', bg: '#e3f2fd' },
      'IN_REVIEW': { title: 'In Review', color: '#f57c00', icon: '👀', bg: '#fff3e0' },
      'DONE': { title: 'Done', color: '#388e3c', icon: '✅', bg: '#e8f5e8' },
      'BLOCKED': { title: 'Blocked', color: '#d32f2f', icon: '🚫', bg: '#ffebee' }
    };
    return configs[status] || configs['TODO'];
  };

  const config = getColumnConfig(status);
  
  return (
    <div 
      className="kanban-column"
      style={{ backgroundColor: config.bg }}
      onDrop={(e) => onDrop(e, status)}
      onDragOver={onDragOver}
    >
      <div 
        className="column-header"
        style={{ borderBottomColor: config.color }}
      >
        <div className="column-title-section">
          <span className="column-icon">{config.icon}</span>
          <h3 className="column-title" style={{ color: config.color }}>
            {config.title}
          </h3>
        </div>
        <div className="task-count-badge" style={{ backgroundColor: config.color }}>
          {tasks.length}
        </div>
      </div>
      
      <div className="column-content">
        {tasks.length === 0 ? (
          <div className="empty-column">
            <div className="empty-icon" style={{ color: config.color }}>
              {config.icon}
            </div>
            <p className="empty-text">No tasks</p>
          </div>
        ) : (
          tasks.map(task => (
            <Card
              key={task.id}
              t={task}
              onDragStart={(e, task) => {
                e.dataTransfer.setData('text/plain', JSON.stringify(task));
              }}
              onOpenModal={onOpenModal}
              projectId={projectId}
            />
          ))
        )}
      </div>
    </div>
  );
};

const BoardTab = ({ projectId, sprintId, onTaskUpdated, reloadKey }) => {
  // Removed unused imports: useParams, useNavigate
  // Removed unused state: draggedTask, setDraggedTask
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openTaskId, setOpenTaskId] = useState('');

  const loadTasks = useCallback(async () => {
    if (!sprintId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const res = await axiosInstance.post('/projects/sprints/tasks/', {
        sprint_id: sprintId,
        page_size: 100
      });
      setTasks(res?.data?.status ? (res?.data?.records || []) : []);
    } catch (error) {
      console.error('Failed to load sprint tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [sprintId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks, reloadKey]);

  const tasksByStatus = useMemo(() => {
    return STATUSES.reduce((acc, status) => {
      acc[status] = tasks.filter(task => task.status === status);
      return acc;
    }, {});
  }, [tasks]);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    try {
      const taskData = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (taskData.status === newStatus) return;

      await axiosInstance.put('/projects/task/move/', {
        id: taskData.id,
        status: newStatus,
        sprint_id: sprintId
      });

      await loadTasks();
      onTaskUpdated?.();
    } catch (error) {
      console.error('Failed to move task:', error);
    }
  };

  const openTaskModal = (task) => {
    setOpenTaskId(task.id);
  };

  if (loading) {
    return (
      <div className="board-loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <span>Loading sprint board...</span>
        </div>
      </div>
    );
  }

  if (!sprintId) {
    return (
      <div className="no-sprint-board">
        <div className="no-sprint-content">
          <div className="no-sprint-icon">🚀</div>
          <h3>No Active Sprint</h3>
          <p>Start a sprint to see your board with tasks organized by status.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="board-tab">
      <div className="board-header">
        <div className="board-stats">
          <div className="stat-item">
            <span className="stat-number">{tasks.length}</span>
            <span className="stat-label">Total Tasks</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{tasksByStatus.DONE?.length || 0}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{tasksByStatus.IN_PROGRESS?.length || 0}</span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{tasksByStatus.TODO?.length || 0}</span>
            <span className="stat-label">To Do</span>
          </div>
        </div>
      </div>

      <div className="kanban-board">
        {STATUSES.map(status => (
          <Column
            key={status}
            status={status}
            tasks={tasksByStatus[status] || []}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onOpenModal={openTaskModal}
            projectId={projectId}
          />
        ))}
      </div>

      {openTaskId && (
        <IssueDetailsModal
          taskId={openTaskId}
          projectId={projectId}
          onClose={() => setOpenTaskId('')}
          onChanged={() => {
            loadTasks();
            onTaskUpdated?.();
          }}
        />
      )}
    </div>
  );
};

export default BoardTab;
