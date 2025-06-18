#!/bin/bash

# Deployment script for Fluid & Diffusion Simulator
# Usage: ./deploy.sh [cpu|gpu]

set -e

DEPLOYMENT_TYPE=${1:-cpu}

echo "🚀 Starting deployment for: $DEPLOYMENT_TYPE"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Build the application
echo "🔨 Building application..."
npm run build

# Set environment variables based on deployment type
if [ "$DEPLOYMENT_TYPE" = "gpu" ]; then
    echo "🖥️  GPU deployment detected"
    export NEXT_PUBLIC_GPU_ENABLED=true
    
    # Check CUDA availability
    if command -v nvcc &> /dev/null; then
        echo "✅ CUDA compiler found"
        nvcc --version
    else
        echo "⚠️  Warning: CUDA compiler not found. GPU features will not work."
        echo "   Install NVIDIA CUDA Toolkit for full functionality."
    fi
    
    # Check GPU availability
    if command -v nvidia-smi &> /dev/null; then
        echo "✅ NVIDIA GPU detected"
        nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits
    else
        echo "⚠️  Warning: NVIDIA GPU not detected. GPU features will not work."
    fi
    
elif [ "$DEPLOYMENT_TYPE" = "cpu" ]; then
    echo "💻 CPU-only deployment"
    export NEXT_PUBLIC_GPU_ENABLED=false
else
    echo "❌ Error: Invalid deployment type. Use 'cpu' or 'gpu'"
    exit 1
fi

# Create deployment info
echo "📋 Creating deployment info..."
cat > deployment-info.txt << EOF
Deployment Type: $DEPLOYMENT_TYPE
GPU Enabled: $NEXT_PUBLIC_GPU_ENABLED
Timestamp: $(date)
Node Version: $(node --version)
NPM Version: $(npm --version)
EOF

if [ "$DEPLOYMENT_TYPE" = "gpu" ]; then
    if command -v nvcc &> /dev/null; then
        echo "CUDA Version: $(nvcc --version | head -n1)" >> deployment-info.txt
    fi
    if command -v nvidia-smi &> /dev/null; then
        echo "GPU Info: $(nvidia-smi --query-gpu=name --format=csv,noheader,nounits)" >> deployment-info.txt
    fi
fi

echo "✅ Deployment preparation complete!"
echo "📄 Deployment info saved to: deployment-info.txt"
echo ""
echo "🚀 To start the application:"
echo "   npm start"
echo ""
echo "🌐 The application will be available at: http://localhost:3000"
echo ""
echo "📊 To check GPU availability:"
echo "   curl http://localhost:3000/api/process-diffusivity" 