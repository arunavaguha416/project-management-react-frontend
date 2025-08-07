import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/auth-context';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosinstance';

const Register = () => {
  const { register } = useContext(AuthContext) || { register: () => {}, errors: {} };
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [salary, setSalary] = useState('');
  const [designation, setDesignation] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dob, setDob] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [company, setCompany] = useState('');
  const [departments, setDepartments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const deptRes = await axiosInstance.post('/department/list/');
        if (deptRes.data.status) setDepartments(deptRes.data.records);
        const compRes = await axiosInstance.post('/company/list/');
        if (compRes.data.status) setCompanies(compRes.data.records);
      } catch {
        setError('Failed to load company/department info.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    const data = { 
      name, 
      email, 
      username, 
      password, 
      date_of_birth: dob, 
      date_of_joining:joining,
      dept_id: department, 
      role:role,
      comp_id: company 
    };
    try {
      const success = await register(data);
      if (success) navigate('/dashboard');
      else navigate('/login');
    } catch (error) {
      setError(error.message || 'Registration failed');
    }
  };

  return (
    <div className="container py-5">
      <div className="card p-4 mx-auto" >
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
        <h3>Create New User</h3>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input id="name" className="form-control" type="text" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input id="email" className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input id="username" className="form-control" type="text" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Date of Birth</label>
            <input id="dob" className="form-control" type="date" value={dob} onChange={e => setDob(e.target.value)} required max={new Date().toISOString().split("T")[0]} />
          </div>
          <div className="mb-3">
            <label className="form-label">Date of Joining</label>
            <input id="dob" className="form-control" type="date" value={dob} onChange={e => setJoining(e.target.value)} required max={new Date().toISOString().split("T")[0]} />
          </div>
          <div className="mb-3">
            <label className="form-label">Department</label>
            <select className="form-select" value={department} onChange={e => setDepartment(e.target.value)} required disabled={isLoading || error}>
              <option value="" disabled>Select your department</option>
              {departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">Role</label>
            <select className="form-select" value={role} onChange={e => setRole(e.target.value)} required disabled={isLoading || error}>
              <option value="" disabled>Select your role</option>
              <option value="USER" disabled>Employee</option>
              <option value="HR" disabled>HR</option>
              <option value="MANAGER" disabled>Manager</option>
              
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">Company</label>
            <select className="form-select" value={company} onChange={e => setCompany(e.target.value)} required disabled={isLoading || error}>
              <option value="" disabled>Select your company</option>
              {companies.map((comp) => <option key={comp.id} value={comp.id}>{comp.name}</option>)}
            </select>
          </div>
           <div className="mb-3">
            <label className="form-label">Salary</label>
            <input id="salary" className="form-control" type="text" value={salary} onChange={e => setSalary(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Designation</label>
            <input id="designation" className="form-control" type="text" value={designation} onChange={e => setDesignation(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input id="password" className="form-control" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div className="mb-4">
            <label className="form-label">Confirm Password</label>
            <input id="confirm-password" className="form-control" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={isLoading}>Save</button>
         
        </form>
      </div>
    </div>
  );
};
export default Register;
