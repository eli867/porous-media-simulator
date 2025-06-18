#!/usr/bin/env node

/**
 * Deployment Diagnostic Script
 * 
 * This script helps identify common issues that cause JSON parsing errors
 * in production deployments of the fluid permeability simulator.
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Fluid Permeability Simulator - Deployment Diagnostics\n');

const diagnostics = {
  environment: {},
  system: {},
  requirements: {},
  errors: []
};

// Helper function to execute commands
const execCommand = (command, args = []) => {
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

// Check environment
async function checkEnvironment() {
  console.log('📋 Checking environment...');
  
  diagnostics.environment = {
    node_version: process.version,
    platform: process.platform,
    arch: process.arch,
    node_env: process.env.NODE_ENV || 'development',
    cwd: process.cwd(),
    temp_dir: require('os').tmpdir()
  };

  console.log(`   Node.js: ${diagnostics.environment.node_version}`);
  console.log(`   Platform: ${diagnostics.environment.platform} (${diagnostics.environment.arch})`);
  console.log(`   Environment: ${diagnostics.environment.node_env}`);
  console.log(`   Working Directory: ${diagnostics.environment.cwd}`);
  console.log(`   Temp Directory: ${diagnostics.environment.temp_dir}`);
}

// Check system resources
async function checkSystem() {
  console.log('\n💻 Checking system resources...');
  
  const memUsage = process.memoryUsage();
  diagnostics.system = {
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB'
    },
    uptime: Math.round(process.uptime()) + ' seconds'
  };

  console.log(`   Memory Usage: ${diagnostics.system.memory.rss} RSS`);
  console.log(`   Heap Used: ${diagnostics.system.memory.heapUsed}`);
  console.log(`   Uptime: ${diagnostics.system.uptime}`);
}

// Check C++ compilers
async function checkCompilers() {
  console.log('\n🔧 Checking C++ compilers...');
  
  const isWindows = process.platform === 'win32';
  const compilers = isWindows ? ['g++', 'clang++', 'gcc'] : ['g++', 'clang++', 'gcc'];
  
  diagnostics.requirements.compilers = [];
  
  for (const compiler of compilers) {
    try {
      const result = await execCommand(compiler, ['--version']);
      if (result.code === 0) {
        const version = result.stdout.split('\n')[0];
        diagnostics.requirements.compilers.push({
          name: compiler,
          version,
          available: true
        });
        console.log(`   ✅ ${compiler}: ${version}`);
      } else {
        diagnostics.requirements.compilers.push({
          name: compiler,
          available: false
        });
        console.log(`   ❌ ${compiler}: Not available`);
      }
    } catch (error) {
      diagnostics.requirements.compilers.push({
        name: compiler,
        available: false
      });
      console.log(`   ❌ ${compiler}: Not available`);
    }
  }
}

// Check required files
async function checkFiles() {
  console.log('\n📁 Checking required files...');
  
  const projectRoot = process.cwd();
  const requiredFiles = ['Perm2D.h', 'Perm2D.cpp', 'stb_image.h'];
  
  diagnostics.requirements.files = [];
  
  for (const file of requiredFiles) {
    const filePath = path.join(projectRoot, file);
    const exists = fs.existsSync(filePath);
    
    diagnostics.requirements.files.push({
      name: file,
      exists,
      path: filePath
    });
    
    if (exists) {
      console.log(`   ✅ ${file}: Found`);
    } else {
      console.log(`   ❌ ${file}: Missing`);
      diagnostics.errors.push(`Missing required file: ${file}`);
    }
  }
}

// Check file system permissions
async function checkPermissions() {
  console.log('\n🔐 Checking file system permissions...');
  
  diagnostics.requirements.permissions = {
    temp_writable: false,
    project_writable: false
  };
  
  try {
    const testFile = path.join(require('os').tmpdir(), 'diagnostic-test.txt');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    diagnostics.requirements.permissions.temp_writable = true;
    console.log('   ✅ Temp directory: Writable');
  } catch (error) {
    console.log('   ❌ Temp directory: Not writable');
    diagnostics.errors.push(`Temp directory not writable: ${error.message}`);
  }
  
  try {
    const testFile = path.join(projectRoot, 'diagnostic-test.txt');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    diagnostics.requirements.permissions.project_writable = true;
    console.log('   ✅ Project directory: Writable');
  } catch (error) {
    console.log('   ❌ Project directory: Not writable');
    diagnostics.errors.push(`Project directory not writable: ${error.message}`);
  }
}

// Test API endpoints
async function testAPI() {
  console.log('\n🌐 Testing API endpoints...');
  
  const endpoints = [
    { name: 'Health Check', url: '/api/health' },
    { name: 'Process Image', url: '/api/process-image' }
  ];
  
  diagnostics.api = [];
  
  for (const endpoint of endpoints) {
    try {
      // This is a simplified test - in a real scenario you'd need a running server
      console.log(`   ⚠️  ${endpoint.name}: Manual test required (server must be running)`);
      diagnostics.api.push({
        name: endpoint.name,
        url: endpoint.url,
        tested: false,
        note: 'Manual test required'
      });
    } catch (error) {
      console.log(`   ❌ ${endpoint.name}: Error`);
      diagnostics.api.push({
        name: endpoint.name,
        url: endpoint.url,
        tested: false,
        error: error.message
      });
    }
  }
}

// Generate recommendations
function generateRecommendations() {
  console.log('\n💡 Recommendations:');
  
  const hasCompiler = diagnostics.requirements.compilers?.some(c => c.available);
  const hasFiles = diagnostics.requirements.files?.every(f => f.exists);
  const hasTempPermissions = diagnostics.requirements.permissions?.temp_writable;
  
  if (!hasCompiler) {
    console.log('   🔧 Install a C++ compiler:');
    if (process.platform === 'win32') {
      console.log('      - Install MinGW-w64 or Visual Studio Build Tools');
      console.log('      - Add to PATH environment variable');
    } else {
      console.log('      - Ubuntu/Debian: sudo apt-get install build-essential');
      console.log('      - CentOS/RHEL: sudo yum groupinstall "Development Tools"');
      console.log('      - macOS: Install Xcode Command Line Tools');
    }
  }
  
  if (!hasFiles) {
    console.log('   📁 Ensure all required files are present:');
    console.log('      - Perm2D.h, Perm2D.cpp, stb_image.h must be in project root');
    console.log('      - Check file paths and permissions');
  }
  
  if (!hasTempPermissions) {
    console.log('   🔐 Fix file system permissions:');
    console.log('      - Ensure temp directory is writable');
    console.log('      - Check user permissions and disk space');
  }
  
  if (diagnostics.errors.length > 0) {
    console.log('\n❌ Issues found:');
    diagnostics.errors.forEach(error => {
      console.log(`   - ${error}`);
    });
  } else {
    console.log('   ✅ No critical issues found');
  }
}

// Main diagnostic function
async function runDiagnostics() {
  try {
    await checkEnvironment();
    await checkSystem();
    await checkCompilers();
    await checkFiles();
    await checkPermissions();
    await testAPI();
    
    generateRecommendations();
    
    // Save diagnostic report
    const reportPath = path.join(process.cwd(), 'deployment-diagnostic-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(diagnostics, null, 2));
    console.log(`\n📄 Diagnostic report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error.message);
    process.exit(1);
  }
}

// Run diagnostics
runDiagnostics(); 