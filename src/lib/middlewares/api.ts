import { NextRequest, NextResponse } from 'next/server';
import { handleCors } from './cors';
import { handleRateLimit } from './rateLimiter';
import { generateRequestId } from '../utils';

export const handleApi = async (request: NextRequest) => {
  // Add request ID to the request
  const requestId = generateRequestId();
  request.headers.set('x-request-id', requestId);
  const response = NextResponse.next();

  // CORS
  const corsResponse = handleCors(request, response);
  if (corsResponse) {
    return corsResponse;
  }

  // Rate limiting
  const rateLimitResponse = handleRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Authentication is enforced per route via handleAuth / requireRole.
  // Return response
  return response;
};
