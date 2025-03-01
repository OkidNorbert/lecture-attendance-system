import React, { useState, useEffect } from 'react';
import { lecturerAPI, courseAssignmentAPI } from '../../services/api';
import { Chart as ChartJS } from 'chart.js/auto';
import { Bar, Pie } from 'react-chartjs-2';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalLecturers: 0,
    totalCourses: 0,
    departmentStats: {},
    courseUnitDistribution: {},
    employmentStatusCount: {
      FULL_TIME: 0,
      PART_TIME: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [lecturersResponse, assignmentsResponse] = await Promise.all([
        lecturerAPI.getAll(),
        courseAssignmentAPI.getAll()
      ]);

      const lecturers = lecturersResponse.data;
      const assignments = assignmentsResponse.data;

      // Process data for statistics
      const departmentStats = {};
      const employmentStatusCount = { FULL_TIME: 0, PART_TIME: 0 };
      const courseUnitDistribution = {};

      lecturers.forEach(lecturer => {
        // Department stats
        departmentStats[lecturer.department] = (departmentStats[lecturer.department] || 0) + 1;
        // Employment status
        employmentStatusCount[lecturer.employmentStatus]++;
      });

      assignments.forEach(assignment => {
        courseUnitDistribution[assignment.courseUnit] = 
          (courseUnitDistribution[assignment.courseUnit] || 0) + 1;
      });

      setStats({
        totalLecturers: lecturers.length,
        totalCourses: assignments.length,
        departmentStats,
        courseUnitDistribution,
        employmentStatusCount
      });
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const departmentChartData = {
    labels: Object.keys(stats.departmentStats),
    datasets: [{
      label: 'Lecturers by Department',
      data: Object.values(stats.departmentStats),
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF'
      ]
    }]
  };

  const employmentStatusData = {
    labels: ['Full Time', 'Part Time'],
    datasets: [{
      data: [
        stats.employmentStatusCount.FULL_TIME,
        stats.employmentStatusCount.PART_TIME
      ],
      backgroundColor: ['#36A2EB', '#FFCE56']
    }]
  };

  if (loading) return <div className="loading">Loading dashboard data...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="dashboard">
      <h1>Admin Dashboard</h1>
      
      <div className="stats-cards">
        <div className="stat-card">
          <h3>Total Lecturers</h3>
          <p className="stat-number">{stats.totalLecturers}</p>
        </div>
        <div className="stat-card">
          <h3>Total Courses</h3>
          <p className="stat-number">{stats.totalCourses}</p>
        </div>
        <div className="stat-card">
          <h3>Departments</h3>
          <p className="stat-number">{Object.keys(stats.departmentStats).length}</p>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-box">
          <h3>Department Distribution</h3>
          <Bar 
            data={departmentChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom'
                }
              }
            }}
          />
        </div>

        <div className="chart-box">
          <h3>Employment Status</h3>
          <Pie 
            data={employmentStatusData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom'
                }
              }
            }}
          />
        </div>
      </div>

      <div className="recent-activity">
        <h3>Course Unit Distribution</h3>
        <div className="unit-distribution">
          {Object.entries(stats.courseUnitDistribution).map(([unit, count]) => (
            <div key={unit} className="unit-item">
              <span>{unit} Units:</span>
              <span>{count} Courses</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 