import React from 'react';

const LeaveRequestsList = ({ leaveRequests, loading, onApprove, onReject, userRole }) => {
  const getStatusColor = (status) => {
    const colors = {
      'PENDING': '#ffab00',
      'APPROVED': '#36b37e',
      'REJECTED': '#ff5630'
    };
    return colors[status] || '#A5ADBA';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'PENDING': '⏳',
      'APPROVED': '✅',
      'REJECTED': '❌'
    };
    return icons[status] || '📋';
  };

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  if (loading) {
    return (
      <div className="leave-requests-section">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading leave requests...</p>
        </div>
      </div>
    );
  }

  if (!leaveRequests.length) {
    return (
      <div className="leave-requests-section">
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No Leave Requests</h3>
          <p>
            {userRole === 'EMPLOYEE' 
              ? "You haven't submitted any leave requests yet." 
              : "No leave requests found."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="leave-requests-section">
      <div className="section-header">
        <h2>Leave Requests</h2>
        <span className="total-count">{leaveRequests.length} requests</span>
      </div>
      
      <div className="requests-table">
        {leaveRequests.map((request) => (
          <div key={request.id} className="request-row">
            <div className="request-employee">
              <div className="employee-info">
                <h4>{request.employee_email}</h4>
                <p className="designation">Employee</p>
                {request.employee_leave_balance !== undefined && (
                  <div className="balance-info">
                    Balance: {request.employee_leave_balance} days
                  </div>
                )}
              </div>
            </div>
            
            <div className="request-details">
              <div className="request-dates">
                <div className="date-range">
                  <span>{request.start_date}</span>
                  <span className="date-separator">to</span>
                  <span>{request.end_date}</span>
                </div>
                <div className="days-count">
                  {calculateDays(request.start_date, request.end_date)} days
                </div>
              </div>
              
              <div className="request-reason">
                <p>{request.reason}</p>
              </div>
            </div>
            
            <div className="request-status">
              <span 
                className="status-badge" 
                style={{ 
                  color: getStatusColor(request.status),
                  backgroundColor: `${getStatusColor(request.status)}20`
                }}
              >
                {getStatusIcon(request.status)} {request.status}
              </span>
            </div>
            
            <div className="request-actions">
              {(userRole === 'HR' || userRole === 'MANAGER') && request.status === 'PENDING' && (
                <div className="action-buttons">
                  <button 
                    className="approve-btn" 
                    onClick={() => onApprove(request.id)}
                  >
                    ✅ Approve
                  </button>
                  <button 
                    className="reject-btn" 
                    onClick={() => onReject(request.id)}
                  >
                    ❌ Reject
                  </button>
                </div>
              )}
              
              <div className="request-meta">
                <div className="applied-date">
                  Applied: {new Date(request.created_at || request.start_date).toLocaleDateString()}
                </div>
                {request.approved_by && (
                  <div className="approved-by">
                    Processed by: {request.approved_by}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaveRequestsList;
