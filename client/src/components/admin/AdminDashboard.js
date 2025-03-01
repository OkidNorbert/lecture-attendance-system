import React, { useState } from 'react';

const AdminDashboard = () => {
  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <nav className="admin-nav">
          <ul>
            <li><button onClick={() => setActiveView('lecturers')}>Manage Lecturers</button></li>
            <li><button onClick={() => setActiveView('courses')}>Manage Courses</button></li>
            <li><button onClick={() => setActiveView('assignments')}>Course Assignments</button></li>
            <li><button onClick={() => setActiveView('reports')}>Reports</button></li>
          </ul>
        </nav>
      </header>
      
      <main className="dashboard-content">
        {/* Content will be rendered based on activeView */}
      </main>
    </div>
  );
};

export default AdminDashboard; 