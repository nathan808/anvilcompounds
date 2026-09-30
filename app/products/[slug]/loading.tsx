import Navbar from "@/components/Navbar";

// Shown instantly on navigation while the product page's server data
// resolves — without this, a click to an uncached product page looked
// frozen until WooCommerce answered (~1s). Also lets <Link> prefetch this
// shell ahead of the click.
export default function ProductLoading() {
  return (
    <>
      <Navbar />
      <main className="bg-mock-page min-h-screen pt-16">
        <div className="max-w-5xl mx-auto px-6 py-10 grid md:grid-cols-2 gap-8 animate-pulse">
          <div className="w-full aspect-square bg-mock-surface2 rounded-2xl" />
          <div className="space-y-4">
            <div className="w-2/3 h-8 bg-mock-surface2 rounded" />
            <div className="w-1/3 h-4 bg-mock-surface2 rounded" />
            <div className="w-1/2 h-10 bg-mock-surface2 rounded mt-6" />
            <div className="w-full h-12 bg-mock-surface2 rounded-lg mt-6" />
            <div className="w-full h-24 bg-mock-surface2 rounded-lg" />
          </div>
        </div>
      </main>
    </>
  );
}
