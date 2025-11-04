#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd, options = {}) {
    console.log(`> ${cmd}`);
    try {
        execSync(cmd, { stdio: 'inherit', ...options });
    } catch (error) {
        console.error(`❌ Command failed: ${cmd}`);
        throw error;
    }
}

function createNginxProxyConfig(domain, containerPort, isApi = false, apiPort = '4000') {
    const apiPrefix = isApi ? '/api' : '';

    return `
server {
    listen 443 ssl http2;
    server_name ${domain};
    client_max_body_size 50M;

    ${isApi ? `
    location /api {
        proxy_pass http://127.0.0.1:${containerPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    ` : `
    location / {
        proxy_pass http://127.0.0.1:${containerPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Handle client-side routing
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy (if API and frontend are on same domain)
    location /api {
        proxy_pass http://127.0.0.1:${apiPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Static assets caching
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:${containerPort};
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    `}

    ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}

server {
    listen 80;
    server_name ${domain};
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://${domain}$request_uri;
    }
}
  `.trim();
}

function createEnvProductionTemplate(appDir) {
    const envTemplate = `# Database Configuration
MYSQL_ROOT_PASSWORD=CHANGE_ME_STRONG_PASSWORD
MYSQL_DATABASE=hr_system
MYSQL_USER=hruser
MYSQL_PASSWORD=CHANGE_ME_STRONG_PASSWORD
MYSQL_PORT=3306

# Application URLs (Update with your domains)
FRONTEND_URL=https://CHANGE_ME_FRONTEND_DOMAIN
API_BASE_URL=https://CHANGE_ME_API_DOMAIN

# Ports (Internal - Nginx will proxy)
WEB_PORT=4001
API_PORT=4000

# JWT Secrets (Generate with: openssl rand -base64 32)
JWT_SECRET=CHANGE_ME_GENERATE_STRONG_SECRET_MIN_32_CHARS
JWT_REFRESH_SECRET=CHANGE_ME_GENERATE_STRONG_SECRET_MIN_32_CHARS
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=5242880

# Email (Optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# Environment
NODE_ENV=production
`;

    const envPath = path.join(appDir, '.env.production');
    if (!fs.existsSync(envPath)) {
        fs.writeFileSync(envPath, envTemplate);
        console.log(`✅ Created .env.production template at ${envPath}`);
        console.log(`⚠️  Please edit .env.production with your configuration before continuing.`);
    }
}

function main() {
    // Check if running as root
    if (process.getuid() !== 0) {
        console.error('❌ Please run as root or with sudo.');
        process.exit(1);
    }

    // Parse arguments
    // Usage: sudo node deploy-production.js <repo_url> <frontend_domain> <api_domain> <api_port> [branch] [email]
    const [, , repo, frontendDomain, apiDomain, apiPort = '4000', branch = 'main', email] = process.argv;

    if (!repo || !frontendDomain || !apiDomain || !apiPort) {
        console.error('Usage: sudo node deploy-production.js <github_repo_url> <frontend_domain> <api_domain> <api_port> [branch] [email]');
        console.error('');
        console.error('Examples:');
        console.error('  # Separate domains:');
        console.error('  sudo node deploy-production.js https://github.com/user/hr-system.git app.example.com api.example.com 4000 main admin@example.com');
        console.error('');
        console.error('  # Same domain (API at /api):');
        console.error('  sudo node deploy-production.js https://github.com/user/hr-system.git app.example.com app.example.com 4000 main admin@example.com');
        console.error('');
        console.error('Arguments:');
        console.error('  repo_url        - GitHub repository URL');
        console.error('  frontend_domain - Domain for frontend (e.g., app.example.com)');
        console.error('  api_domain      - Domain for API (e.g., api.example.com)');
        console.error('  api_port        - Port where API container runs (default: 4000)');
        console.error('  branch          - Git branch to deploy (default: main)');
        console.error('  email           - Email for Let\'s Encrypt (optional)');
        process.exit(1);
    }

    const appDir = `/var/www/hr-system`;
    const webPort = process.env.WEB_PORT || '4001'; // Frontend port (default: 4001)
    const certbotEmail = email || `admin@${frontendDomain.split('.')[0]}.com`;
    const sameDomain = frontendDomain === apiDomain;

    console.log('🚀 HR System - Production Deployment');
    console.log('=====================================');
    console.log(`Repository: ${repo}`);
    console.log(`Branch: ${branch}`);
    console.log(`Frontend Domain: ${frontendDomain}`);
    console.log(`API Domain: ${apiDomain}`);
    if (sameDomain) {
        console.log(`📌 Using same domain - API accessible at /api`);
    }
    console.log(`API Port: ${apiPort}`);
    console.log(`Installation Directory: ${appDir}`);
    console.log('');

    try {
        // 1. Clone or pull repo on given branch
        if (!fs.existsSync(appDir)) {
            console.log('📦 Cloning repository...');
            run(`git clone --branch ${branch} ${repo} ${appDir}`);
        } else {
            console.log(`📦 Directory exists. Fetching latest changes on branch ${branch}...`);
            run(`cd ${appDir} && git fetch && git checkout ${branch} && git pull origin ${branch}`);
        }

        // 2. Create .env.production template if it doesn't exist
        createEnvProductionTemplate(appDir);

        const envPath = path.join(appDir, '.env.production');
        console.log(`\n⚠️  Checking .env.production...`);
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            if (envContent.includes('CHANGE_ME')) {
                console.error('❌ .env.production contains placeholder values. Please configure it first.');
                console.error(`   Edit: ${envPath}`);
                process.exit(1);
            }
            console.log('✅ .env.production is configured');
        } else {
            console.error('❌ .env.production not found. Please create it first.');
            process.exit(1);
        }

        // 3. Load environment variables
        console.log('\n📝 Loading environment variables...');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const envVars = {};
        envContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                if (key && valueParts.length > 0) {
                    envVars[key.trim()] = valueParts.join('=').trim();
                }
            }
        });

        // Set environment variables for docker-compose
        Object.entries(envVars).forEach(([key, value]) => {
            process.env[key] = value;
        });

        // Override URLs with provided domains
        process.env.FRONTEND_URL = `https://${frontendDomain}`;
        process.env.API_BASE_URL = `https://${apiDomain}`;
        process.env.API_PORT = envVars.API_PORT || apiPort; // Use from .env.production, then command line arg, then default
        process.env.WEB_PORT = envVars.WEB_PORT || webPort; // Use from .env.production or default

        // 4. Build Docker images
        console.log('\n🔨 Building Docker images...');
        run(`cd ${appDir} && docker compose -f docker-compose.prod.yml build --no-cache`);

        // 5. Stop & remove existing containers (if running)
        console.log('\n🛑 Stopping existing containers...');
        run(`cd ${appDir} && docker compose -f docker-compose.prod.yml down || true`);

        // 6. Start containers
        console.log('\n🚀 Starting production containers...');
        run(`cd ${appDir} && docker compose -f docker-compose.prod.yml up -d`);

        // 7. Wait for MySQL to be ready
        console.log('\n⏳ Waiting for MySQL to be ready...');
        let mysqlReady = false;
        for (let i = 0; i < 30; i++) {
            try {
                run(`cd ${appDir} && docker compose -f docker-compose.prod.yml exec -T mysql mysqladmin ping -h localhost --silent`, { stdio: 'pipe' });
                console.log('✅ MySQL is ready');
                mysqlReady = true;
                break;
            } catch (e) {
                process.stdout.write('.');
                // Sleep without async/await
                execSync('sleep 2', { stdio: 'pipe' });
            }
        }

        if (!mysqlReady) {
            console.error('\n❌ MySQL failed to start within timeout');
            process.exit(1);
        }

        // 8. Run database migrations
        console.log('\n🗄️  Running database migrations...');
        try {
            run(`cd ${appDir} && docker compose -f docker-compose.prod.yml exec -T api npx prisma migrate deploy`);
        } catch (e) {
            console.log('⚠️  Migration deploy failed, trying db push...');
            run(`cd ${appDir} && docker compose -f docker-compose.prod.yml exec -T api npx prisma db push`);
        }

        // 9. Seed database (only if empty - check if admin user exists)
        console.log('\n🌱 Checking if database needs seeding...');
        try {
            run(`cd ${appDir} && docker compose -f docker-compose.prod.yml exec -T api npm run seed`, { stdio: 'inherit' });
        } catch (e) {
            console.log('ℹ️  Database already has data or seeding failed, continuing...');
        }

        // 10. Setup Nginx configurations
        console.log('\n🌐 Setting up Nginx reverse proxy...');

        if (sameDomain) {
            console.log(`📝 Same domain detected. Creating unified config for ${frontendDomain}...`);
            // Single Nginx config for same domain (frontend + /api proxy)
            const unifiedNginxConf = createNginxProxyConfig(frontendDomain, webPort, false, apiPort);
            fs.writeFileSync(`/etc/nginx/sites-available/${frontendDomain}`, unifiedNginxConf);
            run(`ln -sf /etc/nginx/sites-available/${frontendDomain} /etc/nginx/sites-enabled/${frontendDomain} || true`);
        } else {
            console.log(`📝 Separate domains. Creating configs for ${frontendDomain} and ${apiDomain}...`);
            // Frontend Nginx config
            const frontendNginxConf = createNginxProxyConfig(frontendDomain, webPort, false, apiPort);
            fs.writeFileSync(`/etc/nginx/sites-available/${frontendDomain}`, frontendNginxConf);

            // API Nginx config
            const apiNginxConf = createNginxProxyConfig(apiDomain, apiPort, true, apiPort);
            fs.writeFileSync(`/etc/nginx/sites-available/${apiDomain}`, apiNginxConf);

            // Enable sites
            run(`ln -sf /etc/nginx/sites-available/${frontendDomain} /etc/nginx/sites-enabled/${frontendDomain} || true`);
            run(`ln -sf /etc/nginx/sites-available/${apiDomain} /etc/nginx/sites-enabled/${apiDomain} || true`);
        }

        // Remove default nginx site if it exists
        run(`rm -f /etc/nginx/sites-enabled/default || true`);

        // 11. Test Nginx configuration
        console.log('\n🧪 Testing Nginx configuration...');
        run(`nginx -t`);

        // 12. Reload Nginx
        run(`systemctl reload nginx`);

        // 13. Setup SSL with Let's Encrypt
        console.log('\n🔒 Setting up SSL certificates...');

        // Check if certbot is installed
        try {
            run(`which certbot`, { stdio: 'pipe' });
        } catch (e) {
            console.log('📦 Installing Certbot...');
            run(`apt-get update && apt-get install -y certbot python3-certbot-nginx`);
        }

        // Get SSL certificates
        if (sameDomain) {
            console.log(`📜 Obtaining SSL certificate for ${frontendDomain}...`);
            run(`certbot --nginx -d ${frontendDomain} --non-interactive --agree-tos --email ${certbotEmail} --redirect`);
        } else {
            console.log(`📜 Obtaining SSL certificate for ${frontendDomain}...`);
            run(`certbot --nginx -d ${frontendDomain} --non-interactive --agree-tos --email ${certbotEmail} --redirect`);

            console.log(`📜 Obtaining SSL certificate for ${apiDomain}...`);
            run(`certbot --nginx -d ${apiDomain} --non-interactive --agree-tos --email ${certbotEmail} --redirect`);
        }

        // 14. Final Nginx test & reload
        console.log('\n🔍 Final Nginx configuration test...');
        run(`nginx -t`);
        run(`systemctl reload nginx`);

        // 15. Setup auto-renewal for SSL
        console.log('\n⏰ Setting up SSL auto-renewal...');
        run(`systemctl enable certbot.timer`);
        run(`systemctl start certbot.timer`);

        // 16. Check container status
        console.log('\n📊 Checking container status...');
        run(`cd ${appDir} && docker compose -f docker-compose.prod.yml ps`);

        console.log('\n=====================================');
        console.log('✅ Deployment Complete!');
        console.log('');
        console.log('📍 Access your application:');
        if (sameDomain) {
            console.log(`   Frontend: https://${frontendDomain}`);
            console.log(`   API:      https://${frontendDomain}/api`);
        } else {
            console.log(`   Frontend: https://${frontendDomain}`);
            console.log(`   API:      https://${apiDomain}`);
        }
        console.log('');
        console.log('🔑 Default login credentials:');
        console.log('   Email:    admin@hrsystem.com');
        console.log('   Password: Admin@123');
        console.log('   ⚠️  Please change the default password immediately!');
        console.log('');
        console.log('📊 Useful commands:');
        console.log(`   View logs:    cd ${appDir} && docker compose -f docker-compose.prod.yml logs -f`);
        console.log(`   Stop:         cd ${appDir} && docker compose -f docker-compose.prod.yml down`);
        console.log(`   Restart:      cd ${appDir} && docker compose -f docker-compose.prod.yml restart`);
        console.log(`   Status:       cd ${appDir} && docker compose -f docker-compose.prod.yml ps`);
        console.log('=====================================');

    } catch (err) {
        console.error('\n❌ Deployment failed:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
}

main();
