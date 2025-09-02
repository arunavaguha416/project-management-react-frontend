import React from 'react';

const LeaveFilters = ({ filters, onFilterChange }) => {
  return (
    <div className="leave-filters">
      <div className="filter-group">
        <label htmlFor="status-filter">Filter by Status</label>
        <select
          id="status-filter"
          className="filter-select"
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>
      
      <div className="filter-group">
        <label htmlFor="search-filter">Search</label>
        <input
          id="search-filter"
          type="text"
          className="filter-input"
          placeholder="Search by employee email..."
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
        />
      </div>
    </div>
  );
};

export default LeaveFilters;
