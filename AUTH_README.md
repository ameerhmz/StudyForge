# StudyForge Authentication System

## Overview
JWT-based authentication with **Option 4: Default Student + Teacher Code** strategy.

### Features
- ✅ **Signup/Login** with JWT in httpOnly cookies
- ✅ **Default role: Student** for all new users
- ✅ **Teacher upgrade** with access code
- ✅ **Protected routes** for authenticated users
- ✅ **Role-based access** (student/teacher)

---

## How It Works

### 1. Sign Up
- All new users register as **students** by default
- Password is hashed with bcrypt
- JWT token sent in httpOnly cookie (7-day expiry)

### 2. Login
- Email + password authentication
- JWT token refresh on successful login
- Auto-redirect to dashboard

### 3. Teacher Upgrade
- Students can upgrade to teachers using special code
- **Default code:** `TEACH2024` (change in production!)
- New JWT issued with updated role
- Access to teacher dashboard unlocked

---

## API Endpoints

### Auth Routes (`/api/auth`)

#### POST `/api/auth/signup`
Register new user (default: student)
```json
Request:
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "student"
    }
  }
}
```

#### POST `/api/auth/login`
Login existing user
```json
Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "student"
    }
  }
}
```

#### POST `/api/auth/logout`
Logout user (clears auth cookie)
```json
Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET `/api/auth/me`
Get current authenticated user
```json
Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "student"
    }
  }
}
```

#### POST `/api/auth/upgrade-to-teacher`
Upgrade student to teacher with access code
```json
Request:
{
  "code": "TEACH2024"
}

Response:
{
  "success": true,
  "message": "Successfully upgraded to teacher",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "teacher"
    }
  }
}
```

---

## Auth Middleware

### `requireAuth`
Verify JWT token, block unauthenticated users
```javascript
import { requireAuth } from '../middleware/auth.js';

router.get('/protected', requireAuth, (req, res) => {
  // req.user = { userId, email, role }
});
```

### `requireTeacher`
Block non-teachers (use with `requireAuth`)
```javascript
import { requireAuth, requireTeacher } from '../middleware/auth.js';

router.get('/teacher-only', requireAuth, requireTeacher, (req, res) => {
  // Only teachers can access
});
```

### `optionalAuth`
Add user to req if authenticated, but don't block
```javascript
import { optionalAuth } from '../middleware/auth.js';

router.get('/public', optionalAuth, (req, res) => {
  // req.user is available if logged in, otherwise undefined
});
```

---

## Frontend Usage

### Auth Store (`useAuthStore`)

```javascript
import useAuthStore from '../store/useAuthStore';

function MyComponent() {
  const { user, isAuthenticated, login, logout, signup, upgradeToTeacher } = useAuthStore();

  // Sign up
  await signup('email@example.com', 'password', 'John Doe');

  // Login
  await login('email@example.com', 'password');

  // Logout
  await logout();

  // Upgrade to teacher
  await upgradeToTeacher('TEACH2024');

  // Check auth status
  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome {user.name} ({user.role})</p>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
}
```

### Protected Routes

```javascript
import ProtectedRoute from '../components/ProtectedRoute';

// Student or Teacher
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>

// Teachers only
<Route
  path="/teacher"
  element={
    <ProtectedRoute requireTeacher>
      <TeacherDashboard />
    </ProtectedRoute>
  }
/>
```

---

## Environment Variables

### Server (`.env`)
```bash
# Authentication
JWT_SECRET=your-random-secret-key-change-in-production
TEACHER_ACCESS_CODE=TEACH2024

# CORS
CLIENT_URL=http://localhost:5173
```

### Client (`.env`)
```bash
# API URL
VITE_API_URL=http://localhost:3000
```

---

## Security Best Practices

### ✅ Implemented
- Passwords hashed with bcrypt (salt rounds: 10)
- JWT in httpOnly cookies (no localStorage XSS risk)
- CORS configured with credentials
- 7-day token expiry
- Secure cookies in production (`secure: true`)

### 🔒 Production Checklist
- [ ] Change `JWT_SECRET` to random 256-bit string
- [ ] Change `TEACHER_ACCESS_CODE` to secure code
- [ ] Enable HTTPS (`secure: true` for cookies)
- [ ] Set up refresh tokens for extended sessions
- [ ] Add rate limiting on auth endpoints
- [ ] Implement account verification (email)
- [ ] Add password reset flow
- [ ] Store users in database (currently in-memory)
- [ ] Add session revocation

---

## User Flow

### Student Flow
1. Sign up → Role: `student`
2. Upload PDFs, study, take quizzes
3. (Optional) Upgrade to teacher with code

### Teacher Flow
1. Sign up as student
2. Upgrade with teacher code → Role: `teacher`
3. Access teacher dashboard
4. Create classes and monitor students

---

## Database Migration

Currently using **in-memory storage** (`Map`). To persist users:

```javascript
// Replace in server/src/routes/auth.js
import { db } from '../services/storage.js';
import * as schema from '../db/schema.js';

// Create users table
const users = await db.select().from(schema.users).where(eq(schema.users.email, email));
```

---

## Testing

### Test Accounts (in-memory, restart to clear)

```bash
# Create a student
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.com","password":"test123","name":"Test Student"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.com","password":"test123"}' \
  --cookie-jar cookies.txt

# Upgrade to teacher
curl -X POST http://localhost:3000/api/auth/upgrade-to-teacher \
  -H "Content-Type: application/json" \
  -d '{"code":"TEACH2024"}' \
  --cookie cookies.txt
```

---

## Teacher Access Code

Default code: **`TEACH2024`**

### To change:
1. Update `TEACHER_ACCESS_CODE` in `.env`
2. Restart server
3. Distribute new code to authorized teachers

---

## Next Steps

- [ ] Add password reset functionality
- [ ] Email verification
- [ ] OAuth (Google, GitHub)
- [ ] Refresh tokens
- [ ] Database persistence
- [ ] Admin role for managing teachers
- [ ] Class enrollment codes (separate from teacher upgrade)
