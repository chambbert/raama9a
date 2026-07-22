/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add specific trusted domains here as needed, e.g.:
  // { protocol: 'https', hostname: 'res.cloudinary.com' }
  // Wildcard '**' was removed to prevent loading images from arbitrary external domains.
  images: {
    // All app images are runtime uploads under public/uploads, which `next start`
    // can't read after build (optimizer gets null -> broken images). They're already
    // compressed at upload time by src/lib/uploads.ts, so serve them as-is.
    unoptimized: true,
  },
  experimental: {
    // middleware.ts matches all API routes, so its body buffer must cover the largest
    // upload we accept (50MB video) plus multipart overhead, or larger requests get
    // truncated mid-boundary and fail with a generic 500.
    proxyClientMaxBodySize: '60mb',
  },
}

module.exports = nextConfig
