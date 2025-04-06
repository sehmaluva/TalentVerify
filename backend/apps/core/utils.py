"""
Utility functions for the Talent Verify application.
"""

import json
from datetime import datetime

def parse_json_field(field, default=None):
    """
    Parse a JSON field from a string to a Python object.
    
    Args:
        field: The field to parse
        default: Default value if parsing fails
        
    Returns:
        Parsed JSON object or default value
    """
    if field is None:
        return default
    
    if isinstance(field, (list, dict)):
        return field
    
    try:
        return json.loads(field)
    except (json.JSONDecodeError, TypeError):
        return default

def format_date(date_str):
    """
    Format a date string to YYYY-MM-DD format.
    
    Args:
        date_str: Date string in various formats
        
    Returns:
        Formatted date string or None if invalid
    """
    if not date_str:
        return None
    
    try:
        # Try different date formats
        for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y', '%Y/%m/%d'):
            try:
                return datetime.strptime(date_str, fmt).strftime('%Y-%m-%d')
            except ValueError:
                continue
        return None
    except Exception:
        return None 