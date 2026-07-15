/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // WooCommerce product slugs differ from our internal slugs — redirect to canonical
      { source: "/products/trz",              destination: "/products/glp-trz", permanent: true },
      { source: "/products/rta",              destination: "/products/glp-rt", permanent: true },
      // Catch any auto-slugified variants that might appear from old links
      { source: "/products/dual-receptor-t",  destination: "/products/glp-trz", permanent: true },
      { source: "/products/triple-agonist-r", destination: "/products/glp-rt", permanent: true },
      // t1rz/r3ta were the canonical slugs before the GLP-TRZ/GLP-RT rename —
      // redirect old links/bookmarks straight to the new canonical slugs.
      { source: "/products/t1rz",             destination: "/products/glp-trz", permanent: true },
      { source: "/products/r3ta",             destination: "/products/glp-rt", permanent: true },
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
