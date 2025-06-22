#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

const RAILWAY_URL = 'https://porous-media-predictor-production.up.railway.app';

async function testRailwayAPI() {
  console.log('🚂 Testing Railway API with Correct Endpoints...\n');
  
  // Test 1: Health check endpoint
  console.log('1. Testing health check endpoint (/)...');
  try {
    const healthResponse = await makeRequest(`${RAILWAY_URL}/`);
    console.log('✅ Health check successful');
    console.log('   Status:', healthResponse.status);
    console.log('   Response:', JSON.stringify(healthResponse, null, 2));
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
  
  // Test 2: Simulate endpoint (POST request)
  console.log('\n2. Testing simulate endpoint (/simulate)...');
  try {
    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // width: 1
      0x00, 0x00, 0x00, 0x01, // height: 1
      0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, etc.
      0x90, 0x77, 0x53, 0xDE, // CRC
      0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // compressed data
      0x00, 0x00, 0x00, 0x00, // IEND chunk length
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // CRC
    ]);
    
    const simulateResponse = await makeFormDataRequest(`${RAILWAY_URL}/simulate`, {
      image: { buffer: testImageBuffer, filename: 'test.png', contentType: 'image/png' },
      density: '1000.0',
      viscosity: '0.001',
      domain_width: '1.0',
      mesh_amp: '1',
      max_iter: '1000',
      convergence_rms: '1e-6',
      n_cores: '1'
    });
    
    console.log('✅ Simulate endpoint accessible');
    console.log('   Status:', simulateResponse.status);
    console.log('   Exit Code:', simulateResponse.exit_code);
    console.log('   Has CSV:', !!simulateResponse.csv);
    console.log('   Has STDOUT:', !!simulateResponse.stdout);
    console.log('   Has STDERR:', !!simulateResponse.stderr);
    
    if (simulateResponse.exit_code === 0) {
      console.log('   ✅ Simulation completed successfully');
      if (simulateResponse.csv) {
        console.log('   CSV Preview:', simulateResponse.csv.substring(0, 200) + '...');
      }
    } else {
      console.log('   ⚠️  Simulation failed with exit code:', simulateResponse.exit_code);
      if (simulateResponse.stderr) {
        console.log('   STDERR:', simulateResponse.stderr.substring(0, 200) + '...');
      }
    }
  } catch (error) {
    console.log('❌ Simulate endpoint failed:', error.message);
  }
  
  // Test 3: Test with actual image file if available
  console.log('\n3. Testing with actual image file...');
  const testImages = ['test_porous_media_gray.png', 'simple_test.png', 'working_test.png'];
  
  for (const imageName of testImages) {
    const imagePath = path.join(process.cwd(), imageName);
    if (fs.existsSync(imagePath)) {
      try {
        console.log(`   Testing with ${imageName}...`);
        const imageBuffer = fs.readFileSync(imagePath);
        
        const response = await makeFormDataRequest(`${RAILWAY_URL}/simulate`, {
          image: { buffer: imageBuffer, filename: imageName, contentType: 'image/png' },
          density: '1000.0',
          viscosity: '0.001',
          domain_width: '0.01',
          mesh_amp: '2',
          max_iter: '5000',
          convergence_rms: '1e-6',
          n_cores: '2'
        });
        
        if (response.exit_code === 0) {
          console.log(`   ✅ ${imageName} processed successfully`);
          if (response.csv) {
            const lines = response.csv.trim().split('\n');
            if (lines.length > 1) {
              const lastLine = lines[lines.length - 1];
              const values = lastLine.split(',');
              if (values.length >= 2) {
                console.log(`   Final permeability: ${values[1]}`);
              }
            }
          }
        } else {
          console.log(`   ⚠️  ${imageName} failed with exit code: ${response.exit_code}`);
        }
        break; // Only test with first available image
      } catch (error) {
        console.log(`   ❌ ${imageName} test failed:`, error.message);
      }
    }
  }
  
  console.log('\n🎯 Railway API Test Complete!');
}

function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'User-Agent': 'Railway-API-Test/1.0',
        'Accept': 'application/json, text/plain, */*'
      }
    };
    
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, ...jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data.substring(0, 200) });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

function makeFormDataRequest(url, fields) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
    let body = '';
    
    // Build multipart form data
    for (const [key, value] of Object.entries(fields)) {
      body += `--${boundary}\r\n`;
      
      if (key === 'image') {
        body += `Content-Disposition: form-data; name="${key}"; filename="${value.filename}"\r\n`;
        body += `Content-Type: ${value.contentType}\r\n\r\n`;
        body += value.buffer.toString('binary');
      } else {
        body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
        body += value;
      }
      body += '\r\n';
    }
    body += `--${boundary}--\r\n`;
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'Railway-API-Test/1.0'
      }
    };
    
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, ...jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data.substring(0, 200) });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(60000, () => { // 60 second timeout for simulation
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.write(body);
    req.end();
  });
}

// Run the test
testRailwayAPI().catch(console.error); 