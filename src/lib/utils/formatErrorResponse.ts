import ErrorService from '@/lib/error/errorService';
import { NextRequest, NextResponse } from 'next/server';
import { getRequestId, generateRequestId } from '.';

export function formatErrorResponse(error: unknown, request?: NextRequest): NextResponse {
  const requestId = request ? getRequestId(request) : generateRequestId();
  const appError = ErrorService.handleUnknownError(error, requestId);
  const response = appError.toJSON();

  return NextResponse.json(response, {
    status: appError.getHttpStatus(),
    headers: {
      'X-Request-ID': requestId,
    },
  });
}
