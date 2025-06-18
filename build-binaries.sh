#!/bin/bash

# Build script for fluid permeability and diffusivity simulation binaries
# This script creates pre-compiled binaries with static linking to avoid runtime dependencies

set -e  # Exit on any error

echo "🔧 Building Fluid Permeability and Diffusivity Simulation Binaries"
echo "================================================================"

# Check if we're on Windows or Linux
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    PLATFORM="windows"
    echo "📋 Platform: Windows"
else
    PLATFORM="linux"
    echo "📋 Platform: Linux"
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required tools
echo "🔍 Checking for required tools..."

if ! command_exists g++; then
    echo "❌ Error: g++ compiler not found. Please install build-essential (Linux) or MinGW (Windows)"
    exit 1
fi

if ! command_exists nvcc; then
    echo "⚠️  Warning: nvcc (CUDA compiler) not found. Diffusivity simulation will not be available."
    CUDA_AVAILABLE=false
else
    echo "✅ CUDA compiler found"
    CUDA_AVAILABLE=true
fi

# Build permeability binaries
echo ""
echo "🏗️  Building permeability simulation binaries..."

if [[ "$PLATFORM" == "windows" ]]; then
    echo "Building Windows permeability binary..."
    g++ -O3 -std=c++17 -fopenmp Perm2D.cpp -o fluid_sim.exe -I.
    echo "✅ Created fluid_sim.exe"
else
    echo "Building Linux permeability binary..."
    g++ -O3 -std=c++17 -fopenmp Perm2D.cpp -o fluid_sim -I.
    echo "✅ Created fluid_sim"
fi

# Build diffusivity binaries if CUDA is available
if [[ "$CUDA_AVAILABLE" == "true" ]]; then
    echo ""
    echo "🏗️  Building diffusivity simulation binaries..."
    
    if [[ "$PLATFORM" == "windows" ]]; then
        echo "Building Windows diffusivity binary with static linking..."
        nvcc -std=c++17 -Xcompiler -fopenmp -Xlinker -static-libgcc -Xlinker -static-libstdc++ -o diffusivity_sim.exe main.cu
        echo "✅ Created diffusivity_sim.exe"
    else
        echo "Building Linux diffusivity binary with static linking..."
        nvcc -std=c++17 -Xcompiler -fopenmp -Xlinker -static-libgcc -Xlinker -static-libstdc++ -o diffusivity_sim main.cu
        echo "✅ Created diffusivity_sim"
    fi
else
    echo ""
    echo "⚠️  Skipping diffusivity binary build (CUDA not available)"
fi

# Verify binaries
echo ""
echo "🔍 Verifying binaries..."

if [[ "$PLATFORM" == "windows" ]]; then
    if [[ -f "fluid_sim.exe" ]]; then
        echo "✅ fluid_sim.exe exists"
        ls -la fluid_sim.exe
    fi
    if [[ -f "diffusivity_sim.exe" ]]; then
        echo "✅ diffusivity_sim.exe exists"
        ls -la diffusivity_sim.exe
    fi
else
    if [[ -f "fluid_sim" ]]; then
        echo "✅ fluid_sim exists"
        ls -la fluid_sim
        echo "📋 Dependencies:"
        ldd fluid_sim || echo "   (Static binary)"
    fi
    if [[ -f "diffusivity_sim" ]]; then
        echo "✅ diffusivity_sim exists"
        ls -la diffusivity_sim
        echo "📋 Dependencies:"
        ldd diffusivity_sim || echo "   (Static binary)"
    fi
fi

echo ""
echo "🎉 Build completed successfully!"
echo ""
echo "📋 Summary:"
echo "   - Permeability simulation: ✅ Available"
if [[ "$CUDA_AVAILABLE" == "true" ]]; then
    echo "   - Diffusivity simulation: ✅ Available"
else
    echo "   - Diffusivity simulation: ❌ Requires CUDA"
fi
echo ""
echo "💡 Next steps:"
echo "   1. Deploy your application"
echo "   2. The API will automatically use these pre-compiled binaries"
echo "   3. No runtime compilation will be needed"
echo ""
echo "🔧 If you encounter issues:"
echo "   - Check TROUBLESHOOTING.md for solutions"
echo "   - Ensure all source files are present"
echo "   - Verify CUDA installation for diffusivity simulation" 