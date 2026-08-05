// Generic, self-drawn payment-network glyphs — not reproductions of official
// trademarked artwork/wordmarks. There are no licensed brand-logo assets in
// this repo; these are simplified indicative marks (muted, site-palette
// colors) so customers can recognize accepted card networks without hotlinking
// or fabricating official logos. Swap for real licensed assets if/when provided.

function LogoChip({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center h-5 px-1.5 rounded border border-white/15 bg-white/5 font-mono text-[9px] font-700 tracking-wide text-white/60 ${className}`}
    >
      {children}
    </span>
  );
}

function VisaLogo() {
  return <LogoChip className="italic text-blue-300/80">VISA</LogoChip>;
}

function MastercardLogo() {
  return (
    <span className="inline-flex items-center h-5 w-8" aria-label="Mastercard">
      <svg viewBox="0 0 32 20" className="h-5 w-8">
        <circle cx="13" cy="10" r="7" fill="#EB5C3A" opacity="0.55" />
        <circle cx="19" cy="10" r="7" fill="#F0A93E" opacity="0.55" />
      </svg>
    </span>
  );
}

function AmexLogo() {
  return <LogoChip className="text-sky-300/80">AMEX</LogoChip>;
}

function DiscoverLogo() {
  return <LogoChip className="text-orange-300/70">DISC</LogoChip>;
}

function ApplePayLogo() {
  return (
    <span className="inline-flex items-center gap-1 h-5 px-1.5 rounded border border-white/15 bg-white/5">
      <svg viewBox="0 0 14 16" className="w-3 h-3.5 fill-white/60">
        <path d="M9.6 2.6c.5-.6.9-1.5.8-2.4-.8 0-1.7.5-2.3 1.2-.5.6-.9 1.5-.8 2.3.9.1 1.8-.4 2.3-1.1zM11.8 5.7c-1.3-.1-2.4.7-3 .7-.6 0-1.5-.7-2.5-.7-1.3 0-2.5.7-3.1 1.9C1.9 9.9 2.8 13 4 14.7c.6.9 1.3 1.8 2.3 1.8 1 0 1.3-.6 2.5-.6s1.5.6 2.5.6c1 0 1.7-.9 2.3-1.8.7-1 1-2 1-2-.1 0-1.9-.7-1.9-2.8 0-1.8 1.4-2.6 1.5-2.7-.8-1.2-2.1-1.3-2.4-1.5z" />
      </svg>
      <span className="font-mono text-[9px] font-700 tracking-wide text-white/60">Pay</span>
    </span>
  );
}

export function CardNetworkLogos({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <VisaLogo />
      <MastercardLogo />
      <AmexLogo />
      <DiscoverLogo />
      <ApplePayLogo />
    </div>
  );
}
