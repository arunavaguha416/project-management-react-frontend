import React, { useState, useContext, useMemo } from 'react';
import axiosInstance from '../../services/axiosinstance';
import { AuthContext } from '../../context/auth-context';

const TYPES = [
  { value: 'TASK', label: 'Task' },
  { value: 'STORY', label: 'Story' },
  { value: 'BUG', label: 'Bug' },
  { value: 'EPIC', label: 'Epic' },
];

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const Modal = ({ children, onClose, title }) => {
  return (
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
          width: 'min(720px, 96vw)',
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
};

const CreateIssueModal = ({ projectId, sprint, defaultType = 'TASK', onClose, onSuccess }) => {
  const { user } = useContext(AuthContext);

  const [type, setType] = useState(defaultType); // TASK | STORY | BUG | EPIC
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Only for task-like issues
  const [priority, setPriority] = useState('MEDIUM');
  const [assignedTo, setAssignedTo] = useState(''); // user id if you later provide a selector
  const [dueDate, setDueDate] = useState('');
  const [epicId, setEpicId] = useState(''); // optional epic to link
  const [labels, setLabels] = useState(''); // comma separated
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const sprintId = sprint?.id || null;
  const isEpic = useMemo(() => type === 'EPIC', [type]);

  // TODO: if you want dropdowns, fetch epics and users here; omitted for brevity

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    try {
      setSaving(true);

      if (isEpic) {
        // Create Epic
        const payload = {
          name: title,
          description,
          project_id: projectId,
          color: '#36B37E',
        };
        const res = await axiosInstance.post(
          '/projects/epic/add/',
          payload,
          { headers: { Authorization: `Bearer ${user?.token}` } }
        );
        if (!res.data.status) {
          setError(res.data.message || 'Unable to create epic');
          setSaving(false);
          return;
        }
      } else {
        // Create Task/Story/Bug
        const payload = {
          title,
          description,
          project_id: projectId,
          sprint_id: sprintId,                // may be null; backend allows null for backlog
          status: sprintId ? 'TODO' : 'TODO', // default
          priority,
          task_type: type,                     // 'TASK' | 'STORY' | 'BUG'
          assigned_to: assignedTo || null,
          epic: epicId || null,
          labels: labels
            ? labels.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
          due_date: dueDate || null,
        };

        const res = await axiosInstance.post(
          '/projects/task/add/',
          payload,
          { headers: { Authorization: `Bearer ${user?.token}` } }
        );

        if (!res.data.status) {
          setError(res.data.message || 'Unable to create issue');
          setSaving(false);
          return;
        }
      }

      if (onSuccess) onSuccess();
    } catch {
      setError('Request failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Create issue">
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="add-form">
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="jira-muted">Type</label>
              <select
                className="form-control"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="jira-muted">Project</label>
              <input className="form-control" value={projectId} disabled />
            </div>
          </div>

          {!isEpic && (
            <div>
              <label className="jira-muted">Sprint</label>
              <input
                className="form-control"
                value={sprint?.name ? `${sprint.name} (${sprint.status})` : 'Backlog'}
                disabled
              />
            </div>
          )}

          <div>
            <label className="jira-muted">Title</label>
            <input
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isEpic ? 'Epic name' : 'Summary'}
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

          {!isEpic && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="jira-muted">Priority</label>
                  <select
                    className="form-control"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="jira-muted">Due date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="jira-muted">Assignee (user id)</label>
                  <input
                    className="form-control"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="jira-muted">Epic (id)</label>
                  <input
                    className="form-control"
                    value={epicId}
                    onChange={(e) => setEpicId(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <label className="jira-muted">Labels (comma separated)</label>
                <input
                  className="form-control"
                  value={labels}
                  onChange={(e) => setLabels(e.target.value)}
                  placeholder="e.g., ui, regression"
                />
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button type="button" className="btn-outline-jira" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-jira" disabled={saving}>
              {saving ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateIssueModal;
