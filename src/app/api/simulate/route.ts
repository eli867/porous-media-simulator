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
    console.log('Forwarding parameters to Railway API:');
    for (const [key, value] of formData.entries()) {
      if (key !== 'image') {
        // Ensure value is treated as a string for FormData.append
        railwayFormData.append(key, value.toString());
        console.log(`  ${key}: ${value}`);
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

    // Get the JSON response from Railway API
    const railwayJson = await response.json();
    if (!railwayJson.csv) {
      return NextResponse.json(
        { error: 'No CSV data found in Railway API response', details: railwayJson },
        { status: 500 }
      );
    }

    // Clean up CSV string (handle escaped newlines and quotes)
    const csvData = railwayJson.csv
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\r/g, '\r');

    // --- CSV to JSON parsing ---
    function parseCSV(csv: string) {
      const [headerLine, ...lines] = csv.trim().split(/\r?\n/);
      const headers = headerLine.split(',');
      return lines.map(line => {
        // Handle quoted fields and commas inside quotes (simple version)
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current);
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => {
          obj[h.trim()] = (values[i] || '').trim();
        });
        return obj;
      });
    }

    const jsonResult = parseCSV(csvData);
    console.log('Parsed CSV result:', jsonResult);

    // Patch: Add porosity field if present in Railway API response
    if (typeof railwayJson.porosity !== 'undefined') {
      jsonResult.forEach(obj => {
        obj.porosity = railwayJson.porosity;
      });
    }

    // Return JSON result
    return NextResponse.json(jsonResult, { status: 200 });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
