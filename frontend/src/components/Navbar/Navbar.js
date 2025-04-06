import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../auth/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>Talent Verify</h1>
      </div>
      {user && (
        <div className="navbar-menu">
          <div className="navbar-end">
            <span className="navbar-user">
              Welcome, {user.username} ({user.role})
            </span>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 