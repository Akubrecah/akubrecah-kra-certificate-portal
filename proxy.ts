import { createMiddleware } from '@modelcontextprotocol/sdk/client/middleware';
import type { Middleware } from '@modelcontextprotocol/sdk/client/middleware';
import type { FetchLike } from '@modelcontextprotocol/sdk/shared/transport';

/**
 * Creates a fetch middleware that proxies requests to a target URL.
 *
 * This is useful for scenarios where the client-side application needs to
 * route its API calls through a specific backend or proxy server, for example,
 * to bypass CORS issues during development or to centralize request handling.
 *
 * @param targetBaseUrl - The base URL to which requests should be proxied.
 * @returns A fetch middleware function.
 *
 * @example
 * ```typescript
 * import { applyMiddlewares } from '@modelcontextprotocol/sdk/client/middleware';
 * import { withProxy } from './proxy'; // Assuming this file is proxy.ts
 *
 * const proxyFetch = applyMiddlewares(
 *   withProxy('http://localhost:8080/proxy')
 * )(fetch);
 *
 * // This request will be sent to http://localhost:8080/proxy/data
 * const response = await proxyFetch('https://api.example.com/data');
 * ```
 */
export const withProxy = (targetBaseUrl: string | URL): Middleware => {
  return createMiddleware(async (next: FetchLike, input: string | URL, init?: RequestInit) => {
    const requestUrl = new URL(typeof input === 'string' ? input : input.href);

    // Construct the new URL by taking the pathname and search from the original request
    // and appending it to the proxy target's base URL.
    const proxyUrl = new URL(requestUrl.pathname + requestUrl.search, targetBaseUrl);

    const headers = new Headers(init?.headers);
    // Add a header to inform the proxy about the original host.
    headers.set('X-Forwarded-Host', requestUrl.host);

    return next(proxyUrl, { ...init, headers });
  });
};