/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: '*.clerk.com',
      },
    ],
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
