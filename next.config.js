/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // output: 'standalone', // Only needed for Docker, not for Vercel
}

module.exports = nextConfig

