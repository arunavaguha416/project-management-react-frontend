import React from 'react';

const LeaveRequestForm = ({ 
  formData, 
  onChange, 
  onSubmit, 
  onCancel, 
  calculatingDays, 
  submitting, 
  userRole 
}) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange(prev => ({ ...prev, [name]: value }));
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="modal-overlay">
      <div className="modal-content leave-modal">
        <div className="modal-header">
          <h3>Apply for Leave</h3>
          <button 
            type="button" 
            className="modal-close" 
            onClick={onCancel}
            disabled={submitting}
          >
            ×
          </button>
        </div>
        
        <form className="leave-form" onSubmit={onSubmit}>
          <div className="modal-body">
            {/* Employee ID field for HR/Managers */}
            {(userRole === 'HR' || userRole === 'MANAGER') && (
              <div className="form-group">
                <label htmlFor="employee_id">Employee ID (Optional)</label>
                <input
                  type="text"
                  id="employee_id"
                  name="employee_id"
                  className="form-input"
                  placeholder="Leave blank to apply for yourself"
                  value={formData.employee_id}
                  onChange={handleInputChange}
                />
                <div className="form-help">
                  Leave blank to apply leave for yourself
                </div>
              </div>
            )}
            
            {/* Date inputs */}
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="start_date">Start Date *</label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  className="form-input"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  min={today}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="end_date">End Date *</label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  className="form-input"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  min={formData.start_date || today}
                  required
                />
              </div>
            </div>
            
            {/* Reason */}
            <div className="form-group">
              <label htmlFor="reason">Reason for Leave *</label>
              <textarea
                id="reason"
                name="reason"
                className="form-textarea"
                placeholder="Please provide a reason for your leave request..."
                value={formData.reason}
                onChange={handleInputChange}
                rows={4}
                required
              />
            </div>
            
            {/* Leave summary */}
            <div className="leave-summary">
              <div className="summary-item">
                <span>Days Requested:</span>
                <span><strong>{calculatingDays} days</strong></span>
              </div>
              {formData.start_date && formData.end_date && (
                <div className="summary-item">
                  <span>Period:</span>
                  <span>{formData.start_date} to {formData.end_date}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={submitting || !formData.start_date || !formData.end_date || !formData.reason.trim()}
            >
              {submitting ? (
                <>
                  <div className="spinner"></div>
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveRequestForm;
