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
    joining_date: '',
    end_date: '',
    duties: ''
  });
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      const company = companies.find(c => String(c.id) === String(selectedCompany));
      let depts = [];
      if (company) {
        if (Array.isArray(company.departments)) {
          depts = company.departments;
        } else if (Array.isArray(company.department)) {
          depts = company.department;
        } else if (typeof company.department === 'string' && company.department) {
          depts = [company.department];
        }
      }
      setAvailableDepartments(depts);
    } else {
      setAvailableDepartments([]);
    }
  }, [selectedCompany, companies]);

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
    if (name === 'company') {
      setSelectedCompany(value);
      setFormData(prev => ({ ...prev, department: '' })); // Reset department
    }
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
        company: '', name: '', employee_id: '', department: '', position: '', joining_date: '', end_date: '', duties: ''
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
    setFormData({
      company: employee.company || '',
      name: employee.name || '',
      employee_id: employee.employee_id || '',
      department: employee.department || '',
      position: employee.position || '',
      joining_date: employee.joining_date || '',
      end_date: employee.end_date || '',
      duties: employee.duties || ''
    });
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingEmployee(null);
    setFormData({
      company: '', name: '', employee_id: '', department: '', position: '', joining_date: '', end_date: '', duties: ''
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

  const filteredEmployees = employees.filter(emp => {
    const departmentValue =
      Array.isArray(emp.department)
        ? emp.department.join(', ')
        : typeof emp.department === 'string'
          ? emp.department
          : typeof emp.department === 'number'
            ? emp.department.toString()
            : '';

    return (
      (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      departmentValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.position || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div className="employee-management">
      <button onClick={() => navigate(-1)} className="back-btn">Back to Dashboard</button>
      <h2>Employee Management</h2>
      {error && <div className="error">{error}</div>}
      {showForm ? (
        <div className="form-container">
          <form className="employee-form" onSubmit={handleSubmit} style={{marginBottom: 16, border: '1px solid #ddd', borderRadius: 8, padding: 16, background: '#fafbfc'}}>
            <div className="form-group">
              <label>Company</label>
              <select name="company" value={formData.company} onChange={handleChange} required>
                <option value="">Select Company</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Name</label>
              <input name="name" value={formData.name} onChange={handleChange} placeholder="Name" required />
            </div>
            <div className="form-group">
              <label>Employee ID</label>
              <input name="employee_id" value={formData.employee_id} onChange={handleChange} placeholder="Employee ID" required />
            </div>
            <div className="form-group">
              <label>Department</label>
              <select name="department" value={formData.department} onChange={handleChange} required>
                <option value="">Select Department</option>
                {availableDepartments.map((dept, i) => (
                  <option key={i} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Position</label>
              <input name="position" value={formData.position} onChange={handleChange} placeholder="Position" required />
            </div>
            <div className="form-group">
              <label>Joining Date</label>
              <input name="joining_date" value={formData.joining_date} onChange={handleChange} placeholder="Joining Date" type="date" />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input name="end_date" value={formData.end_date} onChange={handleChange} placeholder="End Date" type="date" />
            </div>
            <div className="form-group">
              <label>Duties</label>
              <input name="duties" value={formData.duties} onChange={handleChange} placeholder="Duties" />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">{editingEmployee ? 'Update' : 'Add'} Employee</button>
              <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingEmployee(null); setFormData({ company: '', name: '', employee_id: '', department: '', position: '', joining_date: '', end_date: '', duties: '' }); }}>Cancel</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="actions">
          <button onClick={handleAdd} className="btn-primary">Add Employee</button>
          <DataUpload onUpload={handleBulkUpload} label="Bulk Upload Employees" />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
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
            <th>Joining Date</th>
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
              <td>{emp.joining_date ? new Date(emp.joining_date).toLocaleDateString('en-GB') : 'N/A'}</td>
              <td>{emp.end_date ? new Date(emp.end_date).toLocaleDateString('en-GB') : 'Current'}</td>
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