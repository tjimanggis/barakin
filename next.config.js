/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_SUPABASE_URL: process.env.NEXT_SUPABASE_URL,
    NEXT_SUPABASE_ANON_KEY: process.env.NEXT_SUPABASE_ANON_KEY,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
