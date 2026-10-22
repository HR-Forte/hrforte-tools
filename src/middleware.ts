import { NextRequest, NextResponse } from 'next/server';
import { handleApi } from './lib/middlewares/api';

// Middleware function ================================================================================================================
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply middleware based on path
  if (pathname.startsWith('/api')) {
    return await handleApi(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
