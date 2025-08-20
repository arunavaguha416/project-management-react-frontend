import React from 'react';

const CardDetailsModal = ({ 
  card, 
  onClose, 
  onMoveToBacklog, 
  onMoveToSprint, 
  sprintId, 
  loading 
}) => {
  if (!card) return null;

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  const handleMoveToBacklog = async () => {
    try {
      await onMoveToBacklog(card);
    } catch (error) {
      console.error('Failed to move to backlog:', error);
    }
  };

  const handleMoveToSprint = async () => {
    try {
      await onMoveToSprint(card);
    } catch (error) {
      console.error('Failed to move to sprint:', error);
    }
  };

  return (
    <div className="issue-overlay" onClick={onClose}>
      <div className="issue-surface" onClick={handleModalClick}>
        
        {/* Header - Same structure as IssueDetailsView */}
        <div className="issue-header">
          <div className="issue-header-left">
            <span className="issue-key">{card.task_type?.toUpperCase() || 'TASK'}</span>
            <h1 className="issue-title">{card.title}</h1>
          </div>
          <div className="issue-toolbar">
            <button className="icon-btn" onClick={onClose} aria-label="Close modal">
              ×
            </button>
          </div>
        </div>

        {/* Body - Two column layout like IssueDetailsView */}
        <div className="issue-body">
          
          {/* Left Column - Main Content */}
          <div className="panel">
            
            {/* Description Section */}
            <div className="panel-section">
              <div className="section-title">Description</div>
              <div className="description-content">
                {card.description || 'No description provided.'}
              </div>
            </div>

            {/* Acceptance Criteria Section */}
            {card.acceptance_criteria && card.acceptance_criteria.length > 0 && (
              <div className="panel-section">
                <div className="section-title">Acceptance Criteria</div>
                <ul className="acceptance-criteria-list">
                  {card.acceptance_criteria.map((criteria, idx) => (
                    <li key={idx} className="criteria-item">
                      <span className="criteria-bullet">•</span>
                      <span className="criteria-text">{criteria}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Technical Notes Section */}
            {card.technical_notes && (
              <div className="panel-section">
                <div className="section-title">Technical Notes</div>
                <div className="technical-notes-content">
                  {card.technical_notes}
                </div>
              </div>
            )}

            {/* Actions Section */}
            <div className="panel-section">
              <div className="section-title">Actions</div>
              <div className="actions-row">
                <button 
                  className="icon-btn btn-move-backlog" 
                  onClick={handleMoveToBacklog}
                  disabled={loading}
                  title="Move this card to the project backlog"
                >
                  {loading ? '⟳' : '📋'} Move to Backlog
                </button>
                
                <button 
                  className="icon-btn btn-move-sprint" 
                  onClick={handleMoveToSprint}
                  disabled={loading || !sprintId}
                  title={!sprintId ? 'No active sprint available' : 'Move this card to the current sprint'}
                >
                  {loading ? '⟳' : '🏃'} Move to Sprint
                </button>
              </div>
            </div>

          </div>

          {/* Right Column - Details Panel */}
          <div className="panel">
            
            {/* Details Section */}
            <div className="panel-section">
              <div className="section-title">Details</div>
              <div className="details-grid">
                
                <div className="details-label">Type</div>
                <div className="details-value">
                  <span className={`badge task-type-${card.task_type?.toLowerCase()}`}>
                    {card.task_type}
                  </span>
                </div>

                <div className="details-label">Priority</div>
                <div className="details-value">
                  <span className={`badge priority-${card.priority?.toLowerCase()}`}>
                    {card.priority} Priority
                  </span>
                </div>

                <div className="details-label">Story Points</div>
                <div className="details-value">
                  <span className="story-points-badge">
                    {card.story_points} SP
                  </span>
                </div>

                {card.ai_id && (
                  <>
                    <div className="details-label">AI ID</div>
                    <div className="details-value">
                      <code className="ai-id">{card.ai_id.slice(0, 8)}...</code>
                    </div>
                  </>
                )}

              </div>
            </div>

            {/* AI Information Section */}
            <div className="panel-section">
              <div className="section-title">AI Generated</div>
              <div className="ai-info">
                <div className="ai-badge">
                  🤖 Generated by AI
                </div>
                <div className="ai-description">
                  This task was automatically generated using AI analysis of your project documents.
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="panel-section">
              <div className="section-title">Quick Actions</div>
              <div className="quick-actions">
                <button 
                  className="subtle-link" 
                  onClick={onClose}
                  disabled={loading}
                >
                  Close Dialog
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default CardDetailsModal;
