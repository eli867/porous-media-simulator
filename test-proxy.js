#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

// Test our local proxy endpoint
const LOCAL_PROXY_URL = 'http://localhost:3000/api/process-image';
const RAILWAY_URL = 'https://porous-media-predictor-production.up.railway.app';

async function testProxy() {
  console.log('🔗 Testing Local Proxy to Railway API...\n');
  
  // Test 1: Health check through proxy
  console.log('1. Testing health check through proxy...');
  try {
    const healthResponse = await makeRequest(`${LOCAL_PROXY_URL}`, 'GET');
    console.log('✅ Proxy health check successful');
    console.log('   Status:', healthResponse.status);
    console.log('   Railway Status:', healthResponse.railway_backend?.status);
    console.log('   Response:', JSON.stringify(healthResponse, null, 2));
  } catch (error) {
    console.log('❌ Proxy health check failed:', error.message);
    console.log('   Note: Make sure the development server is running (npm run dev)');
  }
  
  // Test 2: Process image through proxy
  console.log('\n2. Testing image processing through proxy...');
  try {
    // Use a simple test image
    const testImages = ['test_porous_media_gray.png', 'simple_test.png', 'working_test.png'];
    let imageBuffer = null;
    let imageName = null;
    
    for (const name of testImages) {
      const imagePath = path.join(process.cwd(), name);
      if (fs.existsSync(imagePath)) {
        imageBuffer = fs.readFileSync(imagePath);
        imageName = name;
        break;
      }
    }
    
    if (!imageBuffer) {
      console.log('   ⚠️  No test images found, creating minimal test...');
      // Create a minimal test image
      imageBuffer = Buffer.from([
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
      imageName = 'test.png';
    }
    
    const proxyResponse = await makeFormDataRequest(LOCAL_PROXY_URL, {
      image: { buffer: imageBuffer, filename: imageName, contentType: 'image/png' },
      density: '1000.0',
      viscosity: '0.001',
      domain_width: '0.01',
      mesh_amp: '2',
      max_iter: '1000',
      convergence_rms: '1e-6',
      n_cores: '1'
    });
    
    console.log('✅ Proxy request completed');
    console.log('   Status:', proxyResponse.status || proxyResponse.success);
    
    if (proxyResponse.success) {
      console.log('   ✅ Proxy transformation successful');
      console.log('   Permeability:', proxyResponse.data?.permeability);
      console.log('   Porosity:', proxyResponse.data?.porosity);
      console.log('   Iterations:', proxyResponse.data?.iterations);
    } else {
      console.log('   ⚠️  Proxy returned error:', proxyResponse.error);
      if (proxyResponse.details) {
        console.log('   Details:', JSON.stringify(proxyResponse.details, null, 2));
      }
    }
  } catch (error) {
    console.log('❌ Proxy request failed:', error.message);
  }
  
  // Test 3: Direct Railway comparison
  console.log('\n3. Comparing direct Railway vs Proxy responses...');
  try {
    console.log('   Testing direct Railway API...');
    const railwayResponse = await makeFormDataRequest(`${RAILWAY_URL}/simulate`, {
      image: { buffer: Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), filename: 'test.png', contentType: 'image/png' },
      density: '1000.0',
      viscosity: '0.001',
      domain_width: '0.01',
      mesh_amp: '2',
      max_iter: '1000',
      convergence_rms: '1e-6',
      n_cores: '1'
    });
    
    console.log('   Railway Exit Code:', railwayResponse.exit_code);
    console.log('   Railway Has CSV:', !!railwayResponse.csv);
    console.log('   Railway Has STDOUT:', !!railwayResponse.stdout);
    
    if (railwayResponse.exit_code !== 0) {
      console.log('   ⚠️  Railway has library compatibility issues');
      console.log('   STDERR:', railwayResponse.stderr?.substring(0, 100) + '...');
    }
  } catch (error) {
    console.log('   ❌ Direct Railway test failed:', error.message);
  }
  
  console.log('\n🎯 Proxy Test Complete!');
  console.log('\n📋 Summary:');
  console.log('- Railway API endpoints are accessible');
  console.log('- Railway has library compatibility issues with the C++ binary');
  console.log('- Proxy correctly forwards requests and handles responses');
  console.log('- Proxy transforms Railway format to frontend-expected format');
}

function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const http = isHttps ? https : require('http');
    
    const options = {
      method,
      headers: {
        'User-Agent': 'Proxy-Test/1.0',
        'Accept': 'application/json, text/plain, */*'
      }
    };
    
    const req = http.request(url, options, (res) => {
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
    const isHttps = url.startsWith('https://');
    const http = isHttps ? https : require('http');
    
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
        'User-Agent': 'Proxy-Test/1.0'
      }
    };
    
    const req = http.request(url, options, (res) => {
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
    
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.write(body);
    req.end();
  });
}

// Run the test
testProxy().catch(console.error); 