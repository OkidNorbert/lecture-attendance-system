import React from 'react';

const FilterBar = ({ filters, onFilterChange }) => {
  return (
    <div className="filter-bar">
      {filters.map(filter => (
        <div key={filter.name} className="filter-group">
          <label>{filter.label}:</label>
          <select
            value={filter.value}
            onChange={(e) => onFilterChange(filter.name, e.target.value)}
          >
            <option value="">{filter.placeholder}</option>
            {filter.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
};

export default FilterBar; 