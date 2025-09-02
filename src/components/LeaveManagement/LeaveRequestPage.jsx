import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/auth-context';
import axiosInstance from '../../services/axiosinstance';
import '../../assets/css/LeaveManagement.css';

const LeaveRequestPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [leaveForm, setLeaveForm] = useState({
    start_date: '',
    end_date: '',
    reason: '',
    employee_id: ''
  });
  
  const [myLeaveBalance, setMyLeaveBalance] = useState({
    current_balance: 24,
    used_days: 0,
    pending_days: 0,
    available_days: 24
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(true);

  const showStatus = (type, message) => {
    setStatusMessage({ type, message });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const calculateDays = () => {
    if (leaveForm.start_date && leaveForm.end_date) {
      const startDate = new Date(leaveForm.start_date);
      const endDate = new Date(leaveForm.end_date);
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      return daysDiff > 0 ? daysDiff : 0;
    }
    return 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLeaveForm(prev => ({
      ...prev,
      [name]: value
    }));
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

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    
    if (!leaveForm.start_date || !leaveForm.end_date || !leaveForm.reason.trim()) {
      showStatus('error', 'Please fill in all required fields');
      return;
    }

    const startDate = new Date(leaveForm.start_date);
    const endDate = new Date(leaveForm.end_date);
    
    if (startDate > endDate) {
      showStatus('error', 'End date must be after start date');
      return;
    }

    const daysDifference = calculateDays();
    if (daysDifference > myLeaveBalance.current_balance) {
      showStatus('error', `Insufficient leave balance. You have ${myLeaveBalance.current_balance} days available.`);
      return;
    }

    setSubmitting(true);
    try {
      const requestData = {
        start_date: leaveForm.start_date,
        end_date: leaveForm.end_date,
        reason: leaveForm.reason.trim()
      };

      if ((user.role === 'HR' || user.role === 'MANAGER') && leaveForm.employee_id.trim()) {
        requestData.employee_id = leaveForm.employee_id.trim();
      }

      const response = await axiosInstance.post('/hr-management/leave/apply/', requestData);
      
      if (response.data.status) {
        showStatus('success', response.data.message || 'Leave request submitted successfully!');
        setLeaveForm({
          start_date: '',
          end_date: '',
          reason: '',
          employee_id: ''
        });
        
        // Navigate back to leave management after success
        setTimeout(() => {
          navigate('/leave-management');
        }, 2000);
      } else {
        showStatus('error', response.data.message || 'Failed to submit leave request');
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      showStatus('error', 'Error submitting leave request. Please try again.');
    }
    setSubmitting(false);
  };

  // Fixed useEffect with proper dependencies
  useEffect(() => {
    const fetchLeaveBalance = async () => {
      setLoadingBalance(true);
      try {
        const response = await axiosInstance.get('/hr-management/leave/my-balance/');
        if (response.data.status && response.data.data) {
          setMyLeaveBalance(response.data.data.leave_balance);
        }
      } catch (error) {
        console.error("Error fetching leave balance:", error);
        showStatus('error', 'Failed to fetch leave balance');
      }
      setLoadingBalance(false);
    };

    const fetchEmployees = async () => {
      if (user?.role === 'HR' || user?.role === 'MANAGER') {
        setLoadingEmployees(true);
        try {
          const response = await axiosInstance.post('/hr-management/employees/list/', {
            page: 1,
            page_size: 100,
            search: ''
          });
          if (response.data.status && response.data.records) {
            setEmployees(response.data.records);
          }
        } catch (error) {
          console.error("Error fetching employees:", error);
          showStatus('error', 'Failed to fetch employees');
        }
        setLoadingEmployees(false);
      }
    };

    // Only fetch data if user exists
    if (user) {
      fetchLeaveBalance();
      fetchEmployees();
    }
  }, [user]); // Only user as dependency since functions are defined inside useEffect

  if (!user) {
    return (
      <div className="leave-management">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading user information...</p>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const calculatedDays = calculateDays();

  return (
    <div className="leave-management">
      {/* Header Section */}
      <div className="leave-header">
        <div className="leave-title-section">
          <h1 className="leave-title">Apply for Leave</h1>
          <p className="leave-subtitle">
            {user.role === 'EMPLOYEE' 
              ? 'Fill in the details below to submit your leave request' 
              : 'Apply leave for yourself or on behalf of team members'}
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

      {/* Leave Balance Display */}
      <div className="leave-balance-grid">
        {loadingBalance ? (
          <div className="balance-card">
            <div className="balance-icon">⏳</div>
            <div className="balance-content">
              <h3>Loading...</h3>
              <p>Leave Balance</p>
            </div>
          </div>
        ) : (
          <>
            <div className="balance-card total">
              <div className="balance-icon">📅</div>
              <div className="balance-content">
                <h3>{myLeaveBalance.current_balance}</h3>
                <p>Available Days</p>
              </div>
            </div>
            <div className="balance-card used">
              <div className="balance-icon">✅</div>
              <div className="balance-content">
                <h3>{myLeaveBalance.used_days}</h3>
                <p>Used Days</p>
              </div>
            </div>
            <div className="balance-card pending">
              <div className="balance-icon">⏳</div>
              <div className="balance-content">
                <h3>{myLeaveBalance.pending_days}</h3>
                <p>Pending Days</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Leave Request Form */}
      <div className="leave-requests-section">
        <div className="section-header">
          <h2>New Leave Request</h2>
          <div className="section-info">
            <span className="total-count">
              User: {renderSafely(user?.name)} ({user?.role})
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmitLeave} className="leave-form" style={{ padding: '48px' }}>
          {/* Employee Selection for HR/Manager */}
          {(user?.role === 'HR' || user?.role === 'MANAGER') && (
            <div className="employee-selection-alert">
              <div className="alert-text">
                <strong>Applying leave on behalf of employee:</strong> Select an employee below or leave empty to apply for yourself.
              </div>
            </div>
          )}

          <div className="form-section">
            <h3 className="section-title">
              📝 Leave Details
            </h3>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label required">Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={leaveForm.start_date}
                  onChange={handleInputChange}
                  min={today}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required">End Date</label>
                <input
                  type="date"
                  name="end_date"
                  value={leaveForm.end_date}
                  onChange={handleInputChange}
                  min={leaveForm.start_date || today}
                  className="form-input"
                  required
                />
              </div>
            </div>

            {(user?.role === 'HR' || user?.role === 'MANAGER') && (
              <div className="form-group">
                <label className="form-label">Employee (Optional - Leave empty for yourself)</label>
                {loadingEmployees ? (
                  <div className="form-input" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    color: '#64748b',
                    pointerEvents: 'none'
                  }}>
                    <div className="spinner" style={{ marginRight: '12px' }}></div>
                    Loading employees...
                  </div>
                ) : (
                  <select
                    name="employee_id"
                    value={leaveForm.employee_id}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="">Select Employee (or leave empty for yourself)</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {renderSafely(emp.user?.name) || 'Unknown'} - {emp.designation || 'No designation'}
                        {emp.user?.email && ` (${emp.user.email})`}
                      </option>
                    ))}
                  </select>
                )}
                <div className="form-help">
                  If no employee is selected, the leave will be applied for your own account.
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label required">Reason for Leave</label>
              <textarea
                name="reason"
                value={leaveForm.reason}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="Please provide a detailed reason for your leave request..."
                required
                rows="6"
              />
              <div className="form-help">
                Provide a clear and detailed reason for your leave request to help with approval.
              </div>
            </div>
          </div>

          {/* Leave Summary */}
          {(leaveForm.start_date && leaveForm.end_date) && (
            <div className="leave-summary">
              <div className="summary-grid">
                <div className="summary-item">
                  <div className="summary-label">Days Requested</div>
                  <div className="summary-value neutral">{calculatedDays}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Available Balance</div>
                  <div className="summary-value positive">{myLeaveBalance.current_balance}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Balance After Approval</div>
                  <div className={`summary-value ${
                    myLeaveBalance.current_balance - calculatedDays >= 0 ? 'positive' : 'negative'
                  }`}>
                    {myLeaveBalance.current_balance - calculatedDays}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warning for insufficient balance */}
          {calculatedDays > myLeaveBalance.current_balance && (
            <div className="insufficient-balance-warning">
              <div className="warning-text">
                <strong>Insufficient Leave Balance!</strong><br />
                You are requesting {calculatedDays} days but only have {myLeaveBalance.current_balance} days available.
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '20px', 
            justifyContent: 'flex-end', 
            marginTop: '40px',
            borderTop: '2px solid #e2e8f0',
            paddingTop: '32px'
          }}>
            <button
              type="button"
              onClick={() => navigate('/leave-management')}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || calculatedDays > myLeaveBalance.current_balance}
              className="btn-primary"
            >
              {submitting ? (
                <>
                  <div className="spinner"></div>
                  Submitting...
                </>
              ) : (
                <>
                  📤 Submit Leave Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveRequestPage;
