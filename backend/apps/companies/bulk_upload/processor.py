"""
Bulk upload processor for companies.
"""

import pandas as pd
import json
import csv
import io
from datetime import datetime
from ..models import Company
from ..api.serializers import CompanySerializer

def process_company_file(file, created_by_user):
    """
    Process company data from CSV/Excel/text file.
    
    Args:
        file: Uploaded file object
        created_by_user: User who is uploading the file
        
    Returns:
        tuple: (list of created companies, list of errors)
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
        required_columns = ['name', 'registration_date', 'registration_number', 'address', 
                          'contact_person', 'department', 'employee_count', 'phone', 'email']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise ValueError(f"Missing required columns: {', '.join(missing_columns)}")
        
        companies = []
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Parse department list
                department = row.get('department', '[]')
                if isinstance(department, str):
                    try:
                        department = json.loads(department)
                    except json.JSONDecodeError:
                        # Try to parse as comma-separated list
                        if ',' in department:
                            department = [dept.strip() for dept in department.split(',')]
                        else:
                            department = []
                
                # Parse registration date
                registration_date = row['registration_date']
                if isinstance(registration_date, str):
                    try:
                        # Try to parse date
                        registration_date = datetime.strptime(registration_date, '%Y-%m-%d').date()
                    except ValueError:
                        try:
                            # Try alternative format
                            registration_date = datetime.strptime(registration_date, '%d/%m/%Y').date()
                        except ValueError:
                            raise ValueError(f"Invalid registration date format in row {index + 1}")
                
                company_data = {
                    'name': row['name'],
                    'registration_date': registration_date,
                    'registration_number': str(row['registration_number']),
                    'address': row['address'],
                    'contact_person': row['contact_person'],
                    'department': department,
                    'employee_count': int(row['employee_count']),
                    'phone': str(row['phone']),
                    'email': row['email'],
                    'created_by': created_by_user.id
                }
                
                serializer = CompanySerializer(data=company_data)
                if serializer.is_valid():
                    serializer.save()
                    companies.append(serializer.data)
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
        
        return companies, errors
    
    except Exception as e:
        # Handle any errors during file processing
        return [], [{'row': 0, 'errors': f"File processing error: {str(e)}"}] 