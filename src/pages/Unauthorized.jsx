// pages/Unauthorized.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/auth-context';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoToDashboard = () => {
    if (user) {
      // Redirect based on user role
      switch (user.role) {
        case 'HR':
        case 'ADMIN':
          navigate('/hr-dashboard');
          break;
        case 'MANAGER':
          navigate('/manager-dashboard');
          break;
        case 'EMPLOYEE':
          navigate('/employee-dashboard');
          break;
        default:
          navigate('/login');
      }
    } else {
      navigate('/login');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center" style={{ background: 'var(--jira-bg)' }}>
      <div className="card shadow-lg" style={{ maxWidth: '500px', width: '100%' }}>
        <div className="card-body text-center p-5">
          {/* Error Icon */}
          <div className="mb-4">
            <div 
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{ 
                width: '80px', 
                height: '80px', 
                backgroundColor: 'var(--jira-error)', 
                color: 'white' 
              }}
            >
              <i className="fas fa-lock fa-2x"></i>
            </div>
          </div>

          {/* Error Code */}
          <h1 className="display-1 fw-bold mb-3" style={{ color: 'var(--jira-error)' }}>
            403
          </h1>

          {/* Error Title */}
          <h2 className="h3 mb-3" style={{ color: 'var(--jira-header-text)' }}>
            Access Denied
          </h2>

          {/* Error Description */}
          <p className="text-muted mb-4 lead">
            You don't have permission to access this page.
            <br />
            <small>Please contact your administrator if you believe this is an error.</small>
          </p>

          {/* User Info */}
          {user && (
            <div className="alert alert-info mb-4">
              <small>
                <strong>Current Role:</strong> {user.role}
                <br />
                <strong>User:</strong> {user.name || user.username}
              </small>
            </div>
          )}

          {/* Action Buttons */}
          <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
            <button 
              onClick={handleGoBack}
              className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
              style={{ minWidth: '120px' }}
            >
              <i className="fas fa-arrow-left me-2"></i>
              Go Back
            </button>

            <button 
              onClick={handleGoToDashboard}
              className="btn btn-primary d-flex align-items-center justify-content-center"
              style={{ 
                minWidth: '120px',
                backgroundColor: 'var(--jira-primary)',
                borderColor: 'var(--jira-primary)'
              }}
            >
              <i className="fas fa-home me-2"></i>
              Dashboard
            </button>

            <button 
              onClick={handleLogout}
              className="btn btn-outline-danger d-flex align-items-center justify-content-center"
              style={{ minWidth: '120px' }}
            >
              <i className="fas fa-sign-out-alt me-2"></i>
              Logout
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-4 pt-4 border-top">
            <small className="text-muted">
              <i className="fas fa-info-circle me-1"></i>
              Need help? Contact your system administrator or HR department.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
