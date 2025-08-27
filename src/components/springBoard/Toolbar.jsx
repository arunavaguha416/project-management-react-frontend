import React from 'react';

const Toolbar = ({ onSave, onOpenAsPage, onClose, isDirty, saving }) => {
  return (
    <div className="issue-toolbar">
      {/* Save button - only show when dirty */}
      {isDirty && (
        <button
          className="toolbar-btn save-btn"
          onClick={onSave}
          disabled={saving}
          title="Save changes"
        >
          {saving ? (
            <>
              <span className="btn-spinner"></span>
              Saving...
            </>
          ) : (
            <>
              💾 Save
            </>
          )}
        </button>
      )}

      {/* Open as page */}
      {onOpenAsPage && (
        <button
          className="toolbar-btn"
          onClick={onOpenAsPage}
          title="Open in new tab"
        >
          🔗
        </button>
      )}

      {/* Share */}
      <button
        className="toolbar-btn"
        onClick={() => {
          navigator.clipboard.writeText(window.location.href);
          // You could show a toast notification here
        }}
        title="Copy link"
      >
        📋
      </button>

      {/* More actions */}
      <div className="toolbar-dropdown">
        <button className="toolbar-btn" title="More actions">
          ⋯
        </button>
        {/* Dropdown menu could be implemented here */}
      </div>

      {/* Close button */}
      {onClose && (
        <button
          className="toolbar-btn close-btn"
          onClick={onClose}
          title="Close"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default Toolbar;
