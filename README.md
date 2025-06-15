# Fluid Permeability Simulator - Next.js Project

## Overview

This is a complete Next.js application that integrates C++ computational fluid dynamics with a modern React frontend. The application allows users to upload grayscale images representing porous media structures and receive detailed permeability analysis results.

## Features

### ✅ Complete Next.js Integration
- **Frontend**: Modern React interface with Tailwind CSS and Shadcn UI
- **Backend**: Next.js API routes that compile and execute C++ code
- **Real-time Processing**: Image upload, C++ compilation, and simulation execution
- **Professional UI**: Responsive design with comprehensive results display

### ✅ Technical Capabilities
- Image upload and automatic processing
- C++ code compilation on-demand using g++
- Fluid dynamics simulation with convergence tracking
- Comprehensive results with multiple visualization tabs
- Error handling and validation
- Temporary file management and cleanup

### ✅ Production Ready
- TypeScript implementation with proper type safety
- ESLint configuration for code quality
- Production build optimization
- Standalone deployment capability

## Project Structure

```
fluid-permeability-simulator/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── health/route.ts          # Health check endpoint
│   │   │   └── process-image/route.ts   # Main simulation API
│   │   ├── globals.css                  # Global styles
│   │   ├── layout.tsx                   # Root layout
│   │   └── page.tsx                     # Main application page
│   ├── components/ui/                   # Shadcn UI components
│   └── lib/utils.ts                     # Utility functions
├── public/                              # Static assets
├── C++ Source Files:
│   ├── Perm2D.h                        # C++ header file
│   ├── Perm2D.cpp                      # C++ implementation
│   └── stb_image.h                     # Image loading library
├── Test Images:
│   ├── clear_channel_test.png          # Working test image
│   └── simple_flow_test.png            # Alternative test image
├── Configuration:
│   ├── next.config.ts                  # Next.js configuration
│   ├── tailwind.config.ts              # Tailwind CSS configuration
│   ├── components.json                 # Shadcn UI configuration
│   └── package.json                    # Dependencies and scripts
└── .next/standalone/                   # Production build output
```

## API Endpoints

### GET /api/health
Health check endpoint to verify server status.

**Response:**
```json
{
  "success": true,
  "message": "Fluid simulation API is running",
  "timestamp": 1750003035135,
  "version": "1.0.0"
}
```

### POST /api/process-image
Main endpoint for image processing and fluid simulation.

**Request (multipart/form-data):**
- `image`: Image file (PNG, JPG, etc.)
- `density`: Fluid density in kg/m³ (default: 1000.0)
- `viscosity`: Dynamic viscosity in Pa·s (default: 0.001)
- `domain_width`: Domain width in meters (default: 1.0)
- `mesh_amp`: Mesh amplification factor (default: 1)
- `max_iter`: Maximum iterations (default: 10000)
- `convergence_rms`: Convergence criteria (default: 1e-6)
- `n_cores`: Number of CPU cores (default: 4)

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "permeability": 1.234e-12,
    "porosity": 0.456,
    "iterations": 1500,
    "convergence_rms": 1.23e-6,
    "simulation_time": 45.2,
    "image_properties": {
      "width": 256,
      "height": 256,
      "channels": 1
    },
    "simulation_parameters": {
      "density": 1000.0,
      "viscosity": 0.001,
      "domain_width": 1.0,
      "mesh_amplification": 1,
      "max_iterations": 10000,
      "convergence_criteria": 1e-6,
      "cpu_cores": 4
    },
    "convergence_history": [...]
  },
  "message": "Simulation completed successfully"
}
```

## Installation and Setup

### Prerequisites
- Node.js 20+ 
- npm or pnpm
- Build tools (gcc, g++, make) for C++ compilation
- Ubuntu 22.04 or compatible Linux distribution

### Development Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Start development server:**
```bash
npm run dev
```

3. **Access the application:**
Open `http://localhost:3000` in your web browser

### Production Build

1. **Build the application:**
```bash
npm run build
```

2. **Run standalone server:**
```bash
cd .next/standalone
node server.js
```

## Usage Instructions

### Basic Workflow

1. **Access the Application**: Open the web interface
2. **Upload Image**: 
   - Click the upload area or drag and drop an image
   - Supported formats: PNG, JPG, GIF, etc.
   - Image will be processed for simulation
3. **Configure Parameters**:
   - Adjust fluid properties (density, viscosity)
   - Set simulation parameters (iterations, mesh settings)
   - Configure computational resources (CPU cores)
4. **Run Simulation**:
   - Click "Run Simulation" button
   - Monitor progress (simulations may take several minutes)
   - View results in multiple tabs
5. **Analyze Results**:
   - **Summary**: Key metrics (permeability, porosity, convergence)
   - **Details**: Image properties and simulation parameters
   - **Convergence**: Iteration history and convergence data

### Image Requirements

- **Format**: Any common image format (automatically processed)
- **Content**: Grayscale representation of porous media
- **Structure**: 
  - Black regions = solid material (impermeable)
  - White regions = void space (permeable)
  - Must have a connected path from left to right for valid simulation

### Parameter Guidelines

- **Density**: Typical values 100-2000 kg/m³
- **Viscosity**: Water ≈ 0.001 Pa·s, Oil ≈ 0.01-1.0 Pa·s
- **Mesh Amplification**: Higher values = finer mesh, longer computation
- **Max Iterations**: Increase for better convergence (10,000-100,000)

## Deployment Options

### Option 1: Standalone Server
The application builds to a standalone server that can be deployed anywhere:

```bash
npm run build
cd .next/standalone
node server.js
```

### Option 2: Docker Deployment
Create a Dockerfile for containerized deployment:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY .next/standalone ./
COPY public ./public
RUN apk add --no-cache build-base
EXPOSE 3000
CMD ["node", "server.js"]
```

### Option 3: Platform Deployment
Deploy to platforms like Vercel, Netlify, or Railway that support Next.js applications.

## Technical Implementation

### Backend Architecture
- **Next.js API Routes**: Handle HTTP requests and responses
- **Child Process Execution**: Compile and run C++ code dynamically
- **Temporary File Management**: Secure handling of uploaded images and simulation files
- **Error Handling**: Comprehensive error catching and user feedback

### Frontend Architecture
- **React with TypeScript**: Type-safe component development
- **Tailwind CSS**: Utility-first styling framework
- **Shadcn UI**: Professional component library
- **Responsive Design**: Works on desktop and mobile devices

### Security Considerations
- **File Upload Limits**: Reasonable size restrictions
- **Temporary File Cleanup**: Automatic cleanup of simulation files
- **Input Validation**: Parameter validation and sanitization
- **Process Isolation**: C++ compilation in temporary directories

## Troubleshooting

### Common Issues

1. **"No valid path found"**: 
   - Ensure image has connected white regions from left to right
   - Check that image contrast is sufficient

2. **Compilation errors**:
   - Verify build-essential is installed (`apt install build-essential`)
   - Check that all C++ source files are present

3. **Simulation instability**:
   - Reduce mesh amplification
   - Increase relaxation factor
   - Use simpler geometry for testing

### Performance Optimization

- **CPU Cores**: Set to match available cores for faster computation
- **Image Size**: Smaller images (256x256) process faster than large ones
- **Mesh Amplification**: Start with 1, increase gradually if needed
- **Iterations**: Use lower values for testing, higher for production

## Development Notes

### Key Dependencies
- **Next.js 15.3.3**: React framework with API routes
- **React 19**: Frontend library
- **TypeScript**: Type safety and development experience
- **Tailwind CSS**: Styling framework
- **Shadcn UI**: Component library
- **Lucide React**: Icon library

### Build Configuration
- **Standalone Output**: Self-contained deployment bundle
- **File Tracing**: Includes C++ source files in build
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency

## Future Enhancements

### Potential Improvements
- [ ] Result caching for identical inputs
- [ ] Batch processing for multiple images
- [ ] Advanced visualization (flow field plots)
- [ ] Export functionality (PDF reports, CSV data)
- [ ] User authentication and session management
- [ ] Real-time progress tracking

### Performance Optimizations
- [ ] GPU acceleration for large simulations
- [ ] Parallel processing for multiple images
- [ ] Result streaming for long simulations
- [ ] Progressive mesh refinement

This Next.js application provides a complete, production-ready solution for fluid permeability simulation with modern web technologies and robust C++ computational capabilities.

