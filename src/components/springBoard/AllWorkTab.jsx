// File: src/components/springBoard/AllWorkTab.jsx

import React, { useEffect, useState, useContext, useCallback } from 'react';
import axiosInstance from '../../services/axiosinstance';
import { AuthContext } from '../../context/auth-context';

const AllWorkTab = ({ projectId, reloadKey }) => {
  const { user } = useContext(AuthContext);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.post(
        '/projects/tasks/list/',
        { project_id: projectId, page_size: 50 },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      setRows(res?.data?.status ? (res?.data?.records || []) : []);
    } finally {
      setLoading(false);
    }
  }, [projectId, user?.token]);

  useEffect(() => { load(); }, [load, reloadKey]);

  return (
    <div className="jira-card">
      <table className="table table-hover">
        <thead>
          <tr>
            <th>Issue</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Assignee</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="5">Loading work…</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan="5">No work items</td></tr>
          ) : (
            rows.map((t) => (
              <tr key={t.id}>
                <td>{t.title}</td>
                <td>{t.status}</td>
                <td>{t.priority}</td>
                <td>{t.assignee_name || 'Unassigned'}</td>
                <td>{t.updated_at || '-'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AllWorkTab;
