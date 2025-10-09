# Logout API Documentation

## Overview
The logout API provides comprehensive session management functionality including individual logout, logout from all devices, and session monitoring.

## Endpoints

### 1. Logout (Current Session)
**POST** `/api/auth/logout`

Revokes the current refresh token and clears the session cookie.

**Headers:**
- `Cookie: refreshToken=<token>` (automatically sent by browser)

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

**Status Codes:**
- `200`: Logout successful
- `500`: Server error

### 2. Logout All Devices
**POST** `/api/auth/logout-all`

Revokes all refresh tokens for the authenticated user across all devices.

**Headers:**
- `Authorization: Bearer <access_token>`
- `x-user-id: <user_id>` (set by middleware)

**Response:**
```json
{
  "message": "Logged out from all devices successfully",
  "revokedCount": 3
}
```

**Status Codes:**
- `200`: Logout successful
- `401`: User not authenticated
- `500`: Server error

### 3. Get Active Sessions
**GET** `/api/auth/sessions`

Retrieves all active sessions for the authenticated user.

**Headers:**
- `Authorization: Bearer <access_token>`
- `x-user-id: <user_id>` (set by middleware)

**Response:**
```json
{
  "sessions": [
    {
      "id": "session-uuid",
      "createdAt": "2024-01-15T10:30:00Z",
      "expiresAt": "2024-01-22T10:30:00Z",
      "isCurrent": true,
      "tokenPreview": "abc12345..."
    }
  ],
  "totalActive": 1
}
```

**Status Codes:**
- `200`: Sessions retrieved successfully
- `401`: User not authenticated
- `500`: Server error

## Security Features

### Token Validation
- All refresh tokens are validated against the database
- Expired and revoked tokens are automatically rejected
- JWT signature verification ensures token integrity

### Session Management
- Multiple sessions per user are supported
- Users can view all their active sessions
- Individual or bulk session termination is available

### Automatic Cleanup
- Expired tokens are automatically cleaned up
- Revoked tokens are removed from the database
- Cleanup runs every hour in production

## Frontend Integration

### Basic Logout
```typescript
const logout = async () => {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include' // Include cookies
    });
    
    if (response.ok) {
      // Clear local storage, redirect to login, etc.
      localStorage.clear();
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
```

### Logout All Devices
```typescript
const logoutAll = async () => {
  try {
    const response = await fetch('/api/auth/logout-all', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      localStorage.clear();
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Logout all failed:', error);
  }
};
```

### View Sessions
```typescript
const getSessions = async () => {
  try {
    const response = await fetch('/api/auth/sessions', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const data = await response.json();
    return data.sessions;
  } catch (error) {
    console.error('Failed to get sessions:', error);
  }
};
```

## Database Schema

The logout functionality uses the existing `RefreshToken` model:

```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  createdAt DateTime @default(now())
  expiresAt DateTime
  revoked   Boolean  @default(false)
  user      User     @relation(fields: [userId], references: [id])
}
```

## Security Considerations

1. **Token Revocation**: Tokens are marked as revoked rather than deleted for audit purposes
2. **Database Validation**: All refresh token operations validate against the database
3. **Automatic Cleanup**: Expired tokens are automatically removed to prevent database bloat
4. **Session Tracking**: Users can monitor their active sessions for security
5. **Cookie Management**: Secure cookie settings ensure proper session handling

## Error Handling

All endpoints include comprehensive error handling:
- Invalid or missing tokens return appropriate error messages
- Database errors are logged and return generic error responses
- Network errors are handled gracefully
- Authentication failures return 401 status codes
