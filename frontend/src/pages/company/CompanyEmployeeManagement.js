import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeeService } from '../../services/employeeService';
import DataUpload from '../../components/DataUpload/DataUpload';
import '../../styles/EmployeeManagement.css';

const CompanyEmployeeManagement = () => {
  const { id: companyId } = useParams();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    employee_id: '',
    department: '',
    position: '',
    joining_date: '',
    end_date: '',
    duties: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    salary: '',
  });
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableDepartments, setAvailableDepartments] = useState([]);

  // Gender options matching backend (update as needed)
  const GENDER_OPTIONS = [
    { value: 'M', label: 'Male' },
    { value: 'F', label: 'Female' },
    { value: 'O', label: 'Other' }
  ];

  useEffect(() => {
    fetchEmployees();
  }, [companyId]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const employeesData = await employeeService.getEmployeesByCompany(companyId);
      setEmployees(employeesData);
      // Optionally extract departments from employees
      const depts = [...new Set(employeesData.map(e => e.department).filter(Boolean))];
      setAvailableDepartments(depts);
    } catch (err) {
      setError('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Format date fields as YYYY-MM-DD
      const formatDate = (date) => {
        if (!date) return '';
        if (typeof date === 'string') return date;
        // If date is a Date object
        return date.toISOString().split('T')[0];
      };
      const submitData = {
        ...formData,
        company: companyId,
        joining_date: formatDate(formData.joining_date),
        end_date: formData.end_date ? formatDate(formData.end_date) : '',
        date_of_birth: formatDate(formData.date_of_birth),
      };
      
      if (editingEmployee) {
        await employeeService.updateEmployee(editingEmployee.id, submitData);
      } else {
        await employeeService.createEmployee(submitData);
      }
      setShowForm(false);
      setEditingEmployee(null);
      setFormData({ name: '', employee_id: '', department: '', position: '', joining_date: '', end_date: '', duties: '', email: '', phone: '', date_of_birth: '', gender: '', salary: '', });
      fetchEmployees();
    } catch (err) {
      setError('Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name || '',
      employee_id: employee.employee_id || '',
      department: employee.department || '',
      position: employee.position || '',
      joining_date: employee.joining_date || '',
      end_date: employee.end_date || '',
      duties: employee.duties || '',
      email: employee.email || '',
      phone: employee.phone || '',
      date_of_birth: employee.date_of_birth || '',
      gender: employee.gender || '',
      salary: employee.salary || '',
    });
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingEmployee(null);
    setFormData({ name: '', employee_id: '', department: '', position: '', joining_date: '', end_date: '', duties: '', email: '', phone: '', date_of_birth: '', gender: '', salary: '', });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    setLoading(true);
    try {
      await employeeService.deleteEmployee(id);
      fetchEmployees();
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
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('company', companyId);
      await employeeService.bulkUpload(formDataUpload);
      fetchEmployees();
    } catch (err) {
      setError('Bulk upload failed');
    } finally {
      setLoading(false);
    }
  };

  // Only show employees from this company and currently employed (no end_date or end_date in the future)
  const filteredEmployees = employees.filter(emp => {
    const term = searchTerm.toLowerCase();
    const isCurrent = !emp.end_date || new Date(emp.end_date) >= new Date();
    return (
      emp.company == companyId &&
      isCurrent &&
      (
        emp.name?.toLowerCase().includes(term) ||
        emp.employee_id?.toLowerCase().includes(term) ||
        emp.department?.toLowerCase().includes(term) ||
        emp.position?.toLowerCase().includes(term)
      )
    );
  });

  return (
    <div className="employee-management">
      <button className="btn-secondary" onClick={() => navigate(-1)} style={{marginBottom:'1rem'}}>Back</button>
      <h2>Company Employees</h2>
      <div style={{marginBottom: '1rem', fontWeight: 'bold'}}>
        Total Employees: {filteredEmployees.length}
      </div>
      {error && <div className="error-message">{error}</div>}
      {showForm ? (
        <div className="form-container">
          <form className="employee-form" onSubmit={handleSubmit}>
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
            <div className="form-group">
              <label>Email</label>
              <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" type="email" required />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" required />
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} placeholder="YYYY-MM-DD" type="date" required />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} required>
                <option value="">Select Gender</option>
                {GENDER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Salary</label>
              <input name="salary" value={formData.salary} onChange={handleChange} placeholder="Salary" type="number" min="0" required />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">{editingEmployee ? 'Update' : 'Add'} Employee</button>
              <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingEmployee(null); setFormData({ name: '', employee_id: '', department: '', position: '', joining_date: '', end_date: '', duties: '', email: '', phone: '', date_of_birth: '', gender: '', salary: '', }); }}>Cancel</button>
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
            <th>Employee ID</th>
            <th>Department</th>
            <th>Position</th>
            <th>Joining Date</th>
            <th>End Date</th>
            <th>Duties</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Date of Birth</th>
            <th>Gender</th>
            <th>Salary</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map(emp => (
            <tr key={emp.id}>
              <td>{emp.name}</td>
              <td>{emp.employee_id}</td>
              <td>{emp.department}</td>
              <td>{emp.position}</td>
              <td>{emp.joining_date ? new Date(emp.joining_date).toLocaleDateString('en-GB') : 'N/A'}</td>
              <td>{emp.end_date ? new Date(emp.end_date).toLocaleDateString('en-GB') : 'Current'}</td>
              <td>{emp.duties}</td>
              <td>{emp.email}</td>
              <td>{emp.phone}</td>
              <td>{emp.date_of_birth ? new Date(emp.date_of_birth).toLocaleDateString('en-GB') : 'N/A'}</td>
              <td>{emp.gender}</td>
              <td>{emp.salary}</td>
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

export default CompanyEmployeeManagement;