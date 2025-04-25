import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../auth/AuthContext';
import { companyService } from '../../services/companyService';
import { employeeService } from '../../services/employeeService';
import DataUpload from '../../components/DataUpload/DataUpload';
import '../../styles/Dashboard.css';

const CompanyDashboard = () => {
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const companyId = user.company?.id || user.company?.Id;
        if (!companyId) {
          setError('No company ID found for this user.');
          setLoading(false);
          return;
        }
        const company = await companyService.getCompanyById(companyId);
        setCompanyData(company);
      } catch (err) {
        setError('Failed to fetch company data');
      } finally {
        setLoading(false);
      }
    };
    fetchCompanyData();
  }, [user.company]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBulkUpload = async (file) => {
    try {
      const companyId = companyData?.id || companyData?.Id;
      if (!companyId) {
        setError('No company ID found for upload.');
        return;
      }
      await employeeService.bulkUpload(file, companyId);
      const updatedCompany = await companyService.getCompanyById(companyId);
      setCompanyData(updatedCompany);
    } catch (err) {
      setError('Failed to upload employees');
      console.error('Error uploading employees:', err);
    }
  };

  const handleCompanyUpdate = async (updatedData) => {
    try {
      const companyId = companyData?.id || companyData?.Id;
      if (!companyId) {
        setError('No company ID found for update.');
        return;
      }
      const updatedCompany = await companyService.updateCompany(companyId, updatedData);
      setCompanyData(updatedCompany);
    } catch (err) {
      setError('Failed to update company');
      console.error('Error updating company:', err);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (!companyData) {
    return <div className="error-message">No company data available.</div>;
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-header">
          <h1>{companyData?.name || 'Company Dashboard'}</h1>
          <div className="user-info">
            <span>Welcome, {user.username}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
        <div className="company-navbar-overview">
          <p><strong>Address:</strong> {companyData?.address}</p>
          <p><strong>Registration Date:</strong> {companyData?.registration_date}</p>
          <p><strong>Employee Count:</strong> {companyData?.employee_count}</p>
          {companyData?.created_at && (
            <p><strong>Created At:</strong> {companyData.created_at}</p>
          )}
          {companyData?.updated_at && (
            <p><strong>Updated At:</strong> {companyData.updated_at}</p>
          )}
          {companyData?.created_by && (
            <p><strong>Created By:</strong> {companyData.created_by}</p>
          )}
        </div>
        <div className="nav-links">
          <Link to="/company" className="nav-link">Overview</Link>
          <Link to="/company/employees" className="nav-link">Employees</Link>
          <Link to="/company/verifications" className="nav-link">Verifications</Link>
          <Link to="/company/settings" className="nav-link">Settings</Link>
        </div>
      </nav>

      <main className="dashboard-content">
        {error && <div className="error-message">{error}</div>}
        
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Employees</h3>
            <p className="stat-number">{companyData.employee_count || (companyData.employees ? companyData.employees.length : 0)}</p>
          </div>
          <div className="stat-card">
            <h3>Active Verifications</h3>
            <p className="stat-number">
              {companyData.employees ? companyData.employees.filter(emp => emp.verification_status === 'pending').length : 0}
            </p>
          </div>
          <div className="stat-card">
            <h3>Verified Employees</h3>
            <p className="stat-number">
              {companyData.employees ? companyData.employees.filter(emp => emp.verification_status === 'verified').length : 0}
            </p>
          </div>
        </div>

        <Routes>
          <Route path="/employees" element={
            <div className="employees-section">
              <div className="section-header">
                <h2>Employees</h2>
                <div className="header-actions">
                  <Link to="/company/employees/create" className="btn-primary">Add Employee</Link>
                  <DataUpload 
                    onUpload={handleBulkUpload}
                    accept=".csv,.xlsx"
                    label="Upload Employees"
                  />
                </div>
              </div>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Position</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyData.employees && companyData.employees.map(employee => (
                      <tr key={employee.id}>
                        <td>{employee.name}</td>
                        <td>{employee.position}</td>
                        <td>{employee.department}</td>
                        <td>{employee.status || employee.verification_status}</td>
                        <td>
                          <Link to={`/company/employees/${employee.id}`} className="btn-link">View</Link>
                          <Link to={`/company/employees/${employee.id}/edit`} className="btn-link">Edit</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          } />
          <Route path="/verifications" element={<div>Verification management coming soon</div>} />
          <Route path="/settings" element={<div>Company settings coming soon</div>} />
        </Routes>
      </main>
    </div>
  );
};

export default CompanyDashboard;