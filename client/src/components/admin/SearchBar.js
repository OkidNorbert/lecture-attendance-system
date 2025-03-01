import React from 'react';

const SearchBar = ({ onSearch, placeholder }) => {
  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder={placeholder}
        onChange={(e) => onSearch(e.target.value)}
        className="search-input"
      />
      <i className="search-icon">🔍</i>
    </div>
  );
};

export default SearchBar; 