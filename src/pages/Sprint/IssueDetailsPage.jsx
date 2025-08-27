// src/pages/Sprint/IssueDetailsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import IssueDetailsView from '../../components/springBoard/IssueDetailsView';
import CreateIssueQuickModal from '../../components/springBoard/CreateIssueQuickModal';
import '../../assets/css/IssueDetailsPage.css';

function IssueDetailsPage() {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);

  // Get return URL from query params for better navigation
  const returnUrl = searchParams.get('return') || '/sprint-board';

  // Handle navigation back
  const handleGoBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(returnUrl);
    }
  }, [navigate, returnUrl]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ESC key - close page
      if (e.key === 'Escape') {
        handleGoBack();
      }
      // Ctrl/Cmd + N - create new issue
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setShowCreate(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleGoBack]);

  // Handle new issue creation
  const handleIssueCreated = useCallback((newIssue) => {
    setShowCreate(false);
    if (newIssue && newIssue.id) {
      // Navigate to the new issue if needed
      navigate(`/projects/${projectId}/tasks/${newIssue.id}`, { replace: true });
    }
  }, [navigate, projectId]);

  const onOpenAsPage = () => {}; // already on page

  return (
    <div className="dashboard-container" style={{ paddingTop: 16, paddingBottom: 16 }}>
      <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button 
          className="back-button-styled" 
          onClick={handleGoBack}
          title="Go back (Press Esc)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            backgroundColor: 'white',
            border: '1px solid #dfe1e6',
            borderRadius: '6px',
            color: '#172b4d',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f4f5f7';
            e.target.style.borderColor = '#B3D4FF';
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'white';
            e.target.style.borderColor = '#dfe1e6';
            e.target.style.transform = 'translateY(0px)';
            e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
          }}
        >
          <span style={{ fontSize: '16px' }}>←</span>
          Back
        </button>
        
        <button
          className="create-task-button-styled"
          onClick={() => setShowCreate(true)}
          title="Create new task (Ctrl+N)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            backgroundColor: '#36B37E',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#2a9b68';
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 2px 6px rgba(54, 179, 126, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#36B37E';
            e.target.style.transform = 'translateY(0px)';
            e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
          }}
        >
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>+</span>
          Create Task
        </button>
        
        {/* Optional: Show current task info */}
        <div style={{ 
          marginLeft: 'auto', 
          fontSize: '14px', 
          color: 'var(--jira-muted-text, #42526e)',
          fontWeight: 500
        }}>
          Project {projectId} / Task {taskId}
        </div>
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
          minHeight: '400px',
        }}
      >
        <IssueDetailsView
          projectId={projectId}
          taskId={taskId}
          allowClose={false}
          onOpenAsPage={onOpenAsPage}
          onChanged={() => {
            console.log('Issue updated');
          }}
        />
      </div>

      {showCreate && (
        <CreateIssueQuickModal
          projectId={projectId}
          sprintId={null}
          onClose={() => setShowCreate(false)}
          onCreated={handleIssueCreated}
        />
      )}
    </div>
  );
}

export default IssueDetailsPage;
