import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/auth-context';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosinstance';

function Register() {
  const { register, errors } = useContext(AuthContext) || { register: () => {}, errors: {} };
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [company, setCompany] = useState('');
  const [departments, setDepartments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dob, setDob] = useState('');
  const [joining, setJoining] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDepartments = async () => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.post('/department/list/');
        if (response.data.status) {
          setDepartments(response.data.records);
        } else {
          throw new Error('Failed to fetch departments');
        }
      } catch (err) {
        setError(err.message);
        console.error('Fetch departments error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchCompanies = async () => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.post('/company/list/');
        if (response.data.status) {
          setCompanies(response.data.records);
        } else {
          throw new Error('Failed to fetch companies');
        }
      } catch (err) {
        setError(err.message);
        console.error('Fetch companies error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartments();
    fetchCompanies();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    const data = {
      name,
      email,
      password,
      date_of_joining:joining,
      date_of_birth:dob,
      dept_id: department,
      comp_id: company,
    };
    try {
      const success = await register(data);
      if (success) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed');
    }
  };

  return (
    <div className="container">
      <div className="form-wrapper">
        <h1 className="heading-primary">Project Management</h1>
        <h2 className="heading-secondary">Create Your Account</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="dob">Date of Birth</label>
            <input
              id="dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              placeholder="YYYY-MM-DD"
              required
              max={new Date().toISOString().split("T")[0]} // Optional: Do not allow future date
            />
          </div>

          <div className="input-group">
            <label htmlFor="dob">Date of Joining</label>
            <input
              id="dob"
              type="date"
              value={joining}
              onChange={(e) => setJoining(e.target.value)}
              placeholder="YYYY-MM-DD"
              required
              max={new Date().toISOString().split("T")[0]} // Optional: Do not allow future date
            />
          </div>
          <div className="select-group">
            <label htmlFor="department">Department</label>
            <select
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
              disabled={isLoading || error}
            >
              <option value="" disabled>Select your department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div className="select-group">
            <label htmlFor="company">Company</label>
            <select
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              disabled={isLoading || error}
            >
              <option value="" disabled>Select your company</option>
              {companies.map((comp) => (
                <option key={comp.id} value={comp.id}>{comp.name}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
            />
          </div>
          <button type="submit" className="button" disabled={isLoading}>Add User</button>
          
        </form>
      </div>
    </div>
  );
}

export default Register;