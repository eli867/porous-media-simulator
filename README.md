# Fluid Permeability Simulator

A modern web application for simulating fluid permeability in porous media using advanced numerical methods and a beautiful, interactive interface.

## Features

### 🎯 Core Functionality
- **Finite Volume Method (FVM)** implementation for fluid flow simulation
- **Multi-threaded CPU computation** using OpenMP
- **Real-time convergence tracking** with detailed iteration history
- **Porosity calculation** from image analysis
- **Configurable simulation parameters** for accurate modeling

### 🎨 User Interface
- **Interactive landing page** with animated fluid blob visualization
- **Modern dashboard** with drag-and-drop image upload
- **Real-time parameter adjustment** with live validation
- **Responsive design** that works on all devices

## Prerequisites

### For Development
- **Node.js** 18+ and npm
- **C++ compiler** with OpenMP support:
  - Windows: Visual Studio, MinGW-w64, or MSYS2 (for g++ and make)
  - Linux: GCC 4.9+ or Clang 3.8+
  - macOS: Xcode Command Line Tools

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd fluid-permeability-simulator
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Build the simulation binaries**:
   ```bash
   npm run build:binary:all
   ```

## Usage

### Development Mode
1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open your browser** and navigate to `http://localhost:3000`

3. **Upload an image** representing porous media structure:
   - Grayscale images work best
   - Supported formats: PNG, JPG, BMP
   - Higher resolution provides better accuracy
   - Ensure there's a clear channel from left to right

4. **Configure parameters** based on your physical system:
   - **Density**: Mass per unit volume (kg/m³)
   - **Viscosity**: Resistance to flow (Pa·s)
   - **Domain Width**: Physical size of simulation domain (m)
   - **Mesh Amplification**: Controls mesh refinement
   - **Max Iterations**: Maximum solver iterations
   - **Convergence RMS**: Residual threshold for convergence
   - **CPU Cores**: Number of cores for parallel computation

5. **Run simulation** and view detailed results

### Production Build
```bash
npm run build
npm start
```

## API Endpoints

### Local API
- **Health Check**: `GET /api/health`
- **Simulation**: `POST /api/simulate`

### Railway Backend
The application uses a Railway backend for production simulations:
- **Base URL**: `https://porous-media-predictor-production.up.railway.app`
- **Simulation Endpoint**: `POST /simulate`

## Input Parameters

### Simulation Parameters
- `density`: Density (kg/m³) - Default: 1000
- `viscosity`: Viscosity (Pa·s) - Default: 0.001
- `domain_width`: Physical domain size (m) - Default: 1.0
- `mesh_amp`: Mesh amplification factor - Default: 1
- `max_iter`: Maximum iterations - Default: 10000
- `convergence_rms`: Convergence criteria - Default: 0.000001
- `n_cores`: Number of CPU cores - Default: 4

## Output Results

### Simulation Results
- **Permeability**: Effective permeability (m²)
- **Iterations**: Number of iterations to convergence
- **Convergence RMS**: Final residual error
- **Convergence History**: Detailed iteration data

## Technical Details

### Algorithm
- **Solver**: Finite Volume Method with SIMPLE algorithm
- **Discretization**: Second-order upwind scheme
- **Convergence**: RMS residual-based convergence criteria
- **Parallelization**: OpenMP multi-threading

### Architecture
- **Frontend**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with shadcn/ui components
- **Animations**: Framer Motion
- **Backend**: Railway with C++ simulation engine
- **Build**: Cross-platform binary compilation

## Project Structure

```
fluid-permeability-simulator/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── health/route.ts          # Health check endpoint
│   │   │   └── simulate/route.ts        # Simulation endpoint
│   │   ├── dashboard/page.tsx           # Main application interface
│   │   ├── globals.css                  # Global styles
│   │   ├── layout.tsx                   # Root layout
│   │   └── page.tsx                     # Landing page
│   ├── components/
│   │   ├── ui/                          # UI components (shadcn/ui)
│   │   ├── fluid-blob.tsx               # Animated fluid visualization
│   │   ├── ComputerComponent.tsx        # Terminal interface
│   │   ├── CommandsSection.tsx          # Command documentation
│   │   ├── CreditsSection.tsx           # Credits and info
│   │   ├── PermeabilityResultsCard.tsx  # Results display
│   │   ├── theme-provider.tsx           # Theme context
│   │   └── theme-toggle.tsx             # Dark/light mode toggle
│   └── lib/
│       ├── config.ts                    # Application configuration
│       └── utils.ts                     # Utility functions
├── Perm2D.h                             # Permeability simulation header
├── Perm2D.cpp                           # Permeability simulation implementation
├── stb_image.h                          # Image loading library
├── fluid_sim                            # Linux binary (if built)
├── fluid_sim.exe                        # Windows binary (if built)
├── package.json                         # Node.js dependencies
├── next.config.ts                       # Next.js configuration
├── vercel.json                          # Vercel deployment config
└── README.md                            # This file
```

## Deployment

### Vercel Deployment
The application is configured for Vercel deployment with:
- **Function timeout**: 60 seconds for simulation endpoint
- **Cross-platform binaries**: Automatic platform detection
- **Environment variables**: Production configuration

### Railway Backend
The simulation backend is deployed on Railway for production use, providing:
- **Scalable compute resources**
- **Automatic binary compilation**
- **High-performance simulation engine**

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **Fluid Permeability**: Check out the C++ repository https://github.com/adama-wzr/PixelBasedPermeability
- **UI Components**: Built with Next.js, React, and shadcn/ui
- **Animations**: Powered by Framer Motion
- **Deployment**: Railway for backend, Vercel for frontend

