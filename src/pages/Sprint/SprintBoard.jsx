// src/pages/Sprint/SprintBoard.jsx
import React, { useState, Suspense, useCallback, useContext } from 'react';
import { useParams } from 'react-router-dom';
import '../../assets/css/SprintBoard.css';
import axiosInstance from '../../services/axiosinstance';
import { AuthContext } from '../../context/auth-context';

// Lazy tabs
const BacklogTab = React.lazy(() => import('../../components/springBoard/BacklogTab'));
const BoardTab = React.lazy(() => import('../../components/springBoard/BoardTab'));
const AllWorkTab = React.lazy(() => import('../../components/springBoard/AllWorkTab'));
const ReleasesTab = React.lazy(() => import('../../components/springBoard/ReleasesTab'));
const AIOverview = React.lazy(() => import('../../components/springBoard/AIOverview'));

// Create task modal
import CreateIssueQuickModal from '../../components/springBoard/CreateIssueQuickModal';

const SprintBoard = () => {
  // Active tab state
  const [active, setActive] = useState('board');

  // Trigger children to refetch
  const [reloadKey, setReloadKey] = useState(0);
  const reloadAll = useCallback(() => setReloadKey((k) => k + 1), []);

  // URL params
  const { projectId: routeProjectId } = useParams();
  const projectId = routeProjectId || '';

  // Sprint context
  const [activeSprintId, setActiveSprintId] = useState('');
  const [isSprintActive, setIsSprintActive] = useState(false);
  const [sprintName, setSprintName] = useState('');

  // UI state
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Auth context
  const { user } = useContext(AuthContext);

  // Start sprint function
  const startSprint = useCallback(
    async (projId, sprintId) => {
      if (!projId || !sprintId) {
        setStatusMsg('Select a sprint to start.');
        return;
      }
      try {
        setBusy(true);
        setStatusMsg('');
        const res = await axiosInstance.post(
          '/projects/sprints/start/',
          { project_id: projId, sprint_id: sprintId },
          user?.token
            ? { headers: { Authorization: `Bearer ${user.token}` } }
            : undefined
        );
        if (!res?.data?.status) {
          setStatusMsg(res?.data?.message || 'Failed to start sprint');
          return;
        }
        setIsSprintActive(true);
        setStatusMsg('Sprint started');
        reloadAll();
        setTimeout(() => setStatusMsg(''), 2000);
      } catch (e) {
        setStatusMsg(e?.response?.data?.message || 'Request failed');
      } finally {
        setBusy(false);
      }
    },
    [reloadAll, user?.token]
  );

  // End sprint function
  const endSprint = useCallback(
    async (projId, sprintId) => {
      if (!projId || !sprintId) {
        setStatusMsg('Select a sprint to end.');
        return;
      }
      try {
        setBusy(true);
        setStatusMsg('');
        const res = await axiosInstance.post(
          '/projects/sprints/end/',
          { project_id: projId, sprint_id: sprintId },
          user?.token
            ? { headers: { Authorization: `Bearer ${user.token}` } }
            : undefined
        );
        if (!res?.data?.status) {
          setStatusMsg(res?.data?.message || 'Failed to end sprint');
          return;
        }
        setIsSprintActive(false);
        setStatusMsg('Sprint ended');
        reloadAll();
        setTimeout(() => setStatusMsg(''), 2000);
      } catch (e) {
        setStatusMsg(e?.response?.data?.message || 'Request failed');
      } finally {
        setBusy(false);
      }
    },
    [reloadAll, user?.token]
  );

  // Handle sprint context updates from child components
  const updateSprintContext = useCallback((sprintId, isActive, name = '') => {
    setActiveSprintId(sprintId);
    setIsSprintActive(isActive);
    setSprintName(name);
  }, []);

  // Keyboard navigation between tabs
  const onTabsKeyDown = (e) => {
    const order = ['ai', 'board', 'backlog', 'all', 'releases'];
    const idx = order.indexOf(active);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActive(order[(idx + 1) % order.length]);
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActive(order[(idx - 1 + order.length) % order.length]);
    }
  };

  // Handle task creation success
  const handleTaskCreated = useCallback(() => {
    reloadAll();
    setShowCreate(false);
  }, [reloadAll]);

  // Clear status message
  const clearStatusMsg = useCallback(() => {
    setStatusMsg('');
  }, []);

  return (
    <div className="sprint-board-container">
      {/* Header with project info and actions */}
      <div className="sprint-board-header">
        <div className="project-info">
          <h2>Sprint Board</h2>
          {activeSprintId && (
            <div className="active-sprint-info">
              <span className={`sprint-status ${isSprintActive ? 'active' : 'inactive'}`}>
                {sprintName || 'Current Sprint'}
              </span>
              {isSprintActive && (
                <button
                  className="btn-danger btn-sm"
                  onClick={() => endSprint(projectId, activeSprintId)}
                  disabled={busy}
                >
                  End Sprint
                </button>
              )}
            </div>
          )}
        </div>

        <div className="board-actions">
          <button
            className="btn-primary"
            onClick={() => setShowCreate(true)}
            disabled={busy}
          >
            + Create Issue
          </button>
          
          <button
            className="sb-reload"
            onClick={reloadAll}
            disabled={busy}
            title="Refresh all data"
          >
            {busy ? '⟳' : '↻'} Reload
          </button>
        </div>
      </div>

      {/* Status message */}
      {statusMsg && (
        <div className={`status-message ${statusMsg.includes('failed') || statusMsg.includes('error') ? 'error' : 'success'}`}>
          <span>{statusMsg}</span>
          <button onClick={clearStatusMsg} className="close-btn" aria-label="Close message">&times;</button>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="sb-tabs" role="tablist" onKeyDown={onTabsKeyDown}>
        <button
          className={`sb-tab ${active === 'ai' ? 'active' : ''}`}
          role="tab"
          aria-selected={active === 'ai'}
          tabIndex={active === 'ai' ? 0 : -1}
          onClick={() => setActive('ai')}
        >
          <span role="img" aria-label="AI">🤖</span> AI Overview
        </button>

        <button
          className={`sb-tab ${active === 'board' ? 'active' : ''}`}
          role="tab"
          aria-selected={active === 'board'}
          tabIndex={active === 'board' ? 0 : -1}
          onClick={() => setActive('board')}
        >
          <span role="img" aria-label="Board">📋</span> Board
        </button>

        <button
          className={`sb-tab ${active === 'backlog' ? 'active' : ''}`}
          role="tab"
          aria-selected={active === 'backlog'}
          tabIndex={active === 'backlog' ? 0 : -1}
          onClick={() => setActive('backlog')}
        >
          <span role="img" aria-label="Backlog">📝</span> Backlog
        </button>

        <button
          className={`sb-tab ${active === 'all' ? 'active' : ''}`}
          role="tab"
          aria-selected={active === 'all'}
          tabIndex={active === 'all' ? 0 : -1}
          onClick={() => setActive('all')}
        >
          <span role="img" aria-label="All Work">📊</span> All Work
        </button>

        <button
          className={`sb-tab ${active === 'releases' ? 'active' : ''}`}
          role="tab"
          aria-selected={active === 'releases'}
          tabIndex={active === 'releases' ? 0 : -1}
          onClick={() => setActive('releases')}
        >
          <span role="img" aria-label="Releases">🚀</span> Releases
        </button>
      </div>

      {/* Tab content area */}
      <div className="tab-content" role="tabpanel" aria-labelledby={`${active}-tab`}>
        <Suspense fallback={
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        }>
          {active === 'ai' && (
            <AIOverview
              projectId={projectId}
              sprintId={activeSprintId}
              onCardsCreated={reloadAll}
              reloadKey={reloadKey}
            />
          )}

          {active === 'board' && (
            <BoardTab
              projectId={projectId}
              reloadKey={reloadKey}
              onSprintContextUpdate={updateSprintContext}
              startSprint={startSprint}
              endSprint={endSprint}
              activeSprintId={activeSprintId}
              isSprintActive={isSprintActive}
            />
          )}

          {active === 'backlog' && (
            <BacklogTab
              projectId={projectId}
              sprintId={activeSprintId}
              reloadKey={reloadKey}
              onMoved={reloadAll}
            />
          )}

          {active === 'all' && (
            <AllWorkTab
              projectId={projectId}
              reloadKey={reloadKey}
            />
          )}

          {active === 'releases' && (
            <ReleasesTab
              projectId={projectId}
              reloadKey={reloadKey}
            />
          )}
        </Suspense>
      </div>

      {/* Create task modal */}
      {showCreate && (
        <CreateIssueQuickModal
          projectId={projectId}
          sprintId={activeSprintId}
          onClose={() => setShowCreate(false)}
          onCreated={handleTaskCreated}
        />
      )}

      {/* Loading overlay */}
      {busy && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SprintBoard;
