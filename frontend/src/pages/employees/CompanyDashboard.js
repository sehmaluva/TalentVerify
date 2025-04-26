import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { format } from 'date-fns';
import { getCompany, uploadData, updateCompany, deleteCompany, getEmployees, deleteEmployee, updateDepartment } from '../services/api';
import EmployeeUpdate from '../components/employees/EmployeeUpdate';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';

const CompanyDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate(); // For navigation to department details
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editCompanyOpen, setEditCompanyOpen] = useState(false);
  const [editCompanyData, setEditCompanyData] = useState(null);
  const [newDeptName, setNewDeptName] = useState('');
  const [companyActionLoading, setCompanyActionLoading] = useState(false);
  const [companyActionError, setCompanyActionError] = useState(null);
  const [editCompanyDepartments, setEditCompanyDepartments] = useState('');

  // Fetch employees for this company (for deletion)
  const [companyEmployees, setCompanyEmployees] = useState([]);
  useEffect(() => {
    if (company) {
      getEmployees().then((all) => {
        setCompanyEmployees(all.filter(emp => emp.company === company.id));
      });
    }
  }, [company]);

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const data = await getCompany(id);
        setCompany(data);
      } catch (err) {
        console.error('Error fetching company data:', err);
        setError('Failed to load company data');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [id]);

  const handleEditDepartment = (dept) => {
    setEditDept(dept);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditDept(null);
  };

  const handleEditDeptChange = (e) => {
    setEditDept({ ...editDept, [e.target.name]: e.target.value });
  };

  const handleEditDeptSave = async () => {
    if (!editDept) return;
    setCompanyActionLoading(true);
    setCompanyActionError(null);
    try {
      await updateDepartment(editDept.id, editDept);
      setEditDialogOpen(false);
      setEditDept(null);
      // Optionally refresh company data or departments
      window.location.reload();
    } catch (e) {
      setCompanyActionError(e.response?.data?.message || 'Failed to update department.');
    } finally {
      setCompanyActionLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
    setUploadError(null);
    setUploadSuccess(null);
  };

  const handleBulkUpload = async () => {
    if (!selectedFile || !company) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('company_id', company.id); // Always include the current company ID
      const response = await uploadData(formData, 'employees'); // Pass FormData directly
      setUploadError(null);
      setUploadSuccess(response.message || 'Employees uploaded successfully.');
      setSelectedFile(null);
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ['full_name', 'national_id', 'email', 'phone', 'address', 'department', 'position', 'start_date', 'duties'];
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'employees_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteCompany = async () => {
    if (!window.confirm('Are you sure you want to delete this company and all its employees? This cannot be undone.')) return;
    setCompanyActionLoading(true);
    setCompanyActionError(null);
    try {
      await deleteCompany(company.id);
      window.location.href = '/companies';
    } catch (e) {
      setCompanyActionError(e.response?.data?.message || 'Failed to delete company.');
    } finally {
      setCompanyActionLoading(false);
    }
  };

  const handleEditCompanyOpen = () => {
    setEditCompanyData({ ...company });
    // Convert current departments to a string for editing
    if (company && company.departments && Array.isArray(company.departments)) {
      setEditCompanyDepartments(company.departments.map(d => d.name).join(', '));
    } else {
      setEditCompanyDepartments('');
    }
    setEditCompanyOpen(true);
  };

  const handleEditCompanyChange = (e) => {
    setEditCompanyData({ ...editCompanyData, [e.target.name]: e.target.value });
  };

  const handleEditDepartmentsChange = (e) => {
    setEditCompanyDepartments(e.target.value);
  };

  const handleEditCompanySave = async () => {
    setCompanyActionLoading(true);
    setCompanyActionError(null);
    try {
      // Add departments to update payload
      const payload = {
        ...editCompanyData,
        departments: editCompanyDepartments,
      };
      await updateCompany(company.id, payload);
      setEditCompanyOpen(false);
      window.location.reload();
    } catch (e) {
      setCompanyActionError(e.response?.data?.message || 'Failed to update company.');
    } finally {
      setCompanyActionLoading(false);
    }
  };

  const handleAddDeptFromEdit = async () => {
    if (!newDeptName.trim()) return;
    setCompanyActionLoading(true);
    setCompanyActionError(null);
    try {
      const response = await fetch(`/api/departments/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDeptName, company: company.id })
      });
      if (!response.ok) throw new Error('Failed to create department');
      setNewDeptName('');
      // Optionally, reload company/departments or update state
      window.location.reload();
    } catch (e) {
      setCompanyActionError(e.message || 'Failed to create department');
    } finally {
      setCompanyActionLoading(false);
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    setCompanyActionLoading(true);
    setCompanyActionError(null);
    try {
      await deleteEmployee(id);
      setCompanyEmployees(companyEmployees.filter(emp => emp.id !== id));
    } catch (e) {
      setCompanyActionError(e.response?.data?.message || 'Failed to delete employee.');
    } finally {
      setCompanyActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!company) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Company not found
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {company.name} Dashboard
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button variant="contained" color="primary" onClick={() => setAddEmployeeOpen(true)}>
          Add Employee
        </Button>
        <Button variant="outlined" color="primary" startIcon={<CloudUploadIcon />} onClick={() => setBulkDialogOpen(true)}>
          Bulk Upload
        </Button>
        <Button variant="outlined" color="warning" onClick={handleEditCompanyOpen}>
          Edit Company
        </Button>
        <Button variant="outlined" color="error" onClick={handleDeleteCompany} disabled={companyActionLoading}>
          Delete Company
        </Button>
      </Box>
      {companyActionError && <Alert severity="error" sx={{ mb: 2 }}>{companyActionError}</Alert>}
      <Grid container spacing={3}>
        {/* Company Information Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Company Information
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography><strong>Registration Number:</strong> {company.registration_number}</Typography>
                <Typography><strong>Registration Date:</strong> {format(new Date(company.registration_date), 'PP')}</Typography>
                <Typography><strong>Address:</strong> {company.address}</Typography>
                <Typography><strong>Phone:</strong> {company.phone_number}</Typography>
                <Typography><strong>Email:</strong> {company.email}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Statistics Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Company Statistics
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography><strong>Total Employees:</strong> {company.total_employees}</Typography>
                <Typography><strong>Total Departments:</strong> {company.total_departments}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Departments Table */}
        <Grid item xs={12}>
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Department Name</TableCell>
                    <TableCell>Total Employees</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {company.departments_data?.map((dept) => (
                    <TableRow key={dept.id}>
                      {/* Department details: name is now a link to department details */}
                      <TableCell
                        sx={{ cursor: 'pointer', color: 'primary.main', textDecoration: 'underline' }}
                        onClick={() => navigate(`/departments/${dept.id}`)}
                      >
                        {dept.name}
                      </TableCell>
                      <TableCell>{dept.total_employees}</TableCell>
                      <TableCell>{dept.description || 'No description available'}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={e => { e.stopPropagation(); handleEditDepartment(dept); }}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Employees
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {companyEmployees.map(emp => (
                  <TableRow key={emp.id}>
                    <TableCell>{emp.full_name}</TableCell>
                    <TableCell>{emp.email}</TableCell>
                    <TableCell>{emp.phone}</TableCell>
                    <TableCell>{emp.department_name}</TableCell>
                    <TableCell>{emp.position}</TableCell>
                    <TableCell>
                      <Button color="error" size="small" onClick={() => handleDeleteEmployee(emp.id)} disabled={companyActionLoading}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onClose={handleEditDialogClose}>
        <DialogTitle>Edit Department</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Department Name"
            name="name"
            value={editDept?.name || ''}
            onChange={handleEditDeptChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Description"
            name="description"
            value={editDept?.description || ''}
            onChange={handleEditDeptChange}
            fullWidth
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>Cancel</Button>
          <Button variant="contained" onClick={handleEditDeptSave}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addEmployeeOpen} onClose={() => setAddEmployeeOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Employee</DialogTitle>
        <DialogContent>
          <EmployeeUpdate mode="add" companyId={company.id} onClose={() => setAddEmployeeOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDialogOpen} onClose={() => setBulkDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Upload Employees</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadTemplate}>
              Download Template
            </Button>
          </Box>
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="bulk-upload-file"
          />
          <label htmlFor="bulk-upload-file">
            <Button variant="outlined" component="span">
              Choose File
            </Button>
          </label>
          {selectedFile && (
            <Typography sx={{ mt: 1 }}>
              Selected: {selectedFile.name}
            </Typography>
          )}
          {uploadError && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {uploadError}
            </Alert>
          )}
          {uploadSuccess && (
            <Alert severity="success" sx={{ mt: 1 }}>
              {uploadSuccess}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleBulkUpload} variant="contained" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editCompanyOpen} onClose={() => setEditCompanyOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Company</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Company Name"
            name="name"
            value={editCompanyData?.name || ''}
            onChange={handleEditCompanyChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Registration Number"
            name="registration_number"
            value={editCompanyData?.registration_number || ''}
            onChange={handleEditCompanyChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Address"
            name="address"
            value={editCompanyData?.address || ''}
            onChange={handleEditCompanyChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Phone"
            name="phone_number"
            value={editCompanyData?.phone_number || ''}
            onChange={handleEditCompanyChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Email"
            name="email"
            value={editCompanyData?.email || ''}
            onChange={handleEditCompanyChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Departments"
            name="departments"
            value={editCompanyDepartments}
            onChange={handleEditDepartmentsChange}
            fullWidth
            multiline
            minRows={2}
            helperText="Separate departments with comma, semicolon, or new line."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditCompanyOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditCompanySave} disabled={companyActionLoading}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CompanyDashboard;