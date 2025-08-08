import React, { useState, useEffect, useContext } from "react";
import axiosInstance from "../services/axiosinstance";
import { AuthContext } from '../context/auth-context';
import { useNavigate } from "react-router-dom";

const EmployeeDashboard = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(0);
  const [leaveForm, setLeaveForm] = useState({
    start_date: "",
    end_date: "",
    reason: ""
  });
  const [leaveStatus, setLeaveStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || !user) return;

    const fetchData = async () => {
      try {
        // Projects
        const projectRes = await axiosInstance.post(
          '/hr-management/employees/project/list/',
          { page_size: 5, search: '' },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        setProjects(projectRes.data.projects || []);

        // Leave balance
        const leaveRes = await axiosInstance.post(
          '/hr-management/employee/leave-balance/',
          {},
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        setLeaveBalance(leaveRes.data.leave_balance?.balance || 0);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading]);

  const handleLeaveChange = e => setLeaveForm({
    ...leaveForm,
    [e.target.name]: e.target.value
  });

  const handleLeaveSubmit = async e => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post("/employee-dashboard/apply-leave/", leaveForm);
      if (res.data.success) {
        setLeaveStatus("Leave request submitted!");
        setLeaveForm({ start_date: "", end_date: "", reason: "" });
      } else {
        setLeaveStatus("Failed to submit: " + (res.data.errors ? Object.values(res.data.errors).join("; ") : ""));
      }
    } catch {
      setLeaveStatus("Error submitting leave.");
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Employee Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user.name}!</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Leave Balance</div>
              <div className="text-2xl font-bold text-blue-600">{leaveBalance} days</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Projects Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">My Projects</h2>
              <span className="text-sm text-gray-500">{projects.length} projects</span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Manager
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan="3" className="px-4 py-4 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : projects.length > 0 ? (
                    projects.map((project, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {project.name}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {project.manager_name || "--"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {project.status === "Ongoing" ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Ongoing
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              {project.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-4 py-4 text-center text-gray-500">
                        No projects assigned
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Leave Application Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Apply for Leave</h2>
            
            {leaveStatus && (
              <div className={`mb-4 p-3 rounded ${
                leaveStatus.includes('submitted') 
                  ? 'bg-green-100 text-green-700 border border-green-400'
                  : 'bg-red-100 text-red-700 border border-red-400'
              }`}>
                {leaveStatus}
              </div>
            )}

            <form onSubmit={handleLeaveSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={leaveForm.start_date}
                  onChange={handleLeaveChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={leaveForm.end_date}
                  onChange={handleLeaveChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <textarea
                  name="reason"
                  value={leaveForm.reason}
                  onChange={handleLeaveChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter reason for leave"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Submit Leave Request
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
