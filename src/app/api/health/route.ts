import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Fluid simulation API is running',
    timestamp: Date.now(),
    version: '1.0.0'
  });
}

