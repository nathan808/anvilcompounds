/** @type {import('next').NextConfig} */
const nextConfig = {
  // AC Research Library is a WordPress plugin living on the same
  // WordPress/WooCommerce install as this store's backend, reachable
  // directly at anvilcompounds.shop -- but that apex domain force-
  // redirects everything to www.anvilcompounds.shop (this app), which
  // has no /library route, so a bare link 404s. Rather than stand up a
  // new subdomain (blocked -- Hostinger's plan doesn't support one),
  // /library/* is served by app/library/[[...path]]/route.ts, a proxy
  // route that also rewrites the HTML so deep in-page navigation stays
  // on this domain (see that file for why a plain rewrite isn't enough).
  // Only the plugin/theme/core asset paths those pages reference (CSS,
  // JS, uploaded PDFs) are simple passthrough rewrites here -- they're
  // files, not permalinks, so there's no HTML to rewrite.
  async rewrites() {
    const libraryOrigin = "https://paleturquoise-crane-581984.hostingersite.com";
    return [
      { source: "/wp-content/:path*", destination: `${libraryOrigin}/wp-content/:path*` },
      { source: "/wp-includes/:path*", destination: `${libraryOrigin}/wp-includes/:path*` },
    ];
  },
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
