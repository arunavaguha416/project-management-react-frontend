import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/auth-context';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { login, error: loginError, loading } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setErr("");
    try {
       
      const success = await login(username, password);
      if (success) navigate('/dashboard');
    } catch (error) {
      setErr(error.message || "Could not log in");
    }
  };

  return (
    <div className="container py-5">
      <div className="card p-4 mx-auto" style={{maxWidth: 380}}>
        <h3 className="mb-4">Login</h3>
        {(loginError || err) && <div className="alert alert-danger">{loginError || err}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input className="form-control" type="text" autoComplete="username" required value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div className="mb-4">
            <label className="form-label">Password</label>
            <input className="form-control" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button className="btn btn-primary w-100" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
        </form>
      </div>
    </div>
  );
};
export default Login;
