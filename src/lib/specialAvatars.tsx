import type { ReactNode } from 'react'

/*
 * Extension .tsx et non .ts : ces définitions contiennent du JSX.
 * Base minimaliste, pensée pour être enrichie plus tard.
 */
export interface SpecialAvatar {
  id: string
  name: string
  render: (size: number) => ReactNode
}

export const SPECIAL_AVATARS: Record<string, SpecialAvatar> = {
  sniper: {
    id: 'sniper',
    name: 'Sniper',
    render: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#0E0D10" rx="50" />
        <circle cx="50" cy="50" r="30" fill="none" stroke="#FF6B2C" strokeWidth="3" />
        <line x1="50" y1="20" x2="50" y2="80" stroke="#FF6B2C" strokeWidth="2" />
        <line x1="20" y1="50" x2="80" y2="50" stroke="#FF6B2C" strokeWidth="2" />
        <circle cx="50" cy="50" r="4" fill="#FF6B2C" />
      </svg>
    ),
  },
  crown: {
    id: 'crown',
    name: 'Couronne',
    render: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#221E24" rx="50" />
        <path
          d="M25 55 L35 30 L50 45 L65 30 L75 55 L75 70 L25 70 Z"
          fill="#FFB100"
          stroke="#FF6B2C"
          strokeWidth="2"
        />
        <circle cx="35" cy="40" r="3" fill="#E63946" />
        <circle cx="50" cy="35" r="3" fill="#E63946" />
        <circle cx="65" cy="40" r="3" fill="#E63946" />
      </svg>
    ),
  },
  prophet: {
    id: 'prophet',
    name: 'Prophète',
    render: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#0E0D10" rx="50" />
        <circle cx="50" cy="50" r="20" fill="none" stroke="#9B59B6" strokeWidth="2" />
        <circle cx="50" cy="50" r="12" fill="#9B59B6" opacity="0.3" />
        <circle cx="50" cy="50" r="4" fill="#FF6B2C" />
        <path
          d="M30 30 L20 20 M70 30 L80 20 M30 70 L20 80 M70 70 L80 80"
          stroke="#9B59B6"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  bolt: {
    id: 'bolt',
    name: 'Foudre',
    render: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#0E0D10" rx="50" />
        <path
          d="M55 15 L30 55 L45 55 L40 85 L70 40 L55 40 Z"
          fill="#FFEB3B"
          stroke="#FF6B2C"
          strokeWidth="2"
        />
      </svg>
    ),
  },
  ambassador: {
    id: 'ambassador',
    name: 'Ambassadeur',
    render: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#221E24" rx="50" />
        <circle cx="35" cy="45" r="12" fill="#FF6B2C" />
        <circle cx="65" cy="45" r="12" fill="#E63946" />
        <path d="M20 75 Q35 60 50 75 Q65 60 80 75" fill="none" stroke="#FFB100" strokeWidth="3" />
      </svg>
    ),
  },
  maverick: {
    id: 'maverick',
    name: 'Outsider',
    render: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#0E0D10" rx="50" />
        <path d="M20 80 Q50 20 80 80" fill="none" stroke="#9B59B6" strokeWidth="3" />
        <circle cx="50" cy="50" r="6" fill="#FF6B2C" />
      </svg>
    ),
  },
}
