#!/bin/bash
# ==============================================================================
# SpatialOS - Single-Click Ubuntu Production Setup Script
# ==============================================================================
# This script sets up a bare-metal or VPS Ubuntu server (e.g. AWS EC2, DigitalOcean)
# with all dependencies required to run SpatialOS (Node 20, PostgreSQL, Redis, PM2, Nginx).
#
# RUN THIS SCRIPT ONCE ON A NEW SERVER:
# chmod +x deployment/setup_ubuntu.sh
# sudo ./deployment/setup_ubuntu.sh
# ==============================================================================

set -e # Exit on error

echo "🚀 Starting SpatialOS Ubuntu Production Setup..."

# 1. Update system
echo "📦 Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# 2. Install Node.js (v20)
if ! command -v node &> /dev/null; then
    echo "🟩 Installing Node.js v20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js is already installed: $(node -v)"
fi

# 3. Install Redis
if ! command -v redis-server &> /dev/null; then
    echo "🔴 Installing Redis..."
    sudo apt-get install -y redis-server
    sudo systemctl enable redis-server
    sudo systemctl start redis-server
else
    echo "✅ Redis is already installed."
fi

# 4. Install PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "🐘 Installing PostgreSQL..."
    sudo apt-get install -y postgresql postgresql-contrib
    sudo systemctl enable postgresql
    sudo systemctl start postgresql

    # Setup the default database and user
    echo "🔧 Configuring PostgreSQL 'spatialos' database..."
    sudo -u postgres psql -c "CREATE DATABASE spatialos;" || true
    sudo -u postgres psql -c "CREATE USER spatialos_user WITH ENCRYPTED PASSWORD 'spatialos_password';" || true
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE spatialos TO spatialos_user;" || true
    sudo -u postgres psql -c "ALTER DATABASE spatialos OWNER TO spatialos_user;" || true
else
    echo "✅ PostgreSQL is already installed."
fi

# 5. Install Nginx (For Reverse Proxy)
if ! command -v nginx &> /dev/null; then
    echo "🌐 Installing Nginx..."
    sudo apt-get install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
else
    echo "✅ Nginx is already installed."
fi

# 6. Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    echo "⚡ Installing PM2..."
    sudo npm install -g pm2
else
    echo "✅ PM2 is already installed."
fi

echo "=============================================================================="
echo "🎉 SETUP COMPLETE!"
echo "Next Steps:"
echo "1. Verify your .env variables (DATABASE_URL, REDIS_URL, etc.)."
echo "   Default Local DB: postgresql://spatialos_user:spatialos_password@localhost:5432/spatialos?schema=public"
echo "   Default Redis: redis://localhost:6379"
echo "2. Run the deployment script to boot the apps: bash deployment/deploy.sh"
echo "=============================================================================="
