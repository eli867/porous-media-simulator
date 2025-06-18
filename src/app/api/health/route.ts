import { NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';

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

export async function GET() {
  const healthCheck = {
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
      temp_dir: require('os').tmpdir(),
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
      const fs = require('fs').promises;
      await fs.writeFile(join(require('os').tmpdir(), 'health-check-test.txt'), 'test');
      await fs.unlink(join(require('os').tmpdir(), 'health-check-test.txt'));
      healthCheck.requirements.file_system.temp_writable = true;
    } catch (error) {
      healthCheck.requirements.file_system.temp_writable = false;
      healthCheck.errors.push(`Temp directory not writable: ${error}`);
    }

    try {
      const fs = require('fs').promises;
      await fs.writeFile(join(projectRoot, 'health-check-test.txt'), 'test');
      await fs.unlink(join(projectRoot, 'health-check-test.txt'));
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

