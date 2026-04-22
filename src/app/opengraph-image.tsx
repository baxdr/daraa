import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'درع — مستشار التأسيس والامتثال السعودي';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };

/**
 * Dynamic OG image — generated at edge, no assets to host. Matches the
 * "Modernist Arabic Editorial" palette: cream paper, deep-ink headline,
 * pine-green accent rule.
 */
export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px 96px',
          background: '#F7F3EB',
          color: '#14110F',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <svg width="56" height="56" viewBox="0 0 34 34">
            <path
              d="M17 3 L29 9 L29 19 Q29 27 17 31 Q5 27 5 19 L5 9 Z"
              fill="none"
              stroke="#1E4D3B"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M11 17 L15 21 L23 13"
              fill="none"
              stroke="#1E4D3B"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: '0.18em',
              color: '#635A4E',
            }}
          >
            DARAA · درع
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: '0.18em',
                color: '#1E4D3B',
              }}
            >
              عدد ٠١
            </span>
            <span style={{ width: 48, height: 2, background: '#1E4D3B' }} />
          </div>
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              direction: 'rtl',
            }}
          >
            من أول فكرة
            <br />
            لآخر تجديد.
          </div>
          <div
            style={{
              fontSize: 32,
              color: '#3A342E',
              marginTop: 18,
              maxWidth: 900,
              direction: 'rtl',
            }}
          >
            مستشار ذكاء اصطناعي للتأسيس والامتثال في السعودية.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 24,
            borderTop: '1px solid #D9D1C3',
            fontSize: 18,
            color: '#635A4E',
          }}
        >
          <span>PDPL · NCA ECC · ZATCA · Balady · SFDA · MOHR · GOSI</span>
          <span style={{ fontWeight: 700, color: '#14110F' }}>daraa.sa</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
