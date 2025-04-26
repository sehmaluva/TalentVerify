import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format, parseISO } from 'date-fns';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import { getEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee, uploadData, getCompanies, getDepartments } from '../services/api';

/**
 * Employees Component
 * 
 * This component manages the display and manipulation of employee data.
 * It provides functionality to view, add, edit, delete, and upload employees.
 * The component includes a tabbed dialog for adding/editing employees and uploading employee data.
 */
const Employees = () => {
  const navigate = useNavigate();
  
  // State for data management
  const [employees, setEmployees] = useState([]); // List of all employees
  const [companies, setCompanies] = useState([]); // List of all companies
  const [departments, setDepartments] = useState([]); // List of all departments
  const [filteredDepartments, setFilteredDepartments] = useState([]); // Departments filtered by selected company
  
  // UI state management
  const [loading, setLoading] = useState(true); // Loading indicator state
  const [error, setError] = useState(null); // Error message state
  const [dialogOpen, setDialogOpen] = useState(false); // Dialog visibility state
  const [selectedEmployee, setSelectedEmployee] = useState(null); // Currently selected employee for editing
  const [selectedFile, setSelectedFile] = useState(null); // Selected file for upload
  const [uploadError, setUploadError] = useState(null); // Upload error message
  const [newDuty, setNewDuty] = useState(''); // New duty input state
  const [dialogTab, setDialogTab] = useState(0); // Active tab in the dialog (0: Add/Edit, 1: Upload)

  // Sorting state
  const [sortField, setSortField] = useState('full_name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Form data state
  const [formData, setFormData] = useState({
    full_name: '',
    company: '',
    national_id: '',
    email: '',
    phone: '',
    start_date: new Date(),
    department: '',
    duties: [],
    position: ''
  });

  /**
   * Fetch initial data when component mounts
   * Retrieves employees, companies, and departments from the API
   */
  useEffect(() => {
    fetchData();
  }, []);

  /**
   * Fetch all required data from the API
   * Sets the state with the retrieved data
   */
  const fetchData = async () => {
    try {
      const [employeesData, companiesData, departmentsData] = await Promise.all([
        getEmployees(),
        getCompanies(),
        getDepartments()
      ]);
      console.log('Fetched employees:', employeesData);
      console.log('Fetched companies:', companiesData);
      console.log('Fetched departments:', departmentsData);
      setEmployees(employeesData);
      setCompanies(companiesData);
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filter departments based on selected company
   * Updates filteredDepartments state when company selection changes
   */
  useEffect(() => {
    if (formData.company && departments.length > 0) {
      const filtered = departments.filter(dept => dept.company === parseInt(formData.company, 10));
      setFilteredDepartments(filtered);
    } else {
      setFilteredDepartments([]);
    }
  }, [formData.company, departments]);

  /**
   * Handle form input changes
   * Updates formData state with the new value
   * Resets department selection when company changes
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'company') {
        updated.department = ''; // Reset department when company changes
      }
      return updated;
    });
  };

  /**
   * Handle date picker changes
   * Updates the start_date in formData
   */
  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, start_date: date }));
  };

  /**
   * Add a new duty to the duties array
   * Clears the newDuty input after adding
   */
  const handleAddDuty = () => {
    if (newDuty.trim()) {
      setFormData(prev => ({
        ...prev,
        duties: [...prev.duties, newDuty.trim()]
      }));
      setNewDuty('');
    }
  };

  /**
   * Remove a duty from the duties array
   * @param {number} index - Index of the duty to remove
   */
  const handleRemoveDuty = (index) => {
    setFormData(prev => ({
      ...prev,
      duties: prev.duties.filter((_, i) => i !== index)
    }));
  };

  /**
   * Open the dialog for adding or editing an employee
   * @param {Object} employee - Employee object to edit, or null for adding a new employee
   */
  const handleOpenDialog = (employee = null) => {
    if (employee) {
      // Edit mode: populate form with employee data
      setSelectedEmployee(employee);
      setFormData({
        ...employee,
        start_date: employee.start_date ? parseISO(employee.start_date) : new Date(),
        duties: employee.duties ? employee.duties.split('\n').filter(duty => duty.trim()) : []
      });
      setDialogTab(0);
    } else {
      // Add mode: reset form data
      setSelectedEmployee(null);
      setFormData({
        full_name: '',
        company: '',
        national_id: '',
        email: '',
        phone: '',
        start_date: new Date(),
        department: '',
        duties: [],
        position: ''
      });
      setDialogTab(0);
    }
    setDialogOpen(true);
  };

  /**
   * Close the dialog and reset form state
   */
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedEmployee(null);
    setFormData({
      full_name: '',
      company: '',
      national_id: '',
      email: '',
      phone: '',
      start_date: new Date(),
      department: '',
      duties: [],
      position: ''
    });
    setSelectedFile(null);
    setUploadError(null);
  };

  /**
   * Handle form submission for adding or updating an employee
   * Formats the data and sends it to the API
   * @param {Event} e - Form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Format data for API submission
      const formattedData = {
        ...formData,
        start_date: format(formData.start_date, 'yyyy-MM-dd'),
        company: parseInt(formData.company, 10),
        department: formData.department ? parseInt(formData.department, 10) : null,
        duties: formData.duties.join('\n')
      };

      console.log('Submitting employee data:', formattedData);

      // Create or update employee based on whether we're in edit mode
      if (selectedEmployee) {
        await updateEmployee(selectedEmployee.id, formattedData);
      } else {
        await createEmployee(formattedData);
      }
      handleCloseDialog();
      fetchData(); // Refresh the employee list
    } catch (error) {
      console.error('Error saving employee:', error);
      setError(error.response?.data?.message || 'Failed to save employee');
    }
  };

  /**
   * Delete an employee
   * @param {number} id - ID of the employee to delete
   */
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteEmployee(id);
        setEmployees(employees.filter(emp => emp.id !== id));
      } catch (error) {
        console.error('Error deleting employee:', error);
        setError('Failed to delete employee');
      }
    }
  };

  /**
   * Handle file selection for employee upload
   * @param {Event} event - File selection event
   */
  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
    setUploadError(null);
  };

  /**
   * Handle employee data upload
   * Creates a FormData object and sends it to the API
   */
  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      await uploadData(selectedFile, 'employees');
      fetchData();
      setDialogOpen(false);
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Failed to upload employees');
    }
  };

  /**
   * Navigate to employee details page
   * @param {number} employeeId - ID of the employee to view
   */
  const handleRowClick = (employeeId) => {
    navigate(`/employees/${employeeId}`);
  };

  /**
   * Handle tab change in the dialog
   * @param {Event} event - Tab change event
   * @param {number} newValue - Index of the new active tab
   */
  const handleTabChange = (event, newValue) => {
    setDialogTab(newValue);
  };

  /**
   * Navigate to department details page
   * @param {number} departmentId - ID of the department to view
   */
  const handleDepartmentClick = (departmentId) => {
    if (departmentId) {
      navigate(`/departments/${departmentId}`);
    }
  };

  /**
   * Navigate to company details page
   * @param {number} companyId - ID of the company to view
   */
  const handleCompanyClick = (companyId) => {
    navigate(`/companies/${companyId}`);
  };

  /**
   * Generate and download a CSV template for employee data
   * Creates a file with the required column headers
   */
  const handleDownloadTemplate = () => {
    // Create a CSV template for employees
    const headers = ['full_name', 'company', 'national_id', 'email', 'phone', 'address', 'department', 'position', 'start_date', 'duties'];
    const csvContent = headers.join(',') + '\n';
    
    // Create a blob and download it
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

  // Sort employees
  const sortedEmployees = employees.slice().sort((a, b) => {
    let aValue = a[sortField] || '';
    let bValue = b[sortField] || '';
    // For company_name, handle nested company object or string
    if (sortField === 'company_name' || sortField === 'company') {
      aValue = a.company_name || a.company?.name || '';
      bValue = b.company_name || b.company?.name || '';
    }
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Show loading indicator while data is being fetched
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error message if there was an error fetching data
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with title and action buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Employees</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleOpenDialog()}
          >
            Add Employee
          </Button>
        </Box>
      </Box>
      <button className="btn-secondary" onClick={() => navigate(-1)} style={{marginBottom:'1rem'}}>Back</button>
      {/* Employee data table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Button onClick={() => {
                  setSortField('full_name');
                  setSortOrder(sortOrder === 'asc' && sortField === 'full_name' ? 'desc' : 'asc');
                }}>
                  Name {sortField === 'full_name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </Button>
              </TableCell>
              <TableCell>
                <Button onClick={() => {
                  setSortField('company_name');
                  setSortOrder(sortOrder === 'asc' && sortField === 'company_name' ? 'desc' : 'asc');
                }}>
                  Company {sortField === 'company_name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </Button>
              </TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedEmployees.map((employee) => (
              <TableRow
                key={employee.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => handleRowClick(employee.id)}
              >
                <TableCell>{employee.full_name}</TableCell>
                <TableCell>{employee.company_name || (employee.company && employee.company.name)}</TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>{employee.phone}</TableCell>
                <TableCell>{format(new Date(employee.start_date), 'PP')}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDialog(employee);
                    }}
                  >
                    <VisibilityIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Employee Dialog with Tabs */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogTab === 0 
            ? (selectedEmployee ? 'Edit Employee' : 'Add Employee') 
            : 'Upload Employees'}
        </DialogTitle>
        <DialogContent>
          {/* Tabs for switching between add/edit and upload */}
          <Tabs value={dialogTab} onChange={handleTabChange} sx={{ mb: 2 }}>
            <Tab label={selectedEmployee ? "Edit Employee" : "Add Employee"} />
            <Tab label="Upload Employees" />
          </Tabs>

          {/* Add/Edit Employee Form */}
          {dialogTab === 0 ? (
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                {/* Full Name field */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                {/* Company selection dropdown */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Company</InputLabel>
                    <Select
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      label="Company"
                    >
                      {companies.map((company) => (
                        <MenuItem key={company.id} value={company.id}>
                          {company.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {/* National ID field */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="National ID"
                    name="national_id"
                    value={formData.national_id}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                {/* Email field */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                {/* Phone field */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                {/* Position field */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Position"
                    name="position"
                    value={formData.position || ''}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                </Grid>
                {/* Start Date picker */}
                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Start Date"
                      value={formData.start_date}
                      onChange={handleDateChange}
                      slotProps={{ textField: { fullWidth: true, required: true } }}
                    />
                  </LocalizationProvider>
                </Grid>
                {/* Department selection dropdown */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Department</InputLabel>
                    <Select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      label="Department"
                      disabled={!formData.company}
                    >
                      {filteredDepartments.length > 0 ? (
                        filteredDepartments.map((dept) => (
                          <MenuItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>
                          {formData.company ? 'No departments available' : 'Select a company first'}
                        </MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </Grid>
                {/* Duties management section */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Duties
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      fullWidth
                      label="Add Duty"
                      value={newDuty}
                      onChange={(e) => setNewDuty(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddDuty();
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddDuty}
                      sx={{ minWidth: '100px' }}
                    >
                      Add
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.duties.map((duty, index) => (
                      <Chip
                        key={index}
                        label={duty}
                        onDelete={() => handleRemoveDuty(index)}
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          ) : (
            /* Upload Employees Section */
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload a CSV file to create or update employees. The file should include the following columns:
                <ul>
                  <li>full_name (required)</li>
                  <li>national_id (required, used to identify existing employees)</li>
                  <li>email (required)</li>
                  <li>phone (required)</li>
                  <li>company (company name)</li>
                  <li>department (department name)</li>
                  <li>position</li>
                  <li>start_date (YYYY-MM-DD)</li>
                  <li>duties</li>
                </ul>
                Existing employees will be updated based on their national_id.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadTemplate}
                >
                  Download Template
                </Button>
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  id="employee-file-upload"
                />
                <label htmlFor="employee-file-upload">
                  <Button variant="outlined" component="span">
                    Choose File
                  </Button>
                </label>
              </Box>
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
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          {dialogTab === 0 ? (
            <Button onClick={handleSubmit} variant="contained" color="primary">
              {selectedEmployee ? 'Update' : 'Add'}
            </Button>
          ) : (
            <Button onClick={handleUpload} variant="contained">
              Upload
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Employees;
