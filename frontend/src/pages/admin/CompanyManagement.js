import React, { useState, useEffect } from 'react';
import { companyService } from '../../services/companyService';
import {userService} from '../../services/userService';
import { useNavigate } from 'react-router-dom';
import DataUpload from '../../components/DataUpload/DataUpload';
import '../../styles/CompanyManagement.css';

const CompanyManagement = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    registration_date: '',
    registration_number: '',
    address: '',
    contact_person: '',
    departments: '',
    phone: '',
    email: '',
    createAdmin: false,
    adminUsername: '',
    adminPassword: '',
    adminEmail: ''
  });
  const [editingCompany, setEditingCompany] = useState(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const data = await companyService.getCompanies();
      setCompanies(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to fetch companies');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ?  checked : value
    }));
  };

  const handleDepartmentsTextChange = (e) => {
    setFormData(prev => ({ ...prev, departments: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting company data:', formData);
    setLoading(true);
    setError('');

    // Split departments by newlines or commas
    const departmentsArray = formData.departments
      ? formData.departments.split(/\n|,|;/).map(d => d.trim()).filter(Boolean)
      : [];
    const companyData = {
      name: formData.name,
      registration_date: formData.registration_date,
      registration_number: formData.registration_number,
      address: formData.address,
      contact_person: formData.contact_person,
      department: departmentsArray, // <-- send as 'department'
      phone: formData.phone,
      email: formData.email
    };

    try {
      let newCompany;
      if (editingCompany) {
        await companyService.updateCompany(editingCompany.id, companyData);
        setCompanies(companies.map(company => 
          company.id === editingCompany.id ? { ...company, ...companyData } : company
        ));
      } else {
        newCompany = await companyService.createCompany(companyData);
        setCompanies([...companies, newCompany]);

        // Create admin user for the company if requested
        if (formData.createAdmin && newCompany.id) {
          const adminData = {
            username: formData.adminUsername,
            password: formData.adminPassword,
            email: formData.adminEmail,
            role: 'company',
            company_id: newCompany.id
          };
          await userService.createUser(adminData);
        }
      }
      
      setShowForm(false);
      setFormData({
        name: '',
        registration_date: '',
        registration_number: '',
        address: '',
        contact_person: '',
        departments: '',
        phone: '',
        email: '',
        createAdmin: false,
        adminUsername: '',
        adminPassword: '',
        adminEmail: ''
      });
      setEditingCompany(null);
    } catch (err) {
      setError(err.message || 'Failed to save company');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setShowForm(true);
    setFormData({
      name: company.name || '',
      registration_date: company.registration_date || '',
      registration_number: company.registration_number || '',
      address: company.address || '',
      contact_person: company.contact_person || '',
      departments: Array.isArray(company.departments)
        ? company.departments.join(', ')
        : (typeof company.departments === 'string' && company.departments)
          ? company.departments
          : '',
      phone: company.phone || '',
      email: company.email || '',
      createAdmin: false,
      adminUsername: '',
      adminPassword: '',
      adminEmail: ''
    });
  };

  const handleDelete = async (companyId) => {
    if (!window.confirm('Are you sure you want to delete this company?')) return;
    
    setLoading(true);
    setError('');

    try {
      await companyService.deleteCompany(companyId);
      setCompanies(companies.filter(company => company.id !== companyId));
    } catch (err) {
      setError(err.message || 'Failed to delete company');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({
      name: '',
      registration_date: '',
      registration_number: '',
      address: '',
      contact_person: '',
      departments: '',
      phone: '',
      email: '',
      createAdmin: false,
      adminUsername: '',
      adminPassword: '',
      adminEmail: ''
    });
    setEditingCompany(null);
  };

  const handleBulkUploadCompanies = async (file) => {
    setLoading(true);
    setError('');

    try {
      await companyService.bulkUploadCompanies(file);
      fetchCompanies();
    } catch (err) {
      setError(err.message || 'Bulk upload failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading && companies.length === 0) {
    return <div className="loading">Loading companies...</div>;
  }

  return (
    <div className="company-management">
      <button className="btn-secondary" onClick={() => navigate(-1)} style={{marginBottom:'1rem'}}>Back</button>
      <div className="section-header">
        <h2>{editingCompany ? 'Edit Company' : 'Company Management'}</h2>
        {!showForm && (
          <>
            <button 
              className="btn-primary"
              onClick={() => setShowForm(true)}
            >
              Add Company
            </button>
            <button
              className="btn-secondary"
              style={{ marginLeft: '8px' }}
              onClick={() => window.history.back()}
            >
              Back
            </button>
            <div style={{ display: 'inline-block', marginLeft: '16px' }}>
              <DataUpload
                label="Bulk Upload Companies"
                accept=".csv, .xlsx, .xls"
                onUpload={handleBulkUploadCompanies}
              />
            </div>
          </>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm ? (
        <div className="form-container">
          <form onSubmit={handleSubmit} className="company-form">
            {/* Company Information Fields */}
            <div className="form-group">
              <label htmlFor="name">Company Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="registration_date">Registration Date</label>
              <input
                type="date"
                id="registration_date"
                name="registration_date"
                value={formData.registration_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="registration_number">Registration Number</label>
              <input
                type="text"
                id="registration_number"
                name="registration_number"
                value={formData.registration_number}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact_person">Contact Person</label>
              <input
                type="text"
                id="contact_person"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Departments (separate by comma, semicolon, or newline)</label>
              <textarea
                name="departments"
                value={formData.departments}
                onChange={handleDepartmentsTextChange}
                placeholder="e.g. HR, Finance\nIT"
                rows={4}
                style={{width:'100%'}}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Admin Creation Section */}
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="createAdmin"
                  checked={formData.createAdmin}
                  onChange={handleChange}
                />
                Create Admin User
              </label>
            </div>

            {formData.createAdmin && (
              <>
                <div className="form-group">
                  <label htmlFor="adminUsername">Admin Username</label>
                  <input
                    type="text"
                    id="adminUsername"
                    name="adminUsername"
                    value={formData.adminUsername}
                    onChange={handleChange}
                    required={formData.createAdmin}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="adminPassword">Admin Password</label>
                  <input
                    type="password"
                    id="adminPassword"
                    name="adminPassword"
                    value={formData.adminPassword}
                    onChange={handleChange}
                    required={formData.createAdmin}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="adminEmail">Admin Email</label>
                  <input
                    type="email"
                    id="adminEmail"
                    name="adminEmail"
                    value={formData.adminEmail}
                    onChange={handleChange}
                    required={formData.createAdmin}
                  />
                </div>
              </>
            )}

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : (editingCompany ? 'Update' : 'Create')}
              </button>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th className="px-4 py-2 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-4 py-2 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Address</th>
                <th className="px-4 py-2 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-4 py-2 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Employees</th>
                <th className="px-4 py-2 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Departments</th>
                <th className="px-4 py-2 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map(company => (
                <tr key={company.id} className="company-row" onClick={() => navigate(`/company/dashboard/${company.id}`)}>
                  <td className="px-4 py-2 border-b border-gray-200 text-sm">
                    {company.name}
                  </td>
                  <td className="px-4 py-2 border-b border-gray-200 text-sm">{company.address}</td>
                  <td className="px-4 py-2 border-b border-gray-200 text-sm">{company.email}</td>
                  <td className="px-4 py-2 border-b border-gray-200 text-sm">{company.employee_count}</td>
                  <td className="px-4 py-2 border-b border-gray-200 text-sm">
                    {
                      Array.isArray(company.departments)
                        ? company.departments.filter(d => d && d.trim()).length
                        : (typeof company.departments === 'string' && company.departments)
                          ? company.departments.split(',').map(d => d.trim()).filter(Boolean).length
                          : 0
                    }
                  </td>
                  <td className="px-4 py-2 border-b border-gray-200 text-sm">
                    <button 
                      className="btn-secondary"
                      onClick={e => { e.stopPropagation(); handleEdit(company); }}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn-danger"
                      onClick={e => { e.stopPropagation(); handleDelete(company.id); }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CompanyManagement;