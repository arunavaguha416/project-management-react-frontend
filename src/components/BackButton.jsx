import React from "react";
import { useNavigate } from "react-router-dom";

const BackButton = ({ label = "Back", to = -1, className = "" }) => {
  const navigate = useNavigate();
  return (
    <button
      className={`primary-btn ${className}`}
      type="button"
      style={{ marginBottom: "1.5em" }}
      onClick={() => navigate(to)}
    >
      {label}
    </button>
  );
};

export default BackButton;
