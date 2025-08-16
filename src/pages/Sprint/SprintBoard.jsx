// File: src/pages/Sprint/SprintBoard.jsx

import React, {
  useState,
  useMemo,
  useContext,
  useEffect,
  useCallback,
  Suspense,
} from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../services/axiosinstance';
import { AuthContext } from '../../context/auth-context';

import '../../assets/css/SprintBoard.css';

// Lazy tabs
const BacklogTab = React.lazy(() => import('../../components/springBoard/BacklogTab'));
const BoardTab = React.lazy(() => import('../../components/springBoard/BoardTab'));
const AllWorkTab = React.lazy(() => import('../../components/springBoard/AllWorkTab'));
const ReleasesTab = React.lazy(() => import('../../components/springBoard/ReleasesTab'));

/* ---------- Reusable Modal Shell ---------- */
const Modal = ({ children, onClose, title }) => (
  <div
    role="dialog"
    aria-modal="true"
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(9,30,66,0.54)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}
    onClick={onClose}
  >
    <div
      className="jira-card"
      style={{
        width: 'min(560px, 96vw)',
        maxHeight: '90vh',
        overflow: 'auto',
        borderRadius: 8,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="section-header" style={{ borderBottom: '1px solid var(--jira-divider)' }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <button className="btn-outline-jira" onClick={onClose}>Close</button>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  </div>
);

/* ---------- Start Sprint Modal (no hooks inside conditionals) ---------- */
const StartSprintModal = ({ projectId, needsInitials, onClose, onStarted }) => {
  const { user } = useContext(AuthContext);
  const [initials, setInitials] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = !needsInitials || initials.trim().length > 0;

  const submit = useCallback(async () => {
    setError('');
    try {
      setSaving(true);
      const payload = {
        project_id: projectId,
        sprint_id: null,
        initials: needsInitials ? initials.trim().toUpperCase() : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      };
      const res = await axiosInstance.post(
        '/projects/sprints/start/',
        payload,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      if (!res?.data?.status) {
        setError(res?.data?.message || 'Unable to start sprint');
        setSaving(false);
        return;
      }
      if (onStarted) onStarted();
      if (onClose) onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Request failed.');
    } finally {
      setSaving(false);
    }
  }, [projectId, needsInitials, initials, startDate, endDate, user?.token, onStarted, onClose]);

  const onSubmit = useCallback((e) => {
    e.preventDefault();
    if (!canSubmit) {
      setError('Please provide initials (e.g., USA)');
      return;
    }
    submit();
  }, [canSubmit, submit]);

  return (
    <Modal onClose={onClose} title="Start sprint">
      {error ? <div className="alert alert-danger" style={{ marginBottom: 12 }}>{error}</div> : null}
      <form onSubmit={onSubmit}>
        <div style={{ display: 'grid', gap: 12 }}>
          {needsInitials ? (
            <div>
              <label className="jira-muted">Initials (first-time only)</label>
              <input
                className="form-control"
                value={initials}
                onChange={(e) => setInitials(e.target.value)}
                placeholder="e.g., USA"
                maxLength={8}
                required
              />
              <div className="jira-muted" style={{ marginTop: 6, fontSize: 12 }}>
                These initials will be used to auto-name future sprints, e.g., “USA Sprint 1”, “USA Sprint 2”.
              </div>
            </div>
          ) : (
            <div className="jira-muted">
              Initials already set for this project. The next sprint will be auto-named and started.
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="jira-muted">Start date (optional)</label>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="jira-muted">End date (optional)</label>
              <input
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn-outline-jira" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-jira" disabled={saving || !canSubmit}>
              {saving ? 'Starting…' : 'Start sprint'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

/* ---------- Create Issue Modal (task/story/bug/epic) ---------- */
const TYPES = [
  { value: 'TASK', label: 'Task' },
  { value: 'STORY', label: 'Story' },
  { value: 'BUG', label: 'Bug' },
  { value: 'EPIC', label: 'Epic' },
];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const CreateIssueModal = ({ projectId, sprint, defaultType = 'TASK', onClose, onSuccess }) => {
  const { user } = useContext(AuthContext);

  const [type, setType] = useState(defaultType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [epicId, setEpicId] = useState('');
  const [labels, setLabels] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const sprintId = sprint?.id || null;
  const isEpic = type === 'EPIC';

  const submit = useCallback(async () => {
    setError('');
    try {
      setSaving(true);
      if (isEpic) {
        const res = await axiosInstance.post(
          '/projects/epic/add/',
          { name: title, description, project_id: projectId, color: '#36B37E' },
          { headers: { Authorization: `Bearer ${user?.token}` } }
        );
        if (!res?.data?.status) {
          setError(res?.data?.message || 'Unable to create epic');
          setSaving(false);
          return;
        }
      } else {
        const res = await axiosInstance.post(
          '/projects/task/add/',
          {
            title,
            description,
            project_id: projectId,
            sprint_id: sprintId || null,
            status: 'TODO',
            priority,
            task_type: type,
            assigned_to: assignedTo || null,
            epic: epicId || null,
            labels: labels ? labels.split(',').map((s) => s.trim()).filter(Boolean) : [],
            due_date: dueDate || null,
          },
          { headers: { Authorization: `Bearer ${user?.token}` } }
        );
        if (!res?.data?.status) {
          setError(res?.data?.message || 'Unable to create issue');
          setSaving(false);
          return;
        }
      }
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Request failed.');
    } finally {
      setSaving(false);
    }
  }, [
    isEpic,
    title,
    description,
    projectId,
    sprintId,
    priority,
    type,
    assignedTo,
    epicId,
    labels,
    dueDate,
    user?.token,
    onSuccess,
    onClose,
  ]);

  const onSubmit = useCallback((e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    submit();
  }, [title, submit]);

  return (
    <Modal onClose={onClose} title="Create issue">
      {error ? <div className="alert alert-danger" style={{ marginBottom: 12 }}>{error}</div> : null}
      <form onSubmit={onSubmit} className="add-form">
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="jira-muted">Type</label>
              <select className="form-control" value={type} onChange={(e) => setType(e.target.value)}>
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="jira-muted">Project</label>
              <input className="form-control" value={projectId} disabled />
            </div>
          </div>

          {type !== 'EPIC' && (
            <div>
              <label className="jira-muted">Sprint</label>
              <input className="form-control" value={sprint?.name ? `${sprint.name} (${sprint.status})` : 'Backlog'} disabled />
            </div>
          )}

          <div>
            <label className="jira-muted">Title</label>
            <input
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'EPIC' ? 'Epic name' : 'Summary'}
              maxLength={200}
              required
            />
          </div>

          <div>
            <label className="jira-muted">Description</label>
            <textarea
              className="form-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Describe the work"
            />
          </div>

          {type !== 'EPIC' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="jira-muted">Priority</label>
                  <select className="form-control" value={priority} onChange={(e) => setPriority(e.target.value)}>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="jira-muted">Due date</label>
                  <input type="date" className="form-control" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="jira-muted">Assignee (user id)</label>
                  <input className="form-control" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Optional" />
                </div>
                <div>
                  <label className="jira-muted">Epic (id)</label>
                  <input className="form-control" value={epicId} onChange={(e) => setEpicId(e.target.value)} placeholder="Optional" />
                </div>
              </div>

              <div>
                <label className="jira-muted">Labels (comma separated)</label>
                <input className="form-control" value={labels} onChange={(e) => setLabels(e.target.value)} placeholder="e.g., ui, regression" />
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button type="button" className="btn-outline-jira" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-jira" disabled={saving}>{saving ? 'Creating…' : 'Create'}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

const TABS = ['Backlog', 'Board', 'All work', 'Releases'];

const SprintBoardPage = () => {
  // Hooks at top, never inside conditionals
  const { projectId: routeProjectId } = useParams();
  const projectId = (routeProjectId ?? '').toString().trim();
  const { user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('Board');
  const [sprint, setSprint] = useState(null);
  const [loadingSprint, setLoadingSprint] = useState(false);
  const [error, setError] = useState('');

  // Start/Create modals
  const [showCreate, setShowCreate] = useState(false);
  const [defaultType, setDefaultType] = useState('TASK');
  const [showStartModal, setShowStartModal] = useState(false);
  const [startNeedsInitials, setStartNeedsInitials] = useState(false);

  // Shared reload key for tabs
  const [reloadKey, setReloadKey] = useState(0);
  const bumpReload = useCallback(() => setReloadKey((k) => k + 1), []);

  // Guard render handled after hooks
  const loadCurrentSprint = useCallback(async () => {
    try {
      setLoadingSprint(true);
      setError('');
      const res = await axiosInstance.post(
        '/projects/sprints/current/',
        { project_id: projectId },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      if (res?.data?.status) {
        const rec = res?.data?.records || null;
        setSprint(rec);
        setStartNeedsInitials(!rec); // if no sprint exists, we need initials on first start
      } else {
        setSprint(null);
        setStartNeedsInitials(true);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load sprint');
    } finally {
      setLoadingSprint(false);
    }
  }, [projectId, user?.token]);

  useEffect(() => {
    if (projectId) {
      loadCurrentSprint();
    }
  }, [projectId, loadCurrentSprint]);

  const canStart = useMemo(() => !sprint || sprint?.status === 'PLANNED', [sprint]);
  const canEnd = useMemo(() => !!sprint && sprint?.status === 'ACTIVE', [sprint]);

  const openStartModal = useCallback(() => {
    setShowStartModal(true);
  }, []);

  const onStartedSprint = useCallback(async () => {
    await loadCurrentSprint();
    bumpReload();
  }, [loadCurrentSprint, bumpReload]);

  const handleEndSprint = useCallback(async () => {
    if (!sprint?.id) return;
    try {
      setError('');
      const res = await axiosInstance.post(
        '/projects/sprints/end/',
        { project_id: projectId, sprint_id: sprint?.id },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      if (res?.data?.status) {
        await loadCurrentSprint();
        bumpReload();
      } else {
        setError(res?.data?.message || 'Unable to end sprint');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to end sprint');
    }
  }, [projectId, sprint?.id, user?.token, loadCurrentSprint, bumpReload]);

  if (!projectId) {
    return (
      <div className="dashboard-container">
        <div className="alert alert-danger">Missing projectId in URL.</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="section-header" style={{ borderRadius: 8 }}>
        <div>
          <h2 style={{ marginBottom: 6 }}>Sprint board</h2>
          <div className="jira-muted">
            Project: {projectId} • {loadingSprint ? 'Loading sprint…' : sprint ? `${sprint.name} • ${sprint.status}` : 'No sprint'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn-outline-jira" onClick={() => { setDefaultType('TASK'); setShowCreate(true); }}>
            + Create
          </button>
          {canEnd ? (
            <button className="btn-outline-jira" onClick={handleEndSprint}>Complete sprint</button>
          ) : (
            <button className="btn-jira" disabled={!canStart} onClick={openStartModal}>
              Start sprint
            </button>
          )}
        </div>
      </div>

      {error ? <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div> : null}

      <div className="card" style={{ padding: 0 }}>
        <div
          style={{
            display: 'flex',
            gap: 12,
            padding: '10px 12px',
            borderBottom: '1px solid var(--jira-divider)',
            background: 'var(--jira-table-header)',
          }}
        >
          {['Backlog', 'Board', 'All work', 'Releases'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`btn btn-sm ${activeTab === tab ? 'btn-jira' : 'btn-outline-jira'}`}
              style={{ borderRadius: 20, padding: '6px 14px' }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="table-container" style={{ padding: 16 }}>
          <Suspense fallback={<div>Loading {activeTab}…</div>}>
            {activeTab === 'Backlog' && (
              <BacklogTab
                projectId={projectId}
                sprintId={sprint?.id || null}
                reloadKey={reloadKey}
                onMoved={async () => {
                  await loadCurrentSprint();
                  bumpReload();
                }}
              />
            )}
            {activeTab === 'Board' && (
              <BoardTab sprint={sprint} reloadKey={reloadKey} />
            )}
            {activeTab === 'All work' && (
              <AllWorkTab projectId={projectId} reloadKey={reloadKey} />
            )}
            {activeTab === 'Releases' && (
              <ReleasesTab projectId={projectId} reloadKey={reloadKey} />
            )}
          </Suspense>
        </div>
      </div>

      {showCreate && (
        <CreateIssueModal
          projectId={projectId}
          sprint={sprint}
          defaultType={defaultType}
          onClose={() => setShowCreate(false)}
          onSuccess={async () => {
            setShowCreate(false);
            await loadCurrentSprint();
            bumpReload();
          }}
        />
      )}

      {showStartModal && (
        <StartSprintModal
          projectId={projectId}
          needsInitials={startNeedsInitials}
          onClose={() => setShowStartModal(false)}
          onStarted={onStartedSprint}
        />
      )}
    </div>
  );
};

export default SprintBoardPage;
