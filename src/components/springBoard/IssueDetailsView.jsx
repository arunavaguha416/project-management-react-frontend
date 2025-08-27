import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axiosInstance from '../../services/axiosinstance';
import DetailsSidebar from "./DetailsSidebar";
import Toolbar from "./Toolbar";
import CommentsSection from "./CommentsSection";
import '../../assets/css/IssueDetails.css';

const IssueDetailsView = ({ 
  projectId, 
  taskId, 
  onClose, 
  onOpenAsPage, 
  onChanged = () => {}, 
  allowClose = true 
}) => {
  // State management
  const [loading, setLoading] = useState(true);
  const [rootError, setRootError] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Issue data
  const [issueData, setIssueData] = useState({
    key: '',
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    type: 'TASK',
    assignee: '',
    reporter: '',
    sprint: '',
    labels: '',
    dueDate: '',
    createdAt: '',
    updatedAt: '',
    storyPoints: '',
    originalEstimate: '',
    timeTracked: '',
    parentEpic: '',
    fixVersions: ''
  });

  // Original values for dirty checking
  const [originalData, setOriginalData] = useState({});
  
  // Edit states
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [activeTab, setActiveTab] = useState('activity');
  
  // Options data
  const [users, setUsers] = useState([]);
  const [sprints, setSprints] = useState([]);

  // Check if data is dirty
  const isDirty = useMemo(() => {
    return Object.keys(issueData).some(key => 
      issueData[key] !== originalData[key]
    );
  }, [issueData, originalData]);

  // Load supporting data
  const loadUsers = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/users/list/');
      const data = Array.isArray(res?.data?.records) ? res.data.records : [];
      setUsers(data.map(u => ({
        id: u.id || u.user_id,
        name: u.name || u.username || u.email,
        email: u.email
      })).filter(u => u.id && u.name));
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, []);

  const loadSprints = useCallback(async () => {
    try {
      const res = await axiosInstance.post('/projects/sprints/list/', {
        project_id: projectId,
        page_size: 100
      });
      const list = res?.data?.records || [];
      setSprints(list.map(s => ({
        id: s.id,
        name: s.name,
        status: s.status
      })));
    } catch (error) {
      console.error('Failed to load sprints:', error);
    }
  }, [projectId]);

  // Load issue data
  const loadIssue = useCallback(async () => {
    if (!taskId) return;
    
    setLoading(true);
    setRootError('');
    
    try {
      const res = await axiosInstance.post('/projects/task/details/', {
        id: taskId,
        project_id: projectId
      });
      
      if (!res?.data?.status || !res?.data?.records) {
        setRootError(res?.data?.message || 'Failed to load issue');
        return;
      }
      
      const task = res.data.records;
      const data = {
        key: task.key || task.code || `TASK-${taskId}`,
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'TODO',
        priority: task.priority || 'MEDIUM',
        type: task.type || 'TASK',
        assignee: task.assigned_to || '',
        reporter: task.reporter || task.created_by || '',
        sprint: task.sprint_id || '',
        labels: Array.isArray(task.labels) ? task.labels.join(', ') : (task.labels || ''),
        dueDate: task.due_date || '',
        createdAt: task.created_at || '',
        updatedAt: task.updated_at || '',
        storyPoints: task.story_points || '',
        originalEstimate: task.original_estimate || '',
        timeTracked: task.time_logged || '',
        parentEpic: task.epic || '',
        fixVersions: Array.isArray(task.fix_versions) ? task.fix_versions.join(', ') : (task.fix_versions || '')
      };
      
      setIssueData(data);
      setOriginalData({ ...data });
      
    } catch (error) {
      setRootError('Failed to load issue details');
      console.error('Error loading issue:', error);
    } finally {
      setLoading(false);
    }
  }, [taskId, projectId]);

  // Initialize data
  useEffect(() => {
    Promise.all([loadUsers(), loadSprints(), loadIssue()]);
  }, [loadUsers, loadSprints, loadIssue]);

  // Save changes
  const saveChanges = useCallback(async () => {
    if (!isDirty) return;
    
    setSaving(true);
    try {
      // Save title and description
      await axiosInstance.put('/projects/task/update/details/', {
        id: taskId,
        title: issueData.title,
        description: issueData.description
      });

      // Save assignment and classification
      await axiosInstance.put('/projects/task/update/assignment/', {
        id: taskId,
        assigned_to: issueData.assignee || null,
        due_date: issueData.dueDate || null
      });

      // Save labels and other fields
      await axiosInstance.put('/projects/task/update/classification/', {
        id: taskId,
        epic: issueData.parentEpic || null,
        labels: issueData.labels ? issueData.labels.split(',').map(s => s.trim()).filter(Boolean) : []
      });

      // Move to new status/sprint if changed
      if (issueData.status !== originalData.status || issueData.sprint !== originalData.sprint) {
        await axiosInstance.put('/projects/task/move/', {
          id: taskId,
          status: issueData.status,
          sprint_id: issueData.sprint || null
        });
      }

      setOriginalData({ ...issueData });
      onChanged();
      
    } catch (error) {
      console.error('Failed to save changes:', error);
      setRootError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  }, [isDirty, taskId, issueData, originalData, onChanged]);

  // Handle field changes
  const updateField = useCallback((field, value) => {
    setIssueData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Get user display name
  const getUserName = useCallback((userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unassigned';
  }, [users]);

  // Get sprint display name
  const getSprintName = useCallback((sprintId) => {
    const sprint = sprints.find(s => s.id === sprintId);
    return sprint ? sprint.name : 'No Sprint';
  }, [sprints]);

  // Format date
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  }, []);

  if (loading) {
    return (
      <div className="issue-loading">
        <div className="loading-spinner"></div>
        <p>Loading issue details...</p>
      </div>
    );
  }

  if (rootError) {
    return (
      <div className="issue-error">
        <div className="error-icon">⚠️</div>
        <h3>Failed to Load Issue</h3>
        <p>{rootError}</p>
        <button className="btn-retry" onClick={loadIssue}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="issue-details-container">
      {/* Header */}
      <div className="issue-header">
        <div className="issue-header-left">
          <span className="issue-key">{issueData.key}</span>
          <div className="issue-type-priority">
            <span className={`type-badge type-${issueData.type.toLowerCase()}`}>
              {issueData.type}
            </span>
            <span className={`priority-badge priority-${issueData.priority.toLowerCase()}`}>
              {issueData.priority}
            </span>
          </div>
        </div>
        
        <div className="issue-header-right">
          <Toolbar
            onSave={saveChanges}
            onOpenAsPage={onOpenAsPage}
            onClose={allowClose ? onClose : null}
            isDirty={isDirty}
            saving={saving}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="issue-body">
        {/* Left Column - Details */}
        <div className="issue-main-content">
          {/* Title Section */}
          <div className="content-section">
            <div className="section-header">
              <h2>Summary</h2>
              <button 
                className="edit-btn"
                onClick={() => setEditingTitle(!editingTitle)}
              >
                {editingTitle ? '✓' : '✏️'}
              </button>
            </div>
            
            {editingTitle ? (
              <input
                type="text"
                value={issueData.title}
                onChange={(e) => updateField('title', e.target.value)}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setEditingTitle(false);
                  if (e.key === 'Escape') {
                    updateField('title', originalData.title);
                    setEditingTitle(false);
                  }
                }}
                className="title-input"
                autoFocus
              />
            ) : (
              <h1 
                className="issue-title"
                onClick={() => setEditingTitle(true)}
              >
                {issueData.title || 'Untitled Issue'}
              </h1>
            )}
          </div>

          {/* Description Section */}
          <div className="content-section">
            <div className="section-header">
              <h3>Description</h3>
              <button 
                className="edit-btn"
                onClick={() => setEditingDescription(!editingDescription)}
              >
                {editingDescription ? '✓' : '✏️'}
              </button>
            </div>
            
            {editingDescription ? (
              <textarea
                value={issueData.description}
                onChange={(e) => updateField('description', e.target.value)}
                onBlur={() => setEditingDescription(false)}
                className="description-textarea"
                rows="6"
                placeholder="Add a description..."
                autoFocus
              />
            ) : (
              <div 
                className="description-content"
                onClick={() => setEditingDescription(true)}
              >
                {issueData.description || (
                  <span className="placeholder">Click to add description...</span>
                )}
              </div>
            )}
          </div>

          {/* Activity Section */}
          <div className="content-section">
            <div className="activity-header">
              <h3>Activity</h3>
              <div className="activity-tabs">
                <button 
                  className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
                  onClick={() => setActiveTab('activity')}
                >
                  All
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
                  onClick={() => setActiveTab('comments')}
                >
                  Comments
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  History
                </button>
              </div>
            </div>
            
            <div className="activity-content">
              {activeTab === 'comments' && (
                <CommentsSection 
                  taskId={taskId} 
                  sprintId={issueData.sprint}
                />
              )}
              {activeTab === 'activity' && (
                <div className="activity-feed">
                  <div className="activity-item">
                    <div className="activity-avatar">👤</div>
                    <div className="activity-details">
                      <div className="activity-summary">
                        <strong>{getUserName(issueData.reporter)}</strong> created this issue
                      </div>
                      <div className="activity-time">{formatDate(issueData.createdAt)}</div>
                    </div>
                  </div>
                  {issueData.updatedAt !== issueData.createdAt && (
                    <div className="activity-item">
                      <div className="activity-avatar">📝</div>
                      <div className="activity-details">
                        <div className="activity-summary">
                          Issue was updated
                        </div>
                        <div className="activity-time">{formatDate(issueData.updatedAt)}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'history' && (
                <div className="history-placeholder">
                  <p>Change history will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Details Sidebar */}
        <div className="issue-sidebar">
          <DetailsSidebar
            issueData={issueData}
            users={users}
            sprints={sprints}
            onFieldChange={updateField}
            getUserName={getUserName}
            getSprintName={getSprintName}
            formatDate={formatDate}
          />
        </div>
      </div>
    </div>
  );
};

export default IssueDetailsView;
