import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/auth-context';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../services/axiosinstance';
import '../../assets/css/Auth.css';

const Register = () => {
  const { register } = useContext(AuthContext) || { register: () => {}, errors: {} };
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    salary: '',
    designation: '',
    password: '',
    confirmPassword: '',
    dob: '',
    role: '',
    department: '',
    company: '',
    joining: ''
  });

  const [departments, setDepartments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const steps = [
    { number: 1, title: 'Personal Info', icon: '👤' },
    { number: 2, title: 'Work Details', icon: '💼' },
    { number: 3, title: 'Account Setup', icon: '🔐' }
  ];

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [deptRes, compRes] = await Promise.all([
          axiosInstance.post('/department/list/'),
          axiosInstance.post('/company/list/')
        ]);
        
        if (deptRes.data.status) setDepartments(deptRes.data.records);
        if (compRes.data.status) setCompanies(compRes.data.records);
      } catch {
        setError('Failed to load company/department info.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(''); // Clear errors when user starts typing
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.name && formData.email && formData.dob;
      case 2:
        return formData.designation && formData.salary && formData.department && 
               formData.company && formData.role && formData.joining;
      case 3:
        return formData.username && formData.password && formData.confirmPassword;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      setError('');
    } else {
      setError('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    const data = {
      name: formData.name,
      email: formData.email,
      username: formData.username,
      password: formData.password,
      date_of_birth: formData.dob,
      date_of_joining: formData.joining,
      dept_id: formData.department,
      role: formData.role,
      comp_id: formData.company,
      salary: formData.salary,
      designation: formData.designation
    };

    try {
      setIsLoading(true);
      const success = await register(data);
      if (success) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    } catch (error) {
      setError(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <div className="step-header">
              <h3>Personal Information</h3>
              <p>Let's start with your basic details</p>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <div className="input-wrapper">
                  <div className="input-icon">👤</div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <div className="input-wrapper">
                  <div className="input-icon">📧</div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="dob">Date of Birth *</label>
                <div className="input-wrapper">
                  <div className="input-icon">📅</div>
                  <input
                    type="date"
                    id="dob"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <div className="step-header">
              <h3>Work Details</h3>
              <p>Tell us about your professional information</p>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="designation">Designation *</label>
                <div className="input-wrapper">
                  <div className="input-icon">💼</div>
                  <input
                    type="text"
                    id="designation"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    placeholder="e.g. Software Engineer"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="salary">Salary *</label>
                <div className="input-wrapper">
                  <div className="input-icon">💰</div>
                  <input
                    type="number"
                    id="salary"
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    placeholder="Annual salary"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="department">Department *</label>
                <div className="input-wrapper">
                  <div className="input-icon">🏢</div>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="company">Company *</label>
                <div className="input-wrapper">
                  <div className="input-icon">🏬</div>
                  <select
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    <option value="">Select Company</option>
                    {companies.map(comp => (
                      <option key={comp.id} value={comp.id}>
                        {comp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="role">Role *</label>
                <div className="input-wrapper">
                  <div className="input-icon">👨‍💼</div>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    <option value="">Select Role</option>
                    <option value="USER">Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="joining">Joining Date *</label>
                <div className="input-wrapper">
                  <div className="input-icon">📅</div>
                  <input
                    type="date"
                    id="joining"
                    name="joining"
                    value={formData.joining}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <div className="step-header">
              <h3>Account Setup</h3>
              <p>Create your login credentials</p>
            </div>
            
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="username">Username *</label>
                <div className="input-wrapper">
                  <div className="input-icon">@</div>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose a unique username"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <div className="input-wrapper">
                  <div className="input-icon">🔒</div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                    className="form-input"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <div className="input-wrapper">
                  <div className="input-icon">🔒</div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className="form-input"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
            </div>

            <div className="password-requirements">
              <h4>Password Requirements:</h4>
              <ul>
                <li className={formData.password.length >= 6 ? 'valid' : ''}>
                  At least 6 characters long
                </li>
                <li className={formData.password !== formData.confirmPassword || !formData.confirmPassword ? '' : 'valid'}>
                  Passwords match
                </li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="auth-container register">
      <div className="auth-background">
        <div className="bg-pattern"></div>
        <div className="bg-overlay"></div>
      </div>

      <div className="auth-content">
        {/* Left Side - Progress & Branding */}
        <div className="auth-branding register-branding">
          <div className="brand-content">
            {/* Back Button */}
            <div className="register-header">
              <button 
                className="back-btn-register"
                onClick={() => navigate('/hr-dashboard')}
                title="Back to Dashboard"
              >
                <span className="back-icon">←</span>
                <span className="back-text">Back to Dashboard</span>
              </button>
            </div>

            <div className="brand-logo">
              <div className="logo-icon">PM</div>
              <div className="logo-text">
                <h1>ProjectFlow</h1>
                <p>Management Suite</p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="progress-steps">
              <h3>Registration Progress</h3>
              <div className="steps-container">
                {steps.map((step) => (
                  <div
                    key={step.number}
                    className={`step-item ${currentStep >= step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}
                  >
                    <div className="step-circle">
                      {currentStep > step.number ? '✓' : step.icon}
                    </div>
                    <div className="step-info">
                      <span className="step-title">{step.title}</span>
                      <span className="step-number">Step {step.number}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="register-benefits">
              <h4>Why Join ProjectFlow?</h4>
              <ul>
                <li>🚀 Streamlined project management</li>
                <li>👥 Enhanced team collaboration</li>
                <li>📊 Comprehensive analytics</li>
                <li>🔒 Enterprise-grade security</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="auth-form-container">
          <div className="auth-form-content">
            <div className="form-header">
              <div className="form-logo">
                <div className="form-logo-icon">PM</div>
                <span>ProjectFlow</span>
              </div>
              <h2>Create Your Account</h2>
              <p>Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.title}</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <div className="error-icon">⚠️</div>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form multi-step">
              {renderStepContent()}

              {/* Navigation Buttons */}
              <div className="form-navigation">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="nav-btn prev-btn"
                    disabled={isLoading}
                  >
                    ← Previous
                  </button>
                )}

                {currentStep < steps.length ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="nav-btn next-btn"
                    disabled={isLoading || !validateStep(currentStep)}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={isLoading || !validateStep(currentStep)}
                  >
                    {isLoading ? (
                      <>
                        <div className="btn-spinner"></div>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <div className="btn-arrow">→</div>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>

            <div className="form-footer">
              <p>
                Already have an account?{' '}
                <Link to="/login" className="auth-link">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
