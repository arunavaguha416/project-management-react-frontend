import React, { useRef, useState, useEffect } from "react";

const ALLOWED_EXTENSIONS = ["pdf", "docx", "xlsx", "jpg", "jpeg", "png"];

function getExtension(name = "") {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

const UploadAttachments = ({
  label = "Attachments",
  multiple = true,
  maxFiles = 10,
  value = [],
  onChange,
  disabled = false,
  helperText = "Allowed: pdf, docx, xlsx, jpg, jpeg, png",
}) => {
  const inputRef = useRef(null);
  const [files, setFiles] = useState(value || []);
  const [error, setError] = useState("");

  useEffect(() => {
    setFiles(value || []);
  }, [value]);

  const handlePick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const validateFiles = (fileList) => {
    const arr = Array.from(fileList);
    const errors = [];
    const valid = [];

    for (const f of arr) {
      const ext = getExtension(f.name);
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        errors.push(`"${f.name}" has invalid extension ".${ext}"`);
        continue;
      }
      valid.push(f);
    }

    return { valid, errors };
  };

  const handleInputChange = (e) => {
    setError("");
    const { valid, errors } = validateFiles(e.target.files);

    let next = multiple ? [...files, ...valid] : valid.slice(0, 1);
    if (next.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
      next = next.slice(0, maxFiles);
    }

    setFiles(next);
    onChange && onChange(next);
    if (errors.length) setError(errors.join("; "));
    // reset input so re-selecting same file triggers change
    e.target.value = "";
  };

  const removeAt = (idx) => {
    if (disabled) return;
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    onChange && onChange(next);
  };

  return (
    <div>
      <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
        {label}
      </label>

      <div
        style={{
          border: "1px dashed #bbb",
          borderRadius: 8,
          padding: 16,
          background: disabled ? "#f9f9f9" : "#fff",
        }}
      >
        <button
          type="button"
          onClick={handlePick}
          disabled={disabled}
          style={{
            padding: "8px 12px",
            background: "#0060DF",
            color: "#fff",
            border: 0,
            borderRadius: 6,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          Select files
        </button>

        <input
          ref={inputRef}
          type="file"
          style={{ display: "none" }}
          multiple={multiple}
          accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png"
          onChange={handleInputChange}
        />

        <div style={{ marginTop: 8, color: "#666", fontSize: 12 }}>
          {helperText}
        </div>

        {error ? (
          <div style={{ marginTop: 8, color: "#c00", fontSize: 12 }}>
            {error}
          </div>
        ) : null}

        {files?.length ? (
          <div style={{ marginTop: 12 }}>
            {files.map((f, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 8px",
                  background: "#f5f7fb",
                  borderRadius: 6,
                  marginBottom: 6,
                }}
              >
                <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  {f.name} ({Math.round((f.size / 1024) * 10) / 10}KB)
                </div>
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  disabled={disabled}
                  style={{
                    marginLeft: 12,
                    border: 0,
                    background: "transparent",
                    color: "#c00",
                    cursor: disabled ? "not-allowed" : "pointer",
                  }}
                  aria-label={`Remove ${f.name}`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default UploadAttachments;
