import { Suspense } from "react";
import PayPageClient from "./PayPageClient";

export default function PayPage({ params }: { params: { method: string } }) {
  return (
    <Suspense fallback={null}>
      <PayPageClient method={params.method} />
    </Suspense>
  );
}
