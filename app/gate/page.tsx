import { Suspense } from "react";
import GateClient from "./GateClient";

export const metadata = {
  title: "Verification Required — Anvil Compounds",
  robots: { index: false, follow: false },
};

export default function GatePage() {
  return (
    <Suspense fallback={null}>
      <GateClient />
    </Suspense>
  );
}
