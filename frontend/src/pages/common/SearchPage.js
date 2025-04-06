import React, { useState, useContext } from 'react';
import { AuthContext } from '../../auth/AuthContext';
import { employeeService } from '../../services/employeeService';
import '../../styles/Search.css';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  const { user } = useContext(AuthContext);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    setSearchResults([]);
    setSelectedEmployee(null);

    try {
      const results = await employeeService.searchEmployees(searchQuery);
      setSearchResults(results);
    } catch (err) {
      setError('Failed to search employees. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
  };

  const handleVerifyEmployment = async () => {
    if (!selectedEmployee) return;

    setLoading(true);
    setError('');

    try {
      await employeeService.verifyEmployment(selectedEmployee.id);
      setSelectedEmployee({
        ...selectedEmployee,
        verification_status: 'verified'
      });
    } catch (err) {
      setError('Failed to verify employment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-container">
      <div className="search-header">
        <h1>Employment Verification</h1>
        <p>Search and verify employment history</p>
      </div>

      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, company, or position..."
            className="search-input"
          />
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && <div className="error-message">{error}</div>}

      <div className="search-results">
        {searchResults.length > 0 ? (
          <div className="results-grid">
            {searchResults.map(employee => (
              <div
                key={employee.id}
                className={`result-card ${selectedEmployee?.id === employee.id ? 'selected' : ''}`}
                onClick={() => handleSelectEmployee(employee)}
              >
                <h3>{employee.name}</h3>
                <p><strong>Company:</strong> {employee.company_name}</p>
                <p><strong>Position:</strong> {employee.position}</p>
                <p><strong>Status:</strong> {employee.verification_status}</p>
                <p><strong>Period:</strong> {employee.start_date} - {employee.end_date || 'Present'}</p>
              </div>
            ))}
          </div>
        ) : searchQuery && !loading && (
          <div className="no-results">
            No employees found matching your search.
          </div>
        )}
      </div>

      {selectedEmployee && (
        <div className="verification-panel">
          <h2>Verify Employment</h2>
          <div className="employee-details">
            <p><strong>Name:</strong> {selectedEmployee.name}</p>
            <p><strong>Company:</strong> {selectedEmployee.company_name}</p>
            <p><strong>Position:</strong> {selectedEmployee.position}</p>
            <p><strong>Period:</strong> {selectedEmployee.start_date} - {selectedEmployee.end_date || 'Present'}</p>
            <p><strong>Status:</strong> {selectedEmployee.verification_status}</p>
          </div>
          {selectedEmployee.verification_status !== 'verified' && (
            <button
              onClick={handleVerifyEmployment}
              className="verify-button"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify Employment'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage; 