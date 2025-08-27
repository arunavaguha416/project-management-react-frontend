import React, { useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosinstance";
import { AuthContext } from "../../context/auth-context";
import UploadAttachments from "../../components/uploads/UploadAttachments";
import "../../assets/css/EditProject.css";

const toStr = (v) => (v === null || v === undefined ? "" : String(v));

const EditProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    company: "",
    manager: "",
    startDate: "",
    endDate: "",
    priority: "MEDIUM",
    budget: "",
    status: "PLANNING"
  });

  const [managers, setManagers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [projectManagerId, setProjectManagerId] = useState("");
  const [projectManagerName, setProjectManagerName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProject, setLoadingProject] = useState(true);

  // Build normalized manager options
  const managerOptions = useMemo(() => {
    const opts = (managers || []).map((m) => {
      const idStr = toStr(m.id);
      const label = m.user?.name || m.name || m.email || m.username || "Manager";
      return { id: idStr, label };
    });

    const pmId = toStr(projectManagerId);
    if (pmId && !opts.some((o) => o.id === pmId)) {
      const fallbackLabel = projectManagerName || "Current manager";
      return [{ id: pmId, label: `${fallbackLabel} (current)` }, ...opts];
    }
    return opts;
  }, [managers, projectManagerId, projectManagerName]);

  const fetchFiles = useCallback(async () => {
    try {
      const filesRes = await axiosInstance.post(
        "/projects/upload-files-list/",
        { project_id: id },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (filesRes?.data?.status) {
        setExistingFiles(filesRes.data.records || []);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  }, [id, user.token]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setLoadingProject(true);
        
        const [mgrRes, compRes, projRes] = await Promise.all([
          axiosInstance.post("/hr-management/manager/list/", { role: "MANAGER" }),
          axiosInstance.post("/company/list/"),
          axiosInstance.get(`/projects/details/${id}/`)
        ]);

        if (mgrRes?.data?.status) setManagers(mgrRes.data.records || []);
        if (compRes?.data?.status) setCompanies(compRes.data.records || []);

        if (projRes?.data?.status && projRes?.data?.records) {
          const p = projRes.data.records;
          setFormData({
            name: p.name || "",
            description: p.description || "",
            company: toStr(p.company_id || ""),
            manager: toStr(p.manager_id || ""),
            startDate: p.start_date ? p.start_date.split('T')[0] : "",
            endDate: p.end_date ? p.end_date.split('T')[0] : "",
            priority: p.priority || "MEDIUM",
            budget: p.budget ? String(p.budget) : "",
            status: p.status || "PLANNING"
          });

          const mid = toStr(p.manager_id);
          setProjectManagerId(mid);
          setProjectManagerName(p.manager_name || "");
        }

        await fetchFiles();
      } catch (error) {
        console.error("Error loading project:", error);
        setError("Failed to load project.");
      } finally {
        setLoadingProject(false);
      }
    };

    bootstrap();
  }, [id, fetchFiles]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError("");
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
      const updatePayload = {
        id,
        name: formData.name.trim(),
        description: formData.description.trim(),
        manager_id: formData.manager || undefined,
        company_id: formData.company || undefined,
        start_date: formData.startDate || null,
        end_date: formData.endDate || null,
        priority: formData.priority,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        status: formData.status
      };

      const updateRes = await axiosInstance.put("/projects/update/", updatePayload, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      if (!updateRes?.data?.status) {
        setError(updateRes?.data?.message || "Could not update project.");
        return;
      }

      let uploadSuccess = true;
      if (attachments.length > 0) {
        uploadSuccess = await uploadAttachmentsForProject(id, attachments);
      }

      if (uploadSuccess) {
        setSuccess("Project updated successfully!");
        await fetchFiles();
      } else {
        setSuccess("Project updated, but some files failed to upload.");
      }

      setAttachments([]);
      setTimeout(() => navigate(`/project-details/${id}`), 2000);
    } catch (error) {
      console.error("Update error:", error);
      setError("Error updating project.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      const response = await axiosInstance.delete(`/projects/delete-file/${fileId}/`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      if (response.data.status) {
        setExistingFiles(prev => prev.filter(file => file.id !== fileId));
        setSuccess("File deleted successfully!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      setError("Failed to delete file.");
    }
  };

  if (loadingProject) {
    return (
      <div className="edit-project-loading">
        <div className="loading-spinner"></div>
        <p>Loading project...</p>
      </div>
    );
  }

  return (
    <div className="edit-project-container">
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
      <div className="edit-project-header">
        <div className="header-content">
          <div className="header-info">
            <h1 className="page-title">Edit Project</h1>
            <p className="page-subtitle">Update project information and settings</p>
          </div>
          <div className="header-icon">
            <span className="project-icon">✏️</span>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="form-container">
        <form onSubmit={handleSubmit} className="edit-project-form">
          {/* Messages */}
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

          {/* Basic Information */}
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
                  className="form-textarea"
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label htmlFor="company" className="form-label">
                  Company
                </label>
                <select
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="form-select"
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
                <label htmlFor="manager" className="form-label">
                  Project Manager
                </label>
                <select
                  id="manager"
                  name="manager"
                  value={formData.manager}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">Select Manager</option>
                  {managerOptions.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="status" className="form-label">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="PLANNING">📋 Planning</option>
                  <option value="ONGOING">🚀 Ongoing</option>
                  <option value="COMPLETED">✅ Completed</option>
                  <option value="ON_HOLD">⏸️ On Hold</option>
                  <option value="CANCELLED">❌ Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Project Details */}
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
                  className="form-input"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Existing Files */}
          {existingFiles.length > 0 && (
            <div className="form-section">
              <h3 className="section-title">
                <span className="section-icon">📁</span>
                Existing Files
              </h3>
              <div className="existing-files-grid">
                {existingFiles.map((file) => (
                  <div key={file.id} className="existing-file-card">
                    <div className="file-info">
                      <div className="file-icon">📄</div>
                      <div className="file-details">
                        <span className="file-name">{file.name || file.filename}</span>
                        <span className="file-meta">
                          {file.size && `${(file.size / 1024).toFixed(1)} KB`}
                        </span>
                      </div>
                    </div>
                    <div className="file-actions">
                      <button
                        type="button"
                        className="file-action-btn download"
                        onClick={() => window.open(file.url, '_blank')}
                        title="Download"
                      >
                        ⬇️
                      </button>
                      <button
                        type="button"
                        className="file-action-btn delete"
                        onClick={() => handleDeleteFile(file.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Attachments */}
          <div className="form-section">
            <h3 className="section-title">
              <span className="section-icon">📎</span>
              Add New Files
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
                  Updating...
                </>
              ) : (
                <>
                  <span className="btn-icon">💾</span>
                  Update Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProject;
