import React, { useState, useEffect, useContext, useCallback } from "react";
import axiosInstance from "../../services/axiosinstance";
import { AuthContext } from "../../context/auth-context";
import { useNavigate } from "react-router-dom";
import SmartResourceAllocation from '../../components/ai/SmartResourceAllocation';
import AIAssistant from '../../components/ai/AIAssistant';
import "../../assets/css/Dashboard.css";
import '../../assets/css/ai/ai-components.css';

const PAGE_SIZE = 5;

const HrDashboard = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  // Existing state
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalEmployees: 0,
    pendingLeaves: 0
  });
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [attendance, setAttendance] = useState({ present: 0, absent: 0, total: 0 });
  const [birthdays, setBirthdays] = useState([]);

  // AI-related state
  const [aiMetrics, setAiMetrics] = useState({
    hrEfficiency: 92,
    automatedTasks: 15,
    predictiveInsights: 8,
    riskAlerts: 3
  });
  const [showAITools, setShowAITools] = useState(false);

  // Loading states
  const [statsLoading, setStatsLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [leaveLoading, setLeaveLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  // Modal state
  const [assignModal, setAssignModal] = useState({
    isOpen: false,
    projectId: null,
    selectedManager: ""
  });

  // Utility functions (same as before)
  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n.charAt(0)).join("").toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Ongoing': '#4caf50',
      'Active': '#4caf50',
      'Completed': '#2196f3',
      'On Hold': '#ff9800',
      'Cancelled': '#f44336',
      'PENDING': '#ff9800',
      'APPROVED': '#4caf50',
      'REJECTED': '#f44336'
    };
    return colors[status] || '#757575';
  };

  // Fetch functions (existing + AI)
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [projectRes, employeeRes, leaveRes, attendanceRes, birthdayRes] = await Promise.all([
        axiosInstance.post("/projects/list/", { page_size: 1000, page: 1, search: "" }),
        axiosInstance.post("/hr-management/employees/list/", { page_size: 1000, page: 1 }),
        axiosInstance.post("/hr-management/employees/leave-requests/list/", { page_size: 1000 }),
        axiosInstance.post("/hr-management/attendance/summary/", {}),
        axiosInstance.post("/hr-management/employees/birthdays/today/", {})
      ]);

      if (projectRes.data.status) {
        const projects = projectRes.data.records || [];
        setStats(prev => ({
          ...prev,
          totalProjects: projects.length,
          activeProjects: projects.filter(p => p.status === 'Ongoing').length
        }));
      }

      if (employeeRes.data.status) {
        setStats(prev => ({
          ...prev,
          totalEmployees: employeeRes.data.count || 0
        }));
      }

      if (leaveRes.data.status) {
        const leaves = leaveRes.data.records || [];
        setStats(prev => ({
          ...prev,
          pendingLeaves: leaves.filter(l => l.status === 'PENDING').length
        }));
      }

      if (attendanceRes.data.status) {
        setAttendance({
          present: attendanceRes.data.present || 0,
          absent: attendanceRes.data.absent || 0,
          total: attendanceRes.data.total || 0
        });
      }

      if (birthdayRes.data.status) {
        setBirthdays(birthdayRes.data.records || []);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
    setStatsLoading(false);
  }, []);

  // Fetch AI metrics
  const fetchAIMetrics = useCallback(async () => {
    setAiLoading(true);
    try {
      const res = await axiosInstance.get('/api/ai/hr-insights/');
      if (res.data.status) {
        setAiMetrics(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching AI metrics:', error);
      // Mock data for demo
      setAiMetrics({
        hrEfficiency: 92,
        automatedTasks: 15,
        predictiveInsights: 8,
        riskAlerts: 3
      });
    }
    setAiLoading(false);
  }, []);

  // Other fetch functions (same as original)
  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const response = await axiosInstance.post("/projects/list/", { page_size: PAGE_SIZE, page: 1, search: "" });
      if (response.data.status) {
        setProjects(response.data.records || []);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
    setProjectsLoading(false);
  }, []);

  const fetchEmployees = useCallback(async () => {
    setEmployeesLoading(true);
    try {
      const response = await axiosInstance.post("/hr-management/employees/list/", { page_size: PAGE_SIZE, page: 1 });
      if (response.data.status) {
        setEmployees(response.data.records || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
    setEmployeesLoading(false);
  }, []);

  const fetchLeaveRequests = useCallback(async () => {
    setLeaveLoading(true);
    try {
      const response = await axiosInstance.post("/hr-management/employees/leave-requests/list/", { page_size: PAGE_SIZE, status: 'PENDING' });
      if (response.data.status) {
        setLeaveRequests(response.data.records || []);
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    }
    setLeaveLoading(false);
  }, []);

  const fetchManagers = useCallback(async () => {
    if (user.role === 'HR') {
      try {
        const response = await axiosInstance.post("/hr-management/manager/list/", { role: "MANAGER" });
        if (response.data.status) {
          setManagers(response.data.records || []);
        }
      } catch (error) {
        console.error("Error fetching managers:", error);
      }
    }
  }, [user.role]);

  // Handle project assignment
  const handleAssignProject = async () => {
    if (!assignModal.selectedManager || !assignModal.projectId) return;
    try {
      const response = await axiosInstance.post("/projects/assign-manager/", {
        project_id: assignModal.projectId,
        manager_id: assignModal.selectedManager
      });
      if (response.data.status) {
        fetchProjects();
        setAssignModal({ isOpen: false, projectId: null, selectedManager: "" });
      }
    } catch (error) {
      console.error("Error assigning project:", error);
    }
  };

  // Initialize dashboard data
  useEffect(() => {
    if (authLoading || !user) return;
    fetchStats();
    fetchProjects();
    fetchEmployees();
    fetchLeaveRequests();
    fetchManagers();
    fetchAIMetrics();
  }, [authLoading, user, fetchStats, fetchProjects, fetchEmployees, fetchLeaveRequests, fetchManagers, fetchAIMetrics]);

  if (authLoading || !user) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="welcome-section">
            <h1 className="dashboard-title">Welcome back, {user.name}!</h1>
            <p className="dashboard-subtitle">Here's what's happening today with AI insights.</p>
          </div>
          <div className="header-actions">
            <button 
              className={`action-btn ${showAITools ? 'primary' : 'secondary'}`}
              onClick={() => setShowAITools(!showAITools)}
            >
              <span className="btn-icon">🤖</span>
              AI Tools
            </button>
            <button 
              className="action-btn primary"
              onClick={() => navigate('/add-user')}
            >
              <span className="btn-icon">👤</span>
              Add Employee
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid with AI */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">📁</div>
          <div className="stat-content">
            <h3>{statsLoading ? '...' : stats.totalProjects}</h3>
            <p>Total Projects</p>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">🚀</div>
          <div className="stat-content">
            <h3>{statsLoading ? '...' : stats.activeProjects}</h3>
            <p>Active Projects</p>
          </div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{statsLoading ? '...' : stats.totalEmployees}</h3>
            <p>Total Employees</p>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{statsLoading ? '...' : stats.pendingLeaves}</h3>
            <p>Pending Leaves</p>
          </div>
        </div>
        {/* AI Stats */}
        <div className="stat-card ai-stat primary">
          <div className="stat-icon">🤖</div>
          <div className="stat-content">
            <h3>{aiLoading ? '...' : aiMetrics.hrEfficiency}%</h3>
            <p>HR Efficiency</p>
          </div>
        </div>
        <div className="stat-card ai-stat success">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <h3>{aiLoading ? '...' : aiMetrics.automatedTasks}</h3>
            <p>Automated Tasks</p>
          </div>
        </div>
      </div>

      {/* Today's Info Row */}
      <div className="info-row">
        <div className="info-card">
          <div className="card-header">
            <h3>Today's Attendance</h3>
            <span className="attendance-rate">
              {attendance.total > 0 ? Math.round((attendance.present / attendance.total) * 100) : 0}%
            </span>
          </div>
          <div className="attendance-stats">
            <div className="attendance-item present">
              <div className="dot"></div>
              <span>Present: {attendance.present}</span>
            </div>
            <div className="attendance-item absent">
              <div className="dot"></div>
              <span>Absent: {attendance.absent}</span>
            </div>
          </div>
        </div>

        <div className="info-card">
          <div className="card-header">
            <h3>Today's Birthdays</h3>
            <span className="birthday-count">{birthdays.length}</span>
          </div>
          <div className="birthday-list">
            {birthdays.length > 0 ? (
              birthdays.slice(0, 3).map((person, index) => (
                <div key={index} className="birthday-item">
                  <div className="birthday-avatar">
                    {getInitials(person.name)}
                  </div>
                  <span className="birthday-name">{person.name}</span>
                </div>
              ))
            ) : (
              <p className="no-birthdays">No birthdays today</p>
            )}
          </div>
        </div>
      </div>

      {/* AI Tools Panel */}
      {showAITools && (
        <div className="ai-components-container ai-mb-32">
          <div className="ai-dashboard-grid">
            <div className="ai-dashboard-card">
              <SmartResourceAllocation />
            </div>
            <div className="ai-dashboard-card">
              <AIAssistant />
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Grid - Rest of the existing content */}
      <div className="dashboard-grid">
        {/* Projects Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Recent Projects</h2>
            <button 
              className="view-all-btn"
              onClick={() => navigate('/project-list')}
            >
              View All
            </button>
          </div>
          <div className="card-content">
            {projectsLoading ? (
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
                        <div className="manager-info">
                          <div className="manager-avatar">
                            {getInitials(project.manager_name || 'Unassigned')}
                          </div>
                          <span>{project.manager_name || 'Unassigned'}</span>
                        </div>
                        <span 
                          className="project-status"
                          style={{ color: getStatusColor(project.status) }}
                        >
                          {project.status}
                        </span>
                      </div>
                    </div>
                    {!project.manager_name && (
                      <button 
                        className="assign-btn"
                        onClick={() => setAssignModal({
                          isOpen: true,
                          projectId: project.id,
                          selectedManager: ""
                        })}
                      >
                        Assign
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📁</div>
                <h4>No projects yet</h4>
                <p>Get started by creating your first project</p>
                <button 
                  className="create-btn"
                  onClick={() => navigate('/add-project')}
                >
                  Create Project
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Employees Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Recent Employees</h2>
            <button 
              className="view-all-btn"
              onClick={() => navigate('/employee-list')}
            >
              View All
            </button>
          </div>
          <div className="card-content">
            {employeesLoading ? (
              <div className="loading-state">
                <div className="loading-spinner small"></div>
                <p>Loading employees...</p>
              </div>
            ) : employees.length > 0 ? (
              <div className="employees-list">
                {employees.slice(0, 5).map((employee, index) => (
                  <div key={index} className="employee-item">
                    <div className="employee-avatar">
                      {getInitials(employee.user?.first_name + ' ' + employee.user?.last_name)}
                    </div>
                    <div className="employee-info">
                      <h4 className="employee-name">
                        {employee.user?.first_name} {employee.user?.last_name}
                      </h4>
                      <p className="employee-email">{employee.user?.email}</p>
                      <div className="employee-meta">
                        <span className="employee-role">{employee.role}</span>
                        <span className="employee-status active">Active</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h4>No employees yet</h4>
                <p>Add your first employee to get started</p>
                <button 
                  className="create-btn"
                  onClick={() => navigate('/add-user')}
                >
                  Add Employee
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Leave Requests Card */}
        <div className="dashboard-card full-width">
          <div className="card-header">
            <h2>Pending Leave Requests</h2>
            <span className="pending-count">{leaveRequests.length}</span>
          </div>
          <div className="card-content">
            {leaveLoading ? (
              <div className="loading-state">
                <div className="loading-spinner small"></div>
                <p>Loading leave requests...</p>
              </div>
            ) : leaveRequests.length > 0 ? (
              <div className="leaves-list">
                {leaveRequests.map((request, index) => (
                  <div key={index} className="leave-item compact">
                    <div className="leave-employee">
                      <div className="employee-avatar">
                        {getInitials(request.employee_name)}
                      </div>
                      <div className="employee-details">
                        <h4>{request.employee_name}</h4>
                        <p>{request.employee_email || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="leave-dates">
                      <div className="date-range">
                        <span>{request.start_date}</span>
                        <span className="date-arrow">→</span>
                        <span>{request.end_date}</span>
                      </div>
                      <span className="leave-days">{request.days} days</span>
                    </div>
                    <div className="leave-reason">
                      <p>{request.reason || 'No reason provided'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <h4>All caught up!</h4>
                <p>New requests will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {assignModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Assign Project Manager</h3>
              <button 
                className="modal-close"
                onClick={() => setAssignModal({ isOpen: false, projectId: null, selectedManager: "" })}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Select Manager</label>
                <select 
                  className="form-select"
                  value={assignModal.selectedManager}
                  onChange={(e) => setAssignModal({
                    ...assignModal,
                    selectedManager: e.target.value
                  })}
                >
                  <option value="">Choose a manager...</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.user?.first_name} {manager.user?.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn secondary"
                onClick={() => setAssignModal({ isOpen: false, projectId: null, selectedManager: "" })}
              >
                Cancel
              </button>
              <button 
                className="btn primary"
                onClick={handleAssignProject}
                disabled={!assignModal.selectedManager}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HrDashboard;
