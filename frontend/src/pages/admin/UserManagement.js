import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { companyService } from '../../services/companyService';
import '../../styles/UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'employee',
    company: '',
    is_active: true
  });
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, companiesData] = await Promise.all([
          userService.getUsers(),
          companyService.getCompanies()
        ]);
        setUsers(usersData);
        setCompanies(companiesData);
      } catch (err) {
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editingUser) {
        await userService.updateUser(editingUser.id, formData);
        setUsers(users.map(user => 
          user.id === editingUser.id ? { ...user, ...formData } : user
        ));
      } else {
        const newUser = await userService.createUser(formData);
        setUsers([...users, newUser]);
      }
      
      setShowForm(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'employee',
        company: '',
        is_active: true
      });
      setEditingUser(null);
    } catch (err) {
      setError(err.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      company: user.company_id || '',
      is_active: user.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    setLoading(true);
    setError('');

    try {
      await userService.deleteUser(userId);
      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'employee',
      company: '',
      is_active: true
    });
    setEditingUser(null);
  };

  if (loading && users.length === 0) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="user-management">
      <div className="section-header">
        <h2>{editingUser ? 'Edit User' : 'User Management'}</h2>
        {!showForm && (
          <button 
            className="btn-primary"
            onClick={() => setShowForm(true)}
          >
            Add User
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm ? (
        <div className="form-container">
          <form onSubmit={handleSubmit} className="user-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
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
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={!editingUser}
                placeholder={editingUser ? "Leave blank to keep current password" : ""}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="employee">Employee</option>
                <option value="company">Company</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            {formData.role === 'company' && (
              <div className="form-group">
                <label htmlFor="company">Company</label>
                <select
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a company</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
                Active
              </label>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : (editingUser ? 'Update' : 'Create')}
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
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.is_active ? 'Active' : 'Inactive'}</td>
                  <td className="actions">
                    <button 
                      className="btn-link"
                      onClick={() => handleEdit(user)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn-link delete"
                      onClick={() => handleDelete(user.id)}
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

export default UserManagement; 