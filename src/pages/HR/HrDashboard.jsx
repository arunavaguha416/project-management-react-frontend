import React, { useState, useEffect, useContext, useCallback } from "react";
import axiosInstance from "../../services/axiosinstance";
import { AuthContext } from "../../context/auth-context";
import { useNavigate } from "react-router-dom";
import "../../assets/css/Dashboard.css";

const PAGE_SIZE = 5;

const HrDashboard = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  // State management
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
  const [attendance, setAttendance] = useState({
    present: 0,
    absent: 0,
    total: 0
  });
  const [birthdays, setBirthdays] = useState([]);

  // Loading states
  const [statsLoading, setStatsLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [leaveLoading, setLeaveLoading] = useState(true);

  // Modal state
  const [assignModal, setAssignModal] = useState({
    isOpen: false,
    projectId: null,
    selectedManager: ""
  });

  // Utility functions
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

  // Fetch dashboard stats
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

  // Fetch functions
  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const response = await axiosInstance.post("/projects/list/", {
        page_size: PAGE_SIZE,
        page: 1,
        search: ""
      });
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
      const response = await axiosInstance.post("/hr-management/employees/list/", {
        page_size: PAGE_SIZE,
        page: 1
      });
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
      const response = await axiosInstance.post("/hr-management/employees/leave-requests/list/", {
        page_size: PAGE_SIZE,
        status: 'PENDING'
      });
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
        const response = await axiosInstance.post("/hr-management/manager/list/", {
          role: "MANAGER"
        });
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
  }, [authLoading, user, fetchStats, fetchProjects, fetchEmployees, fetchLeaveRequests, fetchManagers]);

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
            <h1 className="dashboard-title">HR Dashboard</h1>
            <p className="dashboard-subtitle">Welcome back, {user.name}! Here's what's happening today.</p>
          </div>
          <div className="header-actions">
            <button 
              className="action-btn primary"
              onClick={() => navigate('/add-project')}
            >
              <span className="btn-icon">➕</span>
              Add Project
            </button>
            <button 
              className="action-btn secondary"
              onClick={() => navigate('/add-user')}
            >
              <span className="btn-icon">👤</span>
              Add Employee
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{statsLoading ? '...' : stats.totalProjects}</h3>
            <p>Total Projects</p>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">🎯</div>
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
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{statsLoading ? '...' : stats.pendingLeaves}</h3>
            <p>Pending Leaves</p>
          </div>
        </div>
      </div>

      {/* Attendance & Birthdays Row */}
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
              <span className="dot"></span>
              <span>Present: {attendance.present}</span>
            </div>
            <div className="attendance-item absent">
              <span className="dot"></span>
              <span>Absent: {attendance.absent}</span>
            </div>
          </div>
        </div>

        <div className="info-card">
          <div className="card-header">
            <h3>🎂 Today's Birthdays</h3>
            <span className="birthday-count">{birthdays.length}</span>
          </div>
          <div className="birthday-list">
            {birthdays.length > 0 ? (
              birthdays.slice(0, 3).map((person, index) => (
                <div key={index} className="birthday-item">
                  <div className="birthday-avatar">{getInitials(person.name)}</div>
                  <span className="birthday-name">{person.name}</span>
                </div>
              ))
            ) : (
              <p className="no-birthdays">No birthdays today</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Recent Projects */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Recent Projects</h3>
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
                {projects.map((project) => (
                  <div key={project.id} className="project-item">
                    <div className="project-info">
                      <h4 className="project-name">{project.name}</h4>
                      <div className="project-meta">
                        <div className="manager-info">
                          <div className="manager-avatar">
                            {getInitials(project.manager?.name || 'U')}
                          </div>
                          <span>{project.manager?.name || "Unassigned"}</span>
                        </div>
                        <div 
                          className="project-status"
                          style={{ color: getStatusColor(project.status) }}
                        >
                          {project.status}
                        </div>
                      </div>
                    </div>
                    {!project.manager && (
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
                <div className="empty-icon">📂</div>
                <h4>No projects found</h4>
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

        {/* Recent Employees */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Recent Employees</h3>
            <button 
              className="view-all-btn"
              onClick={() => navigate('/employees')}
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
                {employees.map((employee) => (
                  <div key={employee.id} className="employee-item">
                    <div className="employee-avatar">
                      {getInitials(employee.user?.name || employee.name)}
                    </div>
                    <div className="employee-info">
                      <h4 className="employee-name">
                        {employee.user?.name || employee.name}
                      </h4>
                      <p className="employee-email">
                        {employee.user?.email}
                      </p>
                      <div className="employee-meta">
                        <span className="employee-role">
                          {employee.user?.role || employee.role}
                        </span>
                        <span className="employee-status active">Active</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h4>No employees found</h4>
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

        {/* Pending Leave Requests */}
        <div className="dashboard-card full-width">
          <div className="card-header">
            <h3>Pending Leave Requests</h3>
            <button 
              className="view-all-btn"
              onClick={() => navigate('/leave-requests')}
            >
              View All
            </button>
          </div>
          <div className="card-content">
            {leaveLoading ? (
              <div className="loading-state">
                <div className="loading-spinner small"></div>
                <p>Loading leave requests...</p>
              </div>
            ) : leaveRequests.length > 0 ? (
              <div className="leaves-table">
                {leaveRequests.map((request) => (
                  <div key={request.id} className="leave-item">
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
                        <span className="from-date">{request.start_date}</span>
                        <span className="date-arrow">→</span>
                        <span className="to-date">{request.end_date}</span>
                      </div>
                      <span className="leave-days">{request.total_days} days</span>
                    </div>
                    <div className="leave-reason">
                      <p>{request.reason || 'No reason provided'}</p>
                    </div>
                    <div className="leave-actions">
                      <button className="approve-btn">✓ Approve</button>
                      <button className="reject-btn">✗ Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h4>No pending leave requests</h4>
                <p>All caught up! New requests will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {assignModal.isOpen && (
        <div className="modal-overlay" onClick={() => setAssignModal({ ...assignModal, isOpen: false })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Project Manager</h3>
              <button 
                className="modal-close"
                onClick={() => setAssignModal({ ...assignModal, isOpen: false })}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <select
                value={assignModal.selectedManager}
                onChange={(e) => setAssignModal({ ...assignModal, selectedManager: e.target.value })}
                className="manager-select"
              >
                <option value="">Select Manager</option>
                {managers.map(manager => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-footer">
              <button 
                className="btn secondary"
                onClick={() => setAssignModal({ ...assignModal, isOpen: false })}
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
