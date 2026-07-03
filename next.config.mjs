/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // WooCommerce product slugs differ from our internal slugs — redirect to canonical
      { source: "/products/trz",              destination: "/products/t1rz", permanent: true },
      { source: "/products/rta",              destination: "/products/r3ta", permanent: true },
      // Catch any auto-slugified variants that might appear from old links
      { source: "/products/dual-receptor-t",  destination: "/products/t1rz", permanent: true },
      { source: "/products/triple-agonist-r", destination: "/products/r3ta", permanent: true },
    ];
  },
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
