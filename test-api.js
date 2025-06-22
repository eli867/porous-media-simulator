const fs = require('fs');
const FormData = require('form-data');

async function testAPI() {
  try {
    const form = new FormData();
    form.append('image', fs.createReadStream('clear_channel_test.png'));
    
    // Add default parameters
    form.append('density', '1000');
    form.append('viscosity', '0.001');
    form.append('domain_width', '0.01');
    form.append('mesh_amp', '2');
    form.append('max_iter', '1000');
    form.append('convergence_rms', '1e-6');
    form.append('n_cores', '4');

    const response = await fetch('http://localhost:3000/api/simulate', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.text();
    console.log('Response:', data);
    
    try {
      const jsonData = JSON.parse(data);
      console.log('Parsed JSON:', JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log('Response is not JSON');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI(); 