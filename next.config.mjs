/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "anvilcompounds.shop",
      },
    ],
  },
};

export default nextConfig;
