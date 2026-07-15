import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  console.log(`[hooks.server.ts] Request received for: ${event.url.pathname}`);
  if (event.url.pathname.startsWith('/api')) {
    const targetUrl = 'https://musictutorship-crm-server.onrender.com';
    const destination = `${targetUrl}${event.url.pathname}${event.url.search}`;
    console.log(`[hooks.server.ts] Proxying to: ${destination}`);

    const headers = new Headers();
    event.request.headers.forEach((value, key) => {
      // Don't forward host header to avoid SSL/routing mismatches
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    });

    try {
      const hasBody = event.request.method !== 'GET' && event.request.method !== 'HEAD';
      
      const response = await fetch(destination, {
        method: event.request.method,
        headers,
        body: hasBody ? event.request.body : undefined,
        // @ts-ignore
        duplex: hasBody ? 'half' : undefined
      });

      console.log(`[hooks.server.ts] Response status from Render: ${response.status} ${response.statusText}`);

      // Strip content-encoding and content-length headers since fetch/undici 
      // decompresses the stream automatically, but leaves the headers intact.
      const responseHeaders = new Headers(response.headers);
      responseHeaders.delete('content-encoding');
      responseHeaders.delete('content-length');

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });
    } catch (error) {
      console.error('--- Proxy Error ---');
      console.error('Destination:', destination);
      console.error('Error Details:', error);
      console.error('--------------------');
      
      return new Response(JSON.stringify({ 
        error: 'Proxy error connecting to backend',
        details: error instanceof Error ? error.message : String(error)
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return resolve(event);
};
