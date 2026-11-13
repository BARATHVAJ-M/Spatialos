#!/bin/bash
# ==============================================================================
# SpatialOS - Deployment Script
# ==============================================================================
# Run this script whenever you push new code to your production server to 
# rebuild and restart the applications.
#
# Usage:
# chmod +x deployment/deploy.sh
# ./deployment/deploy.sh
# ==============================================================================

set -e

echo "🚀 Starting Deployment Process..."

# 1. Update Backend
echo "📦 Setting up Backend..."
cd backend
npm ci --legacy-peer-deps
echo "🔄 Pushing Database Schema..."
npx prisma db push
npx prisma generate
echo "🏗️ Building Backend..."
npm run build
cd ..

# 2. Update Dashboard
echo "📦 Setting up Dashboard..."
cd dashboard
npm ci --legacy-peer-deps
echo "🏗️ Building Dashboard..."
npm run build
cd ..

# 3. Restart PM2 Processes
echo "🔄 Restarting PM2 processes..."
pm2 start deployment/ecosystem.config.js || pm2 restart deployment/ecosystem.config.js

# 4. Save PM2 config to startup (optional but recommended on first deploy)
echo "💾 Saving PM2 configuration..."
pm2 save

echo "=============================================================================="
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "Your SpatialOS backend and dashboard are now running."
echo "View logs with: pm2 logs"
echo "=============================================================================="
