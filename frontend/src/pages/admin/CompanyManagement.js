import React, { useState, useEffect } from 'react';
import { companyService } from '../../services/companyService';
import DataUpload from '../../components/DataUpload/DataUpload';
import '../../styles/CompanyManagement.css';

const CompanyManagement = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    location: '',
    website: '',
    founded_year: '',
    description: ''
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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editingCompany) {
        await companyService.updateCompany(editingCompany.id, formData);
        setCompanies(companies.map(company => 
          company.id === editingCompany.id ? { ...company, ...formData } : company
        ));
      } else {
        const newCompany = await companyService.createCompany(formData);
        setCompanies([...companies, newCompany]);
      }
      
      setShowForm(false);
      setFormData({
        name: '',
        industry: '',
        location: '',
        website: '',
        founded_year: '',
        description: ''
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
    setFormData({
      name: company.name,
      industry: company.industry || '',
      location: company.location || '',
      website: company.website || '',
      founded_year: company.founded_year || '',
      description: company.description || ''
    });
    setShowForm(true);
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
      industry: '',
      location: '',
      website: '',
      founded_year: '',
      description: ''
    });
    setEditingCompany(null);
  };

  const handleBulkUpload = async (file) => {
    setLoading(true);
    setError('');

    try {
      await companyService.bulkUploadEmployees(file);
      fetchCompanies();
    } catch (err) {
      setError(err.message || 'Failed to upload companies');
    } finally {
      setLoading(false);
    }
  };

  if (loading && companies.length === 0) {
    return <div className="loading">Loading companies...</div>;
  }

  return (
    <div className="company-management">
      <div className="section-header">
        <h2>{editingCompany ? 'Edit Company' : 'Company Management'}</h2>
        <div className="header-actions">
          {!showForm && (
            <>
              <button 
                className="btn-primary"
                onClick={() => setShowForm(true)}
              >
                Add Company
              </button>
              <DataUpload 
                onUpload={handleBulkUpload}
                accept=".csv,.xlsx"
                label="Upload Companies"
              />
            </>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm ? (
        <div className="form-container">
          <form onSubmit={handleSubmit} className="company-form">
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
              <label htmlFor="industry">Industry</label>
              <input
                type="text"
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="website">Website</label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="founded_year">Founded Year</label>
              <input
                type="number"
                id="founded_year"
                name="founded_year"
                value={formData.founded_year}
                onChange={handleChange}
                min="1800"
                max={new Date().getFullYear()}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
              />
            </div>
            
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
                <th>Name</th>
                <th>Industry</th>
                <th>Location</th>
                <th>Website</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map(company => (
                <tr key={company.id}>
                  <td>{company.name}</td>
                  <td>{company.industry}</td>
                  <td>{company.location}</td>
                  <td>
                    {company.website ? (
                      <a href={company.website} target="_blank" rel="noopener noreferrer">
                        {company.website}
                      </a>
                    ) : '-'}
                  </td>
                  <td className="actions">
                    <button 
                      className="btn-link"
                      onClick={() => handleEdit(company)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn-link delete"
                      onClick={() => handleDelete(company.id)}
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