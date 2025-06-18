# Deployment Guide

## ⚠️ IMPORTANT: Binary Deployment Issue

**If you're getting "Pre-compiled binary not found" errors in deployment, follow these steps:**

### Quick Fix for Vercel/Netlify Deployment

1. **Compile Linux Binary Locally** (if you have WSL or Linux):
   ```bash
   # Install g++ if not already installed
   sudo apt-get update && sudo apt-get install g++ libomp-dev

   # Compile the Linux version
   g++ -O3 -std=c++17 -fopenmp Perm2D.cpp -o fluid_sim -I.
   ```

2. **Or Use Docker to Compile**:
   ```bash
   # Create a temporary Docker container to compile
   docker run --rm -v $(pwd):/app -w /app gcc:latest bash -c "apt-get update && apt-get install -y libomp-dev && g++ -O3 -std=c++17 -fopenmp Perm2D.cpp -o fluid_sim -I."
   ```

3. **Verify Both Binaries Exist**:
   ```bash
   ls -la fluid_sim*
   # Should show both fluid_sim.exe (Windows) and fluid_sim (Linux)
   ```

4. **Deploy Again**:
   ```bash
   npm run build
   # Deploy to your platform
   ```

### Alternative: Use GitHub Actions for Cross-Platform Build

Create `.github/workflows/build.yml`:
```yaml
name: Build Binaries

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Install dependencies
      run: |
        sudo apt-get update
        sudo apt-get install -y g++ libomp-dev
    
    - name: Build Linux binary
      run: g++ -O3 -std=c++17 -fopenmp Perm2D.cpp -o fluid_sim -I.
    
    - name: Upload Linux binary
      uses: actions/upload-artifact@v3
      with:
        name: fluid_sim-linux
        path: fluid_sim
```

## Quick Fix for Binary Selection Issues

If you encounter the error `"cannot execute binary file"` during deployment, it means the wrong binary is being selected for your platform. This has been fixed in the latest version.

### Ensure Both Binaries Are Available

1. **Build both binaries locally**:
   ```bash
   npm run build:binary:all
   ```

2. **Verify both binaries exist**:
   ```bash
   ls -la fluid_sim*
   # Should show both fluid_sim.exe (Windows) and fluid_sim (Linux)
   ```

3. **Deploy again**:
   ```bash
   npm run build
   # Deploy to your platform
   ```

### What Was Fixed

- The binary selection logic now prioritizes platform-specific binaries
- On Linux deployments, it will use `fluid_sim` (Linux binary)
- On Windows deployments, it will use `fluid_sim.exe` (Windows binary)
- Added detailed logging to help debug deployment issues

### Testing Binary Detection

You can test the binary detection locally:
```bash
node test-binary-detection.js
```

This will show which binary is selected for your current platform.

## Overview

This application supports both CPU-based permeability simulation and GPU-based diffusivity simulation. The deployment strategy depends on your requirements and infrastructure.

## Deployment Options

### Option 1: CPU-Only Deployment (Recommended for most cases)

**Best for:** General web hosting, Vercel, Netlify, Railway, etc.

**What works:**
- ✅ Fluid permeability simulation (CPU-based)
- ✅ Image upload and processing
- ✅ Web interface

**What doesn't work:**
- ❌ Effective diffusivity simulation (requires CUDA/GPU)

**Configuration:**
```bash
# Set environment variable to disable GPU features
NEXT_PUBLIC_GPU_ENABLED=false
```

**Deployment steps:**
1. Deploy to your preferred platform
2. The diffusivity tab will show a "GPU not available" message
3. Permeability simulation works normally

### Option 2: GPU-Enabled Deployment

**Best for:** Research institutions, universities, companies with GPU infrastructure

**Requirements:**
- NVIDIA GPU with Compute Capability >= 8.6
- CUDA Toolkit >= 11.5
- Linux/Windows server with GPU drivers

**What works:**
- ✅ All features (permeability + diffusivity)
- ✅ GPU-accelerated computations
- ✅ High-performance simulations

**Deployment platforms:**
- **AWS EC2**: g4dn, p3, p4 instances
- **Google Cloud**: GPU instances
- **Azure**: NC, ND, NV series
- **Self-hosted**: Your own GPU server

## Environment Variables

```bash
# Enable/disable GPU features
NEXT_PUBLIC_GPU_ENABLED=true

# CUDA configuration
CUDA_VISIBLE_DEVICES=0
CUDA_PATH=/usr/local/cuda

# Application settings
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-domain.com
```

## Docker Deployment

### CPU-Only Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### GPU-Enabled Dockerfile
```dockerfile
FROM nvidia/cuda:11.8-devel-ubuntu20.04

# Install Node.js
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Docker Compose (GPU)
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_GPU_ENABLED=true
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

## Platform-Specific Instructions

### Vercel Deployment
1. Connect your GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy (CPU-only features will work)

### AWS EC2 (GPU)
1. Launch a GPU instance (g4dn.xlarge or larger)
2. Install CUDA Toolkit:
   ```bash
   wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2004/x86_64/cuda-ubuntu2004.pin
   sudo mv cuda-ubuntu2004.pin /etc/apt/preferences.d/cuda-repository-pin-600
   sudo apt-key adv --fetch-keys https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2004/x86_64/7fa2af80.pub
   sudo add-apt-repository "deb https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2004/x86_64/ /"
   sudo apt-get update
   sudo apt-get install cuda
   ```
3. Install Node.js and deploy your app
4. Configure nginx as reverse proxy

### Google Cloud (GPU)
1. Create a VM with GPU
2. Install CUDA Toolkit
3. Deploy using Cloud Run or Compute Engine

## Monitoring and Logs

### Health Check Endpoints
- `/api/health` - Basic health check
- `/api/process-image` - Permeability simulation status
- `/api/process-diffusivity` - Diffusivity simulation status

### Logging
```bash
# Check application logs
npm run dev 2>&1 | tee app.log

# Monitor GPU usage (if available)
nvidia-smi -l 1
```

## Troubleshooting

### CUDA Not Found
```bash
# Check CUDA installation
nvcc --version
nvidia-smi

# Check PATH
echo $PATH | grep cuda
```

### GPU Memory Issues
- Reduce image resolution
- Lower batch sizes
- Use smaller mesh amplification

### Performance Optimization
- Use SSD storage for temporary files
- Optimize CPU core usage
- Monitor GPU utilization

## Cost Considerations

### CPU-Only Deployment
- **Vercel**: Free tier available, $20/month for Pro
- **Netlify**: Free tier available, $19/month for Pro
- **Railway**: $5/month for basic plan

### GPU-Enabled Deployment
- **AWS EC2 g4dn.xlarge**: ~$0.50/hour
- **Google Cloud n1-standard-4 + GPU**: ~$0.70/hour
- **Self-hosted**: Hardware cost + electricity

## Security Considerations

1. **File Upload Limits**: Set appropriate limits for image uploads
2. **Temporary File Cleanup**: Ensure temporary files are properly cleaned up
3. **GPU Access**: Restrict GPU access to authorized users only
4. **Rate Limiting**: Implement rate limiting for API endpoints

## Backup Strategy

1. **Code**: Use Git for version control
2. **Configuration**: Store environment variables securely
3. **Data**: Implement regular backups if storing user data
4. **Results**: Consider storing simulation results in a database

## Scaling Considerations

### Horizontal Scaling
- Use load balancers for multiple instances
- Implement session management
- Consider using Redis for caching

### Vertical Scaling
- Increase GPU memory for larger simulations
- Add more CPU cores for permeability simulations
- Use faster storage (NVMe SSDs)

## Support and Maintenance

1. **Regular Updates**: Keep CUDA drivers and Node.js updated
2. **Monitoring**: Set up alerts for system resources
3. **Backup**: Regular backups of configuration and data
4. **Documentation**: Keep deployment documentation updated 