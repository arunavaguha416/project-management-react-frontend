import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/auth-context';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { login, errors } = useContext(AuthContext) || { login: () => {}, errors: {} };
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const success = await login(username, password);
      
      if (success) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="container">
      <div className="form-wrapper">
        <h1 className="heading-primary">Project Management</h1>
        <h2 className="heading-secondary">Welcome Back</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter Username"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          {errors?.message && (
            <p className="error">{errors.message}</p>
          )}

          <button type="submit" className="button">
            Log In
          </button>

          <a href="#" className="text-link">Reset Password</a>
         
        </form>
      </div>
    </div>
  );
};

export default Login;