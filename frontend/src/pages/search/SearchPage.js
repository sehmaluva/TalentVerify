import React, { useState } from 'react';
import { employeeService } from '../../services/employeeService';
import './SearchPage.css';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useState({
    name: '',
    employer: '',
    position: '',
    department: '',
    yearStarted: '',
    yearLeft: ''
  });
  
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const results = await employeeService.searchEmployees({
        name: searchParams.name,
        employer: searchParams.employer,
        position: searchParams.position,
        department: searchParams.department,
        year_started: searchParams.yearStarted,
        year_left: searchParams.yearLeft
      });
      setSearchResults(results);
    } catch (err) {
      setError('Failed to search employees. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="search-page">
      <h2>Search Employee Records</h2>
      
      <form onSubmit={handleSubmit} className="search-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Employee Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={searchParams.name}
              onChange={handleChange}
              placeholder="Enter employee name"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="employer">Employer</label>
            <input
              type="text"
              id="employer"
              name="employer"
              value={searchParams.employer}
              onChange={handleChange}
              placeholder="Enter employer name"
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="position">Position</label>
            <input
              type="text"
              id="position"
              name="position"
              value={searchParams.position}
              onChange={handleChange}
              placeholder="Enter position"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="department">Department</label>
            <input
              type="text"
              id="department"
              name="department"
              value={searchParams.department}
              onChange={handleChange}
              placeholder="Enter department"
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="yearStarted">Year Started</label>
            <input
              type="text"
              id="yearStarted"
              name="yearStarted"
              value={searchParams.yearStarted}
              onChange={handleChange}
              placeholder="YYYY"
              pattern="\\d{4}"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="yearLeft">Year Left</label>
            <input
              type="text"
              id="yearLeft"
              name="yearLeft"
              value={searchParams.yearLeft}
              onChange={handleChange}
              placeholder="YYYY"
              pattern="\\d{4}"
            />
          </div>
        </div>
        
        <button type="submit" className="search-button" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
      
      {error && <div className="error-message">{error}</div>}
      
      {searchResults.length > 0 ? (
        <div className="search-results">
          <h3>Search Results</h3>
          <div className="results-grid">
            {searchResults.map((employee, index) => (
              <div key={index} className="result-card">
                <h4>{employee.name}</h4>
                <p><strong>Company:</strong> {employee.company.name}</p>
                <p><strong>Departments:</strong> {employee.departments.join(', ')}</p>
                <p><strong>Roles:</strong> {employee.roles.join(', ')}</p>
                <div className="role-history">
                  <h5>Role History</h5>
                  {employee.roles.map((role, roleIndex) => (
                    <div key={roleIndex} className="role-entry">
                      <p><strong>Role:</strong> {role}</p>
                      <p><strong>Department:</strong> {employee.departments[roleIndex]}</p>
                      <p><strong>Started:</strong> {employee.start_dates[roleIndex]}</p>
                      {employee.end_dates[roleIndex] && (
                        <p><strong>Left:</strong> {employee.end_dates[roleIndex]}</p>
                      )}
                      {employee.duties[roleIndex] && (
                        <p><strong>Duties:</strong> {employee.duties[roleIndex].join(', ')}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        !loading && <p className="no-results">No results found</p>
      )}
    </div>
  );
};

export default SearchPage; 