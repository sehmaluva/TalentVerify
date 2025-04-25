import React, { useState, useEffect } from 'react';
import { employeeService } from '../../services/employeeService';
import { companyService } from '../../services/companyService';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [employeesData, companiesData] = await Promise.all([
        employeeService.getEmployees(),
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
    try {
      if (editingEmployee) {
        await employeeService.updateEmployee(editingEmployee.id, formData);
      } else {
        await employeeService.createEmployee(formData);
      }
      setShowForm(false);
      setEditingEmployee(null);
      setFormData({
        company: '', name: '', employee_id: '', department: '', position: '', start_date: '', end_date: '', duties: ''
      });
      fetchData();
    } catch (err) {
      setError('Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({ ...employee });
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingEmployee(null);
    setFormData({
      company: '', name: '', employee_id: '', department: '', position: '', start_date: '', end_date: '', duties: ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    setLoading(true);
    try {
      await employeeService.deleteEmployee(id);
      fetchData();
    } catch (err) {
      setError('Failed to delete employee');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async (file) => {
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      await employeeService.bulkUpload(formData);
      fetchData();
    } catch (err) {
      setError('Bulk upload failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div className="employee-management">
      <button onClick={() => navigate(-1)} className="back-btn">Back to Dashboard</button>
      <h2>Employee Management</h2>
      {error && <div className="error">{error}</div>}
      <div className="actions">
        <button onClick={handleAdd}>Add Employee</button>
        <DataUpload onUpload={handleBulkUpload} label="Bulk Upload Employees" />
        <input
          type="text"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      {showForm && (
        <form className="employee-form" onSubmit={handleSubmit}>
          <select name="company" value={formData.company} onChange={handleChange} required>
            <option value="">Select Company</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input name="name" value={formData.name} onChange={handleChange} placeholder="Name" required />
          <input name="employee_id" value={formData.employee_id} onChange={handleChange} placeholder="Employee ID" required />
          <input name="department" value={formData.department} onChange={handleChange} placeholder="Department" required />
          <input name="position" value={formData.position} onChange={handleChange} placeholder="Position" required />
          <input name="start_date" value={formData.start_date} onChange={handleChange} placeholder="Start Date" type="date" />
          <input name="end_date" value={formData.end_date} onChange={handleChange} placeholder="End Date" type="date" />
          <input name="duties" value={formData.duties} onChange={handleChange} placeholder="Duties" />
          <button type="submit">{editingEmployee ? 'Update' : 'Add'} Employee</button>
          <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
        </form>
      )}
      <table className="employee-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Employee ID</th>
            <th>Department</th>
            <th>Position</th>
            <th>Company</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Duties</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map(emp => (
            <tr key={emp.id}>
              <td>{emp.name}</td>
              <td>{emp.email}</td>
              <td>{emp.employee_id}</td>
              <td>{emp.department}</td>
              <td>{emp.position}</td>
              <td>{companies.find(c => c.id === emp.company)?.name || emp.company}</td>
              <td>{emp.start_date}</td>
              <td>{emp.end_date}</td>
              <td>{emp.duties}</td>
              <td>
                <button onClick={() => handleEdit(emp)}>Edit</button>
                <button onClick={() => handleDelete(emp.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeManagement;