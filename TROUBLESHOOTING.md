# Troubleshooting Guide

## OpenMP Runtime Library Error: "libgomp.so.1: cannot open shared object file"

This error occurs when the diffusivity simulation tries to run a CUDA executable that was compiled with OpenMP support but the runtime library is missing.

### Quick Diagnosis

1. **Check if the error mentions `libgomp.so.1`:**
   ```
   ./fluid_sim: error while loading shared libraries: libgomp.so.1: cannot open shared object file
   ```

2. **Check OpenMP library availability:**
   ```bash
   ldconfig -p | grep libgomp
   ```

### Solutions

#### Solution 1: Install OpenMP Runtime Library

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install libgomp1
```

**CentOS/RHEL:**
```bash
sudo yum install libgomp
```

**Alpine Linux:**
```bash
apk add libgomp
```

#### Solution 2: Use Pre-compiled Binaries with Static Linking

1. **Build binaries with static linking:**
   ```bash
   # Build diffusivity binaries
   npm run build:diffusivity:all
   
   # Build permeability binaries
   npm run build:binary:all
   ```

2. **Verify static linking:**
   ```bash
   ldd diffusivity_sim
   # Should show minimal dependencies
   ```

#### Solution 3: Docker-based Solution

1. **Build using Docker:**
   ```bash
   docker build -f Dockerfile.diffusivity -t diffusivity-builder .
   docker run --rm -v $(pwd):/output diffusivity-builder cp /app/diffusivity_sim /output/
   ```

2. **Or use the provided Dockerfile:**
   ```bash
   # Build the binary
   docker build -f Dockerfile.diffusivity -t diffusivity-builder .
   
   # Extract the binary
   docker create --name temp diffusivity-builder
   docker cp temp:/app/diffusivity_sim ./diffusivity_sim
   docker rm temp
   ```

#### Solution 4: Environment-specific Compilation

**For deployment environments that don't support OpenMP:**

1. **Modify compilation flags in the API:**
   The API now tries multiple compilation approaches:
   - Static linking of OpenMP libraries
   - Dynamic linking with explicit library paths
   - Fallback to basic compilation

2. **Set environment variable to disable OpenMP:**
   ```bash
   export OMP_NUM_THREADS=1
   ```

#### Solution 5: Alternative Compilation Methods

**If CUDA compilation fails, try these approaches:**

1. **Use gcc instead of nvcc for CPU-only:**
   ```bash
   g++ -std=c++17 -fopenmp -o diffusivity_sim main.cu -I/usr/local/cuda/include -L/usr/local/cuda/lib64 -lcudart
   ```

2. **Compile without OpenMP:**
   ```bash
   nvcc -std=c++17 -o diffusivity_sim main.cu
   ```

### Prevention

1. **Always build binaries on the target platform**
2. **Use static linking for deployment**
3. **Test binaries in the deployment environment**
4. **Include runtime libraries in deployment packages**

## JSON Parsing Error: "unexpected character at line 1 column 1"

This error occurs when the API endpoint returns non-JSON content instead of the expected JSON response. This is a common issue in production deployments.

### Quick Diagnosis

1. **Check the health endpoint first:**
   ```bash
   curl http://your-domain.com/api/health
   ```

2. **Run the diagnostic script:**
   ```bash
   node diagnose-deployment.js
   ```

3. **Check server logs for detailed error messages**

### Common Causes and Solutions

#### 1. Missing C++ Compiler

**Symptoms:**
- Error mentions "No C++ compiler found"
- Compilation fails

**Solutions:**

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install build-essential
```

**CentOS/RHEL:**
```bash
sudo yum groupinstall "Development Tools"
```

**Windows:**
- Install MinGW-w64: https://www.mingw-w64.org/
- Install Visual Studio Build Tools
- Add compiler to PATH environment variable

**macOS:**
```bash
xcode-select --install
```

#### 2. Missing Required Files

**Symptoms:**
- Error mentions "Missing C++ source file"
- Files not found in project root

**Required files:**
- `Perm2D.h`
- `Perm2D.cpp` 
- `stb_image.h`

**Solutions:**
- Ensure all files are in the project root directory
- Check file permissions
- Verify files are included in deployment

#### 3. File System Permissions

**Symptoms:**
- "Permission denied" errors
- Cannot write to temp directory

**Solutions:**
```bash
# Check temp directory permissions
ls -la /tmp

# Fix permissions if needed
chmod 755 /tmp
chown $USER:$USER /tmp

# For project directory
chmod 755 /path/to/project
```

#### 4. Server Configuration Issues

**Symptoms:**
- HTML error pages instead of JSON
- 500 Internal Server Error
- Timeout errors

**Solutions:**

**For Vercel:**
- Check function timeout settings
- Ensure all dependencies are installed
- Verify environment variables

**For Docker:**
```dockerfile
# Add build tools to Dockerfile
FROM node:18

# Install build essentials
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

**For AWS/EC2:**
```bash
# Install required packages
sudo yum update -y
sudo yum groupinstall "Development Tools" -y
sudo yum install gcc-c++ -y

# Set proper permissions
sudo chown -R ec2-user:ec2-user /var/tmp
```

#### 5. Memory/Resource Issues

**Symptoms:**
- Process killed during compilation
- Out of memory errors

**Solutions:**
- Increase server memory allocation
- Reduce image resolution
- Lower mesh amplification settings
- Use smaller input images

### Platform-Specific Solutions

#### Vercel Deployment

1. **Add build configuration to `vercel.json`:**
```json
{
  "functions": {
    "src/app/api/process-image/route.ts": {
      "maxDuration": 300
    }
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_GPU_ENABLED": "false"
    }
  }
}
```

2. **Install build dependencies:**
```bash
npm install --save-dev @vercel/node
```

#### Docker Deployment

1. **Use multi-stage build:**
```dockerfile
# Build stage
FROM node:18 AS builder
RUN apt-get update && apt-get install -y build-essential
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-slim
RUN apt-get update && apt-get install -y build-essential
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/Perm2D.* ./
COPY --from=builder /app/stb_image.h ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["npm", "start"]
```

#### AWS Lambda

**Note:** Lambda has limitations for C++ compilation. Consider using:
- AWS EC2 for full functionality
- Pre-compiled binaries
- Alternative serverless platforms

### Debugging Steps

1. **Enable detailed logging:**
```javascript
// Add to your API route
console.log('Request received:', request.url);
console.log('Environment:', process.env.NODE_ENV);
console.log('Platform:', process.platform);
```

2. **Test individual components:**
```bash
# Test C++ compilation
g++ --version

# Test file access
ls -la Perm2D.*

# Test temp directory
touch /tmp/test.txt && rm /tmp/test.txt
```

3. **Check response headers:**
```javascript
// In browser console
fetch('/api/process-image', {
  method: 'POST',
  body: formData
}).then(response => {
  console.log('Status:', response.status);
  console.log('Headers:', response.headers);
  return response.text();
}).then(text => {
  console.log('Response:', text);
});
```

### Prevention

1. **Use the health check endpoint:**
   - Monitor `/api/health` regularly
   - Set up alerts for unhealthy status

2. **Implement graceful degradation:**
   - Show helpful error messages
   - Provide alternative processing options

3. **Test in production-like environment:**
   - Use Docker for consistent testing
   - Test with same resources as production

### Getting Help

If you're still experiencing issues:

1. **Run the diagnostic script and share the report:**
   ```bash
   node diagnose-deployment.js
   ```

2. **Check the health endpoint:**
   ```bash
   curl http://your-domain.com/api/health
   ```

3. **Review server logs for detailed error messages**

4. **Share the following information:**
   - Deployment platform (Vercel, AWS, etc.)
   - Error messages from browser console
   - Server logs
   - Diagnostic report output

### Alternative Solutions

If C++ compilation continues to fail in production:

1. **Use pre-compiled binaries**
2. **Switch to pure JavaScript implementation**
3. **Use cloud-based computation services**
4. **Implement client-side processing for simple cases**

Remember: The JSON parsing error is usually a symptom of a deeper issue with the server environment or configuration. The diagnostic script and health check endpoint will help identify the root cause. 