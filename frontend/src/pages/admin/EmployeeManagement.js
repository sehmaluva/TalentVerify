import React, { useState, useEffect } from 'react';
import { employeeService } from '../../services/employeeService';
import { companyService } from '../../services/companyService';
import DataUpload from '../../components/DataUpload/DataUpload';
import '../../styles/EmployeeManagement.css';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    company: '',
    name: '',
    employee_id: '',
    department: '',
    position: '',
    start_date: '',
    end_date: '',
    duties: ''
  });
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [employeesData, companiesData] = await Promise.all([
        employeeService.getAllEmployees(),
        companyService.getCompanies()
      ]);
      setEmployees(employeesData);
      setCompanies(companiesData);
    } catch (err) {
      setError('Failed to fetch data');
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
      if (editingEmployee) {
        await employeeService.updateEmployee(editingEmployee.id, formData);
        setEmployees(employees.map(emp => 
          emp.id === editingEmployee.id ? { ...emp, ...formData } : emp
        ));
      } else {
        const newEmployee = await employeeService.createEmployee(formData);
        setEmployees([...employees, newEmployee]);
      }
      
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err.message || 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      company: '',
      name: '',
      employee_id: '',
      department: '',
      position: '',
      start_date: '',
      end_date: '',
      duties: ''
    });
    setEditingEmployee(null);
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      company: employee.company,
      name: employee.name,
      employee_id: employee.employee_id,
      department: employee.department,
      position: employee.position,
      start_date: employee.start_date,
      end_date: employee.end_date || '',
      duties: employee.duties || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (employeeId) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    
    setLoading(true);
    setError('');

    try {
      await employeeService.deleteEmployee(employeeId);
      setEmployees(employees.filter(emp => emp.id !== employeeId));
    } catch (err) {
      setError(err.message || 'Failed to delete employee');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = await employeeService.searchEmployees(searchTerm);
      setEmployees(results);
    } catch (err) {
      setError('Failed to search employees');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async (file) => {
    setLoading(true);
    setError('');

    try {
      await employeeService.bulkUploadEmployees(file);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to upload employees');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const searchLower = searchTerm.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(searchLower) ||
      emp.employee_id?.toLowerCase().includes(searchLower) ||
      emp.department?.toLowerCase().includes(searchLower) ||
      emp.position?.toLowerCase().includes(searchLower) ||
      (companies.find(c => c.id === emp.company)?.name.toLowerCase().includes(searchLower))
    );
  });

  if (loading && employees.length === 0) {
    return <div className="loading">Loading employees...</div>;
  }

  return (
    <div className="employee-management">
      <div className="section-header">
        <h2>{editingEmployee ? 'Edit Employee' : 'Employee Management'}</h2>
        <div className="header-actions">
          {!showForm && (
            <>
              <button 
                className="btn-primary"
                onClick={() => setShowForm(true)}
              >
                Add Employee
              </button>
              <DataUpload 
                onUpload={handleBulkUpload}
                accept=".csv,.xlsx"
                label="Upload Employees"
              />
            </>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm ? (
        <div className="form-container">
          <form onSubmit={handleSubmit} className="employee-form">
            <div className="form-group">
              <label htmlFor="company">Company</label>
              <select
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                required
              >
                <option value="">Select Company</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="name">Full Name</label>
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
              <label htmlFor="employee_id">Employee ID</label>
              <input
                type="text"
                id="employee_id"
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="department">Department</label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="position">Position</label>
              <input
                type="text"
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="start_date">Start Date</label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="end_date">End Date (if applicable)</label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="duties">Duties (comma separated)</label>
              <textarea
                id="duties"
                name="duties"
                value={formData.duties}
                onChange={handleChange}
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : (editingEmployee ? 'Update' : 'Create')}
              </button>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch}>Search</button>
          </div>

          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Employee ID</th>
                  <th>Company</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(employee => {
                  const company = companies.find(c => c.id === employee.company);
                  return (
                    <tr key={employee.id}>
                      <td>{employee.name}</td>
                      <td>{employee.employee_id}</td>
                      <td>{company ? company.name : 'Unknown'}</td>
                      <td>{employee.department}</td>
                      <td>{employee.position}</td>
                      <td>{employee.start_date}</td>
                      <td>{employee.end_date || 'Current'}</td>
                      <td className="actions">
                        <button 
                          className="btn-link"
                          onClick={() => handleEdit(employee)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn-link delete"
                          onClick={() => handleDelete(employee.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default EmployeeManagement;