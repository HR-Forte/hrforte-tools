import { NextRequest, NextResponse } from 'next/server';

export const handleCors = (request: NextRequest, response: NextResponse) => {
  // Get the origin from the request headers
  const origin = request.headers.get('origin');

  // Define allowed origins
  const allowedOrigins = [
    'https://hrforte-tools.vercel.app',
    'https://hrforte-tools.hrforte.com',
    'http://localhost:3000', // For local development
  ];

  // Check if the origin is allowed
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);

  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  // Set CORS headers
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  // Handle preflight request
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: response.headers });
  }
};
