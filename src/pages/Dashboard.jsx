import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/auth-context';
import axiosInstance from '../services/axiosinstance';
import { useNavigate } from "react-router-dom";


const PAGE_SIZE = 10;

const Dashboard = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  // User state
  const [userList, setUserList] = useState([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userLoading, setUserLoading] = useState(true);

  // Project state
  const [projectList, setProjectList] = useState([]);
  const [projectTotal, setProjectTotal] = useState(0);
  const [projectPage, setProjectPage] = useState(1);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectLoading, setProjectLoading] = useState(true);

  // Birthday state
  const [birthdayList, setBirthdayList] = useState([]);
  const [birthdayTotal, setBirthdayTotal] = useState(0);
  const [birthdayPage, setBirthdayPage] = useState(1);
  const [birthdaySearch, setBirthdaySearch] = useState('');
  const [birthdayLoading, setBirthdayLoading] = useState(true);

  // Attendance/leave
  const [attendance, setAttendance] = useState({});
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveLoading, setLeaveLoading] = useState(true);

    // User list fetch
  const fetchUserList = useCallback(async () => {
  setUserLoading(true);
  const res = await axiosInstance.post(
    '/hr-management/employees/list/',
    { page: userPage, page_size: PAGE_SIZE, search: userSearch },
    { headers: { Authorization: `Bearer ${user.token}` } }
  );
  setUserList(res.data.records || []);
  setUserTotal(res.data.count || 0);
  setUserLoading(false);
}, [user, userPage, userSearch]); 

  // Project list fetch
  const fetchProjectList = useCallback( async () => {
    setProjectLoading(true);
    const res = await axiosInstance.post(
      '/projects/list/',
      { page: projectPage, page_size: PAGE_SIZE, search: projectSearch },
      { headers: { Authorization: `Bearer ${user.token}` } });
    setProjectList(res.data.records || []);
    setProjectTotal(res.data.count || 0);
    setProjectLoading(false);
  }, [user, projectPage, projectSearch]); 

  // Birthday list fetch
  const fetchBirthdayList = useCallback(async () => {
  setBirthdayLoading(true);
  const res = await axiosInstance.post(
    '/hr-management/birthdays/list/',
    { page: birthdayPage, page_size: PAGE_SIZE, search: birthdaySearch },
    { headers: { Authorization: `Bearer ${user.token}` } }
  );
  setBirthdayList(res.data.records || []);
  setBirthdayTotal(res.data.count || 0);
  setBirthdayLoading(false);
}, [user, birthdayPage, birthdaySearch]);

  // Attendance and leave requests
  const fetchAttendanceAndLeaves = useCallback(async () => {
  setLeaveLoading(true);
  // Attendance summary
  const att = await axiosInstance.get(
    '/hr-management/attendance/summary/', 
    { headers: { Authorization: `Bearer ${user.token}` } }
  );
  setAttendance(att.data || {});
  // Leave requests
  const leaves = await axiosInstance.post(
    '/hr-management/leave-requests/list/', 
    { headers: { Authorization: `Bearer ${user.token}` } }
  );
  setLeaveRequests(leaves.data.records || []);
  setLeaveLoading(false);
}, [user]);

  useEffect(() => {
    if (authLoading || !user) return;
    fetchUserList();
    fetchProjectList();
    fetchBirthdayList();
    fetchAttendanceAndLeaves();
  }, [authLoading, user, userPage, projectPage, birthdayPage, fetchUserList, fetchProjectList, fetchBirthdayList, fetchAttendanceAndLeaves])



  // Pagination helpers
  const totalUserPages = Math.ceil(userTotal / PAGE_SIZE);
  const totalProjectPages = Math.ceil(projectTotal / PAGE_SIZE);
  const totalBirthdayPages = Math.ceil(birthdayTotal / PAGE_SIZE);

  // Event handlers
  const handleUserSearch = e => { e.preventDefault(); setUserPage(1); fetchUserList(); };
  const handleProjectSearch = e => { e.preventDefault(); setProjectPage(1); fetchProjectList(); };
  const handleBirthdaySearch = e => { e.preventDefault(); setBirthdayPage(1); fetchBirthdayList(); };

  const handleLeaveAction = async (id, status) => {
    await axiosInstance.put(
      '/hr-management/leave-request/update/',
      { id, status },
      { headers: { Authorization: `Bearer ${user.token}` } }
    );
    fetchAttendanceAndLeaves();
  }

  if (authLoading || !user) return <div className="container py-5">Loading dashboard...</div>;

  return (
    <div className="container py-5">
      <div className="bg-primary text-white rounded p-4 mb-4">
        <h2>HR Dashboard</h2>
      </div>
      {/* USERS AND PROJECTS */}
      <div className="row">
        {/* USER LIST */}
        <div className="col-lg-6 mb-4">
          <div className="card p-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h4 className="mb-0">User List</h4>
              <button className="btn btn-primary btn-sm" onClick={() => navigate("/register")}>Add User</button>
            </div>
            <form className="mb-2" onSubmit={handleUserSearch}>
              <div className="input-group">
                <input type="text" className="form-control form-control-sm" placeholder="Search name or dept..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                <button className="btn btn-outline-secondary btn-sm" type="submit">Search</button>
              </div>
            </form>
            <table className="table table-hover table-sm"><thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Designation</th>
                <th>Salary</th>
              </tr>
            </thead>
              <tbody>
                {userLoading ? (
                  <tr><td colSpan={3}>Loading...</td></tr>
                ) : userList.length ? (
                  userList.map(emp =>
                    <tr key={emp.id} className="clickable-row" style={{ cursor: "pointer" }} onClick={() => navigate(`/user/details/${emp.id}`)} >
                      <td>{emp.user.name}</td>
                      <td>{emp.designation || "--"}</td>
                      <td>{emp.salary || "--"}</td>
                    </tr>
                  )
                ) : (
                  <tr>
                    <td colSpan={3} className="text-muted text-center">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
            {/* User pagination */}
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item${userPage <= 1 ? " disabled" : ""}`}>
                  <button className="page-link" onClick={() => setUserPage(p => Math.max(1, p - 1))}>Prev</button>
                </li>
                {[...Array(totalUserPages).keys()].map(i => (
                  <li key={i} className={`page-item${userPage === i + 1 ? " active" : ""}`}>
                    <button className="page-link" onClick={() => setUserPage(i + 1)}>{i + 1}</button>
                  </li>
                ))}
                <li className={`page-item${userPage >= totalUserPages ? " disabled" : ""}`}>
                  <button className="page-link" onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))}>Next</button>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* PROJECT LIST */}
        <div className="col-lg-6 mb-4">
          <div className="card p-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h4 className="mb-0">Project List</h4>
              <button className="btn btn-primary btn-sm" onClick={() => navigate("/add-project")}>Add Project</button>
            </div>
            <form className="mb-2" onSubmit={handleProjectSearch}>
              <div className="input-group">
                <input type="text" className="form-control form-control-sm" placeholder="Search name, team, or manager..." value={projectSearch} onChange={e => setProjectSearch(e.target.value)} />
                <button className="btn btn-outline-secondary btn-sm" type="submit">Search</button>
              </div>
            </form>
            <table className="table table-hover table-sm"><thead className="table-light">
              <tr>
                <th>Project</th>                
                <th>Manager</th>
                <th>Status</th>
              </tr>
            </thead>
              <tbody>
                {projectLoading ? (
                  <tr><td colSpan={4}>Loading...</td></tr>
                ) : projectList.length ? (
                  projectList.map(proj =>
                    <tr key={proj.id} className="clickable-row" style={{ cursor: "pointer" }} onClick={() => navigate(`/project/details/${proj.id}`)}>
                      <td>{proj.name}</td>
                      <td>{proj.manager?.name}</td>
                      <td>
                        <span className={`badge bg-${proj.status === "Done" ? "success" : "primary"}`}>
                          {proj.status}
                        </span>
                      </td>
                    </tr>
                  )
                ) : (
                  <tr>
                    <td colSpan={4} className="text-muted text-center">No projects found</td>
                  </tr>
                )}
              </tbody>
            </table>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item${projectPage <= 1 ? " disabled" : ""}`}>
                  <button className="page-link" onClick={() => setProjectPage(p => Math.max(1, p - 1))}>Prev</button>
                </li>
                {[...Array(totalProjectPages).keys()].map(i => (
                  <li key={i} className={`page-item${projectPage === i + 1 ? " active" : ""}`}>
                    <button className="page-link" onClick={() => setProjectPage(i + 1)}>{i + 1}</button>
                  </li>
                ))}
                <li className={`page-item${projectPage >= totalProjectPages ? " disabled" : ""}`}>
                  <button className="page-link" onClick={() => setProjectPage(p => Math.min(totalProjectPages, p + 1))}>Next</button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      {/* ATTENDANCE / BIRTHDAYS */}
      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card p-3 h-100">
            <h5>User Attendance</h5>
            <div>
              <strong>Present:</strong> {attendance.present} ({attendance.present_percent}%)
              <br />
              <strong>Absent:</strong> {attendance.absent} ({attendance.absent_percent}%)
            </div>
          </div>
        </div>
        {/* BIRTHDAY LIST */}
        <div className="col-md-8 mb-4">
          <div className="card p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="mb-0">Employee Birthdays</h5>
              <form className="mb-0 d-flex" onSubmit={handleBirthdaySearch}>
                <input
                  type="text"
                  className="form-control form-control-sm me-2"
                  style={{ maxWidth: 160 }}
                  placeholder="Search name or email..."
                  value={birthdaySearch}
                  onChange={e => setBirthdaySearch(e.target.value)}
                />
                <button className="btn btn-outline-secondary btn-sm" type="submit">Search</button>
              </form>
            </div>
            <table className="table table-sm">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {birthdayLoading ? (
                  <tr><td colSpan={3}>Loading...</td></tr>
                ) : birthdayList.length ? (
                  birthdayList.map((b, idx) => (
                    <tr key={b.email || idx}>
                      <td>{b.name}</td>
                      <td>{b.email}</td>
                      <td>{b.date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-muted text-center">No birthdays found</td>
                  </tr>
                )}
              </tbody>
            </table>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item${birthdayPage <= 1 ? " disabled" : ""}`}>
                  <button className="page-link" onClick={() => setBirthdayPage(p => Math.max(1, p - 1))}>Prev</button>
                </li>
                {[...Array(totalBirthdayPages).keys()].map(i => (
                  <li key={i} className={`page-item${birthdayPage === i + 1 ? " active" : ""}`}>
                    <button className="page-link" onClick={() => setBirthdayPage(i + 1)}>{i + 1}</button>
                  </li>
                ))}
                <li className={`page-item${birthdayPage >= totalBirthdayPages ? " disabled" : ""}`}>
                  <button className="page-link" onClick={() => setBirthdayPage(p => Math.min(totalBirthdayPages, p + 1))}>Next</button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      {/* LEAVE REQUESTS */}
      <div className="row">
        <div className="col-12">
          <div className="card p-3 mb-4">
            <h5>Pending Leave Request List</h5>
            <table className="table table-sm">
              <thead className="table-light">
                <tr>
                  <th>Employee</th><th>From</th><th>To</th>
                  <th>Reason</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leaveLoading ? (
                  <tr><td colSpan={6}>Loading...</td></tr>
                ) : leaveRequests.length ? (
                  leaveRequests.map(lr =>
                    <tr key={lr.id}>
                      <td>{lr.employee_name}</td>
                      <td>{lr.start_date}</td>
                      <td>{lr.end_date}</td>
                      <td>{lr.reason}</td>
                      <td>
                        <span className={`badge bg-${lr.status === "APPROVED" ? "success" : lr.status === "REJECTED" ? "danger" : "warning"}`}>
                          {lr.status}
                        </span>
                      </td>
                      <td>
                        {lr.status === "PENDING" && (
                          <>
                            <button className="btn btn-success btn-sm me-2" onClick={() => handleLeaveAction(lr.id, "APPROVED")}>Approve</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleLeaveAction(lr.id, "REJECTED")}>Reject</button>
                          </>
                        )}
                        {lr.status !== "PENDING" && <span className="text-muted">—</span>}
                      </td>
                    </tr>
                  )
                ) : (
                  <tr>
                    <td colSpan={6} className="text-muted text-center">No leave requests</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;