"""
Bulk upload processor for employees.
"""

import pandas as pd
import json
import csv
import io
from datetime import datetime
from ..models import Employee
from ..serializers import EmployeeSerializer
from apps.companies.models import Company

def process_employee_file(file, company_id):
    """
    Process employee data from CSV/Excel/text file.
    
    Args:
        file: Uploaded file object
        company_id: ID of the company to associate employees with
        
    Returns:
        tuple: (list of created employees, list of errors)
    """
    # Determine file type and read accordingly
    file_name = file.name.lower()
    
    try:
        if file_name.endswith('.csv'):
            df = pd.read_csv(file)
        elif file_name.endswith('.xlsx') or file_name.endswith('.xls'):
            df = pd.read_excel(file)
        elif file_name.endswith('.txt'):
            # Try to read as tab-separated first
            try:
                df = pd.read_csv(file, sep='\t')
            except:
                # If that fails, try comma-separated
                file.seek(0)  # Reset file pointer
                df = pd.read_csv(file, sep=',')
        else:
            raise ValueError("Unsupported file format. Please upload CSV, Excel, or text file.")
        
        # Validate required columns
        required_columns = ['name', 'employee_id']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise ValueError(f"Missing required columns: {', '.join(missing_columns)}")
        
        # Get company
        try:
            company = Company.objects.get(id=company_id)
        except Company.DoesNotExist:
            raise ValueError(f"Company with ID {company_id} does not exist")
        
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
                            # Try to parse as comma-separated list
                            if ',' in field:
                                field = [item.strip() for item in field.split(',')]
                            else:
                                field = []
                
                # Validate dates
                for date_list in [start_dates, end_dates]:
                    for i, date_str in enumerate(date_list):
                        if date_str and not pd.isna(date_str):
                            try:
                                # Try to parse date
                                datetime.strptime(str(date_str), '%Y-%m-%d')
                            except ValueError:
                                # Try other common formats
                                try:
                                    datetime.strptime(str(date_str), '%d/%m/%Y')
                                except ValueError:
                                    date_list[i] = None
                
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
    
    except Exception as e:
        # Handle any errors during file processing
        return [], [{'row': 0, 'errors': f"File processing error: {str(e)}"}]

def process_company_file(file):
    """
    Process company data from CSV/Excel/text file.
    
    Args:
        file: Uploaded file object
        
    Returns:
        tuple: (list of created companies, list of errors)
    """
    # Similar implementation to process_employee_file but for companies
    # This would be implemented in the companies app
    pass 