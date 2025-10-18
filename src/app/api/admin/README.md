# Admin APIs for Edit and Delete Operations

This document describes the newly created admin APIs for managing faculty, site supervisors, and companies.

## Authentication
All APIs require admin authentication via Bearer token in the Authorization header. The middleware automatically validates the token and adds user information to request headers.

## Faculty Management APIs

### Edit Faculty
**Endpoint:** `PUT /api/admin/edit-faculty`
**Description:** Updates faculty information including profile details

**Request Body:**
```json
{
  "id": "faculty-uuid", // Required
  "email": "faculty@university.edu", // Optional
  "name": "Dr. John Doe", // Optional
  "password": "newpassword", // Optional
  "department": "Computer Science", // Optional
  "designation": "Professor", // Optional
  "phone": "+1234567890", // Optional
  "office": "Room 101", // Optional
  "bio": "Faculty bio", // Optional
  "avatarUrl": "https://example.com/avatar.jpg", // Optional
  "qualifications": "PhD in CS", // Optional
  "expertise": "Machine Learning, AI" // Optional
}
```

**Response:**
```json
{
  "message": "Faculty updated successfully",
  "faculty": {
    "id": "faculty-uuid",
    "email": "faculty@university.edu",
    "name": "Dr. John Doe",
    "role": "FACULTY",
    "verified": true,
    "profile": {
      "department": "Computer Science",
      "designation": "Professor",
      "phone": "+1234567890",
      "office": "Room 101",
      "bio": "Faculty bio",
      "avatarUrl": "https://example.com/avatar.jpg",
      "qualifications": "PhD in CS",
      "expertise": "Machine Learning, AI"
    },
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "updatedBy": "admin-uuid"
}
```

### Delete Faculty
**Endpoint:** `DELETE /api/admin/delete-faculty?id=faculty-uuid`
**Description:** Deletes a faculty member (with safety checks)

**Query Parameters:**
- `id`: Faculty UUID (required)

**Response:**
```json
{
  "message": "Faculty deleted successfully",
  "deletedFaculty": {
    "id": "faculty-uuid",
    "email": "faculty@university.edu",
    "name": "Dr. John Doe",
    "role": "FACULTY"
  },
  "deletedBy": "admin-uuid"
}
```

**Safety Checks:**
- Cannot delete faculty with active internships
- Cannot delete faculty with evaluations
- Automatically revokes all refresh tokens
- Deletes faculty profile if exists

## Site Supervisor Management APIs

### Edit Site Supervisor
**Endpoint:** `PUT /api/admin/edit-site-supervisor`
**Description:** Updates site supervisor information

**Request Body:**
```json
{
  "id": "supervisor-uuid", // Required
  "email": "supervisor@company.com", // Optional
  "name": "Jane Smith", // Optional
  "password": "newpassword", // Optional
  "companyId": "company-uuid" // Optional
}
```

**Response:**
```json
{
  "message": "Site supervisor updated successfully",
  "supervisor": {
    "id": "supervisor-uuid",
    "email": "supervisor@company.com",
    "name": "Jane Smith",
    "role": "SITE_SUPERVISOR",
    "verified": true,
    "company": {
      "id": "company-uuid",
      "name": "Tech Corp",
      "email": "info@techcorp.com"
    },
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "updatedBy": "admin-uuid"
}
```

### Delete Site Supervisor
**Endpoint:** `DELETE /api/admin/delete-site-supervisor?id=supervisor-uuid`
**Description:** Deletes a site supervisor (with safety checks)

**Query Parameters:**
- `id`: Site supervisor UUID (required)

**Response:**
```json
{
  "message": "Site supervisor deleted successfully",
  "deletedSupervisor": {
    "id": "supervisor-uuid",
    "email": "supervisor@company.com",
    "name": "Jane Smith",
    "role": "SITE_SUPERVISOR",
    "company": {
      "id": "company-uuid",
      "name": "Tech Corp"
    }
  },
  "deletedBy": "admin-uuid"
}
```

**Safety Checks:**
- Cannot delete supervisor with active internships
- Cannot delete supervisor with evaluations
- Automatically revokes all refresh tokens

## Company Management APIs

### Edit Company
**Endpoint:** `PUT /api/admin/edit-company`
**Description:** Updates company information

**Request Body:**
```json
{
  "id": "company-uuid", // Required
  "name": "Tech Corp", // Optional
  "email": "info@techcorp.com", // Optional
  "phone": "+1234567890", // Optional
  "address": "123 Tech St", // Optional
  "website": "https://techcorp.com", // Optional
  "industry": "Technology", // Optional
  "description": "Leading tech company" // Optional
}
```

**Response:**
```json
{
  "message": "Company updated successfully",
  "company": {
    "id": "company-uuid",
    "name": "Tech Corp",
    "email": "info@techcorp.com",
    "phone": "+1234567890",
    "address": "123 Tech St",
    "website": "https://techcorp.com",
    "industry": "Technology",
    "description": "Leading tech company",
    "siteSupervisors": [
      {
        "id": "supervisor-uuid",
        "name": "Jane Smith",
        "email": "supervisor@techcorp.com"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "updatedBy": "admin-uuid"
}
```

### Delete Company
**Endpoint:** `DELETE /api/admin/delete-company?id=company-uuid`
**Description:** Deletes a company and all its site supervisors (with safety checks)

**Query Parameters:**
- `id`: Company UUID (required)

**Response:**
```json
{
  "message": "Company deleted successfully",
  "deletedCompany": {
    "id": "company-uuid",
    "name": "Tech Corp",
    "email": "info@techcorp.com",
    "siteSupervisorsCount": 2
  },
  "deletedBy": "admin-uuid"
}
```

**Safety Checks:**
- Cannot delete company with site supervisors who have active internships
- Cannot delete company with site supervisors who have evaluations
- Automatically deletes all associated site supervisors
- Automatically revokes all refresh tokens for site supervisors

## Error Responses

All APIs return appropriate HTTP status codes and error messages:

- `400 Bad Request`: Missing required fields or invalid data
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User is not an admin
- `404 Not Found`: Resource not found
- `409 Conflict`: Email already exists
- `500 Internal Server Error`: Server error

## Security Features

1. **Admin-only access**: All endpoints verify admin role
2. **Email uniqueness**: Prevents duplicate emails across users/companies
3. **Safety checks**: Prevents deletion of resources with active dependencies
4. **Token revocation**: Automatically revokes refresh tokens on deletion
5. **Password hashing**: Passwords are properly hashed using bcrypt
6. **Input validation**: Email format validation and required field checks

## Usage Examples

### Edit Faculty Profile
```bash
curl -X PUT "https://your-api.com/api/admin/edit-faculty" \
  -H "Authorization: Bearer your-admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "faculty-uuid",
    "department": "Computer Science",
    "designation": "Associate Professor",
    "phone": "+1234567890"
  }'
```

### Delete Company
```bash
curl -X DELETE "https://your-api.com/api/admin/delete-company?id=company-uuid" \
  -H "Authorization: Bearer your-admin-token"
```

### Update Site Supervisor
```bash
curl -X PUT "https://your-api.com/api/admin/edit-site-supervisor" \
  -H "Authorization: Bearer your-admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "supervisor-uuid",
    "name": "Updated Name",
    "companyId": "new-company-uuid"
  }'
```
