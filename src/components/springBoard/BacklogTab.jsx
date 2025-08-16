// File: src/components/springBoard/BacklogTab.jsx
// Only change: the modal is the updated version with conditional Save and edit toggles.
// If you already integrated IssueModal earlier, keep that import & usage.

import React, { useEffect, useState, useContext, useCallback } from 'react';
import axiosInstance from '../../services/axiosinstance';
import { AuthContext } from '../../context/auth-context';
import IssueModal from '../../components/springBoard/IssueModal';

const BacklogTab = ({ projectId, sprintId, onMoved, reloadKey }) => {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionOk, setActionOk] = useState('');
  const [openTaskId, setOpenTaskId] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setActionError('');
      setActionOk('');
      const res = await axiosInstance.post(
        '/projects/backlog/list/',
        { project_id: projectId, page_size: 50 },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      setItems(res?.data?.status ? (res?.data?.records || []) : []);
    } catch (err) {
      setItems([]);
      setActionError(err?.response?.data?.message || 'Failed to load backlog');
    } finally {
      setLoading(false);
    }
  }, [projectId, user?.token]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  const addToSprint = async (taskId) => {
    setActionError('');
    setActionOk('');
    if (!sprintId) {
      setActionError('No active sprint to add into.');
      return;
    }
    try {
      setMovingId(taskId);
      const res = await axiosInstance.put(
        '/projects/task/move/',
        { id: taskId, status: 'TODO', sprint_id: sprintId },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      if (!res?.data?.status) {
        setActionError(res?.data?.message || 'Failed to add task to sprint');
        return;
      }
      setActionOk('Task added to sprint.');
      await load();
      if (onMoved) onMoved();
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Request failed.');
    } finally {
      setMovingId(null);
    }
  };

  return (
    <div className="jira-card">
      {actionError ? <div className="alert alert-danger" style={{ marginBottom: 12 }}>{actionError}</div> : null}
      {actionOk ? <div className="alert alert-success" style={{ marginBottom: 12 }}>{actionOk}</div> : null}

      <table className="table table-hover">
        <thead>
          <tr>
            <th>Issue</th>
            <th>Priority</th>
            <th>Assignee</th>
            <th>Status</th>
            <th>Due</th>
            <th style={{ width: 140 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="6">Loading backlog…</td></tr>
          ) : items.length === 0 ? (
            <tr><td colSpan="6">No backlog items</td></tr>
          ) : (
            items.map((t) => (
              <tr
                key={t.id}
                className="clickable-row"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/task-id', t.id);
                  e.dataTransfer.setData('text/from', 'backlog');
                }}
                onClick={() => setOpenTaskId(t.id)}
              >
                <td>{t.title}</td>
                <td>{t.priority || 'MEDIUM'}</td>
                <td>{t.assignee_name || 'Unassigned'}</td>
                <td>{t.status}</td>
                <td>{t.due_date || '-'}</td>
                <td>
                  <button
                    className="btn-jira btn-sm"
                    disabled={!sprintId || movingId === t.id}
                    onClick={(e) => { e.stopPropagation(); addToSprint(t.id); }}
                  >
                    {movingId === t.id ? 'Adding…' : 'Add to sprint'}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {openTaskId ? (
        <IssueModal
          projectId={projectId}
          taskId={openTaskId}
          sprintId={sprintId}
          onClose={() => setOpenTaskId('')}
          onChanged={load}
          reloadLists={onMoved}
        />
      ) : null}
    </div>
  );
};

export default BacklogTab;
