import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../auth/AuthContext';
import { companyService } from '../../services/companyService';
import { employeeService } from '../../services/employeeService';
import DataUpload from '../../components/DataUpload/DataUpload';
import '../../styles/Dashboard.css';

const CompanyDashboard = () => {
  const [companyData, setCompanyData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const [company, employeeList] = await Promise.all([
          companyService.getCompanyById(user.company.Id),
          employeeService.getEmployeesByCompany(user.company.Id)
        ]);
        
        setCompanyData(company);
        setEmployees(employeeList);
      } catch (err) {
        setError('Failed to fetch company data');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [user.company.Id]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBulkUpload = async (file) => {
    try {
      await employeeService.bulkUpload(file, user.company_id);
      // Refresh employees data after upload
      const employeesData = await employeeService.getEmployeesByCompany(user.company_id);
      setEmployees(employeesData);
    } catch (err) {
      setError('Failed to upload employees');
      console.error('Error uploading employees:', err);
    }
  };

  const handleCompanyUpdate = async (updatedData) => {
    try {
      const updatedCompany = await companyService.updateCompany(user.company_id, updatedData);
      setCompanyData(updatedCompany);
    } catch (err) {
      setError('Failed to update company');
      console.error('Error updating company:', err);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
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
            <p className="stat-number">{employees.length}</p>
          </div>
          <div className="stat-card">
            <h3>Active Verifications</h3>
            <p className="stat-number">
              {employees.filter(emp => emp.verification_status === 'pending').length}
            </p>
          </div>
          <div className="stat-card">
            <h3>Verified Employees</h3>
            <p className="stat-number">
              {employees.filter(emp => emp.verification_status === 'verified').length}
            </p>
          </div>
        </div>

        <Routes>
          <Route path="/" element={
            <div className="company-overview">
              <h2>Company Overview</h2>
              <div className="company-details">
                <p><strong>Name</strong> {companyData?.name}</p>
                <p><strong>Address</strong> {companyData?.address}</p>
                <p><strong>Founded:</strong> {companyData?.founded_year}</p>
                <p><strong>Website:</strong> {companyData?.website}</p>
              </div>
            </div>
          } />
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
                    {employees.map(employee => (
                      <tr key={employee.id}>
                        <td>{employee.name}</td>
                        <td>{employee.position}</td>
                        <td>{employee.department}</td>
                        <td>{employee.status}</td>
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