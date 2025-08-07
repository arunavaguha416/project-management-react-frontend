import React, { useState, useContext, useEffect } from "react";
import axiosInstance from "../services/axiosinstance";
import { AuthContext } from "../context/auth-context";
import { useNavigate } from "react-router-dom";

const AddProject = () => {
  const { user} = useContext(AuthContext);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [company, setCompany] = useState("");
  const [manager, setManager] = useState("");
  const [managers, setManagers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCompaniesAndManagers() {
      try {
        setIsLoading(true);
        const mgrRes = await axiosInstance.post("/authentication/list/", { role: "MANAGER" });
        if (mgrRes.data.status) setManagers(mgrRes.data.records);
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
    setError(""); setSuccess("");
    if (!name || !company) {
      setError("Project name and company are required."); return;
    }
    setIsLoading(true);
    try {
      const response = await axiosInstance.post(
        "/projects/add/",
        { name, description, company_id: company, manager_id: manager },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (response.data.status) {
        setSuccess("Project created successfully!"); setName(""); setDescription(""); setCompany(""); setManager("");
        setTimeout(() => navigate("/dashboard"), 1200);
      } else setError(response.data.message || "Could not create project.");
    } catch {
      setError("Error creating project.");
    }
    setIsLoading(false);
  };

  return (
    <div className="container py-5">
      <div className="card p-4 mx-auto">
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
        <h3>Add Project</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Project Name</label>
            <input type="text" className="form-control" required value={name} disabled={isLoading} onChange={e => setName(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label">Description (optional)</label>
            <textarea className="form-control" rows={3} value={description} disabled={isLoading} onChange={e => setDescription(e.target.value)} />
          </div>
          
          <div className="mb-4">
            <label className="form-label">Manager (optional)</label>
            <select className="form-select" value={manager} disabled={isLoading} onChange={e => setManager(e.target.value)}>
              <option value="">Select manager (optional)</option>
              {managers.map((mgr) => <option key={mgr.id} value={mgr.id}>{mgr.name}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" disabled={isLoading}>{isLoading ? "Adding..." : "Add Project"}</button>
        </form>
        {error && <div className="alert alert-danger mt-3">{error}</div>}
        {success && <div className="alert alert-success mt-3">{success}</div>}
      </div>
    </div>
  );
};
export default AddProject;
