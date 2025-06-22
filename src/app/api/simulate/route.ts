import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Parse incoming form data
    const formData = await request.formData();
    const image = formData.get('image') as File;
    
    // Validate required image
    if (!image) {
      return NextResponse.json(
        { error: 'Image file is required' },
        { status: 400 }
      );
    }

    // Prepare request for Railway API
    const railwayFormData = new FormData();
    railwayFormData.append('image', image);
    
    // Forward all other parameters to Railway API
    for (const [key, value] of formData.entries()) {
      if (key !== 'image') {
        railwayFormData.append(key, value.toString());
      }
    }
    
    // Send to Railway API
    const response = await fetch(
      'https://porous-media-predictor-production.up.railway.app/simulate',
      { method: 'POST', body: railwayFormData }
    );

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: 'Railway API error', details: text },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type');
    
    // Handle JSON response from Railway API
    if (contentType?.includes('application/json')) {
      const jsonData = await response.json();
      
      // Check if simulation was successful
      if (jsonData.exit_code !== 0) {
        return NextResponse.json(
          { 
            error: 'Simulation failed', 
            details: jsonData.stderr || 'Unknown error',
            exit_code: jsonData.exit_code 
          },
          { status: 500 }
        );
      }
      
      // Process CSV data if available
      if (jsonData.csv) {
        const results = parseCSVResults(jsonData.csv);
        
        return NextResponse.json({
          status: 'success',
          data: results
        });
      } else {
        return NextResponse.json(
          { error: 'No CSV data in response' },
          { status: 500 }
        );
      }
    }
    
    // Handle CSV response directly (fallback)
    if (contentType?.includes('text/csv')) {
      const csvData = await response.text();
      
      // Process CSV data
      const results = parseCSVResults(csvData);
      
      return NextResponse.json({
        status: 'success',
        data: results
      });
    }
    
    // If not JSON or CSV, return error
    const text = await response.text();
    return NextResponse.json(
      { error: 'Unexpected response from Railway API', details: text },
      { status: 500 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

// CSV Parser and Transformer
function parseCSVResults(csvData: string) {
  const rows = csvData.trim().split('\n');
  const headers = rows[0].split(',');
  
  const results = rows.slice(1).map(row => {
    const values = row.split(',');
    const entry: Record<string, string | number> = {};
    
    headers.forEach((header, index) => {
      const value = values[index].trim();
      
      // Convert numeric values
      if (['iter', 'K', 'R', 'alpha', 'mesh'].includes(header)) {
        entry[header] = isNaN(parseFloat(value)) ? value : parseFloat(value);
      } else {
        entry[header] = value;
      }
    });
    
    return entry;
  });
  
  // Extract key metrics
  const finalResult = results[results.length - 1];
  const porosityMatch = csvData.match(/Porosity = ([\d.]+)/);
  
  return {
    fullData: results,
    summary: {
      permeability: finalResult.K,
      continuityRMS: finalResult.R,
      porosity: porosityMatch ? parseFloat(porosityMatch[1]) : null,
      iterations: results.length
    }
  };
}

// GET method unchanged...
