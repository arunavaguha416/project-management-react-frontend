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
  
  const [aiMetrics, setAiMetrics] = useState({
    hrEfficiency: 92,
    automatedTasks: 15,
    predictiveInsights: 8,
    riskAlerts: 3
  });
  const [showAITools, setShowAITools] = useState(false);
  // AI Chat visibility state
  const [showAIChat, setShowAIChat] = useState(true);

  // Loading states
  const [statsLoading, setStatsLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [leaveLoading, setLeaveLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  
  const [assignModal, setAssignModal] = useState({
    isOpen: false,
    projectId: null,
    selectedManager: ""
  });

  // All your existing functions remain the same...
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

  // All your existing fetch functions remain the same...
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

  const fetchAIMetrics = useCallback(async () => {
    setAiLoading(true);
    try {
      const res = await axiosInstance.get('/ai/hr-insights/');
      if (res.data.status) {
        setAiMetrics(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching AI metrics:', error);
      setAiMetrics({
        hrEfficiency: 92,
        automatedTasks: 15,
        predictiveInsights: 8,
        riskAlerts: 3
      });
    }
    setAiLoading(false);
  }, []);

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

  const handleAssignProject = async () => {
    if (!assignModal.selectedManager || !assignModal.projectId) return;

    try {
      const response = await axiosInstance.post("/projects/assign-manager/", {
        project_id: assignModal.projectId,
        manager_id: assignModal.selectedManager
      });

      if (response.data.status) {
        fetchProjects();
        setAssignModal({
          isOpen: false,
          projectId: null,
          selectedManager: ""
        });
      }
    } catch (error) {
      console.error("Error assigning project:", error);
    }
  };

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
      <div className="dashboard-container">
        <div className="ai-loading-state">
          <div className="ai-loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Dashboard Content */}
      <div className="dashboard-container">
        {/* Dashboard Title */}
        <div className="dashboard-title">
          HR Dashboard
          <small style={{ 
            fontSize: '16px', 
            fontWeight: 'normal', 
            color: 'var(--jira-muted-text)', 
            marginLeft: '16px' 
          }}>
            Here's what's happening today with AI insights.
          </small>
        </div>

        {/* AI Controls Section */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem', 
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: 'var(--jira-table-header)',
          borderRadius: '8px',
          border: '1px solid var(--jira-divider)'
        }}>
          {/* AI Tools Toggle Button */}
          <button 
            onClick={() => setShowAITools(!showAITools)}
            className={showAITools ? "btn-reject" : "btn-approve"}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {showAITools ? '🔧 Hide AI Tools' : '🚀 Show AI Tools'}
          </button>

          {/* AI Chat Toggle Button */}
          <button 
            onClick={() => setShowAIChat(!showAIChat)}
            className={showAIChat ? "btn-reject" : "btn-approve"}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {showAIChat ? '💬 Hide AI Chat' : '💬 Show AI Chat'}
          </button>
          
          {/* Status Indicators */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}>
            {showAITools && (
              <div style={{ color: 'var(--jira-success)' }}>
                <span>✅ AI Tools Active</span>
                <span style={{ marginLeft: '8px' }}>HR Efficiency: {aiMetrics.hrEfficiency}%</span>
                <span style={{ marginLeft: '8px' }}>Tasks: {aiMetrics.automatedTasks}</span>
              </div>
            )}

            {showAIChat && (
              <div style={{ color: 'var(--jira-primary)' }}>
                💬 AI Assistant Ready
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="metrics-row">
          <div className="metric-card">
            <h3>{statsLoading ? '...' : stats.totalProjects}</h3>
            <p>Total Projects</p>
          </div>
          <div className="metric-card">
            <h3>{statsLoading ? '...' : stats.activeProjects}</h3>
            <p>Active Projects</p>
          </div>
          <div className="metric-card">
            <h3>{statsLoading ? '...' : stats.totalEmployees}</h3>
            <p>Total Employees</p>
          </div>
          <div className="metric-card">
            <h3>{statsLoading ? '...' : stats.pendingLeaves}</h3>
            <p>Pending Leaves</p>
          </div>
        </div>

        {/* AI Metrics Row */}
        <div className="metrics-row">
          <div className="metric-card" style={{ borderLeftColor: '#4CAF50' }}>
            <h3>{aiLoading ? '...' : aiMetrics.hrEfficiency}%</h3>
            <p>HR Efficiency</p>
          </div>
          <div className="metric-card" style={{ borderLeftColor: '#2196F3' }}>
            <h3>{aiLoading ? '...' : aiMetrics.automatedTasks}</h3>
            <p>Automated Tasks</p>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          {/* AI Tools Section - Conditionally Rendered */}
          {showAITools && (
            <div className="dashboard-section" style={{ gridColumn: 'span 2' }}>
              <div className="section-header">
                <h2>🤖 Smart Resource Allocation</h2>
                <span className="ai-badge success">AI Powered</span>
              </div>
              <SmartResourceAllocation />
            </div>
          )}

          {/* Today's Attendance */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Today's Attendance</h2>
              <span>{attendance.total > 0 ? Math.round((attendance.present / attendance.total) * 100) : 0}%</span>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ color: '#4caf50' }}>● Present: {attendance.present}</span>
              </div>
              <div>
                <span style={{ color: '#f44336' }}>● Absent: {attendance.absent}</span>
              </div>
            </div>
          </div>

          {/* Today's Birthdays */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Today's Birthdays</h2>
              <span>{birthdays.length}</span>
            </div>
            <div style={{ padding: '20px 24px' }}>
              {birthdays.length > 0 ? (
                birthdays.map((birthday, index) => (
                  <div key={index} style={{ marginBottom: '8px' }}>
                    🎂 {birthday.name}
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--jira-muted-text)', margin: 0 }}>No birthdays today</p>
              )}
            </div>
          </div>

          {/* Recent Projects */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Recent Projects</h2>
              <button onClick={() => navigate('/projects')}>View All</button>
            </div>
            <div className="table-container">
              {projectsLoading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <p>Loading projects...</p>
                </div>
              ) : projects.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <p>Get started by creating your first project</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Status</th>
                      <th>Manager</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map(project => (
                      <tr key={project.id}>
                        <td>{project.name}</td>
                        <td>
                          <span
                            className="status-badge"
                            style={{ color: getStatusColor(project.status) }}
                          >
                            {project.status}
                          </span>
                        </td>
                        <td>
                          {project.manager ? project.manager.name : 
                           <button 
                             className="btn-approve"
                             onClick={() => setAssignModal({
                               isOpen: true,
                               projectId: project.id,
                               selectedManager: ""
                             })}
                           >
                             Assign
                           </button>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Recent Employees */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Recent Employees</h2>
              <button onClick={() => navigate('/employees')}>View All</button>
            </div>
            <div className="table-container">
              {employeesLoading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <p>Loading employees...</p>
                </div>
              ) : employees.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <p>Add your first employee to get started</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Email</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(employee => (
                      <tr key={employee.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'var(--jira-primary)',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              {getInitials(employee.user?.full_name)}
                            </div>
                            {employee.user?.full_name}
                          </div>
                        </td>
                        <td>{employee.user?.email}</td>
                        <td>{employee.user?.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Pending Leave Requests */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Pending Leave Requests</h2>
              <span>{leaveRequests.length}</span>
            </div>
            <div className="table-container">
              {leaveLoading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <p>Loading leave requests...</p>
                </div>
              ) : leaveRequests.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <p>New requests will appear here.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Dates</th>
                      <th>Reason</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveRequests.map(request => (
                      <tr key={request.id}>
                        <td>{request.employee_email || 'N/A'}</td>
                        <td>
                          {request.start_date} - {request.end_date}
                        </td>
                        <td>{request.reason || 'No reason provided'}</td>
                        <td>
                          <button className="btn-approve">Approve</button>
                          <button className="btn-reject">Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant Chat Box - Conditionally Rendered */}
      {showAIChat && <AIAssistant />}

      {/* Assignment Modal */}
      {assignModal.isOpen && (
        <div className="ai-modal-overlay">
          <div className="ai-modal-content">
            <div className="ai-modal-header">
              <h3>Assign Project Manager</h3>
              <button 
                className="ai-modal-close"
                onClick={() => setAssignModal({ isOpen: false, projectId: null, selectedManager: "" })}
              >
                ×
              </button>
            </div>
            <div className="ai-modal-body">
              <div className="ai-form-group">
                <label className="ai-form-label">Select Manager:</label>
                <select 
                  className="ai-form-select"
                  value={assignModal.selectedManager}
                  onChange={(e) => setAssignModal(prev => ({ ...prev, selectedManager: e.target.value }))}
                >
                  <option value="">Choose a manager...</option>
                  {managers.map(manager => (
                    <option key={manager.id} value={manager.id}>
                      {manager.full_name} ({manager.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="ai-modal-footer">
              <button 
                className="ai-action-btn secondary"
                onClick={() => setAssignModal({ isOpen: false, projectId: null, selectedManager: "" })}
              >
                Cancel
              </button>
              <button 
                className="ai-action-btn primary"
                onClick={handleAssignProject}
                disabled={!assignModal.selectedManager}
              >
                Assign Manager
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HrDashboard;
