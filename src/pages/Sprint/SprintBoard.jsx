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

// Create task modal
import CreateIssueQuickModal from '../../components/springBoard/CreateIssueQuickModal';

const SprintBoard = () => {
  // Tabs
  const [active, setActive] = useState('board');

  // Trigger children to refetch
  const [reloadKey, setReloadKey] = useState(0);
  const reloadAll = useCallback(() => setReloadKey((k) => k + 1), []);

  // URL params
  const { projectId: routeProjectId } = useParams();
  const projectId = routeProjectId || '';

  // Sprint context (provided by BoardTab)
  const [activeSprintId, setActiveSprintId] = useState('');
  const [isSprintActive, setIsSprintActive] = useState(false);

  // UI
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Auth (if your axios instance doesn’t auto-attach tokens)
  const { user } = useContext(AuthContext);

  // Start sprint
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
          user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : undefined
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

  // End sprint
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
          user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : undefined
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

  // Optional: keyboard nav between tabs
  const onTabsKeyDown = (e) => {
    const order = ['board', 'backlog', 'all', 'releases'];
    const idx = order.indexOf(active);
    if (e.key === 'ArrowRight') setActive(order[(idx + 1) % order.length]);
    if (e.key === 'ArrowLeft') setActive(order[(idx - 1 + order.length) % order.length]);
  };

  return (
    <>
      {/* Tabs header */}
      <div className="sb-tabs elevated" role="tablist" aria-label="Sprint sections" onKeyDown={onTabsKeyDown}>
        <button
          role="tab"
          aria-selected={active === 'board'}
          tabIndex={active === 'board' ? 0 : -1}
          className={`sb-tab ${active === 'board' ? 'active' : ''}`}
          onClick={() => setActive('board')}
        >
          Board
        </button>
        <button
          role="tab"
          aria-selected={active === 'backlog'}
          tabIndex={active === 'backlog' ? 0 : -1}
          className={`sb-tab ${active === 'backlog' ? 'active' : ''}`}
          onClick={() => setActive('backlog')}
        >
          Backlog
        </button>
        <button
          role="tab"
          aria-selected={active === 'all'}
          tabIndex={active === 'all' ? 0 : -1}
          className={`sb-tab ${active === 'all' ? 'active' : ''}`}
          onClick={() => setActive('all')}
        >
          All work
        </button>
        <button
          role="tab"
          aria-selected={active === 'releases'}
          tabIndex={active === 'releases' ? 0 : -1}
          className={`sb-tab ${active === 'releases' ? 'active' : ''}`}
          onClick={() => setActive('releases')}
        >
          Releases
        </button>

        <div className="sb-tabs-actions">
          <button className="sb-reload" onClick={reloadAll} title="Reload data">Reload</button>

          <button
            className="btn-jira"
            style={{ padding: '6px 12px', borderRadius: 6 }}
            onClick={() => setShowCreate(true)}
            title="Create task"
          >
            + Create task
          </button>

          {/* Toggle Start/End based on isSprintActive; keep your original disabled condition */}
          {isSprintActive ? (
            <button
              className="btn btn-outline-jira"
              style={{ padding: '6px 12px', borderRadius: 6 }}
              onClick={() => endSprint(projectId, activeSprintId)}
              title="End sprint"
              disabled={busy || !projectId || !activeSprintId}
            >
              {busy ? 'Ending…' : 'End sprint'}
            </button>
          ) : (
            <button
              className="btn btn-outline-jira"
              style={{ padding: '6px 12px', borderRadius: 6 }}
              onClick={() => startSprint(projectId, activeSprintId)}
              title="Start sprint"
              disabled={busy || !projectId || !activeSprintId}
            >
              {busy ? 'Starting…' : 'Start sprint'}
            </button>
          )}
        </div>
      </div>

      {statusMsg && (
        <div style={{ padding: '6px 10px', color: 'var(--jira-muted-text, #42526E)', fontSize: 12 }}>
          {statusMsg}
        </div>
      )}

      {/* Content */}
      <div className="sb-content">
        <Suspense fallback={<div>Loading…</div>}>
          {active === 'board' && (
            <BoardTab
              projectId={projectId}
              sprintId={activeSprintId}
              // BoardTab should call this once sprint meta is known:
              // onResolvedSprintMeta({ id: '<uuid>', isActive: true|false })
              onResolvedSprintMeta={(meta) => {
                if (meta?.id) setActiveSprintId(meta.id);
                if (typeof meta?.isActive === 'boolean') setIsSprintActive(meta.isActive);
              }}
              reloadKey={reloadKey}
            />
          )}
          {active === 'backlog' && (
            <BacklogTab
              projectId={projectId}
              sprintId={activeSprintId}
              reloadKey={reloadKey}
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
          sprintId={activeSprintId || null}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            reloadAll();
          }}
        />
      )}
    </>
  );
};

export default SprintBoard;
