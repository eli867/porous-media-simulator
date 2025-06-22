# Fluid Permeability Simulator

A comprehensive web application for simulating fluid permeability in porous media using advanced numerical methods.

## Features

### Fluid Permeability Simulation
- **Finite Volume Method (FVM)** implementation for fluid flow simulation
- **Multi-threaded CPU computation** using OpenMP
- **Convergence tracking** with detailed iteration history
- **Porosity calculation** from image analysis
- **Configurable parameters**: density, viscosity, domain size, mesh amplification

## Prerequisites

### For Fluid Permeability (CPU-based)
- **C++ compiler** with OpenMP support:
  - Windows: Visual Studio, MinGW-w64, or MSYS2
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

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open your browser** and navigate to `http://localhost:3000`

3. **Upload an image** representing porous media structure:
   - Grayscale images work best
   - Supported formats: PNG, JPG, BMP
   - Higher resolution provides better accuracy

4. **Configure parameters** based on your physical system

5. **Run simulation** and view results

## Deployment

### Backend Deployment (Railway)

The backend is deployed on Railway at: `https://porous-media-predictor-production.up.railway.app`

**API Endpoints:**
- **Health Check**: `GET /api/health`
- **Process Image**: `POST /api/process-image`

### Frontend Configuration

The frontend is configured to use the Railway backend by default. To customize the API URL:

1. **Create a `.env.local` file** in the project root:
   ```bash
   NEXT_PUBLIC_API_URL=https://your-custom-backend-url.com
   ```

2. **Or modify `src/lib/config.ts`** to change the default URL.

### Testing Backend Connection

Run the test script to verify the Railway backend is accessible:
```bash
node test-railway-backend.js
```

## API Endpoints

### Fluid Permeability
- **POST** `/api/process-image`
- Processes images for fluid permeability simulation
- Returns permeability, porosity, convergence data

## Input Parameters

### Permeability Parameters
- `density`: Fluid density (kg/m³)
- `viscosity`: Fluid viscosity (Pa·s)
- `domain_width`: Physical domain size (m)
- `mesh_amp`: Mesh amplification factor
- `max_iter`: Maximum iterations
- `convergence_rms`: Convergence criteria
- `n_cores`: Number of CPU cores

## Output Results

### Permeability Results
- **Permeability**: Effective permeability (m²)
- **Porosity**: Volume fraction of pore space (%)
- **Iterations**: Number of iterations to convergence
- **Convergence RMS**: Final residual error
- **Convergence History**: Detailed iteration data

## Technical Details

### Fluid Permeability Algorithm
- **Solver**: Finite Volume Method with SIMPLE algorithm
- **Discretization**: Second-order upwind scheme
- **Convergence**: RMS residual-based convergence criteria
- **Parallelization**: OpenMP multi-threading

## Troubleshooting

### Compilation Errors
1. **Install required compilers**:
   - Windows: Visual Studio Build Tools
   - Linux: `sudo apt-get install build-essential`
   - macOS: `xcode-select --install`

2. **Check OpenMP support**:
   - Windows: Use compatible compiler
   - Linux: `sudo apt-get install libomp-dev`
   - macOS: OpenMP included with Xcode

### Performance Issues
1. **Reduce image resolution** for faster computation
2. **Adjust convergence criteria** for balance of speed/accuracy
3. **Optimize CPU core usage** for permeability simulations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **Fluid Permeability**: Based on finite volume methods for porous media
- **UI Components**: Built with Next.js, React, and shadcn/ui

## Project Structure

```
fluid-permeability-simulator/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── health/route.ts          # Health check endpoint
│   │   │   └── process-image/route.ts   # Permeability simulation endpoint
│   │   ├── dashboard/page.tsx           # Main application interface
│   │   ├── globals.css                  # Global styles
│   │   ├── layout.tsx                   # Root layout
│   │   └── page.tsx                     # Landing page
│   └── components/
│       ├── ui/                          # UI components (shadcn/ui)
│       ├── theme-provider.tsx           # Theme context
│       └── theme-toggle.tsx             # Dark/light mode toggle
├── Perm2D.h                             # Permeability simulation header
├── Perm2D.cpp                           # Permeability simulation implementation
├── stb_image.h                          # Image loading library
├── fluid_sim                            # Linux binary (if built)
├── fluid_sim.exe                        # Windows binary (if built)
├── package.json                         # Node.js dependencies
├── next.config.ts                       # Next.js configuration
└── README.md                            # This file
```

