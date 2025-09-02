import React, { useState, useEffect, useContext, useCallback } from "react";
import axiosInstance from "../../services/axiosinstance";
import { AuthContext } from "../../context/auth-context";
import { useNavigate } from "react-router-dom";
import AIAssistant from '../../components/ai/AIAssistant';
import "../../assets/css/Dashboard.css";
import '../../assets/css/ai/ai-chatbox.css';

const PAGE_SIZE = 5;

const HrDashboard = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

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
  const [birthdays, setBirthdays] = useState([]);
  const [showAIChat, setShowAIChat] = useState(true);

  const [statsLoading, setStatsLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [leaveLoading, setLeaveLoading] = useState(true);
  const [assignModal, setAssignModal] = useState({ isOpen: false, projectId: null, selectedManager: "" });

  // Utility functions
  const getInitials = (name) =>
    name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "U";
  const getStatusColor = (status) => {
    const colors = {
      'Ongoing': '#36b37e', 'Active': '#36b37e', 'Completed': '#2196f3',
      'On Hold': '#ffab00', 'Cancelled': '#ff5630', 'PENDING': '#ffab00',
      'APPROVED': '#36b37e', 'REJECTED': '#ff5630'
    };
    return colors[status] || '#A5ADBA';
  };

  // Data fetching
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [projectRes, employeeRes, leaveRes, , birthdayRes] = await Promise.all([
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
        setStats(prev => ({ ...prev, totalEmployees: employeeRes.data.count || 0 }));
      }
      if (leaveRes.data.status) {
        const leaves = leaveRes.data.records || [];
        setStats(prev => ({
          ...prev,
          pendingLeaves: leaves.filter(l => l.status === 'PENDING').length
        }));
      }
      if (birthdayRes.data.status) {
        setBirthdays(birthdayRes.data.records || []);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
    setStatsLoading(false);
  }, []);

  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const response = await axiosInstance.post("/projects/list/", { page_size: PAGE_SIZE, page: 1, search: "" });
      if (response.data.status) setProjects(response.data.records || []);
    } catch (error) { console.log('error', error); }
    setProjectsLoading(false);
  }, []);

  const fetchEmployees = useCallback(async () => {
    setEmployeesLoading(true);
    try {
      const response = await axiosInstance.post("/hr-management/employees/list/", { page_size: PAGE_SIZE, page: 1 });
      if (response.data.status) setEmployees(response.data.records || []);
    } catch (error) { console.log('error', error); }
    setEmployeesLoading(false);
  }, []);

  const fetchLeaveRequests = useCallback(async () => {
    setLeaveLoading(true);
    try {
      const response = await axiosInstance.post("/hr-management/employees/leave-requests/list/", { page_size: PAGE_SIZE, status: 'PENDING' });
      if (response.data.status) setLeaveRequests(response.data.records || []);
    } catch (error) { console.log('error', error); }
    setLeaveLoading(false);
  }, []);

  const fetchManagers = useCallback(async () => {
    if (user.role === 'HR') {
      try {
        const response = await axiosInstance.post("/hr-management/manager/list/", { role: "MANAGER" });
        if (response.data.status) setManagers(response.data.records || []);
      } catch (error) { console.log('error', error); }
    }
  }, [user.role]);

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
    } catch (error) { console.log('error', error); }
  };

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
      {/* Header with AI Assistant Toggle Button */}
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 className="dashboard-title">HR Dashboard</h1>
          <p className="dashboard-subtitle">
            Welcome back, {user?.full_name || user?.name || 'User'}!
          </p>
        </div>
        <button
          className={`action-btn ${showAIChat ? 'secondary' : 'primary'}`}
          onClick={() => setShowAIChat(prev => !prev)}
        >
          <span role="img" aria-label="ai">🤖</span>
          {showAIChat ? 'Hide AI Assistant' : 'Show AI Assistant'}
        </button>
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
        <div className="stat-card info">
          <div className="stat-icon">🚀</div>
          <div className="stat-content">
            <h3>{statsLoading ? '...' : stats.activeProjects}</h3>
            <p>Active Projects</p>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{statsLoading ? '...' : stats.totalEmployees}</h3>
            <p>Total Employees</p>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">🕑</div>
          <div className="stat-content">
            <h3>{statsLoading ? '...' : stats.pendingLeaves}</h3>
            <p>Pending Leaves</p>
          </div>
        </div>
      </div>

      {/* Birthdays */}
      <div className="info-row">
        <div className="info-card">
          <div className="card-header">
            <h3>🎉 Today's Birthdays</h3>
          </div>
          <div className="birthday-list">
            {birthdays.length === 0
              ? <div className="no-birthdays">No birthdays today</div>
              : birthdays.map((b, i) => (
                <div className="birthday-item" key={i}>
                  <div className="birthday-avatar">{getInitials(b.user?.full_name)}</div>
                  <div>
                    <div className="birthday-name">{b.user?.full_name}</div>
                    <div className="birthday-role">{b.user?.role}</div>
                  </div>
                  <div className="birthday-icon">🎂</div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Recent Projects */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>📊 Recent Projects</h3>
            <button className="view-all-btn" onClick={() => navigate('/projects')}>View All</button>
          </div>
          <div className="card-content">
            {projectsLoading ? (
              <div className="loading-state">
                <div className="loading-spinner small"></div>
                <p>Loading projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <h4>No Projects</h4>
                <p>Get started by creating your first project.</p>
                <button className="create-btn" onClick={() => navigate('/projects/create')}>Create Project</button>
              </div>
            ) : (
              <div className="projects-list">
                {projects.map(project => (
                  <div className="project-item" key={project.id}>
                    <div className="project-info">
                      <div className="project-name">{project.name}</div>
                      <div className="project-status" style={{ color: getStatusColor(project.status) }}>
                        {project.status}
                      </div>
                      {project.manager &&
                        <div className="manager-info">
                          <span className="manager-avatar">{getInitials(project.manager.name)}</span>
                          {project.manager.name}
                        </div>
                      }
                    </div>
                    <div>
                      {!project.manager && (
                        <button
                          className="assign-btn"
                          onClick={() =>
                            setAssignModal({ isOpen: true, projectId: project.id, selectedManager: "" })
                          }
                        >Assign Manager</button>
                      )}
                      <button className="btn secondary" onClick={() => navigate(`/projects/${project.id}`)}>
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Recent Employees */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>👥 Recent Employees</h3>
            <button className="view-all-btn" onClick={() => navigate('/hr/employees')}>View All</button>
          </div>
          <div className="card-content">
            {employeesLoading ? (
              <div className="loading-state">
                <div className="loading-spinner small"></div>
                <p>Loading employees...</p>
              </div>
            ) : employees.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🧑‍💼</div>
                <h4>No Employees</h4>
                <p>Add your first employee to get started.</p>
                <button className="create-btn" onClick={() => navigate('/hr/employees/create')}>Add Employee</button>
              </div>
            ) : (
              <div className="employees-list">
                {employees.map(employee => (
                  <div className="employee-item" key={employee.id}>
                    <div className="employee-avatar">{getInitials(employee.user?.full_name)}</div>
                    <div className="employee-info">
                      <div className="employee-name">{employee.user?.full_name}</div>
                      <div className="employee-email">{employee.user?.email}</div>
                      <div className="employee-meta">
                        <span className="employee-role">{employee.user?.role}</span>
                        {employee.user?.is_active && <span className="employee-status active">Active</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Pending Leave Requests */}
        <div className="dashboard-card full-width">
          <div className="card-header">
            <h3>📅 Pending Leave Requests</h3>
            <button className="view-all-btn" onClick={() => navigate('/hr/leaves')}>View All</button>
          </div>
          <div className="card-content">
            {leaveLoading ? (
              <div className="loading-state">
                <div className="loading-spinner small"></div>
                <p>Loading leave requests...</p>
              </div>
            ) : leaveRequests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">⏳</div>
                <h4>No Pending Requests</h4>
                <p>New requests will appear here.</p>
              </div>
            ) : (
              <div className="leaves-list">
                {leaveRequests.map(request => (
                  <div className="leave-item" key={request.id}>
                    <div className="leave-employee">
                      <div className="employee-avatar">{getInitials(request.employee_name || request.employee_email)}</div>
                      <div className="employee-details">
                        <h4>{request.employee_email || 'N/A'}</h4>
                        <p>{request.employee_name || 'Employee'}</p>
                      </div>
                    </div>
                    <div className="leave-reason">
                      <p>{request.reason || 'No reason provided'}</p>
                    </div>
                    <div className="leave-actions">
                      <button className="approve-btn" onClick={() => console.log('Approve', request.id)}>
                        Approve
                      </button>
                      <button className="reject-btn" onClick={() => console.log('Reject', request.id)}>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* AI Assistant */}
      {showAIChat && (
        <div className="ai-assistant-container">
          <AIAssistant onClose={() => setShowAIChat(false)} user={user} />
        </div>
      )}

      {/* Assign Manager Modal */}
      {assignModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Assign Manager</h3>
              <button
                className="modal-close"
                onClick={() => setAssignModal({ isOpen: false, projectId: null, selectedManager: "" })}
              >×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Select Manager</label>
                <select
                  value={assignModal.selectedManager}
                  onChange={e => setAssignModal(prev => ({ ...prev, selectedManager: e.target.value }))}
                  className="form-input"
                >
                  <option value="">Choose a manager...</option>
                  {managers.map(manager => (
                    <option key={manager.id} value={manager.id}>{manager.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn secondary"
                onClick={() => setAssignModal({ isOpen: false, projectId: null, selectedManager: "" })}
              >Cancel</button>
              <button
                className="btn primary"
                onClick={handleAssignProject}
                disabled={!assignModal.selectedManager}
              >Assign Manager</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default HrDashboard;
