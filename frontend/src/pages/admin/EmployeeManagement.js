import React, { useState, useEffect } from 'react';
import { employeeService } from '../../services/employeeService';
import { companyService } from '../../services/companyService';
import '../../styles/EmployeeManagement.css';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [empData, compData] = await Promise.all([
          employeeService.getAllEmployees(),
          companyService.getCompanies()
        ]);
        setEmployees(empData);
        setCompanies(compData);
        setFiltered(empData);
      } catch (err) {
        setError('Failed to fetch employees or companies');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    setFiltered(
      employees.filter(emp =>
        emp.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        emp.last_name?.toLowerCase().includes(search.toLowerCase()) ||
        emp.email?.toLowerCase().includes(search.toLowerCase()) ||
        getCompanyName(emp.company).toLowerCase().includes(search.toLowerCase()) ||
        emp.department?.toLowerCase().includes(search.toLowerCase()) ||
        emp.position?.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, employees]);

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : 'Unknown';
  };

  if (loading) return <div className="loading">Loading employees...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="employee-management">
      <h2>All Employees</h2>
      <input
        className="search-bar"
        type="text"
        placeholder="Search by name, company, department, position..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{marginBottom: '1rem', padding: '0.5rem', width: '100%', maxWidth: 400}}
      />
      <div className="data-table">
        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Company</th>
              <th>Department</th>
              <th>Position</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(emp => (
              <tr key={emp.id}>
                <td>{emp.first_name}</td>
                <td>{emp.last_name}</td>
                <td>{emp.email}</td>
                <td>{emp.phone}</td>
                <td>{getCompanyName(emp.company)}</td>
                <td>{emp.department}</td>
                <td>{emp.position}</td>
                <td>{emp.is_active ? 'Active' : 'Inactive'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeManagement;
