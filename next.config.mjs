// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
	output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "**" } // Allow external for Google
    ]
  }
};
export default nextConfig;
