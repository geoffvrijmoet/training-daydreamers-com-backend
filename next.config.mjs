/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
  // Note: File uploads go directly to S3 via presigned URLs, bypassing Next.js body size limits
  // S3 supports files up to 5TB per object, but practical limits depend on:
  // - Browser upload capabilities (typically 2-4GB max)
  // - Network timeout settings
  // - S3 bucket configuration
};

export default nextConfig;
