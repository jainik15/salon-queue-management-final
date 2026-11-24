import React from 'react'

interface QRCodeProps {
  value: string
  size?: number
}

// High-contrast QR pattern on a light quiet zone for reliable scanning.
export const LoungeQRCode: React.FC<QRCodeProps> = ({ value, size = 180 }) => {
  const gridCount = 21
  const cellSize = size / gridCount

  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }

  const cells: boolean[][] = []
  for (let r = 0; r < gridCount; r++) {
    cells[r] = []
    for (let c = 0; c < gridCount; c++) {
      const inTopLeft = r < 7 && c < 7
      const inTopRight = r < 7 && c >= gridCount - 7
      const inBottomLeft = r >= gridCount - 7 && c < 7
      const inCenter = r >= 8 && r <= 12 && c >= 8 && c <= 12

      if (inTopLeft || inTopRight || inBottomLeft) {
        const localR = inTopLeft ? r : inTopRight ? r : r - (gridCount - 7)
        const localC = inTopLeft ? c : inTopRight ? c - (gridCount - 7) : c
        const isBorder = localR === 0 || localR === 6 || localC === 0 || localC === 6
        const isInner = localR >= 2 && localR <= 4 && localC >= 2 && localC <= 4
        cells[r][c] = isBorder || isInner
      } else if (inCenter) {
        cells[r][c] = false
      } else {
        const bit = Math.abs(Math.sin((r * 31 + c * 17 + hash) * 0.15)) > 0.48
        cells[r][c] = bit
      }
    }
  }

  return (
    <div
      className="lc-qr p-3.5 rounded-2xl flex items-center justify-center relative shadow-lg bg-white border border-blue-100"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {cells.map((row, r) =>
          row.map((active, c) =>
            active ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize + 0.5}
                y={r * cellSize + 0.5}
                width={cellSize - 1}
                height={cellSize - 1}
                rx={cellSize * 0.25}
                fill="#171612"
              />
            ) : null
          )
        )}
        <defs>
          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#171612" />
            <stop offset="100%" stopColor="#171612" />
          </linearGradient>
        </defs>

        {/* Center Monogram Badge in crisp blue & white */}
        <circle cx={size / 2} cy={size / 2} r={cellSize * 2.3} fill="#FFFFFF" stroke="#a88b58" strokeWidth="2" />
        <text
          x={size / 2}
          y={size / 2 + cellSize * 0.55}
          textAnchor="middle"
          fill="#171612"
          fontSize={cellSize * 1.9}
          fontFamily="Playfair Display, serif"
          fontWeight="900"
        >
          LX
        </text>
      </svg>
    </div>
  )
}
