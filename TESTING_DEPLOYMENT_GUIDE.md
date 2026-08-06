# Testing Deployment Guide for OMSDH Management System

## Quick Summary

Your system consists of:

- **Backend**: Laravel API (PHP) - runs on port 8000
- **Frontend**: React + Vite - runs on port 3000
- **Database**: MySQL

---

## Option 1: Local Testing (Fastest for Initial Testing)

### Prerequisites

- Laragon or XAMPP installed
- PHP 8.1+
- Node.js 18+
- MySQL running

### Setup Steps

**Backend:**

```bash
cd backend-end
composer install
php artisan migrate --seed
php artisan serve --port=8000
```

**Frontend (new terminal):**

```bash
cd frontend-end
npm install
npm run dev
```

**Access:** http://localhost:3000

### Pros

- ✅ Instant setup
- ✅ Fast development feedback
- ✅ Client can test locally on their machine

### Cons

- ❌ Client needs to set up environment
- ❌ Not accessible from external networks

---

## Option 2: Shared Server/VPS Deployment (Recommended for Client Testing)

### Best For

- Giving client a stable testing URL
- Demo link in email/documentation
- Multiple team members testing simultaneously

### Prerequisites

- VPS or shared hosting account (e.g., DigitalOcean, Linode, AWS EC2, or traditional hosting)
- Domain name (optional but recommended)

### Deployment Steps

#### 1. Upload Files

```bash
# Via FTP/SFTP or Git:
git clone your-repo server-path
cd server-path/backend-end
```

#### 2. Configure Backend (.env)

```ini
APP_ENV=testing
APP_DEBUG=true
APP_URL=https://yourdomain.com/api

# Update database credentials for your server
DB_CONNECTION=mysql
DB_HOST=localhost
DB_DATABASE=omsdh_testing
DB_USERNAME=omsdh_user
DB_PASSWORD=secure_password

# Update CORS/domains
SANCTUM_STATEFUL_DOMAINS=yourdomain.com,www.yourdomain.com
SESSION_DOMAIN=yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

#### 3. Setup Backend

```bash
cd backend-end
composer install --no-dev
php artisan key:generate
php artisan migrate --seed
php artisan config:cache
```

#### 4. Configure Frontend (.env)

Create `frontend-end/.env`:

```ini
VITE_API_URL=https://yourdomain.com/api
```

#### 5. Build Frontend

```bash
cd frontend-end
npm install
npm run build
# Dist folder gets deployed to public folder
```

#### 6. Web Server Configuration

**Nginx (recommended):**

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;

    root /var/www/omsdh/frontend-end/dist;
    index index.html;

    # Frontend routes
    location / {
        try_files $uri /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Apache:**

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    Redirect / https://yourdomain.com/
</VirtualHost>

<VirtualHost *:443 >
    ServerName yourdomain.com

    DocumentRoot /var/www/omsdh/frontend-end/dist

    <Directory /var/www/omsdh/frontend-end/dist>
        Options -MultiViews
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteRule ^ index.html [QSA,L]
    </Directory>

    # API proxy
    ProxyPass /api http://localhost:8000/
    ProxyPassReverse /api http://localhost:8000/

    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/yourdomain.crt
    SSLCertificateKeyFile /etc/ssl/private/yourdomain.key
</VirtualHost>
```

#### 7. SSL Certificate (Let's Encrypt - FREE)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com
```

#### 8. Start Backend (using supervisor)

Create `/etc/supervisor/conf.d/omsdh.conf`:

```ini
[program:omsdh-api]
process_name=%(program_name)s_%(process_num)02d
command=php artisan serve --port=8000
autostart=true
autorestart=true
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/omsdh/logs/api.log
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
```

---

## Option 3: Docker Container Deployment (Most Professional)

### Pros

- ✅ Consistent environment
- ✅ Easy to replicate
- ✅ Production-ready
- ✅ Scales easily

### Setup

**Create `Dockerfile`:**

```dockerfile
FROM php:8.3-fpm

RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    zip \
    && docker-php-ext-install pdo pdo_mysql zip

WORKDIR /app
COPY backend-end/ .

RUN curl -s https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
RUN composer install

EXPOSE 8000
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
```

**Create `docker-compose.yml`:**

```yaml
version: "3.8"
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: omsdh
      MYSQL_ROOT_PASSWORD: root
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  backend:
    build: ./backend-end
    ports:
      - "8000:8000"
    depends_on:
      - mysql
    environment:
      DB_HOST: mysql
      DB_DATABASE: omsdh
      DB_USERNAME: root
      DB_PASSWORD: root

  frontend:
    image: node:18
    working_dir: /app
    volumes:
      - ./frontend-end:/app
    ports:
      - "3000:3000"
    command: npm run dev

volumes:
  mysql_data:
```

**Deploy:**

```bash
docker-compose up -d
```

---

## Option 4: Platform-as-a-Service (Easiest)

### Recommended PaaS Platforms

| Platform                   | Backend | Frontend | Pros                    | Cons                      |
| -------------------------- | ------- | -------- | ----------------------- | ------------------------- |
| **Heroku**                 | ✅      | ✅       | Very easy, free tier    | Expensive after free tier |
| **Railway**                | ✅      | ✅       | Simple, great docs      | Smaller community         |
| **Render**                 | ✅      | ✅       | Good free tier          | Cold starts               |
| **Vercel (Frontend only)** | ❌      | ✅       | Excellent React support | Need separate backend     |

### Railway Example

```bash
# Connect your git repo
railway link

# Deploy
railway up

# Check status
railway logs
```

---

## Option 5: Traditional Shared Hosting

### For Hosts Like Hostinger, Namecheap, Bluehost

**Prerequisites:**

- PHP 8.1+ support
- Composer available
- Node.js available (or use pre-built frontend)
- SSH access

**Steps:**

1. Upload via FTP
2. Run: `composer install`
3. Update `.env` with hosting credentials
4. Run: `php artisan migrate:fresh --seed`
5. Build frontend: `npm run build`
6. Configure .htaccess for routing

---

## Testing Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured correctly
- [ ] Database credentials updated
- [ ] Frontend API URLs updated
- [ ] SSL certificate configured
- [ ] Domain DNS configured
- [ ] Database backed up

### Post-Deployment

- [ ] Frontend loads without errors
- [ ] API responds to requests
- [ ] Database connection works
- [ ] User login works
- [ ] Can create sample data
- [ ] Can view patient records
- [ ] Responsive design works on mobile
- [ ] No console errors in browser

### Security

- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Database passwords are strong
- [ ] `.env` file not accessible publicly
- [ ] Debug mode disabled in production
- [ ] API rate limiting configured

---

## Quick Command Reference

```bash
# Check status
curl https://yourdomain.com/api/health

# View logs
tail -f storage/logs/laravel.log

# Run migrations
php artisan migrate

# Seed database
php artisan db:seed

# Clear cache
php artisan config:cache

# Generate test data
php artisan db:seed --class=DemoSeeder
```

---

## Recommended Setup for Client Testing

**My Recommendation:** Start with **Option 2 (VPS)** or **Option 3 (Docker)**

1. Use a $5/month VPS (DigitalOcean/Linode)
2. Configure with SSL
3. Share URL: `https://omsdh-demo.yourdomain.com`
4. Give client testing credentials in email
5. Monitor logs for errors

---

## Support & Troubleshooting

| Issue                | Solution                                          |
| -------------------- | ------------------------------------------------- |
| "Connection refused" | Check if backend is running, verify port          |
| "CORS error"         | Update SANCTUM_STATEFUL_DOMAINS in .env           |
| "Database error"     | Verify DB credentials, run migrations             |
| "Frontend blank"     | Check browser console, verify API URL             |
| "SSL error"          | Regenerate certificates, check Let's Encrypt logs |

---

**Next Step:** Let me know which deployment option interests you most, and I can help you set it up!
