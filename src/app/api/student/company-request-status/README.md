# Student Company Request Status API

This API allows students to check the status of their company requests.

## Endpoints

### 1. Get All Company Requests with Status
**GET** `/api/student/company-request-status`

Retrieves all company requests submitted by the authenticated student with their current status.

#### Query Parameters
- `includeStats` (optional): Include statistics in response (`true`/`false`)

#### Response
```json
{
  "requests": [
    {
      "id": "uuid",
      "name": "Company Name",
      "email": "company@example.com",
      "phone": "+1234567890",
      "address": "Company Address",
      "website": "https://company.com",
      "industry": "Technology",
      "description": "Company description",
      "reason": "Why student wants this company added",
      "status": "PENDING",
      "notes": "Admin notes (if any)",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "reviewedAt": null,
      "reviewedBy": null,
      "statusInfo": {
        "currentStatus": "PENDING",
        "isPending": true,
        "isApproved": false,
        "isRejected": false,
        "submittedAt": "2024-01-01T00:00:00.000Z",
        "lastUpdatedAt": "2024-01-01T00:00:00.000Z",
        "reviewedAt": null,
        "hasNotes": false
      }
    }
  ],
  "total": 1,
  "statistics": {
    "total": 1,
    "byStatus": {
      "PENDING": 1,
      "APPROVED": 0,
      "REJECTED": 0
    },
    "pendingCount": 1,
    "approvedCount": 0,
    "rejectedCount": 0
  }
}
```

### 2. Get Specific Company Request Status
**GET** `/api/student/company-request-status/[id]`

Retrieves the status of a specific company request by ID.

#### Path Parameters
- `id`: The UUID of the company request

#### Response
```json
{
  "request": {
    "id": "uuid",
    "name": "Company Name",
    "email": "company@example.com",
    "phone": "+1234567890",
    "address": "Company Address",
    "website": "https://company.com",
    "industry": "Technology",
    "description": "Company description",
    "reason": "Why student wants this company added",
    "status": "APPROVED",
    "notes": "Admin approval notes",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z",
    "reviewedAt": "2024-01-01T12:00:00.000Z",
    "requestedBy": {
      "id": "student-uuid",
      "name": "Student Name",
      "email": "student@example.com",
      "regNo": "2024-CS-001"
    },
    "reviewedBy": {
      "id": "admin-uuid",
      "name": "Admin Name",
      "email": "admin@example.com"
    }
  },
  "statusInfo": {
    "currentStatus": "APPROVED",
    "isPending": false,
    "isApproved": true,
    "isRejected": false,
    "submittedAt": "2024-01-01T00:00:00.000Z",
    "lastUpdatedAt": "2024-01-01T12:00:00.000Z",
    "reviewedAt": "2024-01-01T12:00:00.000Z",
    "hasNotes": true
  }
}
```

## Authentication

Both endpoints require:
- Valid JWT token in Authorization header: `Bearer <token>`
- User must have `STUDENT` role
- Students can only view their own company requests

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Authorization header with Bearer token is required"
}
```

### 403 Forbidden
```json
{
  "error": "Only students can view company request status"
}
```

### 404 Not Found
```json
{
  "error": "Company request not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error"
}
```

## Usage Examples

### Get all requests
```bash
curl -H "Authorization: Bearer <token>" \
  "https://api.example.com/api/student/company-request-status"
```

### Get specific request status
```bash
curl -H "Authorization: Bearer <token>" \
  "https://api.example.com/api/student/company-request-status/uuid-here"
```

### Get requests with statistics
```bash
curl -H "Authorization: Bearer <token>" \
  "https://api.example.com/api/student/company-request-status?includeStats=true"
```
