import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/auth-context';
import axiosInstance from '../../services/axiosinstance';
import '../../assets/css/GenerateInvoice.css';

const GenerateInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [project, setProject] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Enhanced invoice configuration with charging mode
  const [invoiceConfig, setInvoiceConfig] = useState({
    chargingMode: 'per_task', // 'per_task' or 'per_hour'
    baseRate: 100,
    taxRate: 0.18,
    currency: 'USD'
  });

  // Fetch project data with useCallback to avoid dependency issues
  const fetchProjectData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Fetch project details, team members, and tasks in parallel
      const [projectRes, teamRes, tasksRes] = await Promise.all([
        axiosInstance.get(`/projects/details/${id}/`, {
          headers: { Authorization: `Bearer ${user.token}` }
        }),
        axiosInstance.post('/teams/members/', 
          { project_id: id, page_size: 50 },
          { headers: { Authorization: `Bearer ${user.token}` } }
        ),
        axiosInstance.post('/projects/tasks/list/', 
          { project_id: id, page_size: 100 },
          { headers: { Authorization: `Bearer ${user.token}` } }
        )
      ]);

      if (projectRes.data.status) {
        const projectData = projectRes.data.records;
        setProject(projectData);
        
        // Check if project is completed
        if (projectData.status !== 'Completed') {
          setError('Invoice can only be generated for completed projects');
        }
      } else {
        setError('Project not found');
      }

      if (teamRes.data.status) {
        setTeamMembers(teamRes.data.records || []);
      }

      if (tasksRes.data.status) {
        setTasks(tasksRes.data.records || []);
      }

    } catch (error) {
      console.error('Error fetching project data:', error);
      setError('Failed to load project data');
    } finally {
      setIsLoading(false);
    }
  }, [id, user.token]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // Enhanced calculation with charging mode support
  const calculateInvoiceAmount = useCallback(() => {
    const completedTasks = tasks.filter(task => 
      task.status === 'COMPLETED' || task.status === 'DONE'
    );
    
    const teamSize = teamMembers.length;
    const teamMultiplier = Math.max(1, 1 + (teamSize * 0.1)); // 10% increase per team member
    
    const priorityMultiplier = {
      'LOW': 0.8,
      'MEDIUM': 1.0,
      'HIGH': 1.2,
      'CRITICAL': 1.5
    }[project?.priority] || 1.0;

    let baseAmount = 0;
    let units = 0;

    if (invoiceConfig.chargingMode === 'per_task') {
      units = completedTasks.length;
      baseAmount = units * invoiceConfig.baseRate;
    } else { // per_hour
      units = completedTasks.length * 8; // Assuming 8 hours per completed task
      baseAmount = units * invoiceConfig.baseRate;
    }

    const subtotal = baseAmount * teamMultiplier * priorityMultiplier;
    const taxAmount = subtotal * invoiceConfig.taxRate;
    const total = subtotal + taxAmount;

    return {
      completedTasks: completedTasks.length,
      estimatedHours: invoiceConfig.chargingMode === 'per_hour' ? units : 0,
      units,
      teamSize,
      baseRate: invoiceConfig.baseRate,
      teamMultiplier,
      priorityMultiplier,
      baseAmount,
      subtotal,
      taxAmount,
      total
    };
  }, [tasks, teamMembers, project?.priority, invoiceConfig]);

  const generateInvoice = async () => {
    try {
      setIsGenerating(true);
      
      const response = await axiosInstance.post('/projects/generate-invoice/', 
        { 
          project_id: id,
          config: invoiceConfig
        },
        { 
          headers: { Authorization: `Bearer ${user.token}` },
          responseType: 'blob'
        }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = `invoice-${project?.name?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'project'}-${new Date().toISOString().split('T')[0]}.pdf`;
      link.setAttribute('download', fileName);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      // Show success message and navigate back
      alert('Invoice generated successfully!');
      setTimeout(() => navigate('/projects'), 1500);
      
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Failed to generate invoice. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfigChange = (field, value) => {
    setInvoiceConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="generate-invoice-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading project data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="generate-invoice-container">
        <div className="error-state">
          <h2>Error</h2>
          <p className="error-message">{error}</p>
          <button onClick={() => navigate('/project-list')} className="btn btn-secondary">
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const invoiceCalculation = calculateInvoiceAmount();

  return (
    <div className="generate-invoice-container">
      <div className="invoice-header">
        <h2>Generate Invoice</h2>
        <button onClick={() => navigate('/project-list')} className="back-btn">
          <i className="fas fa-arrow-left"></i> Back to Projects
        </button>
      </div>

      {/* Project Summary */}
      <div className="invoice-section project-summary">
        <h3>Project Details</h3>
        <div className="project-info-grid">
          <div className="info-item">
            <label>Project Name:</label>
            <span>{project?.name || 'N/A'}</span>
          </div>
          <div className="info-item">
            <label>Status:</label>
            <span className={`status-badge ${project?.status?.toLowerCase()}`}>
              {project?.status}
            </span>
          </div>
          <div className="info-item">
            <label>Manager:</label>
            <span>{project?.manager_name || 'Unassigned'}</span>
          </div>
          <div className="info-item">
            <label>Priority:</label>
            <span className={`priority-badge ${project?.priority?.toLowerCase()}`}>
              {project?.priority}
            </span>
          </div>
          <div className="info-item">
            <label>Start Date:</label>
            <span>{project?.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}</span>
          </div>
          <div className="info-item">
            <label>End Date:</label>
            <span>{project?.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}</span>
          </div>
        </div>
        
      </div>

      {/* Team Members */}
      <div className="invoice-section team-section">
        <h3>Team Members ({teamMembers.length})</h3>
        {teamMembers.length > 0 ? (
          <div className="team-grid">
            {teamMembers.map((member, index) => (
              <div key={index} className="team-member-card">
                <div className="member-avatar">
                  {(member.employee_name || member.name || 'U')[0].toUpperCase()}
                </div>
                <div className="member-info">
                  <h4>{member.employee_name || member.name || 'Unknown'}</h4>
                  <p>{member.designation || member.role || 'Team Member'}</p>
                  
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No team members assigned</p>
        )}
      </div>

      {/* Tasks Summary */}
      <div className="invoice-section tasks-section">
        <h3>Tasks Summary</h3>
        <div className="tasks-stats">
          <div className="stat-item">
            <span className="stat-number">{tasks.length}</span>
            <span className="stat-label">Total Tasks</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{invoiceCalculation.completedTasks}</span>
            <span className="stat-label">Completed Tasks</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{tasks.length - invoiceCalculation.completedTasks}</span>
            <span className="stat-label">Remaining Tasks</span>
          </div>
        </div>
      </div>

      {/* ENHANCED Invoice Configuration with Charging Mode */}
      <div className="invoice-section config-section">
        <h3>Invoice Configuration</h3>
        <div className="config-grid">
          {/* NEW: Charging Mode Selection */}
          <div className="config-item charging-mode-selector">
            <label htmlFor="chargingMode">Charging Mode:</label>
            <select
              id="chargingMode"
              value={invoiceConfig.chargingMode}
              onChange={(e) => handleConfigChange('chargingMode', e.target.value)}
              className="config-select"
            >
              <option value="per_task">Per Task</option>
              <option value="per_hour">Per Hour</option>
            </select>
          </div>
          
          <div className="config-item">
            <label htmlFor="baseRate">
              {invoiceConfig.chargingMode === 'per_task' ? 'Base Rate per Task:' : 'Hourly Rate:'}
            </label>
            <div className="input-group">
              <span className="currency-symbol">$</span>
              <input
                id="baseRate"
                type="number"
                min="1"
                step="10"
                value={invoiceConfig.baseRate}
                onChange={(e) => handleConfigChange('baseRate', parseFloat(e.target.value) || 0)}
                className="config-input"
              />
            </div>
          </div>
          
          <div className="config-item">
            <label htmlFor="taxRate">Tax Rate:</label>
            <div className="input-group">
              <input
                id="taxRate"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={invoiceConfig.taxRate}
                onChange={(e) => handleConfigChange('taxRate', parseFloat(e.target.value) || 0)}
                className="config-input"
              />
              <span className="percentage-symbol">%</span>
            </div>
          </div>
          
          <div className="config-item">
            <label htmlFor="currency">Currency:</label>
            <select
              id="currency"
              value={invoiceConfig.currency}
              onChange={(e) => handleConfigChange('currency', e.target.value)}
              className="config-select"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ENHANCED Invoice Preview with Charging Mode Support */}
      <div className="invoice-section preview-section">
        <h3>Invoice Preview</h3>
        <div className="invoice-preview">
          <div className="calculation-row mode-indicator">
            <span>Billing Mode: {invoiceConfig.chargingMode === 'per_task' ? 'Per Task' : 'Per Hour'}</span>
            <span>
              {invoiceConfig.chargingMode === 'per_task' 
                ? `${invoiceCalculation.completedTasks} Tasks` 
                : `${invoiceCalculation.estimatedHours} Hours`}
            </span>
          </div>

          {invoiceConfig.chargingMode === 'per_task' ? (
            <div className="calculation-row">
              <span>Completed Tasks ({invoiceCalculation.completedTasks} × ${invoiceConfig.baseRate}):</span>
              <span>${(invoiceCalculation.completedTasks * invoiceConfig.baseRate).toFixed(2)}</span>
            </div>
          ) : (
            <>
              <div className="calculation-row">
                <span>Estimated Hours ({invoiceCalculation.estimatedHours} hrs):</span>
                <span>${(invoiceCalculation.estimatedHours * invoiceConfig.baseRate).toFixed(2)}</span>
              </div>
              <div className="calculation-row">
                <span>Hourly Rate:</span>
                <span>${invoiceConfig.baseRate}/hr</span>
              </div>
            </>
          )}

          <div className="calculation-row">
            <span>Team Size Multiplier ({invoiceCalculation.teamSize} members × 10%):</span>
            <span>×{invoiceCalculation.teamMultiplier.toFixed(2)}</span>
          </div>
          <div className="calculation-row">
            <span>Priority Multiplier ({project?.priority}):</span>
            <span>×{invoiceCalculation.priorityMultiplier.toFixed(2)}</span>
          </div>
          <div className="calculation-row subtotal">
            <span>Subtotal:</span>
            <span>${invoiceCalculation.subtotal.toFixed(2)}</span>
          </div>
          <div className="calculation-row">
            <span>Tax ({(invoiceConfig.taxRate * 100).toFixed(0)}%):</span>
            <span>${invoiceCalculation.taxAmount.toFixed(2)}</span>
          </div>
          <div className="calculation-row total">
            <span>Total Amount:</span>
            <span>${invoiceCalculation.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="invoice-actions">
        <button 
          onClick={generateInvoice}
          disabled={isGenerating || project?.status !== 'Completed' || invoiceCalculation.completedTasks === 0}
          className="btn btn-primary generate-btn"
        >
          {isGenerating ? (
            <>
              <div className="btn-spinner"></div>
              Generating Invoice...
            </>
          ) : (
            <>
              <i className="fas fa-file-pdf"></i>
              Generate Invoice PDF
            </>
          )}
        </button>
        
        <button 
          onClick={() => navigate('/projects')} 
          className="btn btn-secondary"
          disabled={isGenerating}
        >
          Cancel
        </button>
      </div>

      {invoiceCalculation.completedTasks === 0 && (
        <div className="warning-message">
          <i className="fas fa-exclamation-triangle"></i>
          No completed tasks found. Invoice cannot be generated without completed tasks.
        </div>
      )}
    </div>
  );
};

export default GenerateInvoice;
