import React, { useState, useEffect } from 'react';
import { companyService } from '../../services/companyService';
import './positionelect.css';

const CompanyDropdown = ({ value, onChange }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const data = await companyService.getCompanies();
        setCompanies(data);
      } catch (err) {
        setError('Failed to load companies');
        console.error('Error loading companies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  if (loading) {
    return <div className="loading">Loading companies...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <select
      className="company-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
    >
      <option value="">Select a company</option>
      {companies.map(company => (
        <option key={company.id} value={company.id}>
          {company.name}
        </option>
      ))}
    </select>
  );
};

export default CompanyDropdown; 