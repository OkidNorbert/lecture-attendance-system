import React, { useState, useEffect } from 'react';
import { lecturerAPI, courseAssignmentAPI } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import * as XLSX from 'xlsx';

const Reports = () => {
  const [data, setData] = useState({
    lecturers: [],
    assignments: []
  });
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('lecturer');
  const [filters, setFilters] = useState({
    department: '',
    semester: '',
    academicYear: new Date().getFullYear().toString()
  });
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lecturersRes, assignmentsRes] = await Promise.all([
        lecturerAPI.getAll(),
        courseAssignmentAPI.getAll()
      ]);
      setData({
        lecturers: lecturersRes.data,
        assignments: assignmentsRes.data
      });
    } catch (error) {
      showNotification('error', 'Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = () => {
    let reportData = [];
    
    switch(reportType) {
      case 'lecturer':
        reportData = generateLecturerReport();
        break;
      case 'course':
        reportData = generateCourseReport();
        break;
      case 'workload':
        reportData = generateWorkloadReport();
        break;
      default:
        showNotification('error', 'Invalid report type');
        return;
    }

    exportToExcel(reportData, `${reportType}_report`);
  };

  const generateLecturerReport = () => {
    return data.lecturers
      .filter(lecturer => 
        !filters.department || lecturer.department === filters.department
      )
      .map(lecturer => ({
        'Name': lecturer.name,
        'Email': lecturer.email,
        'Department': lecturer.department,
        'Employment Status': lecturer.employmentStatus,
        'Specialization': lecturer.specialization,
        'Join Date': new Date(lecturer.joinDate).toLocaleDateString()
      }));
  };

  const generateCourseReport = () => {
    return data.assignments
      .filter(assignment => 
        (!filters.semester || assignment.semester.toString() === filters.semester) &&
        (!filters.academicYear || assignment.academicYear === filters.academicYear)
      )
      .map(assignment => ({
        'Course Name': assignment.course.name,
        'Course Code': assignment.course.code,
        'Lecturer': assignment.lecturer.name,
        'Department': assignment.lecturer.department,
        'Semester': assignment.semester,
        'Academic Year': assignment.academicYear,
        'Course Units': assignment.courseUnit
      }));
  };

  const generateWorkloadReport = () => {
    const workloadMap = new Map();

    data.assignments.forEach(assignment => {
      const lecturerId = assignment.lecturer._id;
      if (!workloadMap.has(lecturerId)) {
        workloadMap.set(lecturerId, {
          name: assignment.lecturer.name,
          department: assignment.lecturer.department,
          totalUnits: 0,
          courses: []
        });
      }
      
      const lecturer = workloadMap.get(lecturerId);
      lecturer.totalUnits += assignment.courseUnit;
      lecturer.courses.push(assignment.course.name);
    });

    return Array.from(workloadMap.values()).map(lecturer => ({
      'Lecturer Name': lecturer.name,
      'Department': lecturer.department,
      'Total Course Units': lecturer.totalUnits,
      'Number of Courses': lecturer.courses.length,
      'Courses': lecturer.courses.join(', ')
    }));
  };

  const exportToExcel = (data, fileName) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="reports-container">
      <h1>Generate Reports</h1>

      <div className="report-controls">
        <div className="control-group">
          <label>Report Type:</label>
          <select 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="lecturer">Lecturer Report</option>
            <option value="course">Course Report</option>
            <option value="workload">Workload Report</option>
          </select>
        </div>

        {reportType !== 'workload' && (
          <>
            {reportType === 'lecturer' && (
              <div className="control-group">
                <label>Department:</label>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters({...filters, department: e.target.value})}
                >
                  <option value="">All Departments</option>
                  {Array.from(new Set(data.lecturers.map(l => l.department))).map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            )}

            {reportType === 'course' && (
              <>
                <div className="control-group">
                  <label>Semester:</label>
                  <select
                    value={filters.semester}
                    onChange={(e) => setFilters({...filters, semester: e.target.value})}
                  >
                    <option value="">All Semesters</option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                  </select>
                </div>

                <div className="control-group">
                  <label>Academic Year:</label>
                  <input
                    type="text"
                    value={filters.academicYear}
                    onChange={(e) => setFilters({...filters, academicYear: e.target.value})}
                    placeholder="YYYY"
                  />
                </div>
              </>
            )}
          </>
        )}

        <button 
          className="generate-btn"
          onClick={generateReport}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      <div className="report-preview">
        <h2>Report Preview</h2>
        {loading ? (
          <div className="loading">Loading data...</div>
        ) : (
          <table>
            <thead>
              <tr>
                {reportType === 'lecturer' && (
                  <>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Status</th>
                  </>
                )}
                {reportType === 'course' && (
                  <>
                    <th>Course</th>
                    <th>Lecturer</th>
                    <th>Units</th>
                  </>
                )}
                {reportType === 'workload' && (
                  <>
                    <th>Lecturer</th>
                    <th>Total Units</th>
                    <th>Courses</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {/* Preview data rows */}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Reports; 