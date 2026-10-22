import { NextRequest } from 'next/server';
import { formatErrorResponse, getRequestId } from '../utils';
import errorService from '../error/errorService';

// ponytail: in-memory, per-instance limiter; move to Redis/Upstash if the app runs on multiple instances.
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_KEYS = 10_000;
const DEFAULT_LIMIT = 300; // requests per minute (partner API calls are proxied through /api)
const LOGIN_LIMIT = 10; // login attempts per minute

// First hop of x-forwarded-for is the client as seen by our proxy; the raw header may be a spoofed list.
const getClientIp = (request: NextRequest) =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';

function sweepExpired(now: number) {
  for (const [key, data] of rateLimitMap) {
    if (now - data.lastReset > WINDOW_MS) rateLimitMap.delete(key);
  }
}

export function handleRateLimit(request: NextRequest) {
  const ip = getClientIp(request);
  const isLogin = request.nextUrl.pathname === '/api/auth/login';
  const key = isLogin ? `login:${ip}` : ip;
  const limit = isLogin ? LOGIN_LIMIT : DEFAULT_LIMIT;
  const now = Date.now();

  if (rateLimitMap.size > MAX_KEYS) sweepExpired(now);

  let ipData = rateLimitMap.get(key);
  if (!ipData || now - ipData.lastReset > WINDOW_MS) {
    ipData = { count: 0, lastReset: now };
    rateLimitMap.set(key, ipData);
  }

  if (ipData.count >= limit) {
    return formatErrorResponse(
      errorService.createError({ type: 'RATE_LIMIT_EXCEEDED', options: { requestId: getRequestId(request) } }),
      request
    );
  }

  ipData.count += 1;
}
