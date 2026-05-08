/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'Content-Security-Policy',
    // Loose enough that Next.js inline bootstrap + Google Fonts still work;
    // tight enough that a compromised tracker can't exfiltrate outside our
    // allowed origins. `unsafe-inline` on script is a Next.js requirement;
    // tightening to nonces is Week 2 work.
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob:",
      "font-src 'self' https://fonts.gstatic.com data:",
      "connect-src 'self' https://api.anthropic.com https://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig = {
  reactStrictMode: true,
  // Demo project JSONs are read at runtime by the Supabase project repo
  // (filesystem fallback for ids starting with `demo-`). Make sure Next.js
  // ships them inside the lambda bundle.
  outputFileTracingIncludes: {
    '/project/[projectId]': ['./data/projects/demo-*.json'],
    '/project/[projectId]/agents': ['./data/projects/demo-*.json'],
    '/demo': ['./data/projects/demo-*.json'],
    '/api/cron/reminders': ['./data/projects/demo-*.json'],
  },
  experimental: {
    serverComponentsExternalPackages: ['cheerio'],
  },
  async headers() {
    return [
      {
        // Apply to every route. The policy viewer (`/documents/[docId]`) uses
        // `window.print()` which respects these; no route-specific overrides
        // needed at this stage.
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
