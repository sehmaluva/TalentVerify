// Companies.js
// React component for displaying and managing a list of companies.
// Users can view, add, and upload companies, and download a CSV template for bulk uploads.

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
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { format } from 'date-fns';
import { getCompanies, uploadData, createCompany } from '../services/api';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';

// Main Companies component
const Companies = () => {
  // Use the useNavigate hook to get the navigate function
  const navigate = useNavigate();

  // State to store the list of companies
  const [companies, setCompanies] = useState([]); // Initialize with an empty array

  // State to manage loading spinner visibility
  const [loading, setLoading] = useState(true); // Initially set to true

  // State to store any error messages
  const [error, setError] = useState(null); // Initialize with null

  // State to control the upload dialog visibility
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false); // Initially set to false

  // State to store the selected file for upload
  const [selectedFile, setSelectedFile] = useState(null); // Initialize with null

  // State to store upload errors
  const [uploadError, setUploadError] = useState(null); // Initialize with null

  // State for dialogs and form fields
  const [openCreateDialog, setOpenCreateDialog] = React.useState(false);
  const [openUploadDialog, setOpenUploadDialog] = React.useState(false);
  const [companyName, setCompanyName] = React.useState('');
  const [registrationDate, setRegistrationDate] = React.useState('');
  const [registrationNumber, setRegistrationNumber] = React.useState('');
  const [companyAddress, setCompanyAddress] = React.useState('');
  const [contactPerson, setContactPerson] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [companyEmail, setCompanyEmail] = React.useState('');
  const [newDept, setNewDept] = React.useState('');
  const [departmentsList, setDepartmentsList] = React.useState([]);
  const [uploadFile, setUploadFile] = React.useState(null);
  const [departmentsInput, setDepartmentsInput] = useState('');

  // Fetch company data when component mounts
  useEffect(() => {
    // Call the fetchCompanies function to fetch data
    fetchCompanies();
  }, []); // Empty dependency array means this effect runs only once

  /**
   * Fetch all companies from the API and update state.
   * Handles errors and loading state.
   */
  const fetchCompanies = async () => {
    try {
      // Call the getCompanies API function to fetch companies
      const data = await getCompanies();
      // Update the companies state with the fetched data
      setCompanies(data);
    } catch (err) {
      // Set an error message if the fetch fails
      setError('Failed to load companies');
      // Log the error for debugging
      console.error('Error:', err);
    } finally {
      // Hide the loading spinner
      setLoading(false);
    }
  };

  /**
   * Handle file selection for company upload dialog.
   * @param {Event} event - File selection event
   */
  const handleFileSelect = (event) => {
    // Store the selected file in the selectedFile state
    setSelectedFile(event.target.files[0]);
    // Clear any previous upload errors
    setUploadError(null);
  };

  /**
   * Handle opening the upload dialog.
   */
  const handleOpenUploadDialog = () => {
    // Open the upload dialog
    setUploadDialogOpen(true);
    // Reset the selected file and upload error
    setSelectedFile(null);
    setUploadError(null);
  };

  /**
   * Handle closing the upload dialog.
   */
  const handleCloseUploadDialog = () => {
    // Close the upload dialog
    setUploadDialogOpen(false);
    // Reset the selected file and upload error
    setSelectedFile(null);
    setUploadError(null);
  };

  /**
   * Handle uploading the selected company file.
   * Sends the file to the API and refreshes the company list.
   */
  const handleUpload = async () => {
    // Check if a file is selected
    if (!selectedFile) {
      // Set an error message if no file is selected
      setUploadError('Please select a file');
      return;
    }
    try {
      // Upload the file to the API
      await uploadData(selectedFile, 'companies');
      // Close the upload dialog
      setUploadDialogOpen(false);
      // Reset the selected file
      setSelectedFile(null);
      // Refresh the company list
      fetchCompanies();
    } catch (err) {
      // Set an error message if the upload fails
      setUploadError('Failed to upload file');
      // Log the error for debugging
      console.error('Upload error:', err);
    }
  };

  /**
   * Generate and download a CSV template for company data.
   * Creates a file with the required column headers.
   */
  const handleDownloadTemplate = () => {
    // Define the column headers for the CSV template
    const headers = ['name', 'registration_number', 'registration_date', 'address', 'contact_person', 'phone_number', 'email', 'departments'];
    // Create a CSV string with the headers
    const csvContent = headers.join(',') + '\n';
    // Create a blob with the CSV string
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    // Create a link to download the blob
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'companies_template.csv');
    link.style.visibility = 'hidden';
    // Add the link to the document body
    document.body.appendChild(link);
    // Simulate a click on the link to download the file
    link.click();
    // Remove the link from the document body
    document.body.removeChild(link);
  };

  /**
   * Navigate to company details page.
   * @param {number} companyId - ID of the company to view
   */
  const handleRowClick = (companyId) => {
    // Navigate to the company details page
    navigate(`/companies/${companyId}`);
  };

  // Dialog handlers
  const handleOpenCreateDialog = () => setOpenCreateDialog(true);
  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
    setCompanyName('');
    setRegistrationDate('');
    setRegistrationNumber('');
    setCompanyAddress('');
    setContactPerson('');
    setPhoneNumber('');
    setCompanyEmail('');
    setNewDept('');
    setDepartmentsList([]);
    setDepartmentsInput('');
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
        departments: departmentsInput,
      };
      await createCompany(data);
      handleCloseCreateDialog();
      fetchCompanies(); // Refresh the company list
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create company');
    }
  };

  const handleUploadCompanies = async () => {
    if (!uploadFile) return;
    try {
      await uploadData(uploadFile, 'companies');
      fetchCompanies();
      handleCloseUploadDialog();
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Failed to upload companies');
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

  // Render loading spinner if data is being fetched
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  // Render error alert if there was a problem fetching companies
  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Main render: table of companies and upload dialog
  return (
    <Box sx={{ p: 3 }}>
      {/* Header with title and action buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Companies</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            Create Company
          </Button>
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={handleOpenUploadDialog}
          >
            Upload Companies
          </Button>
        </Box>
      </Box>

      {/* Company data table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Registration Number</TableCell>
              <TableCell>Registration Date</TableCell>
              <TableCell>Contact Person</TableCell>
              <TableCell>Total Employees</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {companies.map((company) => (
              <TableRow
                key={company.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => handleRowClick(company.id)}
              >
                <TableCell>{company.name}</TableCell>
                <TableCell>{company.registration_number}</TableCell>
                <TableCell>{format(new Date(company.registration_date), 'PP')}</TableCell>
                <TableCell>{company.contact_person_name || 'Not Assigned'}</TableCell>
                <TableCell>{company.total_employees}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRowClick(company.id);
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

      {/* Upload Companies Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleCloseUploadDialog}>
        <DialogTitle>Upload Companies</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Instructions for file upload */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload a CSV file to create or update companies. The file should include the following columns:
              <ul>
                <li>name (required)</li>
                <li>registration_number (required, used to identify existing companies)</li>
                <li>registration_date (YYYY-MM-DD)</li>
                <li>address</li>
                <li>phone_number</li>
                <li>email</li>
                <li>departments (one per line)</li>
              </ul>
              Existing companies will be updated based on their registration number.
            </Typography>
            {/* File selection and template download */}
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
                id="company-file-upload"
              />
              <label htmlFor="company-file-upload">
                <Button variant="outlined" component="span">
                  Choose File
                </Button>
              </label>
            </Box>
            {/* Selected file display */}
            {selectedFile && (
              <Typography sx={{ mt: 1 }}>
                Selected: {selectedFile.name}
              </Typography>
            )}
            {/* Upload error display */}
            {uploadError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {uploadError}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog}>Cancel</Button>
          <Button onClick={handleUpload} variant="contained" disabled={!selectedFile}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>

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
            value={departmentsInput}
            onChange={e => setDepartmentsInput(e.target.value)}
            helperText="Separate departments with comma, semicolon, or new line."
            fullWidth
            margin="normal"
          />
          <Box sx={{ mt: 1, mb: 1 }}>
            <Box display="flex" gap={1}>
              <TextField
                label="Add Department"
                value={newDept}
                onChange={e => setNewDept(e.target.value)}
                fullWidth
                onKeyDown={e => {
                  if ((e.key === 'Enter' || e.key === ',' || e.key === ';') && newDept.trim()) {
                    e.preventDefault();
                    handleAddDept();
                  }
                }}
              />
              <IconButton color="primary" onClick={handleAddDept} disabled={!newDept.trim()}>
                <AddIcon />
              </IconButton>
            </Box>
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {departmentsList.map((dept, idx) => (
                <Chip
                  key={idx}
                  label={dept}
                  onDelete={() => handleRemoveDept(idx)}
                  deleteIcon={<CloseIcon />}
                  color="primary"
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Cancel</Button>
          <Button onClick={handleCreateCompany} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={openUploadDialog} onClose={handleCloseUploadDialog}>
        <DialogTitle>Upload Companies (CSV)</DialogTitle>
        <DialogContent>
          <Button
            variant="contained"
            component="label"
            startIcon={<CloudUploadIcon />}
            sx={{ mb: 2 }}
          >
            Select File
            <input
              type="file"
              hidden
              accept=".csv"
              onChange={e => setUploadFile(e.target.files[0])}
            />
          </Button>
          {uploadFile && <div>Selected: {uploadFile.name}</div>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog}>Cancel</Button>
          <Button onClick={handleUploadCompanies} variant="contained" disabled={!uploadFile}>Upload</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Companies;