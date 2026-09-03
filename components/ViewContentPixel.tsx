"use client";

import { useEffect } from "react";
import { trackMetaEvent } from "@/lib/metaPixel";

// Fires Meta's ViewContent once per product-page mount. Rendered from the
// server-rendered ProductPageTemplate so the page itself stays a server
// component — this is the only client-only sliver it needs.
export default function ViewContentPixel({
  wcProductId,
  name,
  price,
}: {
  wcProductId: number;
  name: string;
  price: number;
}) {
  useEffect(() => {
    trackMetaEvent("ViewContent", {
      content_ids: [String(wcProductId)],
      content_type: "product",
      content_name: name,
      value: price,
      currency: "USD",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wcProductId]);

  return null;
}
