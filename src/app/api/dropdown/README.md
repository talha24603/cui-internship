# Dropdown APIs Documentation

This directory contains API endpoints for fetching dropdown data for faculty, site supervisors, and companies.

## Authentication

All dropdown APIs require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <your_access_token>
```

## Endpoints

### 1. Faculty Dropdown
**GET** `/api/dropdown/faculty`

Returns a list of verified faculty members with their profile information.

#### Query Parameters
- `search` (optional): Search faculty by name (case-insensitive)
- `department` (optional): Filter by department (case-insensitive)

#### Response Format
```json
{
  "success": true,
  "data": [
    {
      "id": "faculty-uuid",
      "name": "Dr. John Smith",
      "email": "john.smith@university.edu",
      "department": "Computer Science",
      "designation": "Professor"
    }
  ],
  "total": 1
}
```

#### Example Usage
```bash
# Get all faculty
GET /api/dropdown/faculty

# Search faculty by name
GET /api/dropdown/faculty?search=john

# Filter by department
GET /api/dropdown/faculty?department=computer
```

### 2. Site Supervisors Dropdown
**GET** `/api/dropdown/site-supervisors`

Returns a list of verified site supervisors with their company information.

#### Query Parameters
- `search` (optional): Search supervisors by name (case-insensitive)
- `companyId` (optional): Filter supervisors by company ID

#### Response Format
```json
{
  "success": true,
  "data": [
    {
      "id": "supervisor-uuid",
      "name": "Jane Doe",
      "email": "jane.doe@company.com",
      "company": {
        "id": "company-uuid",
        "name": "Tech Corp",
        "industry": "Technology"
      }
    }
  ],
  "total": 1
}
```

#### Example Usage
```bash
# Get all site supervisors
GET /api/dropdown/site-supervisors

# Search supervisors by name
GET /api/dropdown/site-supervisors?search=jane

# Filter by company
GET /api/dropdown/site-supervisors?companyId=company-uuid
```

### 3. Companies Dropdown
**GET** `/api/dropdown/companies`

Returns a list of companies with their information and supervisor counts.

#### Query Parameters
- `search` (optional): Search companies by name (case-insensitive)
- `industry` (optional): Filter by industry (case-insensitive)

#### Response Format
```json
{
  "success": true,
  "data": [
    {
      "id": "company-uuid",
      "name": "Tech Corp",
      "email": "contact@techcorp.com",
      "phone": "+1234567890",
      "address": "123 Tech Street",
      "website": "https://techcorp.com",
      "industry": "Technology",
      "description": "Leading tech company",
      "supervisorCount": 5
    }
  ],
  "total": 1
}
```

#### Example Usage
```bash
# Get all companies
GET /api/dropdown/companies

# Search companies by name
GET /api/dropdown/companies?search=tech

# Filter by industry
GET /api/dropdown/companies?industry=technology
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

### Common HTTP Status Codes
- `200`: Success
- `401`: Unauthorized (missing or invalid token)
- `500`: Internal Server Error

## Frontend Integration Example

```javascript
// Fetch faculty dropdown
const fetchFaculty = async (searchTerm = '') => {
  try {
    const response = await fetch(`/api/dropdown/faculty?search=${searchTerm}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Error fetching faculty:', error);
    return [];
  }
};

// Usage in React component
const [facultyOptions, setFacultyOptions] = useState([]);

useEffect(() => {
  fetchFaculty().then(setFacultyOptions);
}, []);
```

## Notes

- All APIs require authentication and will return 401 if no valid token is provided
- Search parameters are case-insensitive and use partial matching
- Only verified users are returned in the results
- Results are ordered alphabetically by name
- The APIs are optimized for dropdown usage with minimal data transfer
