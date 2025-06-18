import { NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { writeFile, unlink } from 'fs/promises';

// Helper function to execute shell commands
const execCommand = (command: string, args: string[]): Promise<{ stdout: string; stderr: string; code: number }> => {
  return new Promise((resolve) => {
    const process = spawn(command, args, { stdio: 'pipe' });
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

// Type definitions for health check
interface CompilerInfo {
  name: string;
  version?: string;
  available: boolean;
}

interface FileInfo {
  name: string;
  exists: boolean;
  path: string;
}

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  environment: {
    node_version: string;
    platform: string;
    arch: string;
    node_env: string;
  };
  system: {
    cwd: string;
    temp_dir: string;
    memory_usage: NodeJS.MemoryUsage;
    uptime: number;
  };
  requirements: {
    cpp_compilers: CompilerInfo[];
    required_files: FileInfo[];
    file_system: {
      writable: boolean;
      temp_writable: boolean;
    };
  };
  errors: string[];
}

export async function GET() {
  const healthCheck: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: {
      node_version: process.version,
      platform: process.platform,
      arch: process.arch,
      node_env: process.env.NODE_ENV || 'development'
    },
    system: {
      cwd: process.cwd(),
      temp_dir: tmpdir(),
      memory_usage: process.memoryUsage(),
      uptime: process.uptime()
    },
    requirements: {
      cpp_compilers: [],
      required_files: [],
      file_system: {
        writable: false,
        temp_writable: false
      }
    },
    errors: []
  };

  try {
    // Check for C++ compilers
    const isWindows = process.platform === 'win32';
    const compilers = isWindows ? ['g++', 'clang++', 'gcc'] : ['g++', 'clang++', 'gcc'];
    
    for (const compiler of compilers) {
      try {
        const result = await execCommand(compiler, ['--version']);
        if (result.code === 0) {
          healthCheck.requirements.cpp_compilers.push({
            name: compiler,
            version: result.stdout.split('\n')[0],
            available: true
          });
        }
      } catch {
        healthCheck.requirements.cpp_compilers.push({
          name: compiler,
          available: false
        });
      }
    }

    // Check required files
    const projectRoot = process.cwd();
    const requiredFiles = ['Perm2D.h', 'Perm2D.cpp', 'stb_image.h'];
    
    for (const file of requiredFiles) {
      const filePath = join(projectRoot, file);
      healthCheck.requirements.required_files.push({
        name: file,
        exists: existsSync(filePath),
        path: filePath
      });
    }

    // Check file system permissions
    try {
      const testFile = join(tmpdir(), 'health-check-test.txt');
      await writeFile(testFile, 'test');
      await unlink(testFile);
      healthCheck.requirements.file_system.temp_writable = true;
    } catch (error) {
      healthCheck.requirements.file_system.temp_writable = false;
      healthCheck.errors.push(`Temp directory not writable: ${error}`);
    }

    try {
      const testFile = join(projectRoot, 'health-check-test.txt');
      await writeFile(testFile, 'test');
      await unlink(testFile);
      healthCheck.requirements.file_system.writable = true;
    } catch (error) {
      healthCheck.requirements.file_system.writable = false;
      healthCheck.errors.push(`Project directory not writable: ${error}`);
    }

    // Determine overall health status
    const hasCompiler = healthCheck.requirements.cpp_compilers.some(c => c.available);
    const hasFiles = healthCheck.requirements.required_files.every(f => f.exists);
    const hasPermissions = healthCheck.requirements.file_system.temp_writable;

    if (!hasCompiler || !hasFiles || !hasPermissions) {
      healthCheck.status = 'degraded';
    }

    if (healthCheck.errors.length > 0) {
      healthCheck.status = 'unhealthy';
    }

    return NextResponse.json(healthCheck, { 
      status: healthCheck.status === 'healthy' ? 200 : 503 
    });

  } catch (error) {
    healthCheck.status = 'unhealthy';
    healthCheck.errors.push(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    return NextResponse.json(healthCheck, { status: 503 });
  }
}

