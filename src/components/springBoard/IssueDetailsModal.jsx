// src/components/springBoard/IssueDetailsModal.jsx
import React from 'react';
import IssueDetailsView from './IssueDetailsView';
import '../../assets/css/SprintBoard.css';

function IssueDetailsModal({ taskId, projectId, onClose, onChanged }) {
  if (!taskId) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(1100px, 96vw)',
          maxHeight: '90vh',
          overflow: 'auto',
          background: '#fff',
          borderRadius: 8,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <IssueDetailsView
          taskId={taskId}
          projectId={projectId}
          onClose={onClose}
          onChanged={onChanged}
        />
      </div>
    </div>
  );
}

export default IssueDetailsModal;
