import React, { useEffect, useMemo, useState, useCallback } from 'react';
import axiosInstance from '../../services/axiosinstance';

const TYPES = [
  { value: 'TASK', label: 'Task' },
  { value: 'STORY', label: 'Story' },
  { value: 'BUG', label: 'Bug' },
  { value: 'EPIC', label: 'Epic' },
];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

function CreateIssueQuickModal({ projectId, sprintId, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('TASK');
  const [priority, setPriority] = useState('MEDIUM');

  const [assignee, setAssignee] = useState('');
  const [labels, setLabels] = useState('');
  const [epic, setEpic] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Placement control
  const [toCurrentSprint, setToCurrentSprint] = useState(Boolean(sprintId));

  // Data for selects
  const [users, setUsers] = useState([]);
  const [sprints, setSprints] = useState([]);

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load users
  const loadUsers = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/users/list/');
      const list = Array.isArray(res?.data?.records) ? res.data.records : (Array.isArray(res?.data) ? res.data : []);
      const mapped = list
        .map(u => ({ id: u.id || u.user_id || u.pk, name: u.name || u.username || u.email }))
        .filter(u => u.id && u.name);
      setUsers(mapped);
    } catch {
      setUsers([]);
    }
  }, []);

  // Load sprints for current project (informational)
  const loadSprints = useCallback(async () => {
    if (!projectId) { setSprints([]); return; }
    try {
      const res = await axiosInstance.post('/projects/sprints/list/', { project_id: projectId, page_size: 100 });
      const list = res?.data?.records || [];
      setSprints(list.map(s => ({ id: s.id, name: s.name, status: s.status })));
    } catch {
      setSprints([]);
    }
  }, [projectId]);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => { loadSprints(); }, [loadSprints]);

  const canSubmit = useMemo(() => title.trim().length > 0 && !!projectId, [title, projectId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      setError(!projectId ? 'Project is missing' : 'Title is required');
      return;
    }
    try {
      setSaving(true);
      setError('');

      const payload = {
        title: title.trim(),
        description: desc,
        project_id: projectId,                         // always include
        task_type: type,
        priority,
        assigned_to: assignee || null,
        epic: epic || null,
        labels: labels ? labels.split(',').map(s => s.trim()).filter(Boolean) : [],
        due_date: dueDate || null,
        sprint_id: sprintId ? (toCurrentSprint ? sprintId : null) : null,  // placement
      };

      const res = await axiosInstance.post('/projects/task/add/', payload);
      if (!res?.data?.status) {
        setError(res?.data?.message || 'Failed to create task');
        return;
      }
      onCreated?.(res.data.records);
      onClose?.();
    } catch (err) {
      setError(err?.response?.data?.message || 'Request failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="issue-overlay" onClick={onClose}>
      <div
        className="issue-surface"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ width: 'min(720px, 96vw)' }}
      >
        <div className="issue-header">
          <div className="issue-header-left">
            <span className="issue-key">New</span>
            <div className="issue-title">Create task</div>
          </div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={submit} className="issue-body" style={{ gridTemplateColumns: '1fr', paddingTop: 12 }}>
          <div className="panel">

            {error && <div className="alert alert-danger" style={{ marginBottom: 12 }}>{error}</div>}

            <div className="panel-section">
              <div className="section-title">Title</div>
              <input
                className="form-control"
                value={title}
                onChange={(e)=>setTitle(e.target.value)}
                placeholder="Short summary"
                autoFocus
              />
            </div>

            <div className="panel-section">
              <div className="section-title">Description</div>
              <textarea
                className="form-control"
                rows={5}
                value={desc}
                onChange={(e)=>setDesc(e.target.value)}
                placeholder="Add a description…"
              />
            </div>

            <div className="panel-section" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <div className="section-title">Type</div>
                <select className="form-control" value={type} onChange={(e)=>setType(e.target.value)}>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <div className="section-title">Priority</div>
                <select className="form-control" value={priority} onChange={(e)=>setPriority(e.target.value)}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <div className="section-title">Assignee</div>
                <select className="form-control" value={assignee} onChange={(e)=>setAssignee(e.target.value)}>
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>

              <div>
                <div className="section-title">Due date</div>
                <input type="date" className="form-control" value={dueDate} onChange={(e)=>setDueDate(e.target.value)} />
              </div>

              <div style={{ gridColumn: '1 / 3' }}>
                <div className="section-title">Labels</div>
                <input
                  className="form-control"
                  value={labels}
                  onChange={(e)=>setLabels(e.target.value)}
                  placeholder="label-1, label-2"
                />
              </div>

              <div>
                <div className="section-title">Parent/Epic</div>
                <input
                  className="form-control"
                  value={epic}
                  onChange={(e)=>setEpic(e.target.value)}
                  placeholder="Epic/Parent ID (optional)"
                />
              </div>

              <div>
                <div className="section-title">Placement</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={Boolean(sprintId) && toCurrentSprint}
                    onChange={(e)=> { if (sprintId) setToCurrentSprint(e.target.checked); }}
                    disabled={!sprintId}
                  />
                  {sprintId ? 'Add to current sprint' : 'Backlog (no active sprint)'}
                </label>
              </div>
            </div>

            {/* Optional context note */}
            {Boolean(sprints.length) && (
              <div className="panel-section">
                <div className="row-muted" style={{ fontSize: 12 }}>
                  Current project sprints: {sprints.map(s => s.name).join(', ')}
                </div>
              </div>
            )}

            <div className="actions-row" style={{ marginTop: 8 }}>
              <button type="submit" className="btn-jira" disabled={saving || !canSubmit}>
                {saving ? 'Creating…' : 'Create'}
              </button>
              <button type="button" className="btn btn-outline-jira" onClick={onClose}>Cancel</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateIssueQuickModal;
