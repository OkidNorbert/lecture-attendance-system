import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';

function App() {
  return (
    <NotificationProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<div>Home Page</div>} />
          </Routes>
        </div>
      </Router>
    </NotificationProvider>
  );
}

export default App; 