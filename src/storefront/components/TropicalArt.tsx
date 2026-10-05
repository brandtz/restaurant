export function TropicalArt() {
  return (
    <svg aria-hidden="true" viewBox="0 0 600 500" width="600" height="500">
      <circle cx="390" cy="230" r="170" fill="#55b0b0" opacity=".15" />
      <circle cx="385" cy="210" r="115" fill="#f0a3ad" opacity=".8" />
      <path d="M0 440Q150 350 300 410T600 390V500H0Z" fill="#176568" />
      <path d="M0 470Q220 380 380 450T600 410V500H0Z" fill="#55b0b0" />
      <path
        d="M160 450Q220 280 245 125"
        fill="none"
        stroke="#d8ece3"
        strokeWidth="15"
      />
      {[0, 35, 70, 105, 140, 175].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 245 125)`}>
          <path d="M245 125Q130 10 45 65Q160 40 245 125Z" fill="#55b0b0" />
          <path
            d="M245 125Q140 40 70 65"
            fill="none"
            stroke="#153d3d"
            strokeWidth="2"
          />
        </g>
      ))}
      <path
        d="M480 450Q450 345 480 285"
        fill="none"
        stroke="#d8ece3"
        strokeWidth="8"
      />
      {[-50, 0, 50, 100].map((angle) => (
        <path
          key={angle}
          transform={`rotate(${angle} 480 285)`}
          d="M480 285Q415 220 360 250Q440 232 480 285Z"
          fill="#9fd1c5"
        />
      ))}
      <path
        d="M300 468Q370 436 438 460"
        fill="none"
        stroke="#f0a3ad"
        strokeWidth="4"
      />
    </svg>
  );
}
