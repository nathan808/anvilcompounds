// Small line-icon set for specification tables and the institutional
// homepage sections. Stroke-only, currentColor, 24px grid — sized by the
// caller via className (default w-4 h-4).

export type SciIconName =
  | "flask"
  | "chromatogram"
  | "molecule"
  | "spectrum"
  | "droplet"
  | "document"
  | "shield"
  | "thermometer"
  | "clock"
  | "scale"
  | "hash"
  | "chain"
  | "tag"
  | "box"
  | "truck"
  | "mail"
  | "phone"
  | "pin"
  | "eye";

const PATHS: Record<SciIconName, string[]> = {
  flask: ["M9 3h6", "M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3", "M7.5 15h9"],
  chromatogram: ["M3 20h18", "M3 20V4", "M3 17c2 0 2.5-1 3.5-6S8 4 9 4s1.5 3 2.5 8 1.5 5 3 5 2-6 3-6 1.5 4 3.5 6"],
  molecule: ["M12 8.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", "M6 19.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", "M18 19.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", "M11 8.2 7 15.8", "M13 8.2l4 7.6", "M8 17.5h8"],
  spectrum: ["M3 20h18", "M5 20v-4", "M8 20V9", "M11 20v-6", "M14 20V5", "M17 20v-9", "M20 20v-3"],
  droplet: ["M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"],
  document: ["M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z", "M14 3v5h5", "M9 13h6", "M9 17h6"],
  shield: ["M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z", "M9 12l2 2 4-4"],
  thermometer: ["M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z", "M12 9v7"],
  clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 7v5l3 2"],
  scale: ["M12 4v16", "M7 20h10", "M5 8h14", "M5 8l-3 6a3 3 0 0 0 6 0z", "M19 8l-3 6a3 3 0 0 0 6 0z"],
  hash: ["M5 9h14", "M5 15h14", "M10 4L8 20", "M16 4l-2 16"],
  chain: ["M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1", "M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"],
  tag: ["M3 12V4h8l10 10-8 8z", "M7.5 8.5h.01"],
  box: ["M21 8l-9-5-9 5v8l9 5 9-5z", "M3 8l9 5 9-5", "M12 13v8"],
  truck: ["M3 6h11v10H3z", "M14 10h4l3 3v3h-7", "M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", "M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"],
  mail: ["M4 6h16v12H4z", "M4 7l8 6 8-6"],
  phone: ["M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"],
  pin: ["M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z", "M12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"],
  eye: ["M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"],
};

export default function SciIcon({ name, className = "w-4 h-4" }: { name: SciIconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

// Best-fit icon for a specification-table row label.
export function iconForSpecLabel(label: string): SciIconName {
  const l = label.toLowerCase();
  if (l.includes("catalog")) return "tag";
  if (l.includes("cas")) return "hash";
  if (l.includes("formula")) return "molecule";
  if (l.includes("weight") || l.endsWith(" mw") || l === "mw") return "scale";
  if (l.includes("purity")) return "chromatogram";
  if (l.includes("sequence")) return "chain";
  if (l.includes("appearance")) return "eye";
  if (l.includes("storage")) return "thermometer";
  if (l.includes("shelf")) return "clock";
  if (l.includes("lot")) return "tag";
  if (l.includes("certificate") || l.includes("coa")) return "document";
  if (l.includes("safety") || l.includes("sds") || l.includes("terms")) return "shield";
  if (l.includes("composition") || l.includes("blend") || l.includes("content")) return "flask";
  if (l.includes("volume") || l.includes("reconstitution")) return "droplet";
  if (l.includes("vial") || l.includes("format")) return "box";
  return "spectrum";
}
