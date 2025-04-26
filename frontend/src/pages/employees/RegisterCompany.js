import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Paper, Typography, Box, Alert } from '@mui/material';
import axios from 'axios';
import CompanyForm from '../components/CompanyForm';

const RegisterCompany = () => {
  // Company fields
  const [companyName, setCompanyName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [registrationDate, setRegistrationDate] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [departmentsInput, setDepartmentsInput] = useState('');
  // Admin fields
  const [adminUsername, setAdminUsername] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await axios.post('/api/register-company-admin/', {
        company_name: companyName,
        registration_number: registrationNumber,
        registration_date: registrationDate,
        address: companyAddress,
        phone_number: phoneNumber,
        email: companyEmail,
        departments: departmentsInput,
        admin_username: adminUsername,
        admin_email: adminEmail,
        admin_password: adminPassword,
      });
      setSuccess('Company and admin registered successfully! You can now log in.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Paper elevation={3} sx={{ p: 4, minWidth: 320, maxWidth: 480 }}>
        <Typography variant="h5" mb={2}>Register Company</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <form onSubmit={handleRegister}>
          <CompanyForm
            companyName={companyName}
            setCompanyName={setCompanyName}
            registrationNumber={registrationNumber}
            setRegistrationNumber={setRegistrationNumber}
            registrationDate={registrationDate}
            setRegistrationDate={setRegistrationDate}
            companyAddress={companyAddress}
            setCompanyAddress={setCompanyAddress}
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            companyEmail={companyEmail}
            setCompanyEmail={setCompanyEmail}
            departmentsInput={departmentsInput}
            setDepartmentsInput={setDepartmentsInput}
          />
          <Typography variant="subtitle1" mt={2}>Admin Credentials</Typography>
          <TextField
            label="Admin Username"
            fullWidth
            margin="normal"
            value={adminUsername}
            onChange={e => setAdminUsername(e.target.value)}
            required
          />
          <TextField
            label="Admin Email"
            type="email"
            fullWidth
            margin="normal"
            value={adminEmail}
            onChange={e => setAdminEmail(e.target.value)}
            required
          />
          <TextField
            label="Admin Password"
            type="password"
            fullWidth
            margin="normal"
            value={adminPassword}
            onChange={e => setAdminPassword(e.target.value)}
            required
          />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
            Register Company
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default RegisterCompany;
