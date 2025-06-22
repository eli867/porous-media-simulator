#!/usr/bin/env node

const https = require('https');

const RAILWAY_URL = 'https://porous-media-predictor-production.up.railway.app';

async function testRailwayBackend() {
  console.log('🚂 Testing Railway Backend...\n');
  
  // Test root endpoint
  console.log('0. Testing root endpoint...');
  try {
    const rootResponse = await makeRequest(`${RAILWAY_URL}/`);
    console.log('✅ Root endpoint accessible');
    console.log('   Response:', JSON.stringify(rootResponse, null, 2));
  } catch (error) {
    console.log('❌ Root endpoint failed:', error.message);
  }
  
  // Test health endpoint with different paths
  console.log('\n1. Testing health endpoint variations...');
  const healthPaths = ['/api/health', '/health', '/api', '/'];
  
  for (const path of healthPaths) {
    try {
      console.log(`   Testing ${path}...`);
      const healthResponse = await makeRequest(`${RAILWAY_URL}${path}`);
      console.log(`   ✅ ${path} - Status: ${healthResponse.status || 'OK'}`);
      if (healthResponse.data) {
        console.log(`   Data: ${healthResponse.data.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`   ❌ ${path} - ${error.message}`);
    }
  }
  
  console.log('\n2. Testing process-image endpoint variations...');
  const processPaths = ['/api/process-image', '/process-image', '/api/process'];
  
  for (const path of processPaths) {
    try {
      console.log(`   Testing ${path}...`);
      const processResponse = await makeRequest(`${RAILWAY_URL}${path}`, 'POST');
      console.log(`   ✅ ${path} - Status: ${processResponse.status || 'OK'}`);
      if (processResponse.data) {
        console.log(`   Data: ${processResponse.data.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`   ❌ ${path} - ${error.message}`);
    }
  }
  
  console.log('\n🎯 Railway Backend Test Complete!');
}

function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'User-Agent': 'Railway-Backend-Test/1.0',
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
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Run the test
testRailwayBackend().catch(console.error); 