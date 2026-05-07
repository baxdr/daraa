import type { Config } from 'tailwindcss';

/**
 * Design system — "Modernist Arabic Editorial"
 *
 * Warm cream paper, deep pine-green accent (nods to the Saudi flag without
 * literal reference), burnt terracotta for cautions, and near-black ink for
 * body. Display type uses Almarai at 800 weight for gravitas; body stays on
 * IBM Plex Sans Arabic for legibility.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Body: IBM Plex Sans Arabic (already loaded via next/font).
        sans: ['var(--font-ibm-plex-arabic)', 'system-ui', 'sans-serif'],
        // Display: Almarai 700/800. Used for headlines, score numbers, big stats.
        display: ['var(--font-almarai)', 'var(--font-ibm-plex-arabic)', 'system-ui', 'sans-serif'],
        // Monospaced: tabular numerals in data-heavy contexts.
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        paper: '#F7F3EB', // warm cream — primary background
        'paper-2': '#EFE9DB', // subtle tinted surface (cards on hero)
        'paper-3': '#E6DFCE', // deeper tinted surface
        ink: '#14110F', // near-black — body text
        'ink-2': '#3A342E', // secondary text
        // Muted darkened from #8C857A → #635A4E so small-text contrast on paper
        // passes WCAG AA (~5.4:1). Original was ~3.0:1, failing AA for body copy.
        muted: '#635A4E', // de-emphasized labels
        rule: '#D9D1C3', // divider lines

        // Single sharp accent — deep pine green.
        accent: {
          DEFAULT: '#1E4D3B',
          soft: '#E8EDE8',
          strong: '#143428',
        },

        // Warning tones — burnt terracotta.
        warn: {
          DEFAULT: '#B8571E',
          soft: '#F6E9DE',
          // Darker variant for text-on-warn-soft contexts — passes WCAG AA.
          strong: '#8C3F15',
        },

        // State colors in the warm palette.
        danger: '#9B2C2C',
        success: '#166534',
      },
      letterSpacing: {
        tight: '-0.015em',
        tighter: '-0.025em',
      },
      borderRadius: {
        // Sharper by default than Tailwind's generic rounded-2xl everywhere.
        DEFAULT: '2px',
        sm: '2px',
        md: '4px',
        lg: '6px',
      },
      boxShadow: {
        // No soft cloud shadows. One crisp shadow for rare elevation moments.
        card: '0 1px 0 0 #D9D1C3, 0 0 0 1px rgba(20,17,15,0.04)',
        lift: '0 6px 0 -4px #D9D1C3, 0 0 0 1px rgba(20,17,15,0.06)',
      },
      animation: {
        'fade-rise': 'fadeRise 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        'slide-in-rtl': 'slideInRtl 0.45s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        'rule-draw': 'ruleDraw 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        'pulse-subtle': 'pulseSubtle 2.4s ease-in-out infinite',
      },
      keyframes: {
        fadeRise: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRtl: {
          '0%': { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        ruleDraw: {
          '0%': { transform: 'scaleX(0)', transformOrigin: 'right' },
          '100%': { transform: 'scaleX(1)', transformOrigin: 'right' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
