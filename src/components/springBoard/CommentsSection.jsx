// src/components/springBoard/CommentsSection.jsx
import React, { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../../services/axiosinstance';

const CommentsSection = ({ taskId, sprintId }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [text, setText] = useState('');

  const load = useCallback(async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      setError('');
      const res = await axiosInstance.post('/projects/comments/list/', {
        task_id: taskId,
        sprint_id: sprintId || undefined,
        page_size: 50,
      });
      setItems(res?.data?.status ? (res?.data?.records || []) : []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [taskId, sprintId]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!text.trim()) return;
    try {
      setPosting(true);
      setError('');
      // Backend expects { task, content }
      const res = await axiosInstance.post('/projects/comments/add/', {
        task: taskId,
        content: text.trim(),
      });
      if (!res?.data?.status) {
        setError(res?.data?.message || 'Failed to add comment');
        return;
      }
      setText('');
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to add comment');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div>
      <div className="panel-section">
        <div className="section-title">Comments</div>
        {error && <div className="alert alert-danger" style={{ marginBottom: 8 }}>{error}</div>}
        <div style={{ display: 'grid', gap: 8 }}>
          <textarea
            className="comment-box"
            placeholder="Add a comment…"
            value={text}
            onChange={(e)=>setText(e.target.value)}
          />
          <div className="actions-row">
            <button className="btn-jira" onClick={add} disabled={posting || !text.trim()}>
              {posting ? 'Saving…' : 'Add'}
            </button>
          </div>
        </div>
      </div>

      <div className="panel-section">
        <div className="section-title">Activity</div>
        {loading ? (
          <div className="row-muted">Loading comments…</div>
        ) : items.length === 0 ? (
          <div className="row-muted">No comments yet.</div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {items.map((c) => (
              <div key={c.id} style={{ border: '1px solid var(--jira-divider, #DFE1E6)', borderRadius: 6, padding: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--jira-muted-text, #42526E)' }}>
                  {c.comment_by?.username || c.comment_by?.name || c.comment_by || 'User'} • {c.created_at || ''}
                </div>
                <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{c.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentsSection;
