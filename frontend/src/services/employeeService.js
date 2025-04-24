import { api } from './authService';

export const employeeService = {
  // Bulk upload employees
  async bulkUpload(formData) {
    try {
      // Use the correct backend endpoint: /employees/bulk_upload
      const response = await api.post('/employees/bulk_upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to upload employees');
      }
      throw new Error('Network error occurred while uploading employees');
    }
  },

  // Get all employees (with optional filters)
  async getEmployees(filters = {}) {
    try {
      const response = await api.get('/employees/', { params: filters });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch employees');
      }
      throw new Error('Network error occurred while fetching employees');
    }
  },

  // Get employee by ID
  async getEmployeeById(id) {
    try {
      const response = await api.get(`/employees/${id}/`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch employee');
      }
      throw new Error('Network error occurred while fetching employee');
    }
  },

  // Create new employee
  async createEmployee(employeeData) {
    try {
      const response = await api.post('/employees/', employeeData);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to create employee');
      }
      throw new Error('Network error occurred while creating employee');
    }
  },

  // Update employee
  async updateEmployee(id, employeeData) {
    try {
      const response = await api.put(`/employees/${id}/`, employeeData);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to update employee');
      }
      throw new Error('Network error occurred while updating employee');
    }
  },

  // Delete employee
  async deleteEmployee(id) {
    try {
      const response = await api.delete(`/employees/${id}/`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to delete employee');
      }
      throw new Error('Network error occurred while deleting employee');
    }
  },

  // Search employees
  async searchEmployees(searchQuery) {
    try {
      const response = await api.get('/employees/search/', {
        params: { query: searchQuery }
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to search employees');
      }
      throw new Error('Network error occurred while searching employees');
    }
  },

  // Get employees by company
  async getEmployeesByCompany(companyId) {
    try {
      const response = await api.get(`/employees/`, {
        params: { company: companyId }
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch company employees');
      }
      throw new Error('Network error occurred while fetching company employees');
    }
  },

  // Verify employment
  async verifyEmployment(employeeId) {
    try {
      const response = await api.post(`/employees/${employeeId}/verify/`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to verify employment');
      }
      throw new Error('Network error occurred while verifying employment');
    }
  }
}; 