import React from 'react';
import './positionelect.css';

const RoleDropdown = ({ value, onChange }) => {
  const position = [
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
      {position.map(role => (
        <option key={role.value} value={role.value}>
          {role.label}
        </option>
      ))}
    </select>
  );
};

export default RoleDropdown; 