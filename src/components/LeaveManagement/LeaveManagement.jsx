import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/auth-context';
import axiosInstance from '../../services/axiosinstance';
import '../../assets/css/LeaveManagement.css';

const PAGE_SIZE = 10;

const LeaveManagement = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  // State management
  const [stats, setStats] = useState({
    totalRequests: 0,
    approvedRequests: 0,
    pendingRequests: 0,
    rejectedRequests: 0
  });
  
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [myLeaveBalance, setMyLeaveBalance] = useState({
    current_balance: 24,
    used_days: 0,
    pending_days: 0,
    available_days: 24
  });
  
  const [statusMessage, setStatusMessage] = useState(null);

  // Loading states
  const [statsLoading, setStatsLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });

  // Utility functions
  const showStatus = (type, message) => {
    setStatusMessage({ type, message });
    setTimeout(() => setStatusMessage(null), 5000);
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

  // ✅ SAFE RENDERING HELPER - Prevents object rendering errors
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

  // Data fetching functions
  const fetchLeaveBalance = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/hr-management/leave/my-balance/');
      if (response.data.status && response.data.data) {
        setMyLeaveBalance(response.data.data.leave_balance);
      }
    } catch (error) {
      console.error("Error fetching leave balance:", error);
    }
  }, []);

  const fetchLeaveRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      let requestData = {
        page_size: PAGE_SIZE,
        page: currentPage
      };

      // Add filters
      if (filters.status) requestData.status = filters.status;
      if (filters.search) requestData.search = filters.search;

      // For employees, filter by their ID
      if (user?.role === 'EMPLOYEE') {
        requestData.employee_id = user.id;
      }

      const response = await axiosInstance.post('/hr-management/leave-requests/list/', requestData);
      
      if (response.data.status) {
        const requests = response.data.records || [];
        setLeaveRequests(requests);
        
        // Update pagination info
        setTotalPages(response.data.num_pages || 1);
        setTotalRecords(response.data.count || 0);

        // Calculate stats from current page data (you might want to get this from a separate API)
        setStats({
          totalRequests: response.data.count || 0,
          approvedRequests: requests.filter(r => r.status === 'APPROVED').length,
          pendingRequests: requests.filter(r => r.status === 'PENDING').length,
          rejectedRequests: requests.filter(r => r.status === 'REJECTED').length
        });
      } else {
        setLeaveRequests([]);
        setTotalPages(1);
        setTotalRecords(0);
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      setLeaveRequests([]);
      setTotalPages(1);
      setTotalRecords(0);
    }
    setRequestsLoading(false);
  }, [user, filters, currentPage]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      // Fetch balance and initial stats
      const [balanceRes] = await Promise.all([
        axiosInstance.get('/hr-management/leave/my-balance/')
      ]);

      if (balanceRes.data.status && balanceRes.data.data) {
        setMyLeaveBalance(balanceRes.data.data.leave_balance);
      }

      // Fetch requests for stats with current filters but get all records for accurate stats
      const statsRequestData = {
        page_size: 1000, // Large number to get all records for stats
        page: 1
      };

      if (user?.role === 'EMPLOYEE') {
        statsRequestData.employee_id = user.id;
      }

      const statsResponse = await axiosInstance.post('/hr-management/leave-requests/list/', statsRequestData);
      
      if (statsResponse.data.status) {
        const allRequests = statsResponse.data.records || [];
        setStats({
          totalRequests: allRequests.length,
          approvedRequests: allRequests.filter(r => r.status === 'APPROVED').length,
          pendingRequests: allRequests.filter(r => r.status === 'PENDING').length,
          rejectedRequests: allRequests.filter(r => r.status === 'REJECTED').length
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
    setStatsLoading(false);
  }, [user]);

  // Approve/Reject leave request
  const handleLeaveAction = async (requestId, action) => {
    if (user.role !== 'HR' && user.role !== 'MANAGER') {
      showStatus('error', 'You do not have permission to perform this action');
      return;
    }

    try {
      const response = await axiosInstance.post('/hr-management/leave/approve-reject/', {
        request_id: requestId,
        action: action,
        comments: `${action} by ${user.name}`
      });

      if (response.data.status) {
        showStatus('success', response.data.message);
        // Refresh current page data
        fetchLeaveRequests();
        fetchStats();
      } else {
        showStatus('error', response.data.message || `Failed to ${action.toLowerCase()} leave request`);
      }
    } catch (error) {
      console.error('Error processing leave action:', error);
      showStatus('error', `Error ${action.toLowerCase()}ing leave request`);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    // Reset to first page when filters change
    setCurrentPage(1);
  };

  const getUserRoleDisplay = () => {
    const roleDisplays = {
      'EMPLOYEE': 'My Leave Management',
      'MANAGER': 'Team Leave Management',
      'HR': 'HR Leave Management'
    };
    return roleDisplays[user?.role] || 'Leave Management';
  };

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  // Navigate to add leave page
  const handleAddLeave = () => {
    navigate('/leave-request');
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Navigate to add leave details page
  const handleRowClick = (requestId) => {
    navigate(`/leave-request/${requestId}`);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, 5);
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  };

  // Effects
  useEffect(() => {
    if (authLoading || !user) return;
    fetchStats();
    fetchLeaveBalance();
  }, [authLoading, user, fetchStats, fetchLeaveBalance]);

  useEffect(() => {
    if (authLoading || !user) return;
    fetchLeaveRequests();
  }, [authLoading, user, fetchLeaveRequests]);

  // Loading state
  if (authLoading || !user) {
    return (
      <div className="leave-management">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="leave-management">
      {/* Header Section */}
      <div className="leave-header">
        <div className="leave-title-section">
          <h1 className="leave-title">{getUserRoleDisplay()}</h1>
          <p className="leave-subtitle">
            Welcome back, {renderSafely(user?.full_name || user?.name) || 'User'}!
            Manage your leave requests and track your balance.
          </p>
        </div>
        <div className="header-actions">
          <button onClick={handleAddLeave} className="add-leave-btn">
            + Add Leave Request
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

      {/* Leave Balance Grid */}
      <div className="leave-balance-grid">
        {statsLoading ? (
          <div className="balance-card">
            <div className="balance-icon">⏳</div>
            <div className="balance-content">
              <h3>Loading...</h3>
              <p>Please wait...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="balance-card total">
              <div className="balance-icon">📅</div>
              <div className="balance-content">
                <h3>{myLeaveBalance.available_days}</h3>
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
            <div className="balance-card">
              <div className="balance-icon">📊</div>
              <div className="balance-content">
                <h3>{stats.totalRequests}</h3>
                <p>Total Requests</p>
              </div>
            </div>
            <div className="balance-card pending">
              <div className="balance-icon">⏳</div>
              <div className="balance-content">
                <h3>{stats.pendingRequests}</h3>
                <p>Pending Requests</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filters Section */}
      <div className="leave-filters">
        <div className="filter-group">
          <label>Filter by Status</label>
          <select
            className="filter-select"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Search</label>
          <input
            type="text"
            className="filter-input"
            placeholder="Search by employee name, reason..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
      </div>

      {/* Leave Requests Section */}
      <div className="leave-requests-section">
        <div className="section-header">
          <h2>Leave Requests</h2>
          <div className="section-info">
            <span className="total-count">
              Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalRecords)} - {Math.min(currentPage * PAGE_SIZE, totalRecords)} of {totalRecords} requests
            </span>
          </div>
        </div>

        {requestsLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading leave requests...</p>
          </div>
        ) : leaveRequests.length > 0 ? (
          <>
            <div className="requests-table">
              {leaveRequests.map((request) => (
                <div 
                  key={request.id} 
                  className="request-row clickable-row" 
                  onClick={() => handleRowClick(request.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="request-employee">
                    <div className="employee-info">
                      <h4>{renderSafely(request.employee_name)}</h4>
                      <p>{renderSafely(request.employee_email)}</p>
                      <span className="designation">{renderSafely(request.designation)}</span>
                      {request.employee_leave_balance !== undefined && (
                        <div className="balance-info">
                          Balance: {request.employee_leave_balance} days
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="request-dates">
                    <div className="date-range">
                      <span>{request.start_date}</span>
                      <span className="date-separator">→</span>
                      <span>{request.end_date}</span>
                    </div>
                    <div className="days-count">
                      {calculateDays(request.start_date, request.end_date)} days
                    </div>
                  </div>

                  <div className="request-reason">
                    <p>{renderSafely(request.reason) || 'No reason provided'}</p>
                  </div>

                  <div className="request-actions">
                    <div 
                      className={`status-badge status-${request.status.toLowerCase()}`}
                      style={{ color: getStatusColor(request.status) }}
                    >
                      {getStatusIcon(request.status)} {request.status}
                    </div>

                    {(user?.role === 'HR' || user?.role === 'MANAGER') && request.status === 'PENDING' && (
                      <div className="action-buttons">
                        <button
                          onClick={() => handleLeaveAction(request.id, 'APPROVED')}
                          className="approve-btn"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleLeaveAction(request.id, 'REJECTED')}
                          className="reject-btn"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    <div className="request-meta">
                      <div className="applied-date">
                        Applied: {new Date(request.applied_on).toLocaleDateString()}
                      </div>
                      {request.approved_by && (
                        <div className="approved-by">
                          By: {renderSafely(request.approved_by.name)}
                        </div>
                      )}
                      {request.comments && (
                        <div className="comments">"{request.comments}"</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  « Previous
                </button>

                {/* Page Numbers */}
                {getPageNumbers().map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Next »
                </button>

                <div className="pagination-info">
                  Page {currentPage} of {totalPages} ({totalRecords} total records)
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No Leave Requests Found</h3>
            <p>
              {user?.role === 'EMPLOYEE' 
                ? "You haven't submitted any leave requests yet." 
                : "No leave requests found for your team." 
              }
            </p>
            <button onClick={handleAddLeave} className="btn-primary">
              Submit Your First Leave Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveManagement;
