import adapterStatic from '@sveltejs/adapter-static';
import adapterVercel from '@sveltejs/adapter-vercel';

const adapter = process.env.VERCEL
  ? adapterVercel()
  : adapterStatic({ fallback: 'index.html' });

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    // adapter-static: SPA mode — Go backend serves the built files
    // fallback: 'index.html' enables client-side routing for all routes
    adapter: adapter
  }
};

export default config;
