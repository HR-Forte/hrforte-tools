import { NextRequest, NextResponse } from 'next/server';
import { generateRequestId, getRequestId } from '.';
import { ApiResponse } from '../api/types';

export function formatSuccessResponse<T>(data: T, message?: string, request?: NextRequest): NextResponse {
  const requestId = request ? getRequestId(request) : generateRequestId();
  const response: ApiResponse<T> = {
    data,
    status: 200,
    message: message || 'OK',
    headers: {},
  };

  return NextResponse.json(response, {
    status: 200,
    headers: {
      'X-Request-ID': requestId,
    },
  });
}
