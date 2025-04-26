import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  Chip,
  Divider,
  Button,
} from '@mui/material';
import { format } from 'date-fns';
import { getEmployee, updateEmployeeHistory } from '../services/api';
import EditHistoryModal from '../components/EditHistoryModal';

const EmployeeDashboard = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const data = await getEmployee(id);
        setEmployee(data);
      } catch (err) {
        console.error('Error fetching employee data:', err);
        setError('Failed to load employee data');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 40 }}>
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

  if (!employee) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Employee not found
      </Alert>
    );
  }

  const renderSkills = (skills) => {
    if (!skills) return 'No skills listed';
    return skills.split(',').map((skill, index) => (
      <Chip
        key={index}
        label={skill.trim()}
        sx={{ m: 0.5 }}
        color="primary"
        variant="outlined"
      />
    ));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ flexGrow: 1 }}>
          {employee.full_name}'s Profile
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setSelectedHistory(null); // Open modal for adding
            setEditModalOpen(true);
          }}
          sx={{ ml: 2 }}
        >
          Add Employment History
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Personal Information Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography><strong>National ID:</strong> {employee.national_id}</Typography>
                <Typography><strong>Email:</strong> {employee.email}</Typography>
                <Typography><strong>Phone:</strong> {employee.phone}</Typography>
                <Typography><strong>Address:</strong> {employee.address || 'Not provided'}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Position Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Position
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography><strong>Company:</strong> {employee.company_name}</Typography>
                <Typography><strong>Department:</strong> {employee.department_name}</Typography>
                <Typography><strong>Position:</strong> {employee.position}</Typography>
                <Typography><strong>Start Date:</strong> {format(new Date(employee.start_date), 'PP')}</Typography>
                <Typography><strong>Years in Company:</strong> {employee.years_in_company}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Statistics Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Career Statistics
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography><strong>Total Companies:</strong> {new Set(employee.history?.map((history)=>history.companyID)).size}</Typography>
                <Typography><strong>Total Departments:</strong> {new Set(employee.history?.map(h => h.department_name)).size || 0}</Typography>
                <Typography><strong>Total Positions:</strong> {new Set(employee.history?.map(h => h.position)).size || 0}</Typography>
                <Typography><strong>Total Years Experience:</strong> {employee.history?.reduce((acc, curr) => acc + curr.years_in_role, 0) || employee.years_in_company}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Skills Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Skills & Expertise
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Current Skills:</Typography>
                {renderSkills(employee.skills)}
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>Skills Gained in Current Role:</Typography>
                {renderSkills(employee.history?.[0]?.skills_gained)}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Employment History */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Employment History
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Company</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Position</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Skills Gained</TableCell>
                      <TableCell>Performance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {employee.history?.slice().sort((a, b) => {
                      // Sort by end_date DESC, then start_date DESC
                      const endA = a.end_date ? new Date(a.end_date) : new Date();
                      const endB = b.end_date ? new Date(b.end_date) : new Date();
                      if (endA > endB) return -1;
                      if (endA < endB) return 1;
                      // If end dates are equal or both null, sort by start_date DESC
                      const startA = new Date(a.start_date);
                      const startB = new Date(b.start_date);
                      return startB - startA;
                    }).map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.company_name}</TableCell>
                        <TableCell>{entry.department_name}</TableCell>
                        <TableCell>{entry.position}</TableCell>
                        <TableCell>
                          {format(new Date(entry.start_date), 'PP')} - {' '}
                          {entry.end_date ? format(new Date(entry.end_date), 'PP') : 'Present'}
                          <br />
                          <Typography variant="caption">
                            ({entry.years_in_role} years)
                          </Typography>
                        </TableCell>
                        <TableCell>{renderSkills(entry.skills_gained)}</TableCell>
                        <TableCell>
                          {entry.performance_rating ? (
                            <Chip
                              label={entry.performance_rating}
                              color={entry.performance_rating >= '4' ? 'success' : 'default'}
                            />
                          ) : (
                            'Not rated'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <EditHistoryModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedHistory(null);
        }}
        entry={selectedHistory}
        employeeId={employee.id}
        onSave={async (entryToSave) => {
          setSaving(true);
          try {
            if (entryToSave && entryToSave.id) {
              await updateEmployeeHistory(entryToSave.id, entryToSave);
            } else {
              // Add new history entry
              const { createEmployeeHistory } = await import('../services/api');
              await createEmployeeHistory(entryToSave);
            }
            setEditModalOpen(false);
            setSelectedHistory(null);
            // Refresh employee data
            const data = await getEmployee(id);
            setEmployee(data);
          } catch (e) {
            alert('Failed to save history');
          } finally {
            setSaving(false);
          }
        }}
      />
    </Box>
  );
};

export default EmployeeDashboard;