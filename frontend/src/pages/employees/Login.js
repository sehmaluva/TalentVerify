import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography,
  Paper,
  Button,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions, } from '@mui/material';
import axios from 'axios';
import {createCompany} from '../services/api';
//import AddIcon from '@mui/icons-material/Add';
//import CloseIcon from '@mui/icons-material/Close';
//import IconButton from '@mui/material/IconButton';

const Login = () => {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      // Use DRF's default token auth endpoint
      const response = await axios.post('/api-token-auth/', {
        username,
        password,
      });
      localStorage.setItem('token', response.data.token);
      // Optionally, get user info to check if superuser
      const userRes = await axios.get('/api/user/me/', {
        headers: { Authorization: `Token ${response.data.token}` },
      });
      if (userRes.data.is_superuser) {
        navigate('/');
      } else {
        navigate('/companies/:id');
      }
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  // State for dialogs and form fields
  const [openCreateDialog, setOpenCreateDialog] = React.useState(false);
  const [companyName, setCompanyName] = React.useState('');
  const [registrationDate, setRegistrationDate] = React.useState('');
  const [registrationNumber, setRegistrationNumber] = React.useState('');
  const [companyAddress, setCompanyAddress] = React.useState('');
  // const [contactPerson, setContactPerson] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [companyEmail, setCompanyEmail] = React.useState('');
  const [newDept, setNewDept] = React.useState('');
  const [departmentsList, setDepartmentsList] = React.useState([]);
  //const [departmentsInput, setDepartmentsInput] = useState('');
  // Admin fields
  const [adminUsername, setAdminUsername] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [success, setSuccess] = useState(null);

  // Dialog handlers
  const handleOpenCreateDialog = () => setOpenCreateDialog(true);
  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
    setCompanyName('');
    setRegistrationDate('');
    setRegistrationNumber('');
    setCompanyAddress('');
    //setContactPerson('');
    setPhoneNumber('');
    setCompanyEmail('');
    setNewDept('');
    setDepartmentsList([]);
    //setDepartmentsInput('');
  };

  const handleCreateCompany = async () => {
    try {
      const data = {
        name: companyName,
        registration_number: registrationNumber,
        registration_date: registrationDate,
        address: companyAddress,
        phone_number: phoneNumber,
        email: companyEmail,
        departments: departmentsList,
        admin_username: adminUsername,
        admin_email: adminEmail,
        admin_password: adminPassword,
      };
      await createCompany(data);
       setSuccess('Company and admin registered successfully! You can now log in.');
      handleCloseCreateDialog();
      // fetchCompanies(); // Refresh the company list
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create company');
    }
  };

  const handleAddDept = () => {
    if (newDept.trim()) {
      setDepartmentsList([...departmentsList, newDept.trim()]);
      setNewDept('');
    }
  };

  const handleRemoveDept = (idx) => {
    setDepartmentsList(departmentsList.filter((dept, i) => i !== idx));
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Paper elevation={3} sx={{ p: 4, minWidth: 320 }}>
        <Typography variant="h5" mb={2}>Login</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleLogin}>
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
            Login
          </Button>
        </form>
        <Button
          variant="outlined"
          color="secondary"
          fullWidth
          sx={{ mt: 2 }}
          onClick={handleOpenCreateDialog}
        >
          Register a Company
        </Button>
      </Paper>

      {/* Create Company Dialog */}
      <Dialog open={openCreateDialog} onClose={handleCloseCreateDialog}>
        <DialogTitle>Create New Company</DialogTitle>
        <DialogContent>
          <TextField label="Company Name" value={companyName} onChange={e => setCompanyName(e.target.value)} fullWidth margin="dense" />
          <TextField label="Registration Number" value={registrationNumber} onChange={e => setRegistrationNumber(e.target.value)} fullWidth margin="dense" />
          <TextField label="Registration Date" value={registrationDate} onChange={e => setRegistrationDate(e.target.value)} type="date" InputLabelProps={{ shrink: true }} fullWidth margin="dense" />
          <TextField label="Address" value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} fullWidth margin="dense" />
          {/* <TextField label="Contact Person (Employee ID)" value={contactPerson} onChange={e => setContactPerson(e.target.value)} fullWidth margin="dense" /> */}
          <TextField label="Phone Number" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} fullWidth margin="dense" />
          <TextField label="Email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} fullWidth margin="dense" type="email" />
          <TextField
            label="Departments"
            name="departments"
            value={departmentsList}
            onChange={e => setDepartmentsList(e.target.value)}
            helperText="Separate departments with comma, semicolon, or new line."
            fullWidth
            margin="normal"
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
         
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Cancel</Button>
          <Button onClick={handleCreateCompany} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </Box>

  );
};

export default Login;
