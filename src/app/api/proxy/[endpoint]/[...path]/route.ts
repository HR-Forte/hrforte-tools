import { NextRequest, NextResponse } from 'next/server';
import { handleAuth } from '@/lib/middlewares/auth';
import { apiErrorHandler } from '@/lib/error/apiErrorHandler';
import ErrorService from '@/lib/error/errorService';
import { joinUrl } from '@/lib/utils/joinUrl';
import { PROXY_TARGETS } from '@/config/server';

// Forwards authenticated client calls to partner APIs, attaching their API keys server-side
// so the keys never reach the browser. Upstream status and body are returned unchanged.

const FORWARDED_REQUEST_HEADERS = ['content-type', 'accept', 'accept-language'];
const FORWARDED_RESPONSE_HEADERS = ['content-type', 'content-disposition', 'cache-control'];
const UPSTREAM_TIMEOUT_MS = 14000; // just under the client timeout so the client sees a 504, not its own abort

const handler = apiErrorHandler(async (request: NextRequest, context) => {
  const authResponse = await handleAuth(request);
  if (authResponse) return authResponse;

  const { endpoint } = ((await context?.params) ?? {}) as { endpoint?: string };
  const target = endpoint && Object.hasOwn(PROXY_TARGETS, endpoint) ? PROXY_TARGETS[endpoint] : undefined;
  if (!endpoint || !target?.baseURL) {
    throw ErrorService.createError({ type: 'NOT_FOUND', message: 'Unknown proxy endpoint', options: { request } });
  }

  // Use the raw (still-encoded) path so upstream sees exactly what the client sent.
  const prefix = `/api/proxy/${endpoint}`;
  const rawPath = request.nextUrl.pathname.slice(prefix.length);
  const segments = rawPath.split('/').filter(Boolean);
  if (segments.some(s => ['.', '..'].includes(decodeURIComponent(s)))) {
    throw ErrorService.createError({ type: 'INVALID_FORMAT', message: 'Invalid proxy path', options: { request } });
  }

  const upstreamUrl = new URL(joinUrl(target.baseURL, segments.join('/')));
  upstreamUrl.search = request.nextUrl.search;

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (target.apiKey) headers.set('authorization', target.apiKey);

  const hasBody = !['GET', 'HEAD'].includes(request.method);
  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    cache: 'no-store',
  }).catch(error => {
    const isTimeout = error?.name === 'TimeoutError';
    throw ErrorService.createError({
      type: isTimeout ? 'GATEWAY_TIMEOUT' : 'SERVICE_UNAVAILABLE',
      message: `${endpoint} is unreachable`,
      options: { request },
    });
  });

  const responseHeaders = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  return new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders });
});

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
