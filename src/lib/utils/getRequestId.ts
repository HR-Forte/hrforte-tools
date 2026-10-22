import { NextRequest } from 'next/server';
import { generateRequestId } from './generateRequestId';

export function getRequestId(request?: NextRequest): string {
  return request?.headers.get('x-request-id') || generateRequestId();
}
