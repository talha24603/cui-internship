# Logout API Test Examples

## Testing with cURL

### 1. Login (to get tokens)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}' \
  -c cookies.txt
```

### 2. Logout Current Session
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt \
  -c cookies.txt
```

### 3. Login and Logout All Devices
```bash
# First login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}' \
  -c cookies.txt

# Then logout all devices
curl -X POST http://localhost:3000/api/auth/logout-all \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -b cookies.txt
```

### 4. View Active Sessions
```bash
curl -X GET http://localhost:3000/api/auth/sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Testing with JavaScript/Fetch

### Basic Logout
```javascript
const logout = async () => {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  });
  
  const result = await response.json();
  console.log(result.message); // "Logged out successfully"
};
```

### Logout All Devices
```javascript
const logoutAll = async (accessToken) => {
  const response = await fetch('/api/auth/logout-all', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });
  
  const result = await response.json();
  console.log(result.message); // "Logged out from all devices successfully"
  console.log(`Revoked ${result.revokedCount} sessions`);
};
```

### Get Active Sessions
```javascript
const getSessions = async (accessToken) => {
  const response = await fetch('/api/auth/sessions', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  const result = await response.json();
  console.log(`Active sessions: ${result.totalActive}`);
  result.sessions.forEach(session => {
    console.log(`Session ${session.id}: Created ${session.createdAt}, Current: ${session.isCurrent}`);
  });
};
```

## Expected Responses

### Successful Logout
```json
{
  "message": "Logged out successfully"
}
```

### Successful Logout All
```json
{
  "message": "Logged out from all devices successfully",
  "revokedCount": 3
}
```

### Active Sessions
```json
{
  "sessions": [
    {
      "id": "uuid-1234",
      "createdAt": "2024-01-15T10:30:00Z",
      "expiresAt": "2024-01-22T10:30:00Z",
      "isCurrent": true,
      "tokenPreview": "abc12345..."
    }
  ],
  "totalActive": 1
}
```

### Error Responses
```json
// No active session
{
  "message": "No active session found"
}

// Not authenticated
{
  "error": "User not authenticated"
}

// Server error
{
  "message": "Logout failed"
}
```

## Integration with Frontend Frameworks

### React Hook Example
```javascript
import { useState, useCallback } from 'react';

const useAuth = () => {
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
  
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      localStorage.removeItem('accessToken');
      setAccessToken(null);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, []);
  
  const logoutAll = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/logout-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      const result = await response.json();
      console.log(`Revoked ${result.revokedCount} sessions`);
      
      localStorage.removeItem('accessToken');
      setAccessToken(null);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout all failed:', error);
    }
  }, [accessToken]);
  
  return { logout, logoutAll };
};
```

### Vue.js Composition API Example
```javascript
import { ref, computed } from 'vue';

export function useAuth() {
  const accessToken = ref(localStorage.getItem('accessToken'));
  
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      localStorage.removeItem('accessToken');
      accessToken.value = null;
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  const logoutAll = async () => {
    try {
      const response = await fetch('/api/auth/logout-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken.value}`
        }
      });
      
      const result = await response.json();
      console.log(`Revoked ${result.revokedCount} sessions`);
      
      localStorage.removeItem('accessToken');
      accessToken.value = null;
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout all failed:', error);
    }
  };
  
  return {
    accessToken: computed(() => accessToken.value),
    logout,
    logoutAll
  };
}
```
