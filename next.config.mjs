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
    '/api/kra/retrieve': [
      './eng.traineddata',
      './node_modules/tesseract.js/**/*',
      './node_modules/tesseract.js-core/**/*',
      './node_modules/node-fetch/**/*',
      './node_modules/whatwg-url/**/*',
      './node_modules/tr46/**/*',
      './node_modules/webidl-conversions/**/*',
      './node_modules/wasm-feature-detect/**/*',
    ],
    '/api/kra/confirm-date': [
      './eng.traineddata',
      './node_modules/tesseract.js/**/*',
      './node_modules/tesseract.js-core/**/*',
      './node_modules/node-fetch/**/*',
      './node_modules/whatwg-url/**/*',
      './node_modules/tr46/**/*',
      './node_modules/webidl-conversions/**/*',
      './node_modules/wasm-feature-detect/**/*',
    ],
    '/api/admin/users': [
      './eng.traineddata',
      './node_modules/tesseract.js/**/*',
      './node_modules/tesseract.js-core/**/*',
      './node_modules/node-fetch/**/*',
      './node_modules/whatwg-url/**/*',
      './node_modules/tr46/**/*',
      './node_modules/webidl-conversions/**/*',
      './node_modules/wasm-feature-detect/**/*',
    ],
    '/api/company/terminate-obligation': [
      './eng.traineddata',
      './node_modules/tesseract.js/**/*',
      './node_modules/tesseract.js-core/**/*',
      './node_modules/node-fetch/**/*',
      './node_modules/whatwg-url/**/*',
      './node_modules/tr46/**/*',
      './node_modules/webidl-conversions/**/*',
      './node_modules/wasm-feature-detect/**/*',
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
