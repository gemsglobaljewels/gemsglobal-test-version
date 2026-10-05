import React from 'react';

/**
 * Minimal, thin-stroke iconography — deliberately not lucide/heroicons defaults.
 * Stroke uses `currentColor` so all colour comes from the button (design tokens).
 */

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.25,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
};

export function ChevronLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M14.5 5.5 8 12l6.5 6.5" />
    </svg>
  );
}

export function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M9.5 5.5 16 12l-6.5 6.5" />
    </svg>
  );
}

export function PauseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M9.5 5v14M14.5 5v14" />
    </svg>
  );
}

export function PlayIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} fill="currentColor" stroke="none">
      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
    </svg>
  );
}
