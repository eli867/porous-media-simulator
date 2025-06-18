const fs = require('fs');
const path = require('path');

console.log('Testing CUDA setup...\n');

const requiredFiles = ['main.cu', 'helper.cuh', 'stb_image.h'];
const projectRoot = process.cwd();

console.log('Project root:', projectRoot);
console.log('Checking required CUDA files:\n');

let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(projectRoot, file);
  const exists = fs.existsSync(filePath);
  
  console.log(`${file}: ${exists ? '✅ Found' : '❌ Missing'}`);
  
  if (exists) {
    const stats = fs.statSync(filePath);
    console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);
  }
  
  if (!exists) {
    allFilesExist = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allFilesExist) {
  console.log('✅ All CUDA source files are present and accessible');
  console.log('\nNext steps:');
  console.log('1. Install NVIDIA CUDA Toolkit');
  console.log('2. Ensure nvcc is in your PATH');
  console.log('3. Run: nvcc --version');
  console.log('4. Start the app: npm run dev');
} else {
  console.log('❌ Some CUDA source files are missing');
  console.log('\nPlease ensure all required files are copied to the project root:');
  console.log('- main.cu');
  console.log('- helper.cuh');
  console.log('- stb_image.h');
}

console.log('\n' + '='.repeat(50)); 