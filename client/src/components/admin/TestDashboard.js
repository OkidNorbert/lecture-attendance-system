import React, { useState } from 'react';
import { testFeatures } from '../../utils/testFeatures';
import * as XLSX from 'xlsx-js-style';

const TestDashboard = () => {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runTests = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await testFeatures();
      setTestResults(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="test-dashboard">
      <h2>Feature Testing Dashboard</h2>
      <button 
        onClick={runTests}
        disabled={loading}
      >
        {loading ? 'Running Tests...' : 'Run Tests'}
      </button>

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      {testResults && (
        <div className="test-results">
          <h3>Test Results:</h3>
          <ul>
            <li>
              Lecturer Management: 
              <span className={testResults.lecturerManagement ? 'success' : 'failure'}>
                {testResults.lecturerManagement ? '✅ Passed' : '❌ Failed'}
              </span>
            </li>
            <li>
              Reports Generation: 
              <span className={testResults.reports ? 'success' : 'failure'}>
                {testResults.reports ? '✅ Passed' : '❌ Failed'}
              </span>
            </li>
            <li>
              Bulk Operations: 
              <span className={testResults.bulkOperations ? 'success' : 'failure'}>
                {testResults.bulkOperations ? '✅ Passed' : '❌ Failed'}
              </span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default TestDashboard; 