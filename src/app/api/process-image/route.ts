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

// Helper function to compile C++ code with fallback compilers
const compileCppCode = async (tempDir: string): Promise<{ success: boolean; error?: string; executableName: string }> => {
  const isWindows = process.platform === 'win32';
  const executableName = isWindows ? 'fluid_sim.exe' : 'fluid_sim';
  
  // Try different compilers with platform-specific flags
  const compilers = isWindows ? [
    { name: 'g++', args: ['-O3', '-fopenmp', '-o', executableName, 'Perm2D.cpp', '-lm'] },
    { name: 'clang++', args: ['-O3', '-fopenmp', '-o', executableName, 'Perm2D.cpp', '-lm'] },
    { name: 'gcc', args: ['-O3', '-fopenmp', '-o', executableName, 'Perm2D.cpp', '-lm', '-lstdc++'] }
  ] : [
    { name: 'g++', args: ['-O3', '-fopenmp', '-o', executableName, 'Perm2D.cpp', '-lm'] },
    { name: 'clang++', args: ['-O3', '-fopenmp', '-o', executableName, 'Perm2D.cpp', '-lm'] },
    { name: 'gcc', args: ['-O3', '-fopenmp', '-o', executableName, 'Perm2D.cpp', '-lm', '-lstdc++'] }
  ];

  for (const compiler of compilers) {
    try {
      const result = await execCommand(compiler.name, compiler.args, tempDir);
      if (result.code === 0) {
        return { success: true, executableName };
      }
    } catch (error) {
      console.log(`Compiler ${compiler.name} not available, trying next...`);
      continue;
    }
  }

  return { 
    success: false, 
    error: 'No suitable C++ compiler found. Please install g++, clang++, or gcc with OpenMP support.',
    executableName 
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

    // Copy C++ source files to temp directory
    const projectRoot = process.cwd();
    const cppFiles = ['Perm2D.h', 'Perm2D.cpp', 'stb_image.h'];
    
    for (const cppFile of cppFiles) {
      const srcPath = join(projectRoot, cppFile);
      const dstPath = join(tempDir, cppFile);
      
      if (existsSync(srcPath)) {
        const content = await readFile(srcPath);
        await writeFile(dstPath, content);
      } else {
        return NextResponse.json({
          success: false,
          error: `Missing C++ source file: ${cppFile}`
        }, { status: 500 });
      }
    }

    // Compile C++ code
    console.log('Starting C++ compilation...');
    const compileResult = await compileCppCode(tempDir);

    if (!compileResult.success) {
      console.error('Compilation failed:', compileResult.error);
      return NextResponse.json({
        success: false,
        error: compileResult.error
      }, { status: 500 });
    }

    console.log('Compilation successful, executable:', compileResult.executableName);

    // Run simulation
    console.log('Starting simulation...');
    const startTime = Date.now();
    const executablePath = process.platform === 'win32' 
      ? compileResult.executableName 
      : `./${compileResult.executableName}`;
    const simResult = await execCommand(executablePath, [], tempDir);
    const simulationTime = (Date.now() - startTime) / 1000;

    console.log('Simulation completed, exit code:', simResult.code);
    if (simResult.stderr) {
      console.log('Simulation stderr:', simResult.stderr);
    }

    if (simResult.code !== 0) {
      return NextResponse.json({
        success: false,
        error: `Simulation failed: ${simResult.stderr}`,
        stdout: simResult.stdout
      }, { status: 500 });
    }

    // Parse results from CSV file
    const csvPath = join(tempDir, 'test.csv');
    let results = [];
    let csvContent = '';
    
    try {
      csvContent = await readFile(csvPath, 'utf-8');
      results = parseCSVResults(csvContent);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Simulation output file not found',
        stdout: simResult.stdout
      }, { status: 500 });
    }

    if (results.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No simulation results found'
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
      message: 'Simulation completed successfully'
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Simulation error:', error);
    return NextResponse.json({
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
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
  return NextResponse.json({
    success: true,
    message: 'Fluid simulation API is running',
    timestamp: Date.now()
  });
}
