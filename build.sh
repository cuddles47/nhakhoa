#!/bin/bash

# Build script with versioning: YYYYMMDDHHMM
VERSION=$(date +%Y%m%d%H%M)
echo "🚀 Building nhakhoa images with version: $VERSION"

# Build backend
echo "📦 Building backend..."
cd backend
docker build -t nhakhoa-backend:$VERSION -t nhakhoa-backend:latest .
cd ..

# Build frontend  
echo "📦 Building frontend..."
cd frontend
docker build -t nhakhoa-frontend:$VERSION -t nhakhoa-frontend:latest .
cd ..

echo "✅ Build complete!"
echo "📋 Images created:"
echo "   - nhakhoa-backend:$VERSION"
echo "   - nhakhoa-backend:latest"
echo "   - nhakhoa-frontend:$VERSION"
echo "   - nhakhoa-frontend:latest"
echo ""
echo "💡 To deploy: docker-compose up -d"
