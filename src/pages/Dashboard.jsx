
import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/auth-context'; 
import axiosInstance from '../services/axiosinstance';
import { useNavigate } from "react-router-dom";


const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();


  useEffect(() => {
    if (!user) {
      setLoading(false);
       navigate("/login")
      return;
    }
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get("/hr-management/hr-dashboard/", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        setDashboardData(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };
    fetchData();
    // For debug (optional)
    // console.log("user", user);
  }, [user]);

  if (loading) return <div>Loading dashboard...</div>;
  if (!dashboardData)
    return <div>No data found or error loading dashboard.</div>;

  const {
    employee_summary,
    project_summary,
    attendance,
    birthdays,
  } = dashboardData;

  return (
    <div className="userlist-dashboard">
      <header className="dashboard-header">HR Dashboard</header>
      {/* First row: User List, Project List side by side */}
      <div className="dashboard-row">
        <section className="dashboard-section flex-item">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
            <h2 style={{ margin: 0 }}>User List</h2>
            <button 
              className="primary-btn" 
              onClick={() => navigate("/register")}
            >
               Add User 
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Designation</th>
                <th>Salary</th>
              </tr>
            </thead>
            <tbody>
              {employee_summary.records.map((emp, idx) => (
                <tr key={emp.id || idx}>
                  <td>{emp.name}</td>
                  <td>{emp.designation || "--"}</td>
                  <td>{emp.salary || "--"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

       <section className="dashboard-section flex-item">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
        <h2 style={{ margin: 0 }}>Project List</h2>
        <button 
          className="primary-btn" 
          onClick={() => {
            // Add your logic to open a modal, navigate to add-user page, or show a form
            // e.g., setShowAddUserModal(true);
            alert("Add User button clicked! Implement modal or navigation here.");
          }}
        >
           Add Projects 
        </button>
  </div>
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Team</th>
              <th>Manager</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {project_summary.projects && project_summary.projects.length > 0 ? (
              project_summary.projects.map((proj, idx) => (
                <tr key={proj.id || idx}>
                  <td>{proj.name}</td>
                  <td>{proj.team_name}</td>
                  <td>{proj.manager_name}</td>
                  <td>
                    <span className={`status ${proj.status ? proj.status.toLowerCase() : ''}`}>
                      {proj.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: "center" }}>No projects found</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      </div>

      {/* Second row: Attendance, Birthdays side by side */}
      <div className="dashboard-row">
        <section className="dashboard-section flex-item attendance-section">
          <h2>User Attendance</h2>
          <div>
            <strong>Present:</strong> {attendance.present} ({attendance.present_percent}%)
            <br />
            <strong>Absent:</strong> {attendance.absent} ({attendance.absent_percent}%)
          </div>
          {/* If you'd like a pie chart, see earlier snippets for SVG example */}
        </section>

        <section className="dashboard-section flex-item">
          <h2>Employee Birthdays</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {birthdays && birthdays.length > 0 ? (
                birthdays.map((b, idx) => (
                  <tr key={b.email || idx}>
                    <td>{b.name}</td>
                    <td>{b.email}</td>
                    <td>{b.date}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={3}>No birthdays in next 30 days</td></tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
