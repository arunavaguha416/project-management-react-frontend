import React from 'react';

const DetailsSidebar = ({ 
  issueData, 
  users, 
  sprints, 
  onFieldChange, 
  getUserName, 
  getSprintName, 
  formatDate 
}) => {
  const getStatusIcon = (status) => {
    const icons = {
      'TODO': '⏳',
      'IN_PROGRESS': '🔄',
      'IN_REVIEW': '👀',
      'DONE': '✅',
      'BLOCKED': '🚫'
    };
    return icons[status] || '📋';
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      'HIGH': '🔴',
      'MEDIUM': '🟡',
      'LOW': '🟢'
    };
    return icons[priority] || '⚪';
  };

  return (
    <div className="details-sidebar">
      {/* Status Section */}
      <div className="sidebar-section">
        <h4 className="section-title">Status</h4>
        <select
          value={issueData.status}
          onChange={(e) => onFieldChange('status', e.target.value)}
          className="status-select"
        >
          <option value="TODO">📋 To Do</option>
          <option value="IN_PROGRESS">🔄 In Progress</option>
          <option value="IN_REVIEW">👀 In Review</option>
          <option value="DONE">✅ Done</option>
          <option value="BLOCKED">🚫 Blocked</option>
        </select>
      </div>

      {/* Details Section */}
      <div className="sidebar-section">
        <h4 className="section-title">Details</h4>
        <div className="details-grid">
          {/* Assignee */}
          <div className="detail-row">
            <label className="detail-label">Assignee</label>
            <select
              value={issueData.assignee}
              onChange={(e) => onFieldChange('assignee', e.target.value)}
              className="detail-select"
            >
              <option value="">Unassigned</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reporter */}
          <div className="detail-row">
            <label className="detail-label">Reporter</label>
            <div className="detail-value readonly">
              {getUserName(issueData.reporter)}
            </div>
          </div>

          {/* Priority */}
          <div className="detail-row">
            <label className="detail-label">Priority</label>
            <select
              value={issueData.priority}
              onChange={(e) => onFieldChange('priority', e.target.value)}
              className="detail-select"
            >
              <option value="HIGH">🔴 High</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="LOW">🟢 Low</option>
            </select>
          </div>

          {/* Sprint */}
          <div className="detail-row">
            <label className="detail-label">Sprint</label>
            <select
              value={issueData.sprint}
              onChange={(e) => onFieldChange('sprint', e.target.value)}
              className="detail-select"
            >
              <option value="">No Sprint</option>
              {sprints.map(sprint => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name} ({sprint.status})
                </option>
              ))}
            </select>
          </div>

          {/* Story Points */}
          <div className="detail-row">
            <label className="detail-label">Story Points</label>
            <input
              type="number"
              value={issueData.storyPoints}
              onChange={(e) => onFieldChange('storyPoints', e.target.value)}
              className="detail-input"
              min="0"
              step="0.5"
            />
          </div>

          {/* Due Date */}
          <div className="detail-row">
            <label className="detail-label">Due Date</label>
            <input
              type="date"
              value={issueData.dueDate ? issueData.dueDate.split('T')[0] : ''}
              onChange={(e) => onFieldChange('dueDate', e.target.value)}
              className="detail-input"
            />
          </div>

          {/* Labels */}
          <div className="detail-row full-width">
            <label className="detail-label">Labels</label>
            <input
              type="text"
              value={issueData.labels}
              onChange={(e) => onFieldChange('labels', e.target.value)}
              className="detail-input"
              placeholder="Add labels (comma separated)"
            />
          </div>

          {/* Parent Epic */}
          <div className="detail-row full-width">
            <label className="detail-label">Epic Link</label>
            <input
              type="text"
              value={issueData.parentEpic}
              onChange={(e) => onFieldChange('parentEpic', e.target.value)}
              className="detail-input"
              placeholder="Link to epic"
            />
          </div>
        </div>
      </div>

      {/* Time Tracking Section */}
      <div className="sidebar-section">
        <h4 className="section-title">Time Tracking</h4>
        <div className="time-tracking">
          <div className="time-row">
            <label className="time-label">Original Estimate</label>
            <input
              type="text"
              value={issueData.originalEstimate}
              onChange={(e) => onFieldChange('originalEstimate', e.target.value)}
              className="time-input"
              placeholder="e.g. 2h 30m"
            />
          </div>
          <div className="time-row">
            <label className="time-label">Time Logged</label>
            <div className="time-value readonly">
              {issueData.timeTracked || 'None'}
            </div>
          </div>
        </div>
      </div>

      {/* Dates Section */}
      <div className="sidebar-section">
        <h4 className="section-title">Dates</h4>
        <div className="dates-info">
          <div className="date-row">
            <span className="date-label">Created</span>
            <span className="date-value">{formatDate(issueData.createdAt)}</span>
          </div>
          <div className="date-row">
            <span className="date-label">Updated</span>
            <span className="date-value">{formatDate(issueData.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsSidebar;
