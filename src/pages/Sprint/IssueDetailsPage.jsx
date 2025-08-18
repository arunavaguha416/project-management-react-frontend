// src/pages/Sprint/IssueDetailsPage.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import IssueDetailsView from '../../components/springBoard/IssueDetailsView';
import CreateIssueQuickModal from '../../components/springBoard/CreateIssueQuickModal';

function IssueDetailsPage() {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  const onOpenAsPage = () => {}; // already on page

  return (
    <div className="dashboard-container" style={{ paddingTop: 16, paddingBottom: 16 }}>
      <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
        <button className="btn-outline-jira" onClick={() => navigate(-1)}>Back</button>
        <button
          className="btn-jira"
          onClick={() => setShowCreate(true)}
          style={{ padding: '6px 12px', borderRadius: 6 }}
        >
          + Create task
        </button>
      </div>

      <div
        className="issue-surface"
        style={{
          width: 'min(1100px, 96vw)',
          maxHeight: 'unset',
          borderRadius: 12,
          border: '1px solid var(--jira-divider, #DFE1E6)',
          background: 'var(--jira-card, #fff)',
          boxShadow: '0 8px 24px rgba(9,30,66,0.15)',
          margin: '0 auto',
        }}
      >
        <IssueDetailsView
          projectId={projectId}
          taskId={taskId}
          allowClose={false}
          onOpenAsPage={onOpenAsPage}
          onChanged={() => {}}
        />
      </div>

      {showCreate && (
            <CreateIssueQuickModal
                projectId={projectId}
                sprintId={null}
                onClose={() => setShowCreate(false)}
                onCreated={() => {
                setShowCreate(false);
                // navigate(`/projects/${projectId}/tasks/${newId}`) if used later
                }}
            />
            )}


    </div>
  );
}

export default IssueDetailsPage;
