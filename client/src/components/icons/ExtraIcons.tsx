import type { ReactNode } from "react";

// Line icons for the boat extras that lucide has no faithful glyph for. Same grid
// and stroke rules as lucide (24px, 2px round), so they sit beside lucide icons.
function LineIcon({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Diving mask with its snorkel tube. */
export function SnorkelIcon({ className }: { className?: string }) {
  return (
    <LineIcon className={className}>
      <path d="M2.5 10a2.5 2.5 0 0 1 2.5-2.5h9a2.5 2.5 0 0 1 2.5 2.5v2.5a4.5 4.5 0 0 1-4.5 4.5h-.8l-.7-1.6h-1l-.7 1.6H7a4.5 4.5 0 0 1-4.5-4.5Z" />
      <path d="M9.5 8v4.5" />
      <path d="M16.5 10H19V4.5a1.5 1.5 0 0 1 3 0" />
    </LineIcon>
  );
}

/** Stand-up paddle board with its paddle beside it. */
export function PaddleBoardIcon({ className }: { className?: string }) {
  return (
    <LineIcon className={className}>
      <path d="M9 2c2.4 2.5 3.8 6.3 3.8 10.5 0 4.2-1.4 7.8-3.8 9.5-2.4-1.7-3.8-5.3-3.8-9.5C5.2 8.3 6.6 4.5 9 2Z" />
      <path d="M9 6.5v11" />
      <path d="M19 3v12" />
      <path d="M17.5 3h3" />
      <rect x="17" y="15" width="4" height="6" rx="1.5" />
    </LineIcon>
  );
}

/** Cooler box: lid, handle and body. */
export function CoolerIcon({ className }: { className?: string }) {
  return (
    <LineIcon className={className}>
      <rect x="2.5" y="7" width="19" height="4" rx="1" />
      <path d="M4 11v8a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-8" />
      <path d="M8.5 7V5a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 15.5 5v2" />
      <path d="M12 14.5v3" />
    </LineIcon>
  );
}
