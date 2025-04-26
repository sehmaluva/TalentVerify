import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
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
  const { id } = useParams();

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        if (!id) {
          setError('No company ID found in URL.');
          setLoading(false);
          return;
        }
        const company = await companyService.getCompanyById(id);
        setCompanyData(company);
      } catch (err) {
        setError('Failed to fetch company data');
      } finally {
        setLoading(false);
      }
    };
    fetchCompanyData();
  }, [id]);

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
      setError('');
    } catch (err) {
      const msg = err?.message || err?.toString() || 'Failed to update company';
      setError(msg);
      console.error('Error updating company:', err);
    }
  };

  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    address: '',
    registration_date: '',
    registration_number: '',
    contact_person: '',
    phone: '',
    email: '',
    departments: ['']
  });

  // Open edit form with current company data
  const handleEditClick = () => {
    setEditFormData({
      name: companyData.name || '',
      address: companyData.address || '',
      registration_date: companyData.registration_date || '',
      registration_number: companyData.registration_number || '',
      contact_person: companyData.contact_person || '',
      phone: companyData.phone || '',
      email: companyData.email || '',
      departments: Array.isArray(companyData.departments) ? companyData.departments : (companyData.departments ? [companyData.departments] : [''])
    });
    setShowEditForm(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // Add/Remove Department fields
  const handleDepartmentChange = (index, value) => {
    setEditFormData(prev => {
      const updated = [...(prev.departments || [])];
      updated[index] = value;
      return { ...prev, departments: updated };
    });
  };
  const handleAddDepartment = () => {
    setEditFormData(prev => ({ ...prev, departments: [...(prev.departments || []), ''] }));
  };
  const handleRemoveDepartment = (index) => {
    setEditFormData(prev => {
      const updated = [...(prev.departments || [])];
      updated.splice(index, 1);
      return { ...prev, departments: updated };
    });
  };

  const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    await handleCompanyUpdate({
      ...editFormData,
      department: (editFormData.departments || []).filter(d => d.trim() !== '')
    });
    setShowEditForm(false);
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
            <button className="btn-primary" style={{marginLeft:'1rem', padding:'0.4rem 0.8rem', fontSize:'0.9rem'}} onClick={handleEditClick}>Edit</button>
          </div>
        </div>
        <div className="company-navbar-overview">
          {showEditForm ? (
            <div className="modal-overlay">
              <div className="modal-content">
                <form onSubmit={handleEditFormSubmit} className="company-edit-form">
                  <div className="form-group">
                    <label>Name</label>
                    <input name="name" value={editFormData.name} onChange={handleEditFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Address</label>
                    <input name="address" value={editFormData.address} onChange={handleEditFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Registration Date</label>
                    <input name="registration_date" value={editFormData.registration_date} onChange={handleEditFormChange} type="date" required />
                  </div>
                  <div className="form-group">
                    <label>Registration Number</label>
                    <input name="registration_number" value={editFormData.registration_number} onChange={handleEditFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Contact Person</label>
                    <input name="contact_person" value={editFormData.contact_person} onChange={handleEditFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input name="phone" value={editFormData.phone} onChange={handleEditFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input name="email" value={editFormData.email} onChange={handleEditFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Departments</label>
                    {(editFormData.departments || []).map((dept, idx) => (
                      <div key={idx} style={{display:'flex',alignItems:'center',marginBottom:'0.5rem'}}>
                        <input
                          type="text"
                          value={dept}
                          onChange={e => handleDepartmentChange(idx, e.target.value)}
                          placeholder={`Department #${idx+1}`}
                          style={{marginRight:'0.5rem'}}
                        />
                        {(editFormData.departments.length > 1) && (
                          <button type="button" className="btn-secondary" onClick={() => handleRemoveDepartment(idx)} style={{padding:'0 8px'}}>X</button>
                        )}
                      </div>
                    ))}
                    <button type="button" className="btn-primary" onClick={handleAddDepartment} style={{marginTop:'0.5rem'}}>Add Department</button>
                  </div>
                  <button className="btn-primary" type="submit">Save</button>
                  <button className="btn-secondary" type="button" onClick={() => setShowEditForm(false)}>Cancel</button>
                </form>
              </div>
            </div>
          ) : (
            <>
              <p><strong>Address:</strong> {companyData?.address}</p>
              <p><strong>Registration Date:</strong> {companyData?.registration_date}</p>
              <p><strong>Employee Count:</strong> {companyData?.employee_count}</p>
              {companyData?.created_at && (
                <p><strong>Created At:</strong> {new Date(companyData.created_at).toLocaleDateString('en-GB', { dateStyle: 'medium' })}</p>
              )}
              {companyData?.updated_at && (
                <p><strong>Updated At:</strong> {new Date(companyData.updated_at).toLocaleDateString('en-GB', { dateStyle: 'medium' })}</p>
              )}
              {companyData?.created_by && (
                <p><strong>Created By:</strong> {companyData.created_by}</p>
              )}
            </>
          )}
        </div>
        <div className="nav-links">
          <Link to="/company" className="nav-link">Overview</Link>
          <Link to={`/company/dashboard/${companyData.id}/employees`} className="nav-link">Employees</Link>
          <Link to="/company/verifications" className="nav-link">Verifications</Link>
          <Link to="/company/settings" className="nav-link">Settings</Link>
        </div>
      </nav>

      <main className="dashboard-content">
        {error && <div className="error-message">{error}</div>}
        
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Employees</h3>
            <p className="stat-number">
              {
                Array.isArray(companyData.employees)
                  ? companyData.employees.filter(emp => !emp.end_date || new Date(emp.end_date) >= new Date()).length
                  : (typeof companyData.employee_count === 'number' ? companyData.employee_count : 0)
              }
            </p>
          </div>
          <div className="stat-card">
            <h3>Total Departments</h3>
            <p className="stat-number">
              {
                Array.isArray(companyData.departments)
                  ? companyData.departments.filter(d => d && d.trim() !== '').length
                  : (companyData.departments ? 1 : 0)
              }
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