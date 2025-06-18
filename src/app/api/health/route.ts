import { NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { join } from 'path';

export async function GET() {
  const isWindows = process.platform === 'win32';
  const expectedBinaryName = isWindows ? 'fluid_sim.exe' : 'fluid_sim';
  
  // Check for binaries
  const binaries = [
    { name: 'fluid_sim.exe', path: join(process.cwd(), 'fluid_sim.exe') },
    { name: 'fluid_sim', path: join(process.cwd(), 'fluid_sim') }
  ];
  
  const binaryStatus = binaries.map(binary => ({
    name: binary.name,
    exists: existsSync(binary.path),
    path: binary.path
  }));
  
  return NextResponse.json({
    success: true,
    message: 'Fluid simulation API is running',
    timestamp: new Date().toISOString(),
    environment: {
      platform: process.platform,
      arch: process.arch,
      node_version: process.version,
      cwd: process.cwd(),
      expected_binary: expectedBinaryName
    },
    binaries: binaryStatus,
    deployment_info: {
      runtime: 'nodejs',
      max_duration: 60,
      vercel_environment: process.env.VERCEL_ENV || 'unknown'
    }
  });
}

