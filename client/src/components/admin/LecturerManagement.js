import React, { useState, useEffect } from 'react';
import SearchBar from './SearchBar';
import FilterBar from './FilterBar';
import { lecturerAPI } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { validateLecturerForm } from '../../utils/validation';

const LecturerManagement = () => {
  const [lecturers, setLecturers] = useState([]);
  const [filteredLecturers, setFilteredLecturers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    employmentStatus: '',
    sortBy: 'name'
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    specialization: '',
    employmentStatus: 'FULL_TIME'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchLecturers();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [lecturers, searchTerm, filters]);

  const fetchLecturers = async () => {
    try {
      setLoading(true);
      const response = await lecturerAPI.getAll();
      setLecturers(response.data);
      setFilteredLecturers(response.data);
    } catch (err) {
      setError('Failed to fetch lecturers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSearch = () => {
    let result = [...lecturers];

    // Apply search
    if (searchTerm) {
      result = result.filter(lecturer =>
        lecturer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lecturer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (filters.department) {
      result = result.filter(lecturer => lecturer.department === filters.department);
    }
    if (filters.employmentStatus) {
      result = result.filter(lecturer => lecturer.employmentStatus === filters.employmentStatus);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'department':
          return a.department.localeCompare(b.department);
        case 'joinDate':
          return new Date(b.joinDate) - new Date(a.joinDate);
        default:
          return 0;
      }
    });

    setFilteredLecturers(result);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const filterConfig = [
    {
      name: 'department',
      label: 'Department',
      placeholder: 'All Departments',
      value: filters.department,
      options: Array.from(new Set(lecturers.map(l => l.department)))
        .map(dept => ({ value: dept, label: dept }))
    },
    {
      name: 'employmentStatus',
      label: 'Employment Status',
      placeholder: 'All Statuses',
      value: filters.employmentStatus,
      options: [
        { value: 'FULL_TIME', label: 'Full Time' },
        { value: 'PART_TIME', label: 'Part Time' }
      ]
    },
    {
      name: 'sortBy',
      label: 'Sort By',
      placeholder: 'Sort By',
      value: filters.sortBy,
      options: [
        { value: 'name', label: 'Name' },
        { value: 'department', label: 'Department' },
        { value: 'joinDate', label: 'Join Date' }
      ]
    }
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { isValid, errors } = validateLecturerForm(formData);
    if (!isValid) {
      showNotification('error', Object.values(errors)[0]);
      return;
    }

    try {
      setLoading(true);
      await lecturerAPI.create(formData);
      showNotification('success', 'Lecturer created successfully');
      setFormData({
        name: '',
        email: '',
        department: '',
        specialization: '',
        employmentStatus: 'FULL_TIME'
      });
      fetchLecturers();
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to create lecturer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lecturer-management">
      <div className="management-header">
        <h1>Lecturer Management</h1>
        <div className="search-filter-container">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search by name or email..."
          />
          <FilterBar
            filters={filterConfig}
            onFilterChange={handleFilterChange}
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      
      <section className="add-lecturer-form">
        <h2>Add New Lecturer</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name:</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Email:</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Department:</label>
            <input 
              type="text" 
              name="department" 
              value={formData.department}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Specialization:</label>
            <input 
              type="text" 
              name="specialization" 
              value={formData.specialization}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label>Employment Status:</label>
            <select 
              name="employmentStatus" 
              value={formData.employmentStatus}
              onChange={handleInputChange}
            >
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
            </select>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Lecturer'}
          </button>
        </form>
      </section>

      <section className="lecturers-list">
        <h2>Current Lecturers</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="lecturers-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Join Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLecturers.map(lecturer => (
                  <tr key={lecturer._id}>
                    <td>{lecturer.name}</td>
                    <td>{lecturer.email}</td>
                    <td>{lecturer.department}</td>
                    <td>{lecturer.employmentStatus}</td>
                    <td>{new Date(lecturer.joinDate).toLocaleDateString()}</td>
                    <td>
                      <button onClick={() => handleEdit(lecturer._id)}>Edit</button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDelete(lecturer._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default LecturerManagement; 