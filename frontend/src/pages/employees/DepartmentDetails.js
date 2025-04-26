// DepartmentDetails.js
// Shows department info and lists all employees in the department.
// Fetches department (with employees) from API and displays in a table.

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Chip,
  Button,
} from '@mui/material';
import { format } from 'date-fns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { getDepartment } from '../services/api';

const DepartmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch department details (should include employees)
        const departmentData = await getDepartment(id);
        setDepartment(departmentData);
      } catch (err) {
        console.error('Error fetching department data:', err);
        setError('Failed to load department data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleViewEmployee = (employeeId) => {
    navigate(`/employees/${employeeId}`);
  };

  const handleBack = () => {
    navigate(-1);
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

  if (!department) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Department not found
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4">
          {department.name} Department
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Department Information
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography>
            <strong>Company:</strong> {department.company_name || department.company}
          </Typography>
          <Typography>
            <strong>Description:</strong> {department.description || 'No description'}
          </Typography>
          <Typography>
            <strong>Total Employees:</strong> {department.employees ? department.employees.length : 0}
          </Typography>
        </Box>
      </Paper>

      <Typography variant="h5" gutterBottom>
        Employees in this Department
      </Typography>

      {department.employees && department.employees.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>Duties</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {department.employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.full_name}</TableCell>
                  <TableCell>{employee.position || 'Not Specified'}</TableCell>
                  <TableCell>
                    {employee.start_date ? format(new Date(employee.start_date), 'PP') : 'Not Specified'}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {employee.duties ? (
                        employee.duties.split('\n').map((duty, index) => (
                          <Chip
                            key={index}
                            label={duty.trim()}
                            size="small"
                            variant="outlined"
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No duties specified
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Employee Details">
                      <IconButton
                        onClick={() => handleViewEmployee(employee.id)}
                        color="primary"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="info">
          No employees found in this department.
        </Alert>
      )}
    </Box>
  );
};

export default DepartmentDetails;