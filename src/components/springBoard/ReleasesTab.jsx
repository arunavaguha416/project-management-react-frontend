// File: src/components/springBoard/ReleasesTab.jsx

import React, { useEffect, useState, useContext, useCallback } from 'react';
import axiosInstance from '../../services/axiosinstance';
import { AuthContext } from '../../context/auth-context';

const ReleasesTab = ({ projectId, reloadKey }) => {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.post(
        '/projects/milestones/list/',
        { project_id: projectId, page_size: 50 },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      setItems(res?.data?.status ? (res?.data?.records || []) : []);
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
            <th>Release</th>
            <th>Status</th>
            <th>Target date</th>
            <th>Progress</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="4">Loading releases…</td></tr>
          ) : items.length === 0 ? (
            <tr><td colSpan="4">No releases</td></tr>
          ) : (
            items.map((m) => (
              <tr key={m.id}>
                <td>{m.title || m.name}</td>
                <td>{m.status}</td>
                <td>{m.target_date || m.due_date || '-'}</td>
                <td>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${m.completion_percentage ?? 0}%` }} />
                    <span>{m.completion_percentage ?? 0}%</span>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ReleasesTab;
