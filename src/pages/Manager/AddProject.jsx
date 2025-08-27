import React, { useState, useContext, useEffect } from "react";
import axiosInstance from "../../services/axiosinstance";
import { AuthContext } from "../../context/auth-context";
import { useNavigate } from "react-router-dom";
import UploadAttachments from "../../components/uploads/UploadAttachments";
import "../../assets/css/AddProject.css";

const AddProject = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    company: "",
    manager: "",
    startDate: "",
    endDate: "",
    priority: "MEDIUM",
    budget: ""
  });
  
  const [managers, setManagers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    async function fetchCompaniesAndManagers() {
      try {
        setDataLoading(true);
        const [mgrRes, compRes] = await Promise.all([
          axiosInstance.post("/hr-management/manager/list/", { role: "MANAGER" }),
          axiosInstance.post("/company/list/")
        ]);
        
        if (mgrRes.data.status) setManagers(mgrRes.data.records);
        if (compRes.data.status) setCompanies(compRes.data.records);
      } catch (error) {
        console.error("Error loading form data:", error);
        setError("Failed to load form data. Please refresh the page.");
      } finally {
        setDataLoading(false);
      }
    }
    fetchCompaniesAndManagers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(""); // Clear error when user starts typing
  };

  const uploadAttachmentsForProject = async (projectId, files) => {
    if (!files || files.length === 0) return true;
    try {
      const formData = new FormData();
      formData.append("project_id", projectId);
      files.forEach((f) => formData.append("files", f));
      
      const res = await axiosInstance.post("/projects/upload-files/", formData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      return !!res?.data?.status;
    } catch (error) {
      console.error("File upload error:", error);
      return false;
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Project name is required.");
      return false;
    }
    if (!formData.company) {
      setError("Please select a company.");
      return false;
    }
    if (!formData.manager) {
      setError("Please select a project manager.");
      return false;
    }
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      setError("End date cannot be before start date.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const projectPayload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        manager_id: formData.manager,
        company_id: formData.company,
        start_date: formData.startDate || null,
        end_date: formData.endDate || null,
        priority: formData.priority,
        budget: formData.budget ? parseFloat(formData.budget) : null
      };

      const response = await axiosInstance.post("/projects/add/", projectPayload, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      if (response.data.status) {
        const projectId = response.data?.records?.id;
        let uploadSuccess = true;
        
        if (attachments.length > 0) {
          uploadSuccess = await uploadAttachmentsForProject(projectId, attachments);
        }

        if (uploadSuccess) {
          setSuccess("Project created successfully!");
        } else {
          setSuccess("Project created, but some files failed to upload.");
        }

        // Reset form
        setFormData({
          name: "",
          description: "",
          company: "",
          manager: "",
          startDate: "",
          endDate: "",
          priority: "MEDIUM",
          budget: ""
        });
        setAttachments([]);

        setTimeout(() => navigate("/projects"), 2000);
      } else {
        setError(response.data.message || "Could not create project.");
      }
    } catch (error) {
      console.error("Project creation error:", error);
      setError("Error creating project. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="add-project-loading">
        <div className="loading-spinner"></div>
        <p>Loading form data...</p>
      </div>
    );
  }

  return (
    <div className="add-project-container">
      {/* Back Button */}
      <div className="page-header">
        <button 
          className="back-btn"
          onClick={() => navigate(-1)}
          title="Go back"
        >
          <span className="back-icon">←</span>
          <span className="back-text">Back</span>
        </button>
      </div>

      {/* Header */}
      <div className="add-project-header">
        <div className="header-content">
          <div className="header-info">
            <h1 className="page-title">Create New Project</h1>
            <p className="page-subtitle">Set up a new project and assign it to a manager</p>
          </div>
          <div className="header-icon">
            <span className="project-icon">📋</span>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="form-container">
        <form onSubmit={handleSubmit} className="add-project-form">
          {/* Error/Success Messages */}
          {error && (
            <div className="message error-message">
              <div className="message-icon">⚠️</div>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="message success-message">
              <div className="message-icon">✅</div>
              <span>{success}</span>
            </div>
          )}

          {/* Basic Information Section */}
          <div className="form-section">
            <h3 className="section-title">
              <span className="section-icon">📝</span>
              Basic Information
            </h3>
            
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="name" className="form-label required">
                  Project Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter project name"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your project..."
                  className="form-textarea"
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label htmlFor="company" className="form-label required">
                  Company
                </label>
                <select
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="">Select Company</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="manager" className="form-label required">
                  Project Manager
                </label>
                <select
                  id="manager"
                  name="manager"
                  value={formData.manager}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="">Select Manager</option>
                  {managers.map(manager => (
                    <option key={manager.id} value={manager.id}>
                      {manager.user?.name || manager.name || manager.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Project Details Section */}
          <div className="form-section">
            <h3 className="section-title">
              <span className="section-icon">📊</span>
              Project Details
            </h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="startDate" className="form-label">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate" className="form-label">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="priority" className="form-label">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="LOW">🟢 Low</option>
                  <option value="MEDIUM">🟡 Medium</option>
                  <option value="HIGH">🔴 High</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="budget" className="form-label">
                  Budget (₹)
                </label>
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  placeholder="Enter budget amount"
                  className="form-input"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="form-section">
            <h3 className="section-title">
              <span className="section-icon">📎</span>
              Attachments
            </h3>
            <UploadAttachments
              attachments={attachments}
              setAttachments={setAttachments}
            />
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="btn-spinner"></div>
                  Creating...
                </>
              ) : (
                <>
                  <span className="btn-icon">✨</span>
                  Create Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProject;
