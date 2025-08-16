// File: src/components/common/IssueModal.jsx
// Jira-like modal with:
// - Inline read mode for Title/Description; double-click or click "Edit" to switch to edit.
// - Per-section dirty tracking: Save button appears only when the section has unsaved changes.
// - Fix: Task type update now uses a dedicated endpoint (or unified) and confirms server roundtrip.
// - Status/Sprint moved via TaskMove endpoint.
// - Hooks are never conditional.

import React, { useContext, useEffect, useMemo, useState, useCallback } from 'react';
import axiosInstance from '../../services/axiosinstance';
import { AuthContext } from '../../context/auth-context';

const ModalShell = ({ title, onClose, right, children, width = 1024 }) => (
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
      zIndex: 1100,
    }}
    onClick={onClose}
  >
    <div
      className="jira-card"
      style={{
        width: `min(${width}px, 96vw)`,
        maxHeight: '92vh',
        overflow: 'auto',
        borderRadius: 8,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="section-header"
        style={{
          borderBottom: '1px solid var(--jira-divider)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {right}
          <button className="btn-outline-jira" onClick={onClose}>Close</button>
        </div>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  </div>
);

const Section = ({ title, showSave, onSave, saving, error, right, children }) => (
  <div className="jira-card" style={{ padding: 12, marginBottom: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <h3 style={{ margin: 0, fontSize: 14 }}>{title}</h3>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {right}
        {showSave ? (
          <button className="btn btn-sm btn-jira" onClick={onSave} disabled={!!saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        ) : null}
      </div>
    </div>
    {error ? <div className="alert alert-danger" style={{ marginBottom: 12 }}>{error}</div> : null}
    {children}
  </div>
);

// Layout utilities
const Row2 = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>
);

// Enums
const STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const TYPES = ['TASK', 'STORY', 'BUG'];

const IssueModal = ({ projectId, taskId, sprintId, onClose, onChanged, reloadLists }) => {
  const { user } = useContext(AuthContext);

  // Root/meta
  const [loading, setLoading] = useState(true);
  const [rootError, setRootError] = useState('');
  const [issueKey, setIssueKey] = useState('');

  // Title/Description with read/edit toggle
  const [title, setTitle] = useState('');
  const [titleOriginal, setTitleOriginal] = useState('');
  const [desc, setDesc] = useState('');
  const [descOriginal, setDescOriginal] = useState('');
  const [editDetails, setEditDetails] = useState(false);

  // Properties (type/priority/status/sprint)
  const [taskType, setTaskType] = useState('TASK');
  const [taskTypeOriginal, setTaskTypeOriginal] = useState('TASK');
  const [priority, setPriority] = useState('MEDIUM');
  const [priorityOriginal, setPriorityOriginal] = useState('MEDIUM');
  const [statusValue, setStatusValue] = useState('TODO');
  const [statusOriginal, setStatusOriginal] = useState('TODO');
  const [currentSprintId, setCurrentSprintId] = useState(sprintId || '');
  const [sprintOriginal, setSprintOriginal] = useState(sprintId || '');

  // Assignment & Due
  const [assignee, setAssignee] = useState('');
  const [assigneeOriginal, setAssigneeOriginal] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueOriginal, setDueOriginal] = useState('');

  // Classification
  const [epicId, setEpicId] = useState('');
  const [epicOriginal, setEpicOriginal] = useState('');
  const [labels, setLabels] = useState('');
  const [labelsOriginal, setLabelsOriginal] = useState('');

  // Lists
  const [users, setUsers] = useState([]);
  const [sprints, setSprints] = useState([]);

  // Comments
  const [comments, setComments] = useState([]);
  const [commentTxt, setCommentTxt] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  // Worklogs
  const [worklogs, setWorklogs] = useState([]);
  const [logHours, setLogHours] = useState('');
  const [logComment, setLogComment] = useState('');
  const [savingLog, setSavingLog] = useState(false);

  // Section saving/errors
  const [savingDetails, setSavingDetails] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');
  const [savingProps, setSavingProps] = useState(false);
  const [errorProps, setErrorProps] = useState('');
  const [savingAssign, setSavingAssign] = useState(false);
  const [errorAssign, setErrorAssign] = useState('');
  const [savingClassify, setSavingClassify] = useState(false);
  const [errorClassify, setErrorClassify] = useState('');

  // Derived dirty flags per section
  const detailsDirty = useMemo(
    () => title !== titleOriginal || desc !== descOriginal,
    [title, titleOriginal, desc, descOriginal]
  );
  const propsDirty = useMemo(
    () =>
      taskType !== taskTypeOriginal ||
      priority !== priorityOriginal ||
      statusValue !== statusOriginal ||
      (currentSprintId || '') !== (sprintOriginal || ''),
    [taskType, taskTypeOriginal, priority, priorityOriginal, statusValue, statusOriginal, currentSprintId, sprintOriginal]
  );
  const assignDirty = useMemo(
    () => (assignee || '') !== (assigneeOriginal || '') || (dueDate || '') !== (dueOriginal || ''),
    [assignee, assigneeOriginal, dueDate, dueOriginal]
  );
  const classifyDirty = useMemo(
    () => (epicId || '') !== (epicOriginal || '') || (labels || '') !== (labelsOriginal || ''),
    [epicId, epicOriginal, labels, labelsOriginal]
  );

  // Loaders
  const loadUsers = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/users/list/', {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      const data = Array.isArray(res?.data?.records) ? res.data.records : (res?.data || []);
      const mapped = data.map(u => ({
        id: u.id || u.user_id || u.pk,
        name: u.name || u.username || u.email,
      })).filter(u => u.id && u.name);
      setUsers(mapped);
    } catch {
      setUsers([]);
    }
  }, [user?.token]);

  const loadSprints = useCallback(async () => {
    try {
      const res = await axiosInstance.post(
        '/projects/sprints/list/',
        { project_id: projectId, page_size: 100 },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      const list = res?.data?.records || [];
      setSprints(list.map(s => ({ id: s.id, name: s.name, status: s.status })));
    } catch {
      setSprints([]);
    }
  }, [projectId, user?.token]);

  const loadTask = useCallback(async () => {
    setRootError('');
    setLoading(true);
    try {
      const res = await axiosInstance.post(
        '/projects/task/details/',
        { id: taskId },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      if (!res?.data?.status || !res?.data?.records) {
        setRootError(res?.data?.message || 'Unable to load task');
        setLoading(false);
        return;
      }
      const t = res.data.records;

      // Details
      setTitle(t.title || ''); setTitleOriginal(t.title || '');
      setDesc(t.description || ''); setDescOriginal(t.description || '');
      setIssueKey(t.key || t.code || '');

      // Properties
      const tType = t.task_type || 'TASK';
      setTaskType(tType); setTaskTypeOriginal(tType);
      const prio = t.priority || 'MEDIUM';
      setPriority(prio); setPriorityOriginal(prio);
      const st = t.status || 'TODO';
      setStatusValue(st); setStatusOriginal(st);
      const sp = t.sprint_id || '';
      setCurrentSprintId(sp); setSprintOriginal(sp);

      // Assignment
      const asg = t.assigned_to || '';
      setAssignee(asg); setAssigneeOriginal(asg);
      const due = t.due_date || '';
      setDueDate(due); setDueOriginal(due);

      // Classification
      const ep = t.epic || '';
      setEpicId(ep); setEpicOriginal(ep);

      const lbls = Array.isArray(t.labels) ? t.labels.join(', ') : (t.labels || '');
      setLabels(lbls); setLabelsOriginal(lbls);
    } catch {
      setRootError('Failed to load task');
    } finally {
      setLoading(false);
    }
  }, [taskId, user?.token]);

  const loadComments = useCallback(async () => {
    try {
      const res = await axiosInstance.post(
        '/projects/task/comments/list/',
        { task_id: taskId },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      setComments(res?.data?.records || []);
    } catch {
      setComments([]);
    }
  }, [taskId, user?.token]);

  const loadWorklogs = useCallback(async () => {
    try {
      const res = await axiosInstance.post(
        '/projects/task/worklog/list/',
        { task_id: taskId },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      setWorklogs(res?.data?.records || []);
    } catch {
      setWorklogs([]);
    }
  }, [taskId, user?.token]);

  useEffect(() => {
    loadUsers();
    loadSprints();
  }, [loadUsers, loadSprints]);

  useEffect(() => {
    loadTask();
    loadComments();
    loadWorklogs();
  }, [loadTask, loadComments, loadWorklogs]);

  // Save sections
  // 1) Details (title/description)
  const saveDetails = useCallback(async () => {
    if (!detailsDirty) return;
    setErrorDetails('');
    setSavingDetails(true);
    try {
      const res = await axiosInstance.put(
        '/projects/task/update/details/', // granular endpoint recommended
        { id: taskId, title, description: desc },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      if (!res?.data?.status) {
        setErrorDetails(res?.data?.message || 'Failed to save details');
        setSavingDetails(false);
        return;
      }
      // sync originals
      setTitleOriginal(title);
      setDescOriginal(desc);
      onChanged?.(); reloadLists?.();
    } catch {
      setErrorDetails('Failed to save details');
    } finally {
      setSavingDetails(false);
    }
  }, [detailsDirty, taskId, title, desc, user?.token, onChanged, reloadLists]);

  // 2) Properties (type/priority/status/sprint)
  // Fix for "task type not updated": ensure proper field name and endpoint accepts it.
  const saveProps = useCallback(async () => {
    if (!propsDirty) return;
    setErrorProps('');
    setSavingProps(true);
    try {
      // First update type & priority via properties endpoint
      const base = await axiosInstance.put(
        '/projects/task/update/properties/', // use granular endpoint so server saves task_type
        { id: taskId, task_type: taskType, priority },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      if (!base?.data?.status) {
        setErrorProps(base?.data?.message || 'Failed to save properties');
        setSavingProps(false);
        return;
      }

      // Then move (status + sprint) via move endpoint in one call
      const moveBody = { id: taskId, status: statusValue };
      // Backlog support
      moveBody.sprint_id = currentSprintId || null;
      const mv = await axiosInstance.put(
        '/projects/task/move/',
        moveBody,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      if (!mv?.data?.status) {
        setErrorProps(mv?.data?.message || 'Failed to move task');
        setSavingProps(false);
        return;
      }

      // Commit originals on success
      setTaskTypeOriginal(taskType);
      setPriorityOriginal(priority);
      setStatusOriginal(statusValue);
      setSprintOriginal(currentSprintId || '');

      onChanged?.(); reloadLists?.();
    } catch {
      setErrorProps('Failed to save properties');
    } finally {
      setSavingProps(false);
    }
  }, [
    propsDirty, taskId, taskType, priority, statusValue, currentSprintId, user?.token, onChanged, reloadLists
  ]);

  // 3) Assignment (assignee/due)
  const saveAssign = useCallback(async () => {
    if (!assignDirty) return;
    setErrorAssign(''); setSavingAssign(true);
    try {
      const res = await axiosInstance.put(
        '/projects/task/update/assignment/',
        { id: taskId, assigned_to: assignee || null, due_date: dueDate || null },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      if (!res?.data?.status) {
        setErrorAssign(res?.data?.message || 'Failed to save assignment');
        setSavingAssign(false);
        return;
      }
      setAssigneeOriginal(assignee || '');
      setDueOriginal(dueDate || '');
      onChanged?.(); reloadLists?.();
    } catch {
      setErrorAssign('Failed to save assignment');
    } finally {
      setSavingAssign(false);
    }
  }, [assignDirty, taskId, assignee, dueDate, user?.token, onChanged, reloadLists]);

  // 4) Classification (epic/labels)
  const saveClassify = useCallback(async () => {
    if (!classifyDirty) return;
    setErrorClassify(''); setSavingClassify(true);
    try {
      const res = await axiosInstance.put(
        '/projects/task/update/classification/',
        {
          id: taskId,
          epic: epicId || null,
          labels: labels ? labels.split(',').map(s => s.trim()).filter(Boolean) : [],
        },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      if (!res?.data?.status) {
        setErrorClassify(res?.data?.message || 'Failed to save classification');
        setSavingClassify(false);
        return;
      }
      setEpicOriginal(epicId || '');
      setLabelsOriginal(labels || '');
      onChanged?.(); reloadLists?.();
    } catch {
      setErrorClassify('Failed to save classification');
    } finally {
      setSavingClassify(false);
    }
  }, [classifyDirty, taskId, epicId, labels, user?.token, onChanged, reloadLists]);

  // Comments
  const addComment = useCallback(async () => {
    if (!commentTxt.trim()) return;
    setSavingComment(true);
    try {
      const res = await axiosInstance.post(
        '/projects/task/comments/add/',
        { task_id: taskId, text: commentTxt.trim() },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      if (!res?.data?.status) {
        setSavingComment(false);
        return;
      }
      setCommentTxt('');
      await loadComments();
    } finally {
      setSavingComment(false);
    }
  }, [taskId, commentTxt, user?.token, loadComments]);

  const deleteComment = useCallback(async (commentId) => {
    try {
      await axiosInstance.delete(
        '/projects/task/comments/delete/',
        { data: { id: commentId }, headers: { Authorization: `Bearer ${user?.token}` } }
      );
      await loadComments();
    } catch { /* no-op */ }
  }, [user?.token, loadComments]);

  // Worklogs
  const addWorklog = useCallback(async () => {
    const hrs = (logHours || '').trim();
    if (!hrs) return;
    setSavingLog(true);
    try {
      const res = await axiosInstance.post(
        '/projects/task/worklog/add/',
        { task_id: taskId, hours: hrs, comment: logComment || '' },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      if (!res?.data?.status) {
        setSavingLog(false);
        return;
      }
      setLogHours(''); setLogComment('');
      await loadWorklogs();
    } finally {
      setSavingLog(false);
    }
  }, [taskId, logHours, logComment, user?.token, loadWorklogs]);

  const deleteWorklog = useCallback(async (worklogId) => {
    try {
      await axiosInstance.delete(
        '/projects/task/worklog/delete/',
        { data: { id: worklogId }, headers: { Authorization: `Bearer ${user?.token}` } }
      );
      await loadWorklogs();
    } catch { /* no-op */ }
  }, [user?.token, loadWorklogs]);

  // Read-mode renderers for title/desc
  const TitleView = () => (
    <div
      onDoubleClick={() => setEditDetails(true)}
      style={{ cursor: 'text' }}
      title="Double-click to edit"
    >
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>{title || 'Untitled issue'}</div>
    </div>
  );

  const DescView = () => (
    <div
      onDoubleClick={() => setEditDetails(true)}
      style={{ cursor: 'text', whiteSpace: 'pre-wrap' }}
      title="Double-click to edit"
    >
      {desc ? desc : <span className="jira-muted">No description. Double-click to add.</span>}
    </div>
  );

  // Section right controls for Details
  const detailsRight = (
    !editDetails ? (
      <button className="btn btn-sm btn-outline-jira" onClick={() => setEditDetails(true)}>
        Edit
      </button>
    ) : (
      <button className="btn btn-sm btn-outline-jira" onClick={() => { setEditDetails(false); setTitle(titleOriginal); setDesc(descOriginal); }}>
        Cancel edit
      </button>
    )
  );

  return (
    <ModalShell
      title={`${issueKey ? issueKey + ' • ' : ''}${title || 'Issue'}`}
      onClose={onClose}
    >
      {loading ? (
        <div>Loading issue…</div>
      ) : (
        <>
          {rootError ? (
            <div className="alert alert-danger" style={{ marginBottom: 12 }}>{rootError}</div>
          ) : null}

          {/* Details: read mode by default; edit on double-click or via Edit button */}
          <Section
            title="Details"
            showSave={editDetails && detailsDirty}
            onSave={saveDetails}
            saving={savingDetails}
            error={errorDetails}
            right={detailsRight}
          >
            {editDetails ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label className="jira-muted">Title</label>
                  <input className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <label className="jira-muted">Description</label>
                  <textarea
                    className="form-control"
                    rows={6}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Write a clear description…"
                  />
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                <TitleView />
                <DescView />
              </div>
            )}
          </Section>

          {/* Properties: Save appears only if dirty; fix task type update */}
          <Section
            title="Properties"
            showSave={propsDirty}
            onSave={saveProps}
            saving={savingProps}
            error={errorProps}
          >
            <Row2>
              <div>
                <label className="jira-muted">Type</label>
                <select className="form-control" value={taskType} onChange={(e) => setTaskType(e.target.value)}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="jira-muted">Priority</label>
                <select className="form-control" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </Row2>

            <Row2>
              <div>
                <label className="jira-muted">Status</label>
                <select className="form-control" value={statusValue} onChange={(e) => setStatusValue(e.target.value)}>
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="jira-muted">Sprint</label>
                <select
                  className="form-control"
                  value={currentSprintId || ''}
                  onChange={(e) => setCurrentSprintId(e.target.value)}
                >
                  <option value="">Backlog</option>
                  {sprints.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                  ))}
                </select>
              </div>
            </Row2>
          </Section>

          {/* Assignment & dates */}
          <Section
            title="Assignment & dates"
            showSave={assignDirty}
            onSave={saveAssign}
            saving={savingAssign}
            error={errorAssign}
          >
            <Row2>
              <div>
                <label className="jira-muted">Assignee</label>
                <select className="form-control" value={assignee || ''} onChange={(e) => setAssignee(e.target.value)}>
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="jira-muted">Due date</label>
                <input type="date" className="form-control" value={dueDate || ''} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </Row2>
          </Section>

          {/* Classification */}
          <Section
            title="Classification"
            showSave={classifyDirty}
            onSave={saveClassify}
            saving={savingClassify}
            error={errorClassify}
          >
            <Row2>
              <div>
                <label className="jira-muted">Epic (id)</label>
                <input className="form-control" value={epicId || ''} onChange={(e) => setEpicId(e.target.value)} placeholder="Optional" />
              </div>
              <div>
                <label className="jira-muted">Labels (comma separated)</label>
                <input className="form-control" value={labels} onChange={(e) => setLabels(e.target.value)} placeholder="ui, regression" />
              </div>
            </Row2>
          </Section>

          {/* Comments */}
          <div className="jira-card" style={{ padding: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: 14 }}>Comments</h3>
              <button className="btn btn-sm btn-outline-jira" onClick={addComment} disabled={savingComment || !commentTxt.trim()}>
                {savingComment ? 'Adding…' : 'Add comment'}
              </button>
            </div>
            <div style={{ marginBottom: 8 }}>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Add a comment…"
                value={commentTxt}
                onChange={(e) => setCommentTxt(e.target.value)}
              />
            </div>
            <div className="jira-list">
              {comments.length === 0 ? (
                <div className="jira-muted">No comments yet.</div>
              ) : comments.map(c => (
                <div key={c.id} className="jira-list-item" style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{c.author_name || 'User'}</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{c.text}</div>
                    <div className="jira-muted" style={{ fontSize: 12, marginTop: 4 }}>{c.created_at}</div>
                  </div>
                  <button className="btn btn-sm btn-outline-jira" onClick={() => deleteComment(c.id)}>Delete</button>
                </div>
              ))}
            </div>
          </div>

          {/* Worklog */}
          <div className="jira-card" style={{ padding: 12 }}>
            <h3 style={{ margin: 0, fontSize: 14, marginBottom: 8 }}>Work log</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              <input
                className="form-control"
                placeholder="e.g., 1h 30m or 1.5h or 90m"
                value={logHours}
                onChange={(e) => setLogHours(e.target.value)}
              />
              <textarea
                className="form-control"
                rows={2}
                placeholder="What did you work on?"
                value={logComment}
                onChange={(e) => setLogComment(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-sm btn-jira" onClick={addWorklog} disabled={savingLog || !logHours.trim()}>
                  {savingLog ? 'Logging…' : 'Add worklog'}
                </button>
              </div>
            </div>

            <div className="jira-list" style={{ marginTop: 12 }}>
              {worklogs.length === 0 ? (
                <div className="jira-muted">No work logged.</div>
              ) : worklogs.map(w => (
                <div key={w.id} className="jira-list-item" style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{w.author_name || 'User'} • {w.time_spent_readable || w.hours}</div>
                    <div className="jira-muted" style={{ fontSize: 12 }}>{w.created_at}</div>
                    {w.comment ? <div style={{ marginTop: 4 }}>{w.comment}</div> : null}
                  </div>
                  <button className="btn btn-sm btn-outline-jira" onClick={() => deleteWorklog(w.id)}>Delete</button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </ModalShell>
  );
};

export default IssueModal;
