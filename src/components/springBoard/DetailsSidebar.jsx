
const STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'];
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

export default DetailsSidebar;
