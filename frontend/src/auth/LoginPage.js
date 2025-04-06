import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { companyService } from '../services/companyService';
import { ROLES } from '../config';
import '../styles/Auth.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'employee',
    company: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  
  const { login, isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch companies when role is 'company'
  useEffect(() => {
    const fetchCompanies = async () => {
      if (formData.role === ROLES.COMPANY) {
        setLoadingCompanies(true);
        try {
          const data = await companyService.getCompanies();
          // Ensure data is an array
          setCompanies(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error('Error fetching companies:', err);
          setError('Failed to load companies. Please try again.');
          setCompanies([]); // Set empty array on error
        } finally {
          setLoadingCompanies(false);
        }
      }
    };

    fetchCompanies();
  }, [formData.role]);

  // Handle navigation after authentication
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = user.role === ROLES.ADMIN ? '/admin' : 
                         user.role === ROLES.COMPANY ? '/company' : 
                         '/search';
      
      // Use requestAnimationFrame to ensure navigation happens in the next frame
      requestAnimationFrame(() => {
        navigate(redirectPath, { replace: true });
      });
    }
  }, [isAuthenticated, user, location, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with username:', formData.username);
      const userData = await login(formData.username, formData.password, formData.role, formData.company);
      console.log('Login successful, user data:', userData);
      // Navigation will be handled by the useEffect
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Login to Talent Verify</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
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
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
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
              <option value={ROLES.ADMIN}>Admin</option>
              <option value={ROLES.COMPANY}>Company</option>
              <option value={ROLES.EMPLOYEE}>Employee</option>
            </select>
          </div>
          {formData.role === ROLES.COMPANY && (
            <div className="form-group">
              <label htmlFor="company">Company</label>
              <select
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                required
                disabled={loadingCompanies}
              >
                <option value="">Select Company</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              {loadingCompanies && <div className="loading-message">Loading companies...</div>}
            </div>
          )}
          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage; 