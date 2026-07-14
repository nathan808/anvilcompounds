import { Suspense } from "react";
import ConfirmationPageClient from "./ConfirmationPageClient";

export default function ConfirmationPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmationPageClient />
    </Suspense>
  );
}
