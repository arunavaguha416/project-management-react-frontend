import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/auth-context';
import axiosInstance from '../../services/axiosinstance';
import '../../assets/css/LeaveManagement.css';

const LeaveDetailsPage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [leaveRequest, setLeaveRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const showStatus = (type, message) => {
    setStatusMessage({ type, message });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const renderSafely = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number') return value;
    if (typeof value === 'object') {
      if (value.name) return value.name;
      if (value.email) return value.email;
      return 'Unknown';
    }
    return String(value);
  };

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

  // Fixed with useCallback to resolve dependency warning
  const fetchLeaveRequest = useCallback(async () => {
    setLoading(true);
    try {
      // First get all leave requests and find the specific one
      const requestData = {
        page_size: 1000,
        page: 1
      };

      if (user?.role === 'EMPLOYEE') {
        requestData.employee_id = user.id;
      }

      const response = await axiosInstance.post('/hr-management/leave-requests/list/', requestData);
      
      if (response.data.status && response.data.records) {
        const foundRequest = response.data.records.find(req => req.id === requestId);
        if (foundRequest) {
          setLeaveRequest(foundRequest);
        } else {
          showStatus('error', 'Leave request not found');
          navigate('/leave-management');
        }
      } else {
        showStatus('error', 'Failed to fetch leave request details');
        navigate('/leave-management');
      }
    } catch (error) {
      console.error('Error fetching leave request:', error);
      showStatus('error', 'Error loading leave request details');
      navigate('/leave-management');
    }
    setLoading(false);
  }, [requestId, user, navigate]); // Added dependencies for useCallback

  const handleLeaveAction = async (action) => {
    if (user.role !== 'HR' && user.role !== 'MANAGER') {
      showStatus('error', 'You do not have permission to perform this action');
      return;
    }

    setActionLoading(true);
    try {
      const response = await axiosInstance.post('/hr-management/leave/approve-reject/', {
        request_id: requestId,
        action: action,
        comments: `${action} by ${user.name}`
      });

      if (response.data.status) {
        showStatus('success', response.data.message);
        // Refresh the request details
        fetchLeaveRequest();
      } else {
        showStatus('error', response.data.message || `Failed to ${action.toLowerCase()} leave request`);
      }
    } catch (error) {
      console.error('Error processing leave action:', error);
      showStatus('error', `Error ${action.toLowerCase()}ing leave request`);
    }
    setActionLoading(false);
  };

  // Fixed useEffect with proper dependencies
  useEffect(() => {
    if (user && requestId) {
      fetchLeaveRequest();
    }
  }, [user, requestId, fetchLeaveRequest]); // Now includes fetchLeaveRequest

  if (loading) {
    return (
      <div className="leave-management">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading leave request details...</p>
        </div>
      </div>
    );
  }

  if (!leaveRequest) {
    return (
      <div className="leave-management">
        <div className="empty-state">
          <div className="empty-icon">❌</div>
          <h3>Leave Request Not Found</h3>
          <p>The requested leave request could not be found or you don't have permission to view it.</p>
          <button onClick={() => navigate('/leave-management')} className="btn-primary">
            Back to Leave Management
          </button>
        </div>
      </div>
    );
  }

  const days = calculateDays(leaveRequest.start_date, leaveRequest.end_date);

  return (
    <div className="leave-management">
      {/* Header */}
      <div className="leave-header">
        <div className="leave-title-section">
          <h1 className="leave-title">Leave Request Details</h1>
          <p className="leave-subtitle">
            Request ID: {leaveRequest.id}
          </p>
        </div>
        <div className="header-actions">
          <button 
            onClick={() => navigate('/leave-management')}
            className="btn-secondary"
          >
            ← Back to Leave Management
          </button>
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div className={`status-message ${statusMessage.type}`}>
          <span>{statusMessage.message}</span>
          <button onClick={() => setStatusMessage(null)}>×</button>
        </div>
      )}

      {/* Leave Request Details */}
      <div className="leave-requests-section">
        <div className="section-header">
          <h2>Request Information</h2>
          <div className="section-info">
            <div 
              className={`status-badge status-${leaveRequest.status.toLowerCase()}`}
              style={{ color: getStatusColor(leaveRequest.status), fontSize: '16px', padding: '12px 20px' }}
            >
              {getStatusIcon(leaveRequest.status)} {leaveRequest.status}
            </div>
          </div>
        </div>

        <div style={{ padding: '48px' }}>
          {/* Employee Information */}
          <div className="form-section">
            <h3 className="section-title">
              👤 Employee Information
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Employee Name</label>
                <div className="form-display-value">
                  {renderSafely(leaveRequest.employee_name)}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <div className="form-display-value">
                  {renderSafely(leaveRequest.employee_email)}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Designation</label>
                <div className="form-display-value">
                  {renderSafely(leaveRequest.designation)}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <div className="form-display-value">
                  {renderSafely(leaveRequest.department)}
                </div>
              </div>
            </div>
          </div>

          {/* Leave Details */}
          <div className="form-section">
            <h3 className="section-title">
              📅 Leave Details
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <div className="form-display-value">
                  {new Date(leaveRequest.start_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <div className="form-display-value">
                  {new Date(leaveRequest.end_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Duration</label>
                <div className="form-display-value">
                  <span style={{ 
                    background: '#f3e8ff', 
                    color: '#7c3aed', 
                    padding: '8px 16px', 
                    borderRadius: '12px', 
                    fontWeight: 'bold' 
                  }}>
                    {days} {days === 1 ? 'Day' : 'Days'}
                  </span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Current Leave Balance</label>
                <div className="form-display-value">
                  <span style={{ 
                    background: '#dcfce7', 
                    color: '#166534', 
                    padding: '8px 16px', 
                    borderRadius: '12px', 
                    fontWeight: 'bold' 
                  }}>
                    {leaveRequest.employee_leave_balance} Days Available
                  </span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Reason for Leave</label>
              <div className="form-display-value" style={{ 
                background: '#f9fafb', 
                padding: '20px', 
                borderRadius: '12px', 
                border: '2px solid #e5e7eb',
                minHeight: '80px',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.6'
              }}>
                {renderSafely(leaveRequest.reason) || 'No reason provided'}
              </div>
            </div>
          </div>

          {/* Request Timeline */}
          <div className="form-section">
            <h3 className="section-title">
              📊 Request Timeline
            </h3>
            <div className="timeline">
              <div className="timeline-item">
                <div className="timeline-icon">📝</div>
                <div className="timeline-content">
                  <div className="timeline-title">Request Submitted</div>
                  <div className="timeline-date">
                    {new Date(leaveRequest.applied_on).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              {leaveRequest.approved_by && (
                <div className="timeline-item">
                  <div className="timeline-icon">
                    {leaveRequest.status === 'APPROVED' ? '✅' : '❌'}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-title">
                      Request {leaveRequest.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                    </div>
                    <div className="timeline-subtitle">
                      By: {renderSafely(leaveRequest.approved_by.name)}
                    </div>
                    {leaveRequest.comments && (
                      <div className="timeline-comments">
                        "{leaveRequest.comments}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Leave Summary */}
          <div className="leave-summary">
            <div className="summary-grid">
              <div className="summary-item">
                <div className="summary-label">Days Requested</div>
                <div className="summary-value neutral">{days}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Current Balance</div>
                <div className="summary-value positive">{leaveRequest.employee_leave_balance}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Balance After Leave</div>
                <div className={`summary-value ${
                  leaveRequest.employee_leave_balance - days >= 0 ? 'positive' : 'negative'
                }`}>
                  {leaveRequest.employee_leave_balance - days}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons for HR/Manager */}
          {(user?.role === 'HR' || user?.role === 'MANAGER') && leaveRequest.status === 'PENDING' && (
            <div style={{ 
              display: 'flex', 
              gap: '20px', 
              justifyContent: 'center', 
              marginTop: '40px',
              borderTop: '2px solid #e2e8f0',
              paddingTop: '32px'
            }}>
              <button
                onClick={() => handleLeaveAction('APPROVED')}
                disabled={actionLoading}
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}
              >
                {actionLoading ? (
                  <>
                    <div className="spinner"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    ✅ Approve Request
                  </>
                )}
              </button>
              <button
                onClick={() => handleLeaveAction('REJECTED')}
                disabled={actionLoading}
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
              >
                {actionLoading ? (
                  <>
                    <div className="spinner"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    ❌ Reject Request
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveDetailsPage;
