import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axiosInstance from '../../services/axiosinstance';

const STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'];

const Toolbar = ({ onOpenVSCode, onCreateBranch, onCreateCommit, onOpenAsPage }) => (
  <div className="issue-toolbar">
    <button className="icon-btn" title="Open with VS Code" onClick={onOpenVSCode}>VS</button>
    <button className="icon-btn" title="Create branch" onClick={onCreateBranch}>Br</button>
    <button className="icon-btn" title="Create commit" onClick={onCreateCommit}>Cm</button>
    <button className="icon-btn" title="Open as page" onClick={onOpenAsPage}>↗</button>
  </div>
);

const DetailsSidebar = ({
  users, sprints,
  assignee, setAssignee,
  sprintId, setSprintId,
  labels, setLabels,
  parent, setParent,
  dueDate, setDueDate,
  team, setTeam,
  startDate, setStartDate,
  originalEstimate, setOriginalEstimate,
  timeTracked, setTimeTracked,
  fixVersions, setFixVersions,
  statusValue, setStatusValue,
  saving, error, onSave, dirty,
}) => (
  <aside className="panel">
    {error ? <div className="alert alert-danger" style={{ marginBottom: 12 }}>{error}</div> : null}
    <div className="panel-section">
      <div className="section-title">Details</div>
      <div className="details-grid">
        <div className="details-label">Assignee</div>
        <div className="details-value">
          <select className="form-control" value={assignee || ''} onChange={(e)=>setAssignee(e.target.value)}>
            <option value="">Unassigned</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        <div className="details-label">Sprint</div>
        <div className="details-value">
          <select className="form-control" value={sprintId || ''} onChange={(e)=>setSprintId(e.target.value)}>
            <option value="">Backlog</option>
            {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="details-label">Status</div>
        <div className="details-value">
          <select className="form-control" value={statusValue} onChange={(e)=>setStatusValue(e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>

        <div className="details-label">Labels</div>
        <div className="details-value">
          <input className="form-control" value={labels} onChange={(e)=>setLabels(e.target.value)} placeholder="label-1, label-2" />
        </div>

        <div className="details-label">Parent</div>
        <div className="details-value">
          <input className="form-control" value={parent || ''} onChange={(e)=>setParent(e.target.value)} placeholder="Epic/Parent ID" />
        </div>

        <div className="details-label">Due date</div>
        <div className="details-value">
          <input type="date" className="form-control" value={dueDate || ''} onChange={(e)=>setDueDate(e.target.value)} />
        </div>

        <div className="details-label">Team</div>
        <div className="details-value">
          <input className="form-control" value={team || ''} onChange={(e)=>setTeam(e.target.value)} placeholder="Optional" />
        </div>

        <div className="details-label">Start date</div>
        <div className="details-value">
          <input type="date" className="form-control" value={startDate || ''} onChange={(e)=>setStartDate(e.target.value)} />
        </div>

        <div className="details-label">Original estimate</div>
        <div className="details-value">
          <input className="form-control" value={originalEstimate || ''} onChange={(e)=>setOriginalEstimate(e.target.value)} placeholder="e.g., 1h 30m" />
        </div>

        <div className="details-label">Time tracking</div>
        <div className="details-value">
          <input className="form-control" value={timeTracked || ''} onChange={(e)=>setTimeTracked(e.target.value)} placeholder="No time logged" />
        </div>

        <div className="details-label">Fix versions</div>
        <div className="details-value">
          <input className="form-control" value={fixVersions || ''} onChange={(e)=>setFixVersions(e.target.value)} placeholder="Optional" />
        </div>
      </div>
      <div className="actions-row" style={{ marginTop: 12 }}>
        <button className="btn btn-sm btn-jira" onClick={onSave} disabled={!dirty || saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <span className="subtle-link">Add field</span>
      </div>
    </div>

    <div className="panel-section">
      <div className="section-title">Development</div>
      <div className="details-grid">
        <div className="details-label">Open with VS Code</div>
        <div className="details-value"><span className="subtle-link">Open with VS Code</span></div>
        <div className="details-label">Create branch</div>
        <div className="details-value"><span className="subtle-link">Create branch</span></div>
        <div className="details-label">Create commit</div>
        <div className="details-value"><span className="subtle-link">Create commit</span></div>
      </div>
    </div>
  </aside>
);

const IssueDetailsView = ({
  projectId,
  taskId,
  onClose,
  onOpenAsPage,
  onChanged = () => {},       // safe default to avoid “not defined”
  allowClose = true,
}) => {
  // Top-level hooks only
  const [loading, setLoading] = useState(true);
  const [rootError, setRootError] = useState('');

  const [issueKey, setIssueKey] = useState('');
  const [title, setTitle] = useState('');
  const [titleOriginal, setTitleOriginal] = useState('');
  const [desc, setDesc] = useState('');
  const [descOriginal, setDescOriginal] = useState('');
  const [editDetails, setEditDetails] = useState(false);

  const [statusValue, setStatusValue] = useState('TODO');
  const [statusOriginal, setStatusOriginal] = useState('TODO');

  const [sprintId, setSprintId] = useState('');
  const [sprintOriginal, setSprintOriginal] = useState('');

  const [assignee, setAssignee] = useState('');
  const [assigneeOriginal, setAssigneeOriginal] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueOriginal, setDueOriginal] = useState('');

  const [labels, setLabels] = useState('');
  const [labelsOriginal, setLabelsOriginal] = useState('');
  const [parent, setParent] = useState('');
  const [team, setTeam] = useState('');
  const [startDate, setStartDate] = useState('');
  const [originalEstimate, setOriginalEstimate] = useState('');
  const [timeTracked, setTimeTracked] = useState('');
  const [fixVersions, setFixVersions] = useState('');

  const [users, setUsers] = useState([]);
  const [sprints, setSprints] = useState([]);

  const [savingSide, setSavingSide] = useState(false);
  const [errorSide, setErrorSide] = useState('');

  // Dirtiness
  const detailsDirty = useMemo(
    () => title !== titleOriginal || desc !== descOriginal,
    [title, titleOriginal, desc, descOriginal]
  );

  const sidebarDirty = useMemo(() => (
    (assignee || '') !== (assigneeOriginal || '') ||
    (sprintId || '') !== (sprintOriginal || '') ||
    (labels || '') !== (labelsOriginal || '') ||
    (dueDate || '') !== (dueOriginal || '') ||
    statusValue !== statusOriginal
  ), [
    assignee, assigneeOriginal,
    sprintId, sprintOriginal,
    labels, labelsOriginal,
    dueDate, dueOriginal,
    statusValue, statusOriginal
  ]);

  // Data loaders
  const loadUsers = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/users/list/');
      const data = Array.isArray(res?.data?.records) ? res.data.records : (res?.data || []);
      const mapped = data
        .map(u => ({ id: u.id || u.user_id || u.pk, name: u.name || u.username || u.email }))
        .filter(u => u.id && u.name);
      setUsers(mapped);
    } catch {
      setUsers([]);
    }
  }, []);

  const loadSprints = useCallback(async () => {
    try {
      const res = await axiosInstance.post('/projects/sprints/list/', { project_id: projectId, page_size: 100 });
      const list = res?.data?.records || [];
      setSprints(list.map(s => ({ id: s.id, name: s.name, status: s.status })));
    } catch {
      setSprints([]);
    }
  }, [projectId]);

  const loadTask = useCallback(async () => {
    setRootError('');
    setLoading(true);
    try {
      // API: POST /projects/task/details/ => { status, records: {...} }
      const res = await axiosInstance.post('/projects/task/details/', { id: taskId, project_id: projectId });
      if (!res?.data?.status || !res?.data?.records) {
        setRootError(res?.data?.message || 'Unable to load task');
        setLoading(false);
        return;
      }
      const t = res.data.records;

      setIssueKey(t.key || t.code || '');
      setTitle(t.title || ''); setTitleOriginal(t.title || '');
      setDesc(t.description || ''); setDescOriginal(t.description || '');

      const st = t.status || 'TODO';
      setStatusValue(st); setStatusOriginal(st);

      const sp = t.sprint_id || '';
      setSprintId(sp); setSprintOriginal(sp);

      const asg = t.assigned_to || '';
      setAssignee(asg); setAssigneeOriginal(asg);

      const due = t.due_date || '';
      setDueDate(due); setDueOriginal(due);

      const lbls = Array.isArray(t.labels) ? t.labels.join(', ') : (t.labels || '');
      setLabels(lbls); setLabelsOriginal(lbls);

      // optional/info mapping
      setTeam(t.team || '');
      setStartDate(t.start_date || '');
      setOriginalEstimate(t.original_estimate || '');
      setTimeTracked(t.time_logged || '');
      setFixVersions(Array.isArray(t.fix_versions) ? t.fix_versions.join(', ') : (t.fix_versions || ''));
    } catch {
      setRootError('Failed to load task');
    } finally {
      setLoading(false);
    }
  }, [taskId, projectId]);

  // Effects
  useEffect(() => { loadUsers(); loadSprints(); }, [loadUsers, loadSprints]);
  useEffect(() => { if (taskId) loadTask(); }, [loadTask, taskId]);

  // Saves
  const saveTitleDesc = useCallback(async () => {
    if (!detailsDirty) return;
    await axiosInstance.put('/projects/task/update/details/', { id: taskId, title, description: desc });
    setTitleOriginal(title);
    setDescOriginal(desc);
    setEditDetails(false);
  }, [detailsDirty, taskId, title, desc]);

  const saveSidebar = useCallback(async () => {
    if (!sidebarDirty) return;
    setErrorSide('');
    setSavingSide(true);
    try {
      await axiosInstance.put('/projects/task/update/assignment/', {
        id: taskId,
        assigned_to: assignee || null,
        due_date: dueDate || null
      });

      await axiosInstance.put('/projects/task/update/classification/', {
        id: taskId,
        epic: parent || null,
        labels: labels ? labels.split(',').map(s => s.trim()).filter(Boolean) : []
      });

      await axiosInstance.put('/projects/task/move/', {
        id: taskId,
        status: statusValue,
        sprint_id: sprintId || null
      });

      setAssigneeOriginal(assignee || '');
      setDueOriginal(dueDate || '');
      setLabelsOriginal(labels || '');
      setSprintOriginal(sprintId || '');
      setStatusOriginal(statusValue);
    } catch (e) {
      setErrorSide(e?.response?.data?.message || 'Failed to save');
    } finally {
      setSavingSide(false);
    }
  }, [sidebarDirty, taskId, assignee, dueDate, labels, sprintId, statusValue, parent]);

  const handleSaveAll = useCallback(async () => {
    await saveTitleDesc();
    await saveSidebar();
    if (detailsDirty || sidebarDirty) {
      onChanged();         // safe due to default no-op
      await loadTask();    // refresh derived fields
    }
  }, [saveTitleDesc, saveSidebar, detailsDirty, sidebarDirty, onChanged, loadTask]);

  // Open page handler (used by Toolbar)
  const openAsPage = useCallback(() => {
    const absolute = `${window.location.origin}/projects/${projectId}/tasks/${taskId}`;
    window.open(absolute, '_blank', 'noopener,noreferrer');
  }, [projectId, taskId]);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div className="issue-header">
        <div className="issue-header-left">
          <span className="issue-key">{issueKey || 'ISSUE'}</span>
          <div
            className="issue-title"
            onDoubleClick={()=>setEditDetails(true)}
            title="Double-click to edit"
          >
            {title || 'Untitled issue'}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <Toolbar
            onOpenVSCode={() => {}}
            onCreateBranch={() => {}}
            onCreateCommit={() => {}}
            // If parent passes onOpenAsPage, use it; otherwise use local openAsPage
            onOpenAsPage={onOpenAsPage || openAsPage}
            />
          {allowClose && <button className="icon-btn" onClick={onClose}>✕</button>}
        </div>
      </div>

      {loading ? (
        <div style={{ padding:16 }}>Loading issue…</div>
      ) : rootError ? (
        <div className="alert alert-danger" style={{ margin:16 }}>{rootError}</div>
      ) : (
        <div className="issue-body" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, padding: 16 }}>
          <div className="panel">
            <div className="panel-section">
              <div className="section-title">Description</div>
              {editDetails ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  <textarea className="form-control" rows={6} value={desc} onChange={(e)=>setDesc(e.target.value)} />
                  <div className="row-muted">Double-click title/description to edit; Save in the Details section.</div>
                </div>
              ) : (
                <div
                  style={{ whiteSpace: 'pre-wrap', cursor: 'text', minHeight: 24 }}
                  onDoubleClick={()=>setEditDetails(true)}
                  title="Double-click to edit"
                >
                  {desc || <span className="row-muted">Add a description…</span>}
                </div>
              )}
            </div>
          </div>

          <DetailsSidebar
            users={users}
            sprints={sprints}
            assignee={assignee} setAssignee={setAssignee}
            sprintId={sprintId} setSprintId={setSprintId}
            labels={labels} setLabels={setLabels}
            parent={parent} setParent={setParent}
            dueDate={dueDate} setDueDate={setDueDate}
            team={team} setTeam={setTeam}
            startDate={startDate} setStartDate={setStartDate}
            originalEstimate={originalEstimate} setOriginalEstimate={setOriginalEstimate}
            timeTracked={timeTracked} setTimeTracked={setTimeTracked}
            fixVersions={fixVersions} setFixVersions={setFixVersions}
            statusValue={statusValue} setStatusValue={setStatusValue}
            saving={savingSide}
            error={errorSide}
            onSave={handleSaveAll}
            dirty={detailsDirty || sidebarDirty}
          />
        </div>
      )}
    </div>
  );
};

export default IssueDetailsView;
