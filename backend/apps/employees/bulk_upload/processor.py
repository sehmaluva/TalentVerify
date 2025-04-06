"""
Bulk upload processor for employees.
"""

import pandas as pd
import json
from ..models import Employee
from ..serializers import EmployeeSerializer

def process_employee_file(file, company_id):
    """
    Process employee data from CSV/Excel file.
    
    Args:
        file: Uploaded file object
        company_id: ID of the company to associate employees with
        
    Returns:
        tuple: (list of created employees, list of errors)
    """
    if file.name.endswith('.csv'):
        df = pd.read_csv(file)
    elif file.name.endswith('.xlsx'):
        df = pd.read_excel(file)
    else:
        raise ValueError("Unsupported file format")
    
    employees = []
    errors = []
    
    for index, row in df.iterrows():
        try:
            # Convert string lists to actual lists
            departments = row.get('departments', '[]')
            roles = row.get('roles', '[]')
            start_dates = row.get('start_dates', '[]')
            end_dates = row.get('end_dates', '[]')
            duties = row.get('duties', '[]')
            
            # Parse JSON strings if they're strings
            for field in [departments, roles, start_dates, end_dates, duties]:
                if isinstance(field, str):
                    try:
                        field = json.loads(field)
                    except json.JSONDecodeError:
                        field = []
            
            employee_data = {
                'company': company_id,
                'name': row['name'],
                'employee_id': row['employee_id'],
                'departments': departments,
                'roles': roles,
                'start_dates': start_dates,
                'end_dates': end_dates,
                'duties': duties
            }
            
            serializer = EmployeeSerializer(data=employee_data)
            if serializer.is_valid():
                serializer.save()
                employees.append(serializer.data)
            else:
                errors.append({
                    'row': index + 1,
                    'errors': serializer.errors
                })
        except Exception as e:
            errors.append({
                'row': index + 1,
                'errors': str(e)
            })
    
    return employees, errors 