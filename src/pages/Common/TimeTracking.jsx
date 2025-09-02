import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../../context/auth-context';
import axiosInstance from '../../services/axiosinstance';
import '../../assets/css/TimeTracking.css';

const TimeTracking = () => {
  const { user } = useContext(AuthContext);
  const [timeEntries, setTimeEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    user_id: ''
  });

  // ✅ FIXED: Wrapped fetchTimeEntries in useCallback with proper dependencies
  const fetchTimeEntries = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const requestData = {
        page: page,
        page_size: 10,
        ...filters
      };

      const response = await axiosInstance.post('/time-tracking/entries/list/', requestData);
      
      if (response.data.status) {
        setTimeEntries(response.data.records || []);
        setTotalPages(response.data.num_pages || 1);
        setTotalRecords(response.data.count || 0);
        setCurrentPage(page);
      } else {
        setTimeEntries([]);
        setTotalPages(1);
        setTotalRecords(0);
      }
    } catch (error) {
      console.error('Error fetching time entries:', error);
      setTimeEntries([]);
      setTotalPages(1);
      setTotalRecords(0);
    }
    setLoading(false);
  }, [filters]); // ✅ Dependencies: filters

  // ✅ FIXED: Wrapped fetchStats in useCallback
  const fetchStats = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/time-tracking/entries/stats/');
      if (response.data.status) {
        setStats(response.data.data);
      } else {
        setStats(null);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(null);
    }
  }, []); // ✅ No dependencies as this function doesn't depend on any state/prop

  // ✅ FIXED: Updated useEffect with proper dependencies
  useEffect(() => {
    if (user) {
      fetchTimeEntries(currentPage);
      fetchStats();
    }
  }, [user, fetchTimeEntries, fetchStats, currentPage]); // ✅ All dependencies included

  // Handle filter changes and reset page
  const handleFilterChange = useCallback((filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  // Handle page changes
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  }, [totalPages, currentPage]);

  // Format time helper
  const formatTime = useCallback((timeString) => {
    if (!timeString) return '--:--';
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }, []);

  // Format date helper
  const formatDate = useCallback((dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  if (!user) {
    return (
      <div className="time-tracking">
        <div className="error-message">
          <p>Please log in to view time tracking.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="time-tracking">
      {/* Header */}
      <div className="time-tracking-header">
        <div className="header-content">
          <h1>Time Tracking</h1>
          <p>Monitor your work hours and productivity</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{stats.total_hours}</h3>
              <p>Total Hours</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{stats.total_days}</h3>
              <p>Days Worked</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <h3>{stats.average_hours_per_day}</h3>
              <p>Avg per Day</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>{stats.current_week_hours}</h3>
              <p>This Week</p>
            </div>
          </div>
        </div>
      )}

      {/* Today's Status */}
      {stats && (
        <div className="today-status">
          <h3>Today's Status</h3>
          <div className={`status-badge ${stats.today_status ? stats.today_status.toLowerCase().replace(/\s+/g, '-') : 'unknown'}`}>
            {stats.today_status || 'Unknown'}
          </div>
          {stats.today_entry && (
            <div className="today-details">
              <div className="time-detail">
                <span>Login:</span>
                <span>{formatTime(stats.today_entry.login_time)}</span>
              </div>
              <div className="time-detail">
                <span>Logout:</span>
                <span>{formatTime(stats.today_entry.logout_time)}</span>
              </div>
              {stats.today_entry.duration_hours && (
                <div className="time-detail">
                  <span>Duration:</span>
                  <span>{stats.today_entry.duration_hours}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>From Date</label>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>To Date</label>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => handleFilterChange('date_to', e.target.value)}
          />
        </div>
      </div>

      {/* Time Entries Section */}
      <div className="time-entries-section">
        <div className="section-header">
          <h3>Time Entries</h3>
          <div className="section-info">
            <span className="total-count">
              Showing {Math.min((currentPage - 1) * 10 + 1, totalRecords)} - {Math.min(currentPage * 10, totalRecords)} of {totalRecords} entries
            </span>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading time entries...</p>
          </div>
        ) : timeEntries.length > 0 ? (
          <>
            <div className="entries-table">
              {timeEntries.map((entry) => (
                <div key={entry.id} className="entry-row">
                  <div className="entry-date">
                    <div className="date">{formatDate(entry.date)}</div>
                  </div>
                  <div className="entry-times">
                    <div className="time-in">
                      <span className="label">In:</span>
                      <span className="time">{formatTime(entry.login_time)}</span>
                    </div>
                    <div className="time-out">
                      <span className="label">Out:</span>
                      <span className="time">{formatTime(entry.logout_time)}</span>
                    </div>
                  </div>
                  <div className="entry-duration">
                    <div className="duration">{entry.duration_hours || '--'}</div>
                  </div>
                  <div className="entry-status">
                    <div className={`status ${entry.logout_time ? 'completed' : 'active'}`}>
                      {entry.logout_time ? 'Completed' : 'Active'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
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
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Next »
                </button>

                <div className="pagination-info">
                  Page {currentPage} of {totalPages} ({totalRecords} total entries)
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">⏰</div>
            <h3>No Time Entries Found</h3>
            <p>
              {filters.date_from || filters.date_to 
                ? "No time entries found for the selected date range."
                : "You haven't logged any time entries yet."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeTracking;
