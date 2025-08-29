/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'cdn.cosmicjs.com',
      'imgix.cosmicjs.com'
    ]
  },
  // Disable typedRoutes to prevent deployment errors
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  }
}

module.exports = nextConfig