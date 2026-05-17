/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
    ],
  },
  outputFileTracingIncludes: {
    '/api/**/*': ['./eng.traineddata'],
  },
  async redirects() {
    return [
      {
        source: '/services/kra-retrieval',
        destination: '/',
        permanent: true,
      },
    ]
  },
}

export default nextConfig;
