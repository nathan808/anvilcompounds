/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "anvilcompounds.shop",
      },
      {
        protocol: "https",
        hostname: "paleturquoise-crane-581984.hostingersite.com",
      },
    ],
  },
};

export default nextConfig;
