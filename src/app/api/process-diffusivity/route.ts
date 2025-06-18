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

// Helper function to check if CUDA is available
const checkCudaAvailability = async (): Promise<{ available: boolean; error?: string }> => {
  try {
    const result = await execCommand('nvcc', ['--version'], process.cwd());
    return { available: result.code === 0 };
  } catch (error) {
    return { 
      available: false, 
      error: 'CUDA compiler (nvcc) not found. Please install NVIDIA CUDA Toolkit.' 
    };
  }
};

// Helper function to compile CUDA code
const compileCudaCode = async (tempDir: string): Promise<{ success: boolean; error?: string; executableName: string }> => {
  const isWindows = process.platform === 'win32';
  const executableName = isWindows ? 'diffusivity_sim.exe' : 'diffusivity_sim';
  
  // First check if CUDA is available
  const cudaCheck = await checkCudaAvailability();
  if (!cudaCheck.available) {
    return { 
      success: false, 
      error: cudaCheck.error || 'CUDA not available in this environment',
      executableName 
    };
  }
  
  // Try different CUDA compilation approaches
  const compilers = [
    { name: 'nvcc', args: ['-std=c++17', '-Xcompiler', '-openmp', '-o', executableName, 'main.cu'] },
    { name: 'nvcc', args: ['-Xcompiler', '-openmp', '-o', executableName, 'main.cu'] },
    { name: 'nvcc', args: ['-std=c++17', '-o', executableName, 'main.cu'] }
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
    error: 'CUDA compilation failed. Please check CUDA installation and GPU compatibility.',
    executableName 
  };
};

// Helper function to parse diffusivity results
const parseDiffusivityResults = (stdout: string) => {
  // Extract effective diffusivity from stdout
  const diffusivityMatch = stdout.match(/Effective Diffusivity[:\s]+([\d.e+-]+)/i);
  const diffusivity = diffusivityMatch ? parseFloat(diffusivityMatch[1]) : null;

  // Extract tortuosity if available
  const tortuosityMatch = stdout.match(/Tortuosity[:\s]+([\d.e+-]+)/i);
  const tortuosity = tortuosityMatch ? parseFloat(tortuosityMatch[1]) : null;

  // Extract porosity if available
  const porosityMatch = stdout.match(/Porosity[:\s]+([\d.e+-]+)/i);
  const porosity = porosityMatch ? parseFloat(porosityMatch[1]) : null;

  // Extract iterations if available
  const iterationsMatch = stdout.match(/Iterations[:\s]+(\d+)/i);
  const iterations = iterationsMatch ? parseInt(iterationsMatch[1]) : 0;

  return {
    diffusivity,
    tortuosity,
    porosity,
    iterations
  };
};

export async function POST(request: NextRequest) {
  const tempDir = join(tmpdir(), `diffusivity-sim-${randomUUID()}`);
  
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
    const nD = parseInt(formData.get('nD') as string) || 2;
    const inputType = parseInt(formData.get('inputType') as string) || 2;
    const numDC = parseInt(formData.get('numDC') as string) || 3;
    const D1 = parseFloat(formData.get('D1') as string) || 0;
    const D2 = parseFloat(formData.get('D2') as string) || 3e-12;
    const D3 = parseFloat(formData.get('D3') as string) || 1e-14;
    const D_TH1 = parseInt(formData.get('D_TH1') as string) || 40;
    const D_TH2 = parseInt(formData.get('D_TH2') as string) || 170;
    const D_TH3 = parseInt(formData.get('D_TH3') as string) || 255;
    const meshAmpX = parseInt(formData.get('meshAmpX') as string) || 1;
    const meshAmpY = parseInt(formData.get('meshAmpY') as string) || 1;
    const convergence = parseFloat(formData.get('convergence') as string) || 1e-7;
    const maxIter = parseInt(formData.get('maxIter') as string) || 1000000;
    const CL = parseFloat(formData.get('CL') as string) || 0;
    const CR = parseFloat(formData.get('CR') as string) || 1;
    const nThreads = parseInt(formData.get('nThreads') as string) || 8;
    const useGPU = parseInt(formData.get('useGPU') as string) || 1;
    const nGPU = parseInt(formData.get('nGPU') as string) || 1;
    const verbose = parseInt(formData.get('verbose') as string) || 1;

    // Process image - save directly as JPG for CUDA code to handle
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    
    // Save the image as JPG (the CUDA code expects JPG format)
    const imagePath = join(tempDir, 'input_image.jpg');
    await writeFile(imagePath, imageBuffer);
    
    // Get basic image info
    const info = { width: 256, height: 256, channels: 1 };

    // Create input configuration file
    const inputConfig = `Example Input File:
nD: ${nD}
inputType: ${inputType}
numDC: ${numDC}
D1: ${D1}
D2: ${D2}
D3: ${D3}
D_TH1: ${D_TH1}
D_TH2: ${D_TH2}
D_TH3: ${D_TH3}
MeshAmpX: ${meshAmpX}
MeshAmpY: ${meshAmpY}
printOutput: 1
OutputName: DiffusionResults.csv
printCMap: 1
CMapName: concentration_map.csv
printFMap: 1
FMapName: flux_map.csv
Convergence: ${convergence}
MaxIter: ${maxIter}
CL: ${CL}
CR: ${CR}
InputName: input_image.jpg
nThreads: ${nThreads}
Verbose: ${verbose}
useGPU: ${useGPU}
nGPU: ${nGPU}
TF: 0
Time: 100
Current: 6e-5
Charge: 1
SS: 1
CD_Time: 1800
Relax_Time: 14400
StartFlag: 0
StartTime: 900
InitCmap: CMAP_00090.csv
`;

    const inputTxtPath = join(tempDir, 'input.txt');
    await writeFile(inputTxtPath, inputConfig);

    // Copy CUDA source files to temp directory
    const projectRoot = process.cwd();
    const cudaFiles = ['main.cu', 'helper.cuh', 'stb_image.h'];
    
    for (const cudaFile of cudaFiles) {
      const srcPath = join(projectRoot, cudaFile);
      const dstPath = join(tempDir, cudaFile);
      
      if (existsSync(srcPath)) {
        const content = await readFile(srcPath);
        await writeFile(dstPath, content);
      } else {
        return NextResponse.json({
          success: false,
          error: `Missing CUDA source file: ${cudaFile}`
        }, { status: 500 });
      }
    }

    // Compile CUDA code
    console.log('Starting CUDA compilation...');
    const compileResult = await compileCudaCode(tempDir);

    if (!compileResult.success) {
      console.error('Compilation failed:', compileResult.error);
      return NextResponse.json({
        success: false,
        error: compileResult.error
      }, { status: 500 });
    }

    console.log('Compilation successful, executable:', compileResult.executableName);

    // Run simulation
    console.log('Starting diffusivity simulation...');
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

    // Parse results from stdout
    const results = parseDiffusivityResults(simResult.stdout);

    if (!results.diffusivity) {
      return NextResponse.json({
        success: false,
        error: 'No diffusivity results found in simulation output',
        stdout: simResult.stdout
      }, { status: 500 });
    }

    // Parse image dimensions from stdout
    let actualWidth = info.width;
    let actualHeight = info.height;
    const widthMatch = simResult.stdout.match(/Width[:\s]+(\d+)/i);
    const heightMatch = simResult.stdout.match(/Height[:\s]+(\d+)/i);
    if (widthMatch && heightMatch) {
      actualWidth = parseInt(widthMatch[1]);
      actualHeight = parseInt(heightMatch[1]);
    }

    // Prepare response
    const responseData = {
      success: true,
      data: {
        diffusivity: results.diffusivity,
        tortuosity: results.tortuosity,
        porosity: results.porosity,
        iterations: results.iterations,
        simulation_time: simulationTime,
        image_properties: {
          width: actualWidth,
          height: actualHeight,
          channels: 1
        },
        simulation_parameters: {
          nD,
          inputType,
          numDC,
          D1,
          D2,
          D3,
          D_TH1,
          D_TH2,
          D_TH3,
          meshAmpX,
          meshAmpY,
          convergence,
          maxIter,
          CL,
          CR,
          nThreads,
          useGPU,
          nGPU
        }
      },
      message: 'Diffusivity simulation completed successfully'
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Diffusivity simulation error:', error);
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
  // Check GPU availability
  const cudaCheck = await checkCudaAvailability();
  
  return NextResponse.json({
    success: true,
    message: 'Effective diffusivity simulation API is running',
    gpu_available: cudaCheck.available,
    gpu_error: cudaCheck.error,
    timestamp: Date.now()
  });
} 