/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove deprecated appDir option
  output: 'standalone', // Optimize for Azure deployment
  compress: true, // Enable compression
  poweredByHeader: false, // Remove X-Powered-By header for security
  generateEtags: false, // Disable ETags for better caching control
  
  // Image optimization
  images: {
    domains: ['localhost', 'your-api.azurewebsites.net'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY || 'default-value',
  },
  
  // Webpack optimization
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
