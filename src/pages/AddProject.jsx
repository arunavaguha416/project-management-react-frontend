import React, { useState, useContext, useEffect } from "react";
import axiosInstance from "../services/axiosinstance";
import { AuthContext } from "../context/auth-context";
import { useNavigate } from "react-router-dom";

const AddProject = () => {
  const { user } = useContext(AuthContext);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [company, setCompany] = useState("");
  const [manager, setManager] = useState("");
  const [managers, setManagers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCompaniesAndManagers() {
      try {
        setIsLoading(true);
        const mgrRes = await axiosInstance.post("/hr-management/manager/list/", {
          role: "MANAGER"
        });
        if (mgrRes.data.status) setManagers(mgrRes.data.records);

        const compRes = await axiosInstance.post("/company/list/");
        if (compRes.data.status) setCompanies(compRes.data.records);
      } catch {
        setError("Form loading failed.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchCompaniesAndManagers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !company) {
      setError("Project name and company are required.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.post(
        "/projects/add/",
        {
          name,
          description,
          company_id: company,
          manager_id: manager
        },
        {
          headers: { Authorization: `Bearer ${user.token}` }
        }
      );

      if (response.data.status) {
        setSuccess("Project created successfully!");
        setName("");
        setDescription("");
        setCompany("");
        setManager("");
        setTimeout(() => navigate("/dashboard"), 1200);
      } else {
        setError(response.data.message || "Could not create project.");
      }
    } catch {
      setError("Error creating project.");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Add New Project</h1>
              <p className="text-gray-600 mt-1">Create a new project and assign it to a manager</p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="btn-jira text-white px-4 py-2 rounded-md "
            >
              Back 
            </button>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Project Details</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter project name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company *
                </label>
                <select
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Company</option>
                  {companies.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Manager
                </label>
                <select
                  value={manager}
                  onChange={(e) => setManager(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Manager</option>
                  {managers.map((mgr) => (
                    <option key={mgr.id} value={mgr.id}>
                      {mgr.user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter project description"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-jira text-white px-6 py-2 rounded-md "
              >
                {isLoading ? "Creating..." : "Create Project"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProject;
