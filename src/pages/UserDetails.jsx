import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../services/axiosinstance";

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loginDetails, setLoginDetails] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        // User basic details
        const userResp = await axiosInstance.get(`/authentication/details/${id}/`);
        setUser(userResp.data.records);

        // Leave requests
        const leaveResp = await axiosInstance.get(`/hr-management/employee/attendance/list/${id}/`);
        setLeaveRequests(leaveResp.data.records || []);

        // Attendance
        const loginResp = await axiosInstance.get(`/hr-management/employee/attendance/list/${id}/`);
        setLoginDetails(loginResp.data.records || []);
      } catch {
        setError("Could not fetch user details.");
      }
    }
    fetchData();
  }, [id]);

  if (error) return <div className="container py-4">{error}</div>;
  if (!user) return <div className="container py-4">Loading...</div>;

  return (
    <div className="container py-5">
      {/* Top-left Back Button */}
      
      <div style={{clear: "both"}} />

      {/* UNIFIED CARD FOR ALL TABLES */}
      <div className="card p-4" style={{background: "#fff"}}>
        <div className="mb-2">
            <button
              className="btn btn-outline-primary btn-sm"
              type="button"
              style={{marginBottom: ".5em", float: "left"}}
              onClick={() => navigate(-1)}
            >
              ← Back
            </button>
        </div>
        <div className="row">
          {/* Employee Details (Left) */}
          <div className="col-md-7 mb-4 mb-md-0">
              <h3 className="mb-3" style={{color: "var(--jira-header-text)"}}>Employee Details</h3>
                <table className="table mb-0">
                    <tbody>
                      <tr><th>Name</th><td>{user.name}</td></tr>
                      <tr><th>Designation</th><td>{user.designation}</td></tr>
                      <tr><th>Salary</th><td>{user.salary}</td></tr>
                      <tr><th>Joining Date</th><td>{user.date_of_joining}</td></tr>
                      <tr><th>DOB</th><td>{user.date_of_birth}</td></tr>
                      <tr><th>Manager</th><td>{user.manager_name}</td></tr>
                    </tbody>
                </table>
          </div>
          {/* Leave Requests (Right) */}
          <div className="col-md-5">
            <h5 className="mb-3">Leave Requests</h5>
            <table className="table table-sm mb-0">
              <thead>
                <tr><th>Date</th><th>Reason</th><th>Status</th></tr>
              </thead>
              <tbody>
                {leaveRequests.length > 0 ? leaveRequests.map((leave, i) =>
                  <tr key={i}><td>{leave.date}</td><td>{leave.reason}</td><td>{leave.status}</td></tr>
                ) : <tr><td colSpan={3} className="text-muted text-center">No leave requests</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        {/* Employee Login Details: Full Row Below */}
        <div className="row mt-5">
          <div className="col-12">
            <h5 className="mb-3">Employee Login Details</h5>
            <table className="table table-sm mb-0">
              <thead>
                <tr><th>Date</th><th>In Time</th><th>Out Time</th></tr>
              </thead>
              <tbody>
                {loginDetails.length > 0 ? loginDetails.map((entry, i) =>
                  <tr key={i}><td>{entry.date}</td><td>{entry.in_time}</td><td>{entry.out_time}</td></tr>
                ) : <tr><td colSpan={3} className="text-muted text-center">No login details</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
export default UserDetails;
