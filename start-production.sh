#!/bin/bash

# Fluid Permeability Simulator - Production Start Script
# This script starts the production build of the Next.js application

echo "🚀 Starting Fluid Permeability Simulator (Production Mode)..."

# Check if build exists
if [ ! -d ".next/standalone" ]; then
    echo "❌ Production build not found. Running build first..."
    npm run build
fi

# Check if build tools are available
if ! command -v g++ &> /dev/null; then
    echo "⚠️  g++ compiler not found. Installing build-essential..."
    sudo apt update && sudo apt install -y build-essential
fi

# Start the standalone server
echo "🌐 Starting production server..."
echo "📍 Application will be available at: http://localhost:3000"
echo "🔧 API health check: http://localhost:3000/api/health"
echo ""
echo "Press Ctrl+C to stop the server"

cd .next/standalone
node server.js

