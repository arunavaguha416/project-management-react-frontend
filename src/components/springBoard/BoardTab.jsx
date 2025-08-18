import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axiosInstance from '../../services/axiosinstance';
import { useNavigate, useParams } from 'react-router-dom';
import IssueDetailsModal from './IssueDetailsModal';

const STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'];

const Card = ({ t, onDragStart, onOpenModal, projectId }) => {
  const openPageNewTab = (e) => {
    e.stopPropagation(); // prevent modal open
    e.preventDefault();  // avoid SPA interception
    const absolute = `${window.location.origin}/projects/${projectId}/tasks/${t.id}`;
    window.open(absolute, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="card"
      draggable
      onDragStart={onDragStart}
      onClick={onOpenModal}
      style={{
        padding: 12,
        borderRadius: 8,
        cursor: 'pointer',
        background: '#fff',
        border: '1px solid var(--jira-divider)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ fontWeight: 600 }}>{t.title}</div>
        <button
          type="button"
          className="btn btn-sm btn-outline-jira"
          title="Open as page"
          onClick={openPageNewTab}
        >
          ↗
        </button>
      </div>

      {t.description ? (
        <div
          className="jira-muted"
          style={{
            fontSize: 12,
            marginTop: 4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {t.description}
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <span className="status-badge" style={{ background: '#F3F4F6', padding: '2px 8px', borderRadius: 12 }}>
          {t.priority || 'MEDIUM'}
        </span>
        <span className="status-badge" style={{ background: '#EFF6FF', padding: '2px 8px', borderRadius: 12 }}>
          {t.assignee_name || 'Unassigned'}
        </span>
      </div>
    </div>
  );
};

const Column = ({ title, tasks, onDropStatus, onOpenModal, projectId }) => (
  <div
    className="jira-card"
    style={{ minHeight: 480, padding: 8, borderRadius: 8, background: '#fff' }}
    onDragOver={(e) => e.preventDefault()}
    onDrop={(e) => {
      const taskId = e.dataTransfer.getData('text/task-id');
      const from = e.dataTransfer.getData('text/from');
      if (taskId) onDropStatus(taskId, from);
    }}
  >
    <div className="section-header" style={{ borderBottom: '1px solid var(--jira-divider)' }}>
      <h3 style={{ fontSize: 14, margin: 0 }}>{title}</h3>
      <div className="jira-muted">{tasks.length}</div>
    </div>

    <div style={{ padding: 8, display: 'grid', gap: 8 }}>
      {tasks.length === 0 ? (
        <div className="jira-muted">No items</div>
      ) : (
        tasks.map((t) => (
          <Card
            key={t.id}
            t={t}
            projectId={projectId}
            onDragStart={(e) => {
              e.dataTransfer.setData('text/task-id', t.id);
              e.dataTransfer.setData('text/from', 'board');
            }}
            onOpenModal={(e) => onOpenModal(t, e)}
          />
        ))
      )}
    </div>
  </div>
);

const BoardTab = ({ reloadKey }) => {
  const navigate = useNavigate();
  const { projectId: projectIdFromUrl } = useParams();

  const projectId = projectIdFromUrl || '';
  const [currentSprint, setCurrentSprint] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loadingSprint, setLoadingSprint] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [openTaskId, setOpenTaskId] = useState('');
  const [actionError, setActionError] = useState('');

  const loadCurrentSprint = useCallback(async () => {
    setLoadingSprint(true);
    setActionError('');
    try {
      const res = await axiosInstance.post('/projects/sprints/current/', { project_id: projectId });
      setCurrentSprint(res?.data?.records || null);
    } catch (e) {
      setCurrentSprint(null);
      setActionError(e?.response?.data?.message || 'Failed to load current sprint');
    } finally {
      setLoadingSprint(false);
    }
  }, [projectId]);

  const loadSprintTasks = useCallback(async () => {
    if (!currentSprint?.id) {
      setTasks([]);
      return;
    }
    setLoadingTasks(true);
    setActionError('');
    try {
      const res = await axiosInstance.post('/projects/sprints/tasks/', { sprint_id: currentSprint.id });
      setTasks(res?.data?.status ? (res?.data?.records || []) : []);
    } catch (e) {
      setTasks([]);
      setActionError(e?.response?.data?.message || 'Failed to load sprint tasks');
    } finally {
      setLoadingTasks(false);
    }
  }, [currentSprint?.id]);

  useEffect(() => {
    if (!projectId) return;
    loadCurrentSprint();
  }, [projectId, loadCurrentSprint, reloadKey]);

  useEffect(() => {
    if (!currentSprint?.id) return;
    loadSprintTasks();
  }, [currentSprint?.id, loadSprintTasks]);

  const grouped = useMemo(() => {
    const map = {};
    STATUSES.forEach((s) => (map[s] = []));
    tasks.forEach((t) => {
      if (!map[t.status]) map[t.status] = [];
      map[t.status].push(t);
    });
    return map;
  }, [tasks]);

  const moveTask = useCallback(
    async (taskId, newStatus, from) => {
      try {
        const body =
          from === 'backlog'
            ? { id: taskId, status: newStatus, sprint_id: currentSprint?.id || null }
            : { id: taskId, status: newStatus };
        const res = await axiosInstance.put('/projects/task/move/', body);
        if (!res?.data?.status) {
          setActionError(res?.data?.message || 'Failed to move task');
          return;
        }
        await loadSprintTasks();
      } catch (e) {
        setActionError(e?.response?.data?.message || 'Failed to move task');
      }
    },
    [currentSprint?.id, loadSprintTasks]
  );

  // Normal click -> modal; Shift+Click -> open page in same tab
  const onOpenModal = useCallback(
    (t, evt) => {
      if (evt?.shiftKey) {
        navigate(`/projects/${projectId}/tasks/${t.id}`);
        return;
      }
      setOpenTaskId(t.id);
    },
    [navigate, projectId]
  );

  if (!projectId) return <div className="jira-muted">No project selected.</div>;
  if (loadingSprint) return <div>Loading sprint…</div>;
  if (!currentSprint?.id) return <div className="jira-muted">No active or planned sprint selected for this project.</div>;

  return (
    <>
      {actionError ? (
        <div className="alert alert-danger" style={{ marginBottom: 12 }}>{actionError}</div>
      ) : null}

      <div className="jira-card" style={{ marginBottom: 12 }}>
        <div className="section-header" style={{ borderBottom: '1px solid var(--jira-divider)' }}>
          <h3 style={{ margin: 0 }}>{currentSprint?.name || 'Current Sprint'}</h3>
          <div className="jira-muted">
            {currentSprint?.status || ''} {currentSprint?.start_date ? `• ${currentSprint.start_date}` : ''}{' '}
            {currentSprint?.end_date ? `→ ${currentSprint.end_date}` : ''}
          </div>
        </div>
      </div>

      {loadingTasks ? (
        <div>Loading board…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {STATUSES.map((s) => (
            <Column
              key={s}
              title={s.replace('_', ' ')}
              tasks={grouped[s] || []}
              onDropStatus={(taskId, from) => moveTask(taskId, s, from)}
              onOpenModal={onOpenModal}
              projectId={projectId}
            />
          ))}
        </div>
      )}

      {openTaskId ? (
        <IssueDetailsModal
          projectId={projectId}
          taskId={openTaskId}
          onClose={() => setOpenTaskId('')}
          onOpenAsPage={() => {
            const absolute = `${window.location.origin}/projects/${projectId}/tasks/${openTaskId}`;
            window.open(absolute, '_blank', 'noopener,noreferrer');
          }}
        />
      ) : null}
    </>
  );
};

export default BoardTab;
