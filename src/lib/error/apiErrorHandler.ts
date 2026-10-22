import { NextRequest } from 'next/server';
import { ApiHandler, RouteContext } from './types';
import { formatErrorResponse } from '@/lib/utils/formatErrorResponse';

export function apiErrorHandler<R = unknown>(handler: ApiHandler<R>) {
  return async (request: NextRequest, context?: RouteContext) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return formatErrorResponse(error, request);
    }
  };
}
