import { NextResponse, NextRequest } from 'next/server';
import { ERROR } from './constants';

export type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export type ApiHandler<R = unknown> = (
  request: NextRequest,
  context?: RouteContext
) => Promise<NextResponse<R>> | NextResponse<R>;

export type ErrorOptions = {
  type: keyof typeof ERROR;
  message?: string;
  options?: {
    field?: string;
    details?: Record<string, unknown>;
    requestId?: string;
    userId?: string;
    request?: NextRequest;
  };
};

// Error Categories
export enum ErrorCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  SYSTEM = 'SYSTEM',
  USER = 'USER',
  GENERAL = 'GENERAL',
}

// Error Severity Levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Base Error Interface
export interface BaseError {
  code: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  field?: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  requestId?: string;
  userId?: string;
  stack?: string;
}

export interface AppErrorOptions {
  message?: string;
  field?: string;
  details?: Record<string, unknown>;
  requestId?: string;
  userId?: string;
}
