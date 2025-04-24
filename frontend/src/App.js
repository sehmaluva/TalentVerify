import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './auth/AuthContext';
import LoginPage from './auth/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import CompanyDashboard from './pages/company/CompanyDashboard';
import SearchPage from './pages/search/SearchPage';
import UserManagement from './pages/admin/UserManagement';
import CompanyManagement from './pages/admin/CompanyManagement';
//import EmployeeManagent from './pages/admin/EmployeeManagement';
import Navbar from './components/Navbar/Navbar';
import './App.css';
import EmployeeManagement from './pages/admin/EmployeeManagement';

// Protected Route component
const ProtectedRoute = ({ children, allowedposition }) => {
  const { user, isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedposition && !allowedposition.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Root redirect component
const RootRedirect = () => {
  const { isAuthenticated, user } = useContext(AuthContext);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  } else if (user.role === 'company') {
    return <Navigate to="/company/${user.companyId}" replace />;
  } else {
    return <Navigate to="/search" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<RootRedirect />} />
            
            {/* Admin Routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedposition={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedposition={['admin']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/companies"
              element={
                <ProtectedRoute allowedposition={['admin']}>
                  <CompanyManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/employees"
              element={
                <ProtectedRoute allowedposition={['admin']}>
                  <EmployeeManagement/>
                </ProtectedRoute>
              }
            />

            {/* Company Routes */}
            <Route
              path="/company"
              element={
                <ProtectedRoute allowedposition={['company']}>
                  <CompanyDashboard />
                </ProtectedRoute>
              }
            />

            {/* Employee Routes */}
            <Route
              path="/search"
              element={
                <ProtectedRoute allowedposition={['employee', 'company', 'admin']}>
                  <SearchPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
