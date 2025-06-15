#!/bin/bash

# Fluid Permeability Simulator - Quick Start Script
# This script sets up and starts the Next.js application

echo "🚀 Starting Fluid Permeability Simulator..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

# Check if build tools are available
if ! command -v g++ &> /dev/null; then
    echo "⚠️  g++ compiler not found. Installing build-essential..."
    sudo apt update && sudo apt install -y build-essential
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the application if .next doesn't exist
if [ ! -d ".next" ]; then
    echo "🔨 Building application..."
    npm run build
fi

# Start the development server
echo "🌐 Starting development server..."
echo "📍 Application will be available at: http://localhost:3000"
echo "🔧 API health check: http://localhost:3000/api/health"
echo ""
echo "Press Ctrl+C to stop the server"

npm run dev

