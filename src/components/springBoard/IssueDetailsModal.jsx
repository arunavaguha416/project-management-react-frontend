import React from 'react';
import IssueDetailsView from './IssueDetailsView';
import '../../assets/css/IssueDetails.css';

function IssueDetailsModal({ taskId, projectId, onClose, onChanged }) {
  if (!taskId) return null;

  return (
    <div className="issue-overlay" onClick={onClose}>
      <div 
        className="issue-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <IssueDetailsView
          taskId={taskId}
          projectId={projectId}
          onClose={onClose}
          onChanged={onChanged}
          allowClose={true}
        />
      </div>
    </div>
  );
}

export default IssueDetailsModal;
