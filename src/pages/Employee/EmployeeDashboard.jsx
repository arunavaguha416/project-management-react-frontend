import React, { useState, useEffect, useContext, useCallback } from "react";
import axiosInstance from "../../services/axiosinstance";
import { AuthContext } from '../../context/auth-context';
import { useNavigate } from "react-router-dom";
import AIAssistant from '../../components/ai/AIAssistant';
import "../../assets/css/Dashboard.css";
import '../../assets/css/ai/ai-components.css';

const EmployeeDashboard = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  // Existing state
  const [projects, setProjects] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(0);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [attendance, setAttendance] = useState({ present_days: 0, total_days: 0, percentage: 0 });
  const [tasks, setTasks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // AI-related state
  const [aiSuggestions, setAiSuggestions] = useState({
    productivity: 88,
    taskOptimization: 5,
    learningPaths: 3,
    workloadBalance: 'good'
  });
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  // Form state
  const [leaveForm, setLeaveForm] = useState({ start_date: "", end_date: "", reason: "" });
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveStatus, setLeaveStatus] = useState(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const getStatusColor = (status) => {
    const colors = {
      'Ongoing': '#4caf50',
      'Active': '#4caf50',
      'Completed': '#2196f3',
      'On Hold': '#ff9800',
      'Cancelled': '#f44336',
      'PENDING': '#ff9800',
      'APPROVED': '#4caf50',
      'REJECTED': '#f44336',
      'TODO': '#757575',
      'IN_PROGRESS': '#2196f3',
      'DONE': '#4caf50'
    };
    return colors[status] || '#757575';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'HIGH': '#f44336',
      'MEDIUM': '#ff9800',
      'LOW': '#4caf50'
    };
    return colors[priority] || '#757575';
  };

  // Fetch AI suggestions
  const fetchAISuggestions = useCallback(async () => {
    setAiLoading(true);
    try {
      const res = await axiosInstance.get(
        '/api/ai/employee-insights/',
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (res.data.status) {
        setAiSuggestions(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
      // Mock data for demo
      setAiSuggestions({
        productivity: 88,
        taskOptimization: 5,
        learningPaths: 3,
        workloadBalance: 'good'
      });
    }
    setAiLoading(false);
  }, [user]);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        projectRes,
        leaveRes,
        attendanceRes,
        tasksRes,
        recentLeavesRes,
        announcementsRes
      ] = await Promise.all([
        // Projects
        axiosInstance.post(
          '/hr-management/employees/project/list/',
          { page_size: 5, search: '' },
          { headers: { Authorization: `Bearer ${user.token}` } }
        ),
        // Leave balance
        axiosInstance.post(
          '/hr-management/employee/leave-balance/',
          {},
          { headers: { Authorization: `Bearer ${user.token}` } }
        ),
        // Attendance
        axiosInstance.post(
          '/hr-management/employee/attendance/summary/',
          {},
          { headers: { Authorization: `Bearer ${user.token}` } }
        ),
        // Tasks
        axiosInstance.post(
          '/hr-management/employee/tasks/list/',
          { page_size: 5 },
          { headers: { Authorization: `Bearer ${user.token}` } }
        ),
        // Recent leaves
        axiosInstance.post(
          '/hr-management/employee/leave-requests/list/',
          { page_size: 3 },
          { headers: { Authorization: `Bearer ${user.token}` } }
        ),
        // Announcements
        axiosInstance.post(
          '/hr-management/announcements/list/',
          { page_size: 3 },
          { headers: { Authorization: `Bearer ${user.token}` } }
        )
      ]);

      // Set projects
      if (projectRes.data.status) {
        setProjects(projectRes.data.projects || []);
      }

      // Set leave balance
      if (leaveRes.data.status) {
        setLeaveBalance(leaveRes.data.leave_balance?.balance || 0);
      }

      // Set attendance
      if (attendanceRes.data.status) {
        setAttendance(attendanceRes.data);
      }

      // Set tasks
      if (tasksRes.data.status) {
        setTasks(tasksRes.data.records || []);
      }

      // Set recent leaves
      if (recentLeavesRes.data.status) {
        setRecentLeaves(recentLeavesRes.data.records || []);
      }

      // Set announcements
      if (announcementsRes.data.status) {
        setAnnouncements(announcementsRes.data.records || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading || !user) return;
    fetchDashboardData();
    fetchAISuggestions();
  }, [authLoading, user, fetchDashboardData, fetchAISuggestions]);

  // Handle leave form
  const handleLeaveChange = (e) => {
    setLeaveForm({ ...leaveForm, [e.target.name]: e.target.value });
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setSubmittingLeave(true);
    try {
      const res = await axiosInstance.post(
        "/employee-dashboard/apply-leave/",
        leaveForm,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (res.data.success) {
        setLeaveStatus({ type: 'success', message: 'Leave request submitted successfully!' });
        setLeaveForm({ start_date: "", end_date: "", reason: "" });
        setShowLeaveForm(false);
        fetchDashboardData(); // Refresh data
      } else {
        setLeaveStatus({ 
          type: 'error', 
          message: "Failed to submit: " + (res.data.errors ? Object.values(res.data.errors).join("; ") : "")
        });
      }
    } catch {
      setLeaveStatus({ type: 'error', message: "Error submitting leave request." });
    } finally {
      setSubmittingLeave(false);
      setTimeout(() => setLeaveStatus(null), 5000);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const completedTasks = tasks.filter(task => task.status === 'DONE').length;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="welcome-section">
            <h1 className="dashboard-title">Welcome back, {user.name}!</h1>
            <p className="dashboard-subtitle">Here's your personalized workspace with AI insights.</p>
          </div>
          <div className="header-actions">
            <button 
              className={`action-btn ${showAIAssistant ? 'primary' : 'secondary'}`}
              onClick={() => setShowAIAssistant(!showAIAssistant)}
            >
              <span className="btn-icon">🤖</span>
              AI Assistant
            </button>
            <button 
              className="action-btn primary"
              onClick={() => setShowLeaveForm(true)}
            >
              <span className="btn-icon">📅</span>
              Apply Leave
            </button>
          </div>
        </div>
      </div>

      {/* Leave Status Message */}
      {leaveStatus && (
        <div className={`status-message ${leaveStatus.type}`}>
          <span>{leaveStatus.message}</span>
          <button 
            className="status-close"
            onClick={() => setLeaveStatus(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Enhanced Stats Grid with AI */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">📁</div>
          <div className="stat-content">
            <h3>{isLoading ? '...' : projects.length}</h3>
            <p>My Projects</p>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{isLoading ? '...' : leaveBalance}</h3>
            <p>Leave Days Left</p>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{isLoading ? '...' : attendance.percentage}%</h3>
            <p>Attendance Rate</p>
          </div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{isLoading ? '...' : completedTasks}</h3>
            <p>Tasks Completed</p>
          </div>
        </div>
        {/* AI Stats */}
        <div className="stat-card ai-stat primary">
          <div className="stat-icon">🤖</div>
          <div className="stat-content">
            <h3>{aiLoading ? '...' : aiSuggestions.productivity}%</h3>
            <p>AI Productivity Score</p>
          </div>
        </div>
        <div className="stat-card ai-stat success">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <h3>{aiLoading ? '...' : aiSuggestions.taskOptimization}</h3>
            <p>Task Optimizations</p>
          </div>
        </div>
      </div>

      {/* AI Assistant Panel */}
      {showAIAssistant && (
        <div className="ai-components-container ai-mb-32">
          <div className="ai-dashboard-grid">
            <div className="ai-dashboard-card full-width">
              <AIAssistant />
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Projects Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>My Projects</h2>
            <button 
              className="view-all-btn"
              onClick={() => navigate('/projects')}
            >
              View All
            </button>
          </div>
          <div className="card-content">
            {isLoading ? (
              <div className="loading-state">
                <div className="loading-spinner small"></div>
                <p>Loading projects...</p>
              </div>
            ) : projects.length > 0 ? (
              <div className="projects-list">
                {projects.slice(0, 5).map((project, index) => (
                  <div key={index} className="project-item">
                    <div className="project-info">
                      <h4 className="project-name">{project.name}</h4>
                      <div className="project-meta">
                        <span 
                          className="project-status"
                          style={{ color: getStatusColor(project.status) }}
                        >
                          {project.status}
                        </span>
                        <div className="project-progress">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${project.progress || 0}%` }}
                            ></div>
                          </div>
                          <span className="progress-text">{project.progress || 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📁</div>
                <h4>No projects assigned</h4>
                <p>Projects will appear here when assigned to you</p>
              </div>
            )}
          </div>
        </div>

        {/* Tasks Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Recent Tasks</h2>
            <span className="task-count">{tasks.length}</span>
          </div>
          <div className="card-content">
            {isLoading ? (
              <div className="loading-state">
                <div className="loading-spinner small"></div>
                <p>Loading tasks...</p>
              </div>
            ) : tasks.length > 0 ? (
              <div className="tasks-list">
                {tasks.slice(0, 5).map((task, index) => (
                  <div key={index} className="task-item">
                    <div className="task-info">
                      <h4 className="task-title">{task.title}</h4>
                      <p className="task-project">{task.project_name}</p>
                    </div>
                    <div className="task-meta">
                      <span 
                        className="task-priority"
                        style={{ backgroundColor: getPriorityColor(task.priority) }}
                      >
                        {task.priority}
                      </span>
                      <span 
                        className="task-status"
                        style={{ backgroundColor: getStatusColor(task.status) }}
                      >
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <h4>No tasks assigned</h4>
                <p>Tasks will appear here when assigned to you</p>
              </div>
            )}
          </div>
        </div>

        {/* Leave History Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Leave History</h2>
            <span className="leave-balance">Balance: {leaveBalance} days</span>
          </div>
          <div className="card-content">
            {isLoading ? (
              <div className="loading-state">
                <div className="loading-spinner small"></div>
                <p>Loading leave history...</p>
              </div>
            ) : recentLeaves.length > 0 ? (
              <div className="leaves-list">
                {recentLeaves.map((leave, index) => (
                  <div key={index} className="leave-item">
                    <div className="leave-dates">
                      <div className="date-range">
                        <span>{leave.start_date}</span>
                        <span className="date-separator">→</span>
                        <span>{leave.end_date}</span>
                      </div>
                      <span className="leave-duration">{leave.days} days</span>
                    </div>
                    <div className="leave-info">
                      <p className="leave-reason">{leave.reason}</p>
                    </div>
                    <div className="leave-status" style={{ color: getStatusColor(leave.status) }}>
                      {leave.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h4>No leave history</h4>
                <p>Your leave history will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Announcements Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Announcements</h2>
            <span className="announcement-count">{announcements.length}</span>
          </div>
          <div className="card-content">
            {isLoading ? (
              <div className="loading-state">
                <div className="loading-spinner small"></div>
                <p>Loading announcements...</p>
              </div>
            ) : announcements.length > 0 ? (
              <div className="announcements-list">
                {announcements.map((announcement, index) => (
                  <div key={index} className="announcement-item">
                    <div className="announcement-header">
                      <h4 className="announcement-title">{announcement.title}</h4>
                      <span className="announcement-date">{announcement.date}</span>
                    </div>
                    <p className="announcement-content">{announcement.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📢</div>
                <h4>No announcements</h4>
                <p>Company announcements will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leave Application Modal */}
      {showLeaveForm && (
        <div className="modal-overlay">
          <div className="modal-content leave-modal">
            <div className="modal-header">
              <h3>Apply for Leave</h3>
              <button 
                className="modal-close"
                onClick={() => setShowLeaveForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleLeaveSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="start_date">Start Date</label>
                    <input
                      type="date"
                      id="start_date"
                      name="start_date"
                      className="form-input"
                      value={leaveForm.start_date}
                      onChange={handleLeaveChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="end_date">End Date</label>
                    <input
                      type="date"
                      id="end_date"
                      name="end_date"
                      className="form-input"
                      value={leaveForm.end_date}
                      onChange={handleLeaveChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="reason">Reason</label>
                  <textarea
                    id="reason"
                    name="reason"
                    className="form-textarea"
                    value={leaveForm.reason}
                    onChange={handleLeaveChange}
                    placeholder="Please provide a reason for your leave..."
                    required
                  />
                </div>
                <div className="leave-info">
                  <p>Available leave balance: <strong>{leaveBalance} days</strong></p>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button"
                  className="btn secondary"
                  onClick={() => setShowLeaveForm(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn primary"
                  disabled={submittingLeave}
                >
                  {submittingLeave ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
