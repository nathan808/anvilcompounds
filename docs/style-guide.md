# Style Guide

## Design System

| Token | Value |
|---|---|
| `navy-950` (darkest bg) | `#04091A` |
| `navy-900` (section bg) | `#0A1628` |
| `navy-800` (card bg) | `#0D1F3C` |
| `blue-600` (primary accent) | `#1D6ADB` |
| `blue-400` (light accent) | `#4D94F0` |
| `ice` (light section bg) | `#EEF4FF` |
| `font-display` | Syne |
| `font-body` | DM Sans |
| `font-mono` | DM Mono |

Fonts are loaded via `next/font/google` in `app/layout.tsx`. Most custom CSS/utility classes (glassmorphism cards, mesh backgrounds, etc.) live in `app/globals.css` rather than Tailwind config.
