import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Grid, Container, Typography, CircularProgress, Alert, Box, Button } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import { getDashboardStats, getCompanies, getEmployees } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Dashboard: Starting to fetch data');
        const [statsData, companiesData, employeesData] = await Promise.all([
          getDashboardStats(),
          getCompanies(),
          getEmployees()
        ]);
        
        console.log('Dashboard: Data fetched successfully', { statsData, companiesData, employeesData });
        setStats(statsData);
        setCompanies(companiesData);
        setEmployees(employeesData);
      } catch (err) {
        console.error('Dashboard: Error fetching data', err);
        setError('Failed to load dashboard data');
        setErrorDetails(err.message || JSON.stringify(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCardClick = (path) => {
    navigate(path);
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="h6">Error Details:</Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
            {errorDetails}
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Container>
    );
  }

  // Prepare data for charts
  const barChartData = [
    { name: 'Total Employees', value: stats?.totalEmployees || 0 },
    { name: 'Total Companies', value: stats?.totalCompanies || 0 },
  ];

  // Prepare data for employees per company chart
  const employeesPerCompanyData = companies.map(company => {
    const companyEmployees = employees.filter(emp => emp.company === company.id);
    return {
      name: company.name,
      employees: companyEmployees.length
    };
  }).filter(item => item.employees > 0); // Only show companies with employees

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Navigation Cards */}
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              p: 3, 
              cursor: 'pointer',
              '&:hover': { backgroundColor: '#f5f5f5' }
            }}
            onClick={() => handleCardClick('/employees')}
          >
            <Grid container alignItems="center" spacing={2}>
              <Grid item>
                <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Grid>
              <Grid item>
                <Typography variant="h6">Employees</Typography>
                <Typography variant="h4">{stats?.totalEmployees || 0}</Typography>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              p: 3, 
              cursor: 'pointer',
              '&:hover': { backgroundColor: '#f5f5f5' }
            }}
            onClick={() => handleCardClick('/companies')}
          >
            <Grid container alignItems="center" spacing={2}>
              <Grid item>
                <BusinessIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Grid>
              <Grid item>
                <Typography variant="h6">Companies</Typography>
                <Typography variant="h4">{stats?.totalCompanies || 0}</Typography>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Bar Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Overview
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Pie Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Employees Distribution
            </Typography>
            {employeesPerCompanyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={employeesPerCompanyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="employees"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {employeesPerCompanyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`${value} employees`, props.payload.name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <Typography variant="body1" color="text.secondary">
                  No employee data available
                </Typography>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
