import React, { useState, useContext } from 'react';
import { employeeService } from '../../services/employeeService';
import { AuthContext } from '../../auth/AuthContext';
import './BulkUpload.css';

const EmployeeBulkUpload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const { user } = useContext(AuthContext);
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ];
      
      if (validTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Please upload a CSV, Excel, or text file');
        setFile(null);
      }
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    setLoading(true);
    setError('');
    setResults(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    // If user is a company user, use their company ID
    if (user.is_company_user) {
      formData.append('company_id', user.company.id);
    }
    
    try {
      const response = await employeeService.bulkUpload(formData);
      setResults(response);
      if (response.errors && response.errors.length > 0) {
        setError('Some records could not be processed. Please check the errors below.');
      }
    } catch (err) {
      setError(err.message || 'Failed to upload employees. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const downloadTemplate = () => {
    // Create CSV template
    const headers = [
      'name',
      'employee_id',
      'department',
      'position',
      'start_dates',
      'end_dates',
      'duties'
    ];
    
    const csvContent = [
      headers.join(','),
      'John Doe,EMP001,"[""IT""]","[""Developer""]","[""2023-01-01""]","[]","[""Coding"",""Testing""]"'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };
  
  return (
    <div className="bulk-upload">
      <h3>Bulk Upload Employees</h3>
      
      <div className="template-section">
        <p>Download the template file to see the required format:</p>
        <button onClick={downloadTemplate} className="template-button">
          Download Template
        </button>
        <div className="template-info">
          <h4>Template Format:</h4>
          <ul>
            <li>department: JSON array of department names</li>
            <li>position: JSON array of role titles</li>
            <li>start_dates: JSON array of start dates (YYYY-MM-DD)</li>
            <li>end_dates: JSON array of end dates (YYYY-MM-DD or empty)</li>
            <li>duties: JSON array of duties lists</li>
          </ul>
          <p>Note: Arrays must be in valid JSON format and match in length</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="file-input">
          <label htmlFor="file">Select File</label>
          <input
            type="file"
            id="file"
            accept=".csv,.xlsx,.xls,.txt"
            onChange={handleFileChange}
          />
          <p className="file-help">
            Supported formats: CSV, Excel, Text file
          </p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button type="submit" className="upload-button" disabled={!file || loading}>
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
      
      {results && (
        <div className="upload-results">
          <h4>Upload Results</h4>
          
          <div className="results-summary">
            <p>Successfully processed: {results.created.length} employees</p>
            {results.errors.length > 0 && (
              <p>Failed to process: {results.errors.length} records</p>
            )}
          </div>
          
          {results.errors.length > 0 && (
            <div className="error-details">
              <h5>Error Details</h5>
              <ul>
                {results.errors.map((error, index) => (
                  <li key={index}>
                    Row {error.row}: {Object.values(error.errors).join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeeBulkUpload; 