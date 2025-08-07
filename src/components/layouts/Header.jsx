import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/auth-context";

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary py-2">
      <div className="container">
        <Link to="/dashboard" className="navbar-brand fw-bold">
          <span style={{letterSpacing: '0.04em'}}>Project<span style={{color: "#FFAB00"}}>Manager</span></span>
        </Link>
        <div className="d-flex align-items-center ms-auto">
          {user && (
            <>
              <span className="text-white fw-bold me-3">
                {user.name || user.email} &nbsp;
                <span className="badge bg-light text-primary">{user.role}</span>
              </span>
              <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>Logout</button>
            </>
          )}
          {!user && (
            <Link to="/login" className="btn btn-light btn-sm">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
