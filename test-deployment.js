#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('=== Deployment Environment Test ===');
console.log(`Platform: ${process.platform}`);
console.log(`Architecture: ${process.arch}`);
console.log(`Node version: ${process.version}`);
console.log(`Current directory: ${process.cwd()}`);

// Check for binaries
const binaries = [
  { name: 'fluid_sim.exe', path: path.join(process.cwd(), 'fluid_sim.exe') },
  { name: 'fluid_sim', path: path.join(process.cwd(), 'fluid_sim') }
];

console.log('\n=== Binary Check ===');
for (const binary of binaries) {
  const exists = fs.existsSync(binary.path);
  console.log(`${binary.name}: ${exists ? '✅ Found' : '❌ Not found'}`);
  
  if (exists) {
    try {
      const stats = fs.statSync(binary.path);
      console.log(`  Size: ${stats.size} bytes`);
      console.log(`  Executable: ${(stats.mode & 0o111) ? 'Yes' : 'No'}`);
    } catch (e) {
      console.log(`  Error getting stats: ${e.message}`);
    }
  }
}

// Test binary execution
console.log('\n=== Binary Execution Test ===');
const testBinary = process.platform === 'win32' ? 'fluid_sim.exe' : 'fluid_sim';
const testPath = path.join(process.cwd(), testBinary);

if (fs.existsSync(testPath)) {
  console.log(`Testing execution of ${testBinary}...`);
  
  const child = spawn(testPath, ['--help'], { 
    stdio: 'pipe',
    cwd: process.cwd()
  });
  
  let stdout = '';
  let stderr = '';
  
  child.stdout.on('data', (data) => {
    stdout += data.toString();
  });
  
  child.stderr.on('data', (data) => {
    stderr += data.toString();
  });
  
  child.on('close', (code) => {
    console.log(`Exit code: ${code}`);
    if (stdout) console.log(`STDOUT: ${stdout.substring(0, 200)}...`);
    if (stderr) console.log(`STDERR: ${stderr.substring(0, 200)}...`);
    
    if (code === 0) {
      console.log('✅ Binary execution successful');
    } else {
      console.log('❌ Binary execution failed');
    }
  });
  
  child.on('error', (error) => {
    console.log(`❌ Binary execution error: ${error.message}`);
  });
} else {
  console.log(`❌ Test binary ${testBinary} not found`);
}

// List all files in directory
console.log('\n=== Directory Contents ===');
try {
  const files = fs.readdirSync(process.cwd());
  const relevantFiles = files.filter(f => 
    f.includes('fluid_sim') || 
    f.includes('Perm2D') || 
    f.includes('stb_image')
  );
  console.log('Relevant files:', relevantFiles);
} catch (e) {
  console.log(`Error listing directory: ${e.message}`);
}

console.log('\n=== Test Complete ==='); 