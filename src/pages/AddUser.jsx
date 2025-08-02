import React, { useState } from "react";
import axiosInstance from '../services/axiosinstance';

const initialForm = {
  name: "",
  email: "",
  role: "",
  salary: "",
  date_of_birth: "", // optional, see below
};

export default function AddUser({ user, onSuccess }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      // Update endpoint to match your backend API for user creation!
      const response = await axiosInstance.post(
        "/authentication/register/", // adjust this endpoint as needed
        form,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      setLoading(false);
      setSuccessMsg("User added successfully!");
      setForm(initialForm);
      if (onSuccess) onSuccess(response.data);
    } catch (err) {
      setLoading(false);
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Failed to add user. Please check your input."
      );
    }
  };

  return (
    <div className="add-user-page">
      <div className="add-user-card">
        <h2>Add User</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Name
            <input
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              disabled={loading}
            />
          </label>
          <label>
            Email
            <input
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              disabled={loading}
            />
          </label>
          <label>
            Role
            <input
              name="role"
              type="text"
              required
              value={form.role}
              onChange={handleChange}
              disabled={loading}
              placeholder="E.g. Software Engineer"
            />
          </label>
          <label>
            Salary
            <input
              name="salary"
              type="number"
              required
              min="0"
              value={form.salary}
              onChange={handleChange}
              disabled={loading}
            />
          </label>
          {/* Uncomment if date_of_birth is present in your backend */}
          {/* <label>
            Date of Birth
            <input
              name="date_of_birth"
              type="date"
              value={form.date_of_birth}
              onChange={handleChange}
              disabled={loading}
            />
          </label> */}
          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add User"}
          </button>
          {error && <div className="form-error">{error}</div>}
          {successMsg && <div className="form-success">{successMsg}</div>}
        </form>
      </div>
    </div>
  );
}
