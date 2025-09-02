import React from 'react';

const LeaveBalance = ({ balance, loading }) => {
  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading leave balance...</p>
      </div>
    );
  }

  return (
    <div className="leave-balance-grid">
      <div className="balance-card total">
        <div className="balance-icon">📅</div>
        <div className="balance-content">
          <h3>{balance?.current_balance ?? 0}</h3>
          <p>Total Leave Balance</p>
        </div>
      </div>
      
      <div className="balance-card used">
        <div className="balance-icon">✅</div>
        <div className="balance-content">
          <h3>{balance?.used_days ?? 0}</h3>
          <p>Used Days</p>
        </div>
      </div>
      
      <div className="balance-card pending">
        <div className="balance-icon">⏳</div>
        <div className="balance-content">
          <h3>{balance?.pending_days ?? 0}</h3>
          <p>Pending Days</p>
        </div>
      </div>
      
      <div className="balance-card available">
        <div className="balance-icon">🆓</div>
        <div className="balance-content">
          <h3>{balance?.available_days ?? 0}</h3>
          <p>Available Days</p>
        </div>
      </div>
    </div>
  );
};

export default LeaveBalance;
