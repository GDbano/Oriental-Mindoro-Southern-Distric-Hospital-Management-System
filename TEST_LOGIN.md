# Test Login Guide

## Quick Test Using cURL

### Test 1: Check if Backend is Running
```bash
curl http://localhost:8000/api/user
```

**Expected:** Should return an error about authentication (this is good - server is running)

---

### Test 2: Login as Admin
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@omsdh.gov.ph",
    "password": "password123"
  }'
```

**Expected:** Should return user data and access token

---

### Test 3: Login as Patient (Gerald)
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "gerald.depalubos@email.com",
    "password": "password123"
  }'
```

**Expected:** Should return user data and access token

---

### Test 4: Login as Doctor
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dr.santos@omsdh.gov.ph",
    "password": "password123"
  }'
```

**Expected:** Should return user data and access token

---

## Using Postman

### Setup:
1. Open Postman
2. Create new POST request
3. URL: `http://localhost:8000/api/login`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON):
```json
{
  "email": "admin@omsdh.gov.ph",
  "password": "password123"
}
```

### Expected Response:
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "System Administrator",
    "email": "admin@omsdh.gov.ph",
    "role": "admin"
  },
  "access_token": "1|xxxxxxxxxxxxx",
  "token_type": "Bearer"
}
```

---

## Common Issues & Solutions

### Issue 1: ERR_CONNECTION_REFUSED
**Problem:** Backend server is not running

**Solution:**
```bash
cd backend-end
php artisan serve
```

Keep this terminal open!

---

### Issue 2: 422 Unprocessable Content
**Problem:** Validation error

**Possible Causes:**
1. Wrong email format
2. Wrong password
3. Missing fields
4. User doesn't exist in database

**Solution:**
```bash
# Check if users exist
cd backend-end
php artisan tinker

# In tinker:
User::where('email', 'admin@omsdh.gov.ph')->first();
# Should show the admin user

# Check password (should be hashed)
User::where('email', 'admin@omsdh.gov.ph')->first()->password;
# Should show: $2y$12$...

# Exit tinker
exit
```

---

### Issue 3: CORS Error
**Problem:** Frontend can't connect to backend

**Solution:** Check `backend-end/config/cors.php`:
```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => ['*'], // or ['http://localhost:5173']
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
```

---

### Issue 4: Database Not Seeded
**Problem:** Users don't exist

**Solution:**
```bash
cd backend-end
php artisan db:seed --class=SampleDataSeeder
```

---

## Verify Database Has Users

```bash
cd backend-end
php artisan tinker
```

Then run:
```php
// Check all users
User::all()->pluck('email');

// Should show:
// [
//   "admin@omsdh.gov.ph",
//   "dr.santos@omsdh.gov.ph",
//   "dr.reyes@omsdh.gov.ph",
//   "dr.cruz@omsdh.gov.ph",
//   "staff@omsdh.gov.ph",
//   "records@omsdh.gov.ph",
//   "cashier@omsdh.gov.ph",
//   "gerald.depalubos@email.com",
//   "aaron.agbas@email.com",
//   "nepthalie.fabic@email.com",
//   "flordric.magayon@email.com",
//   "reshalyn.mortel@email.com",
//   "cecille.delapena@email.com",
//   "jesserene.espinosa@email.com"
// ]

// Check specific user
User::where('email', 'admin@omsdh.gov.ph')->first();

// Test password
$user = User::where('email', 'admin@omsdh.gov.ph')->first();
Hash::check('password123', $user->password);
// Should return: true

exit
```

---

## Frontend Configuration

Check your frontend `.env` file:

```env
VITE_API_URL=http://localhost:8000
```

Or in your axios configuration:
```javascript
// frontend-end/src/services/api.js
const API_URL = 'http://localhost:8000/api';
```

---

## Complete Startup Checklist

### Backend:
- [ ] Navigate to backend folder: `cd backend-end`
- [ ] Database is running (MySQL/MariaDB)
- [ ] Run migrations: `php artisan migrate`
- [ ] Seed database: `php artisan db:seed --class=SampleDataSeeder`
- [ ] Start server: `php artisan serve`
- [ ] Server running at: http://localhost:8000

### Frontend:
- [ ] Navigate to frontend folder: `cd frontend-end`
- [ ] Install dependencies: `npm install` (if not done)
- [ ] Check .env file has correct API URL
- [ ] Start dev server: `npm run dev`
- [ ] Frontend running at: http://localhost:5173

---

## Test Login from Browser Console

Open browser console (F12) and run:

```javascript
fetch('http://localhost:8000/api/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'admin@omsdh.gov.ph',
    password: 'password123'
  })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
```

**Expected:** Should log user data and token

---

## Still Not Working?

### Check Laravel Logs:
```bash
cd backend-end
tail -f storage/logs/laravel.log
```

Then try logging in again and watch for errors.

### Check Network Tab:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try logging in
4. Click on the failed request
5. Check:
   - Request URL
   - Request Headers
   - Request Payload
   - Response

---

## Quick Reset (If All Else Fails)

```bash
cd backend-end

# Clear everything
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# Fresh database
php artisan migrate:fresh --seed --seeder=SampleDataSeeder

# Restart server
php artisan serve
```

---

**Created:** May 4, 2026  
**Status:** Troubleshooting Guide
