import React, { useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosinstance";
import { AuthContext } from "../../context/auth-context";
import UploadAttachments from "../../components/uploads/UploadAttachments";

const toStr = (v) => (v === null || v === undefined ? "" : String(v));

const EditProject = () => {
  const { id } = useParams(); // project id from route
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [company, setCompany] = useState(""); // UI only, not persisted to backend
  const [manager, setManager] = useState(""); // selected manager id
  const [managers, setManagers] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [attachments, setAttachments] = useState([]); // files to add on save
  const [existingFiles, setExistingFiles] = useState([]); // loaded from backend

  const [projectManagerId, setProjectManagerId] = useState(""); // from details
  const [projectManagerName, setProjectManagerName] = useState(""); // for fallback label

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProject, setLoadingProject] = useState(true);

  // Build normalized manager options; inject current manager if missing
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
    } catch {
      // non-blocking
    }
  }, [id, user.token]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setIsLoading(true);

        // Fetch managers, companies, and project details in parallel
        const [mgrRes, compRes, projRes] = await Promise.all([
          axiosInstance.post("/hr-management/manager/list/", { role: "MANAGER" }),
          axiosInstance.post("/company/list/"),
          axiosInstance.get(`/projects/details/${id}/`),
        ]);

        if (mgrRes?.data?.status) setManagers(mgrRes.data.records || []);
        if (compRes?.data?.status) setCompanies(compRes.data.records || []);

        if (projRes?.data?.status && projRes?.data?.records) {
          const p = projRes.data.records;
          setName(p.name || "");
          setDescription(p.description || "");

          // Preselect manager from details
          const mid = toStr(p.manager_id);
          setProjectManagerId(mid);
          setProjectManagerName(p.manager_name || "");
          setManager(mid);
        }

        // Fetch existing files
        await fetchFiles();
      } catch {
        setError("Failed to load project.");
      } finally {
        setIsLoading(false);
        setLoadingProject(false);
      }
    };

    bootstrap();
  }, [id, fetchFiles]);

  // Keep selection consistent once options are ready
  useEffect(() => {
    const val = toStr(manager);
    if (!val) {
      const pmId = toStr(projectManagerId);
      if (pmId) setManager(pmId);
      return;
    }
  }, [managerOptions, manager, projectManagerId]);

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
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name) {
      setError("Project name is required.");
      return;
    }

    setIsLoading(true);
    try {
      // Update project metadata
      const updateRes = await axiosInstance.put(
        "/projects/update/",
        {
          id,
          name,
          description,
          // Provide both keys to maximize serializer compatibility without removing existing backend code
          manager: manager || undefined,
          manager_id: manager || undefined,
        },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      if (!updateRes?.data?.status) {
        setError(updateRes?.data?.message || "Could not update project.");
        setIsLoading(false);
        return;
      }

      // Upload new attachments (if any)
      const uploaded = await uploadAttachmentsForProject(id, attachments);
      if (!uploaded) {
        setSuccess("Project updated. Files failed to upload.");
      } else {
        setSuccess("Project updated successfully!");
        // refresh files list so new uploads appear
        await fetchFiles();
      }

      setAttachments([]);
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch {
      setError("Error updating project.");
    }
    setIsLoading(false);
  };

  if (loadingProject) {
    return <div style={{ padding: 24 }}>Loading project...</div>;
  }

  return (
    <div className="container" style={{ maxWidth: 720, margin: "24px auto" }}>
      <h2 style={{ marginBottom: 16 }}>Edit project</h2>

      {error ? (
        <div style={{ marginBottom: 12, color: "#b42318" }}>{error}</div>
      ) : null}
      {success ? (
        <div style={{ marginBottom: 12, color: "#05603a" }}>{success}</div>
      ) : null}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Project name</label>
          <input
            type="text"
            value={name}
            disabled={isLoading}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter project name"
            className="form-control"
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6 }}>
            Description
          </label>
          <textarea
            value={description}
            disabled={isLoading}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description"
            className="form-control"
            rows={4}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Company</label>
          <select
            value={company}
            disabled={isLoading}
            onChange={(e) => setCompany(e.target.value)}
            className="form-control"
          >
            <option value="">Select company</option>
            {companies?.map((c) => (
              <option key={c.id || c._id || c.value} value={toStr(c.id || c._id || c.value)}>
                {c.name || c.label}
              </option>
            ))}
          </select>
          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
            Note: Company is currently not saved on the backend Project model.
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Manager</label>
          <select
            value={toStr(manager)}
            disabled={isLoading}
            onChange={(e) => setManager(toStr(e.target.value))}
            className="form-control"
          >
            <option value="">Select manager (optional)</option>
            {managerOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <UploadAttachments
            label="Add files"
            multiple
            maxFiles={10}
            value={attachments}
            onChange={setAttachments}
            disabled={isLoading}
            helperText="Allowed: pdf, docx, xlsx, jpg, jpeg, png"
          />
        </div>

        {/* Existing files */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Existing files</div>
          {existingFiles?.length ? (
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {existingFiles.map((f) => (
                <li key={f.id} style={{ marginBottom: 6 }}>
                  {f.url ? (
                    <a href={f.url} target="_blank" rel="noreferrer">
                      {f.filename}
                    </a>
                  ) : (
                    <span>{f.filename}</span>
                  )}
                  <span style={{ color: "#666", marginLeft: 8, fontSize: 12 }}>
                    ({(f.extension || "").toUpperCase()}, {Math.round((f.size / 1024) * 10) / 10}KB)
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ color: "#666", fontSize: 14 }}>No files uploaded yet.</div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary"
          style={{ minWidth: 140 }}
        >
          {isLoading ? "Saving..." : "Update Project"}
        </button>
      </form>
    </div>
  );
};

export default EditProject;
