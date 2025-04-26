import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../auth/AuthContext';
import { userService } from '../../services/userService';
import { companyService } from '../../services/companyService';
import { employeeService } from '../../services/employeeService';
import CompanyManagement from './CompanyManagement';
import UserManagement from './UserManagement';
import '../../styles/Dashboard.css';
import EmployeeManagement from './EmployeeManagement';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    activeUsers: 0,
    totalEmployees: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, companies, employees] = await Promise.all([
          userService.getUsers(),
          companyService.getCompanies(),
          employeeService.getEmployees()
        ]);
        
        setStats({
          totalUsers: users.length,
          totalCompanies: companies.length,
          activeUsers: users.filter(u => u.is_active).length,
          totalEmployees: employees.length
        });
      } catch (err) {
        setError('Failed to fetch dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-header">
          <h1>Talent Verify Admin</h1>
          <div className="user-info">
            <span>Welcome, {user.username}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
        <div className="nav-links">
          <Link 
            to="/admin" 
            className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/admin/users" 
            className={`nav-link ${location.pathname === '/admin/users' ? 'active' : ''}`}
          >
            Users
          </Link>
          <Link 
            to="/admin/companies" 
            className={`nav-link ${location.pathname === '/admin/companies' ? 'active' : ''}`}
          >
            Companies
          </Link>
          <Link 
            to="/admin/employees" 
            className={`nav-link ${location.pathname === '/admin/employees' ? 'active' : ''}`}
          >
            Employees
          </Link>
        </div>
      </nav>

      <main className="dashboard-content">
        {error && <div className="error-message">{error}</div>}
        
        <Routes>
          <Route index element={
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Users</h3>
                  <p className="stat-number">{stats.totalUsers}</p>
                </div>
                <div className="stat-card">
                  <h3>Total Companies</h3>
                  <p className="stat-number">{stats.totalCompanies}</p>
                </div>
                <div className="stat-card">
                  <h3>Active Users</h3>
                  <p className="stat-number">{stats.activeUsers}</p>
                </div>
                <div className="stat-card">
                  <h3>Total Employees</h3>
                  <p className="stat-number">{stats.totalEmployees}</p>
                </div>
              </div>
              <div className="welcome-message">
                <h2>Welcome to the Talent Verify Admin Dashboard</h2>
                <p>Select an option from the navigation menu to get started.</p>
              </div>
            </>
          } />
          <Route path="users" element={<UserManagement />} />
          <Route path="companies" element={<CompanyManagement />} />
          <Route path="employees" element={<EmployeeManagement/>} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard; 