import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

// Helper function to execute shell commands
const execCommand = (command: string, args: string[], cwd: string): Promise<{ stdout: string; stderr: string; code: number }> => {
  return new Promise((resolve) => {
    const process = spawn(command, args, { cwd, stdio: 'pipe' });
    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      resolve({ stdout, stderr, code: code || 0 });
    });
  });
};

// Helper function to check if pre-compiled binary exists
const checkPrecompiledBinary = async (): Promise<{ success: boolean; error?: string; binaryPath?: string }> => {
  const isWindows = process.platform === 'win32';
  const binaryName = isWindows ? 'fluid_sim.exe' : 'fluid_sim';
  const binaryPath = join(process.cwd(), 'bin', binaryName);
  
  if (existsSync(binaryPath)) {
    return { success: true, binaryPath };
  }
  
  // Check alternative locations
  const alternativePaths = [
    join(process.cwd(), binaryName),
    join(process.cwd(), 'public', binaryName),
    join(process.cwd(), 'static', binaryName)
  ];
  
  for (const path of alternativePaths) {
    if (existsSync(path)) {
      return { success: true, binaryPath: path };
    }
  }
  
  return {
    success: false,
    error: `Pre-compiled binary not found. Expected: ${binaryPath} or ${binaryName} in project root. Please build the binary and place it in the correct location.`
  };
};

// Helper function to parse CSV results
const parseCSVResults = (csvContent: string) => {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',');
  const results = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: Record<string, number> = {};
    headers.forEach((header, index) => {
      const value = values[index];
      if (header === 'iter' || header === 'mesh') {
        row[header] = parseInt(value) || 0;
      } else {
        row[header] = parseFloat(value) || 0;
      }
    });
    results.push({
      iteration: row.iter,
      permeability: row.K,
      residual: row.R,
      alpha: row.alpha,
      mesh: row.mesh
    });
  }
  
  return results;
};

export async function POST(request: NextRequest) {
  const tempDir = join(tmpdir(), `fluid-sim-${randomUUID()}`);
  
  try {
    // Check for pre-compiled binary first
    console.log('Checking for pre-compiled binary...');
    const binaryCheck = await checkPrecompiledBinary();
    
    if (!binaryCheck.success) {
      console.error('Binary check failed:', binaryCheck.error);
      return NextResponse.json({
        success: false,
        error: binaryCheck.error,
        details: {
          recommendation: 'Please build the C++ binary and place it in the project root or bin/ directory',
          expectedLocations: [
            join(process.cwd(), 'bin', process.platform === 'win32' ? 'fluid_sim.exe' : 'fluid_sim'),
            join(process.cwd(), process.platform === 'win32' ? 'fluid_sim.exe' : 'fluid_sim')
          ]
        }
      }, { status: 500 });
    }
    
    console.log('Pre-compiled binary found:', binaryCheck.binaryPath);
    
    // Create temporary directory
    await mkdir(tempDir, { recursive: true });
    
    // Parse form data
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json({
        success: false,
        error: 'No image file provided'
      }, { status: 400 });
    }

    // Get parameters with defaults
    const density = parseFloat(formData.get('density') as string) || 1000.0;
    const viscosity = parseFloat(formData.get('viscosity') as string) || 0.001;
    const domainWidth = parseFloat(formData.get('domain_width') as string) || 1.0;
    const meshAmp = parseInt(formData.get('mesh_amp') as string) || 1;
    const maxIter = parseInt(formData.get('max_iter') as string) || 10000;
    const convergenceRms = parseFloat(formData.get('convergence_rms') as string) || 1e-6;
    const nCores = parseInt(formData.get('n_cores') as string) || 4;

    // Process image - save directly as PNG for C++ code to handle
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    
    // Save the image directly - the C++ code will handle grayscale conversion
    const imagePath = join(tempDir, 'input_image.png');
    await writeFile(imagePath, imageBuffer);
    
    // Get basic image info (we'll let the C++ code determine actual dimensions)
    const info = { width: 256, height: 256, channels: 1 };

    // Create input configuration file
    const inputConfig = `Dens: ${density}
Visc: ${viscosity}
DomainWidth: ${domainWidth}
DomainHeight: ${domainWidth}
MeshAmp: ${meshAmp}
MaxIterGlobal: ${maxIter}
ResidualConv: ${convergenceRms}
nCores: ${nCores}
InputName: ${imagePath}
OutputName: test.csv
PL: 1.0
PR: 0.0
RelaxFactor: 0.7
Verbose: 1
printMaps: 0
`;

    const inputTxtPath = join(tempDir, 'input.txt');
    await writeFile(inputTxtPath, inputConfig);

    // Copy the pre-compiled binary to temp directory
    const binaryName = process.platform === 'win32' ? 'fluid_sim.exe' : 'fluid_sim';
    const tempBinaryPath = join(tempDir, binaryName);
    
    try {
      const binaryContent = await readFile(binaryCheck.binaryPath!);
      await writeFile(tempBinaryPath, binaryContent);
      
      // Make binary executable on Unix systems
      if (process.platform !== 'win32') {
        await execCommand('chmod', ['+x', tempBinaryPath], tempDir);
      }
    } catch (copyError) {
      console.error('Failed to copy binary:', copyError);
      return NextResponse.json({
        success: false,
        error: 'Failed to copy pre-compiled binary to temporary directory',
        details: { copyError: copyError instanceof Error ? copyError.message : 'Unknown error' }
      }, { status: 500 });
    }

    // Run simulation using pre-compiled binary
    console.log('Starting simulation with pre-compiled binary...');
    const startTime = Date.now();
    const executablePath = process.platform === 'win32' 
      ? binaryName 
      : `./${binaryName}`;
    const simResult = await execCommand(executablePath, [], tempDir);
    const simulationTime = (Date.now() - startTime) / 1000;

    console.log('Simulation completed, exit code:', simResult.code);
    if (simResult.stderr) {
      console.log('Simulation stderr:', simResult.stderr);
    }

    if (simResult.code !== 0) {
      return NextResponse.json({
        success: false,
        error: `Simulation failed with exit code ${simResult.code}`,
        details: {
          stderr: simResult.stderr,
          stdout: simResult.stdout,
          executablePath,
          tempDir
        }
      }, { status: 500 });
    }

    // Parse results from CSV file
    const csvPath = join(tempDir, 'test.csv');
    let results = [];
    let csvContent = '';
    
    try {
      csvContent = await readFile(csvPath, 'utf-8');
      results = parseCSVResults(csvContent);
    } catch (csvError) {
      console.error('CSV read error:', csvError);
      return NextResponse.json({
        success: false,
        error: 'Simulation output file not found or unreadable',
        details: {
          csvPath,
          csvError: csvError instanceof Error ? csvError.message : 'Unknown error',
          stdout: simResult.stdout,
          stderr: simResult.stderr
        }
      }, { status: 500 });
    }

    if (results.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No simulation results found in output file',
        details: {
          csvContent: csvContent.substring(0, 500), // First 500 chars for debugging
          stdout: simResult.stdout
        }
      }, { status: 500 });
    }

    // Get final results
    const finalResult = results[results.length - 1];

    // Parse porosity from stdout
    let porosity = null;
    const porosityMatch = simResult.stdout.match(/Porosity = ([\d.]+)/);
    if (porosityMatch) {
      porosity = parseFloat(porosityMatch[1]);
    }

    // Parse image dimensions from stdout
    let actualWidth = info.width;
    let actualHeight = info.height;
    const widthMatch = simResult.stdout.match(/Width \(pixels\) = (\d+)/);
    const heightMatch = simResult.stdout.match(/Height \(pixels\) = (\d+)/);
    if (widthMatch && heightMatch) {
      actualWidth = parseInt(widthMatch[1]);
      actualHeight = parseInt(heightMatch[1]);
    }

    // Prepare response
    const responseData = {
      success: true,
      data: {
        permeability: finalResult.permeability,
        porosity: porosity,
        iterations: finalResult.iteration,
        convergence_rms: finalResult.residual,
        simulation_time: simulationTime,
        image_properties: {
          width: actualWidth,
          height: actualHeight,
          channels: 1
        },
        simulation_parameters: {
          density,
          viscosity,
          domain_width: domainWidth,
          mesh_amplification: meshAmp,
          max_iterations: maxIter,
          convergence_criteria: convergenceRms,
          cpu_cores: nCores
        },
        convergence_history: results.slice(-10) // Last 10 iterations
      },
      message: 'Simulation completed successfully using pre-compiled binary'
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Simulation error:', error);
    return NextResponse.json({
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: {
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 });
  } finally {
    // Cleanup temporary directory
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
  }
}

// Health check endpoint
export async function GET() {
  const binaryCheck = await checkPrecompiledBinary();
  
  return NextResponse.json({
    success: true,
    message: 'Fluid simulation API is running',
    timestamp: Date.now(),
    binary_available: binaryCheck.success,
    binary_path: binaryCheck.binaryPath,
    platform: process.platform
  });
}
