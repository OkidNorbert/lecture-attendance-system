import React, { useState, useEffect } from 'react';
import { courseAssignmentAPI, lecturerAPI } from '../../services/api';

const CourseAssignment = () => {
  const [assignments, setAssignments] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    lecturerId: '',
    courseId: '',
    courseName: '',
    courseCode: '',
    semester: '1',
    academicYear: new Date().getFullYear().toString(),
    studentYear: '1',
    courseUnit: '3'
  });

  useEffect(() => {
    fetchAssignments();
    fetchLecturers();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await courseAssignmentAPI.getAll();
      setAssignments(response.data);
    } catch (err) {
      setError('Failed to fetch assignments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLecturers = async () => {
    try {
      const response = await lecturerAPI.getAll();
      setLecturers(response.data);
    } catch (err) {
      setError('Failed to fetch lecturers');
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await courseAssignmentAPI.create(formData);
      setFormData({
        ...formData,
        courseId: '',
        courseName: '',
        courseCode: '',
        lecturerId: ''
      });
      fetchAssignments();
    } catch (err) {
      setError('Failed to create assignment');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="course-assignment">
      {error && <div className="error-message">{error}</div>}
      
      <section className="assignment-form">
        <h2>Assign Course to Lecturer</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Lecturer:</label>
            <select 
              name="lecturerId" 
              value={formData.lecturerId}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a lecturer</option>
              {lecturers.map(lecturer => (
                <option key={lecturer._id} value={lecturer._id}>
                  {lecturer.name} - {lecturer.department}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Course Name:</label>
            <input 
              type="text"
              name="courseName"
              value={formData.courseName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Course Code:</label>
            <input 
              type="text"
              name="courseCode"
              value={formData.courseCode}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Course Units:</label>
            <input 
              type="number"
              name="courseUnit"
              value={formData.courseUnit}
              onChange={handleInputChange}
              min="1"
              max="6"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Semester:</label>
              <select 
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                required
              >
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
            </div>

            <div className="form-group">
              <label>Academic Year:</label>
              <input 
                type="text"
                name="academicYear"
                value={formData.academicYear}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Student Year:</label>
              <select 
                name="studentYear"
                value={formData.studentYear}
                onChange={handleInputChange}
                required
              >
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Assigning...' : 'Assign Course'}
          </button>
        </form>
      </section>

      <section className="assignments-list">
        <h2>Current Course Assignments</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Lecturer</th>
                <th>Course</th>
                <th>Units</th>
                <th>Semester</th>
                <th>Year</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(assignment => (
                <tr key={assignment._id}>
                  <td>{assignment.lecturer.name}</td>
                  <td>{assignment.course.name} ({assignment.course.code})</td>
                  <td>{assignment.courseUnit}</td>
                  <td>Semester {assignment.semester}</td>
                  <td>{assignment.academicYear}</td>
                  <td>
                    <button onClick={() => handleEdit(assignment._id)}>Edit</button>
                    <button onClick={() => handleDelete(assignment._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default CourseAssignment; 