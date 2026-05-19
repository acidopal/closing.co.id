#!/bin/bash
# Scalebiz Production Deployment Script
# Source: 150.109.22.47
# Target: ubuntu@43.133.150.94

TARGET="ubuntu@43.133.150.94"
FRONTEND_DIR="/var/www/scalebiz/frontend"
BACKEND_DIR="/var/www/scalebiz/backend"

echo "🚀 Starting Deployment to Production..."

# 1. Build Backend
echo "📦 Building Backend..."
cd apps/backend
bun run build
cd ../..

# 2. Build Frontend
echo "📦 Building Frontend..."
cd apps/frontend
# Ensure production env vars are used
export VITE_API_URL="https://api.scalebiz.chat"
bun --bun vite build
cd ../..

# 3. Transfer Files
echo "🚚 Transferring files to Production..."

# Frontend (TanStack Start outputs to .output/)
if [ -d "apps/frontend/.output" ]; then
  rsync -avz --delete apps/frontend/.output/ $TARGET:$FRONTEND_DIR/.output/
elif [ -d "apps/frontend/dist" ]; then
  rsync -avz --delete apps/frontend/dist/ $TARGET:$FRONTEND_DIR/
else
  echo "⚠️  No frontend build output found (.output/ or dist/)"
fi

# Backend
rsync -avz --delete apps/backend/dist/ $TARGET:$BACKEND_DIR/dist/
rsync -avz apps/backend/prisma/ $TARGET:$BACKEND_DIR/prisma/
rsync -avz apps/backend/package.json $TARGET:$BACKEND_DIR/

# 4. Restart Backend Service on Target
echo "🔄 Restarting Backend Service on Target..."
ssh $TARGET "sudo systemctl restart scalebiz-api || echo 'Service not found yet'"

echo "✅ Deployment Complete!"
