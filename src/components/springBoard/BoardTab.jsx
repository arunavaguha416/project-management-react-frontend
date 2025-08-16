// File: src/components/springBoard/BoardTab.jsx
// unchanged except it uses the new IssueModal (with conditional Save buttons & edit toggles)

import React, { useEffect, useState, useContext, useMemo, useCallback } from 'react';
import axiosInstance from '../../services/axiosinstance';
import { AuthContext } from '../../context/auth-context';
import IssueModal from '../../components/springBoard/IssueModal';

const STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'];

const Column = ({ title, tasks, onDropStatus, onOpen }) => (
  <div
    className="jira-card"
    style={{ minHeight: 480, padding: 8, borderRadius: 8 }}
    onDragOver={(e) => e.preventDefault()}
    onDrop={(e) => {
      const taskId = e.dataTransfer.getData('text/task-id');
      const from = e.dataTransfer.getData('text/from'); // 'backlog' | 'board'
      if (taskId) onDropStatus(taskId, from);
    }}
  >
    <div className="section-header" style={{ borderBottom: '1px solid var(--jira-divider)' }}>
      <h3 style={{ fontSize: 14, margin: 0 }}>{title}</h3>
      <div className="jira-muted">{tasks.length}</div>
    </div>
    <div style={{ padding: 8, display: 'grid', gap: 8 }}>
      {tasks.map((t) => (
        <div
          key={t.id}
          className="card"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/task-id', t.id);
            e.dataTransfer.setData('text/from', 'board');
          }}
          onClick={() => onOpen(t.id)}
          style={{ padding: 12, borderRadius: 8, cursor: 'pointer' }}
        >
          <div style={{ fontWeight: 600 }}>{t.title}</div>
          <div className="jira-muted" style={{ fontSize: 12 }}>{t.description || ''}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <span className="status-badge pending">{t.priority || 'MEDIUM'}</span>
            <span className="status-badge active">{t.assignee_name || 'Unassigned'}</span>
          </div>
        </div>
      ))}
      {tasks.length === 0 && <div className="jira-muted">No items</div>}
    </div>
  </div>
);

const BoardTab = ({ sprint, reloadKey }) => {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openTaskId, setOpenTaskId] = useState('');

  const sprintId = sprint?.id;

  const load = useCallback(async () => {
    if (!sprintId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await axiosInstance.post(
        '/projects/sprints/tasks/',
        { sprint_id: sprintId },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      setTasks(res?.data?.status ? (res?.data?.records || []) : []);
    } finally {
      setLoading(false);
    }
  }, [sprintId, user?.token]);

  useEffect(() => { load(); }, [load, reloadKey]);

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
        const body = from === 'backlog'
          ? { id: taskId, status: newStatus, sprint_id: sprintId }
          : { id: taskId, status: newStatus };
        const res = await axiosInstance.put(
          '/projects/task/move/',
          body,
          { headers: { Authorization: `Bearer ${user?.token}` } }
        );
        if (!res?.data?.status) return;
        await load();
      } catch { /* no-op */ }
    },
    [sprintId, user?.token, load]
  );

  const onOpen = useCallback((id) => setOpenTaskId(id), []);

  if (!sprintId) return <div className="jira-muted">No active/selected sprint for this project.</div>;

  return loading ? (
    <div>Loading board…</div>
  ) : (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {STATUSES.map((s) => (
          <Column
            key={s}
            title={s.replace('_', ' ')}
            tasks={grouped[s] || []}
            onDropStatus={(taskId, from) => moveTask(taskId, s, from)}
            onOpen={onOpen}
          />
        ))}
      </div>

      {openTaskId ? (
        <IssueModal
          projectId={sprint?.project_id || ''}
          taskId={openTaskId}
          sprintId={sprintId}
          onClose={() => setOpenTaskId('')}
          onChanged={load}
          reloadLists={load}
        />
      ) : null}
    </>
  );
};

export default BoardTab;
