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
      if (res?.data?.status) {
        const list = Array.isArray(res?.data?.records) ? res.data.records : [];
        setItems(list);
      } else {
        setItems([]);
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load comments');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [taskId, sprintId]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!text.trim() || !taskId) return;
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
      {error ? <div className="row-muted" style={{ color: 'var(--jira-error)' }}>{error}</div> : null}

      <div style={{ marginBottom: 8 }}>
        <textarea
          className="comment-box"
          placeholder="Add a comment…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="actions-row" style={{ marginTop: 8 }}>
          <button className="icon-btn" onClick={add} disabled={posting || !text.trim()}>
            {posting ? 'Posting…' : 'Add comment'}
          </button>
          <button className="icon-btn" onClick={() => setText('')} disabled={posting || !text}>
            Clear
          </button>
        </div>
      </div>

      {loading ? (
        <div className="row-muted">Loading comments…</div>
      ) : items.length === 0 ? (
        <div className="row-muted">No comments yet</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {items.map((c) => {
            const when = c?.created_at ? new Date(c.created_at).toLocaleString() : '';
            return (
              <div key={c.id} style={{ border: '1px solid var(--jira-divider)', borderRadius: 6, padding: 8 }}>
                <div className="row-muted" style={{ marginBottom: 4, display: 'flex', gap: 8 }}>
                  {/* If backend serializer exposes comment_by_name, show it; otherwise omit */}
                  {c.comment_by_name ? <strong>{c.comment_by_name}</strong> : null}
                  <span>{when}</span>
                </div>
                <div>{c.content}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CommentsSection;
