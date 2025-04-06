import React from 'react';
import './RoleSelect.css';

const RoleDropdown = ({ value, onChange }) => {
  const roles = [
    { value: 'admin', label: 'Admin' },
    { value: 'company', label: 'Company' },
    { value: 'employee', label: 'Employee' }
  ];

  return (
    <select
      className="role-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
    >
      <option value="">Select a role</option>
      {roles.map(role => (
        <option key={role.value} value={role.value}>
          {role.label}
        </option>
      ))}
    </select>
  );
};

export default RoleDropdown; 