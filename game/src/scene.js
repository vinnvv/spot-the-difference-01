// Draws both workshop scenes as flat-shaded SVG, one function per layer.
// Variant 'A' is the left panel, 'B' the right panel. The eight differences
// are the only places the two variants disagree; everything else is shared
// so the panels read as two near-identical realities.

const INDIGO = '#141B2D';
const SLATE = '#283B5B';
const WALL = '#1E2A44';
const MAHOGANY = '#4A2C2A';
const MAHOGANY_DARK = '#38201F';
const AMBER = '#F4A236';
const BRASS = '#C98A2E';
const BRASS_LIGHT = '#E0AA4E';
const CREAM = '#F6EBD8';
const CORAL = '#D95D48';
const TEAL = '#2E7D7B';
const GINGER = '#C96A3F';
const SAGE = '#6E8B67';

function gear(cx, cy, r, fill, teeth = 8) {
  let parts = '';
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const x1 = cx + Math.cos(a) * r * 0.82;
    const y1 = cy + Math.sin(a) * r * 0.82;
    const x2 = cx + Math.cos(a) * r * 1.18;
    const y2 = cy + Math.sin(a) * r * 1.18;
    parts += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${fill}" stroke-width="${(r * 0.42).toFixed(1)}"/>`;
  }
  return `${parts}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/><circle cx="${cx}" cy="${cy}" r="${r * 0.38}" fill="${INDIGO}"/>`;
}

function stars() {
  const pts = [
    [252, 52], [268, 92], [292, 44], [308, 120], [352, 48], [372, 96],
    [392, 56], [404, 132], [244, 130], [286, 168], [356, 168], [398, 180],
    [240, 180], [330, 132], [378, 140],
  ];
  return pts.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 4 === 0 ? 1.8 : 1.2}" fill="${CREAM}" opacity="${i % 3 === 0 ? 0.9 : 0.55}"/>`).join('');
}

function skyline() {
  // Distant canal-city rooftops, flat silhouettes with a few lit windows.
  const blocks = [
    [232, 196, 26, 58], [260, 178, 30, 76], [292, 206, 22, 48],
    [316, 188, 34, 66], [352, 200, 24, 54], [378, 182, 30, 72],
    [406, 208, 14, 46],
  ];
  let s = '';
  for (const [x, y, w, h] of blocks) {
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#1A2440"/>`;
  }
  const lit = [[244, 210], [268, 196], [300, 216], [330, 202], [362, 214], [388, 196], [274, 222], [342, 226]];
  for (const [x, y] of lit) s += `<rect x="${x}" y="${y}" width="4" height="5" fill="${AMBER}" opacity="0.85"/>`;
  // Canal band with a moonlight streak.
  s += `<rect x="225" y="232" width="190" height="23" fill="#22304F"/>`;
  s += `<rect x="300" y="238" width="70" height="3" fill="${CREAM}" opacity="0.35"/>`;
  s += `<rect x="318" y="246" width="36" height="2" fill="${CREAM}" opacity="0.25"/>`;
  return s;
}

function moon(variant) {
  if (variant === 'A') {
    // Crisp crescent: a cream disc with a sky-coloured bite taken out.
    return `<circle cx="330" cy="74" r="17" fill="${CREAM}"/><circle cx="338" cy="68" r="15" fill="#2A3A5E"/>`;
  }
  return `<circle cx="330" cy="74" r="17" fill="${CREAM}"/><circle cx="325" cy="70" r="3" fill="#D8C9A8"/><circle cx="336" cy="80" r="2.2" fill="#D8C9A8"/><circle cx="334" cy="66" r="1.6" fill="#D8C9A8"/>`;
}

function windowLayer(variant, p) {
  return `
  <path d="M225,255 L225,115 A95,95 0 0 1 415,115 L415,255 Z" fill="url(#sky-${p})"/>
  ${stars()}
  ${moon(variant)}
  ${skyline()}
  <path d="M225,255 L225,115 A95,95 0 0 1 415,115 L415,255 Z" fill="none" stroke="${MAHOGANY}" stroke-width="10"/>
  <line x1="320" y1="22" x2="320" y2="255" stroke="${MAHOGANY}" stroke-width="6"/>
  <line x1="225" y1="152" x2="415" y2="152" stroke="${MAHOGANY}" stroke-width="6"/>
  <rect x="208" y="252" width="224" height="14" rx="3" fill="${MAHOGANY}"/>
  <rect x="208" y="252" width="224" height="4" rx="2" fill="${BRASS_LIGHT}" opacity="0.5"/>`;
}

function lamp(p) {
  return `
  <ellipse cx="320" cy="120" rx="150" ry="110" fill="url(#lamp-${p})"/>
  <line x1="320" y1="0" x2="320" y2="34" stroke="${BRASS}" stroke-width="3"/>
  <path d="M286,34 L354,34 L340,64 L300,64 Z" fill="${BRASS}"/>
  <ellipse cx="320" cy="64" rx="20" ry="5" fill="${AMBER}"/>
  <polygon points="300,64 340,64 430,320 210,320" fill="${AMBER}" opacity="0.05"/>`;
}

function cuckooClock(variant) {
  const tilt = variant === 'A' ? -14 : 14;
  return `
  <g>
    <polygon points="52,52 104,22 156,52" fill="${MAHOGANY_DARK}"/>
    <rect x="58" y="50" width="92" height="104" rx="6" fill="${MAHOGANY}"/>
    <rect x="58" y="50" width="92" height="104" rx="6" fill="none" stroke="${BRASS}" stroke-width="2" opacity="0.6"/>
    <circle cx="104" cy="92" r="31" fill="${CREAM}"/>
    <circle cx="104" cy="92" r="31" fill="none" stroke="${BRASS}" stroke-width="3"/>
    ${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => {
      const r = (a * Math.PI) / 180;
      const x1 = 104 + Math.sin(r) * 26;
      const y1 = 92 - Math.cos(r) * 26;
      const x2 = 104 + Math.sin(r) * 29;
      const y2 = 92 - Math.cos(r) * 29;
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${SLATE}" stroke-width="2"/>`;
    }).join('')}
    <line x1="104" y1="92" x2="88" y2="76" stroke="${INDIGO}" stroke-width="3" stroke-linecap="round"/>
    <line x1="104" y1="92" x2="120" y2="80" stroke="${INDIGO}" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="104" cy="92" r="3" fill="${CORAL}"/>
    <g transform="rotate(${tilt} 104 122)">
      <line x1="104" y1="122" x2="104" y2="152" stroke="${BRASS}" stroke-width="3"/>
      <circle cx="104" cy="158" r="10" fill="${BRASS}"/>
      <circle cx="104" cy="158" r="5" fill="${BRASS_LIGHT}"/>
    </g>
    <rect x="74" y="154" width="10" height="26" rx="4" fill="${BRASS}" opacity="0.85"/>
    <rect x="120" y="154" width="10" height="26" rx="4" fill="${BRASS}" opacity="0.85"/>
  </g>`;
}

function blueprint() {
  return `
  <g>
    <rect x="168" y="66" width="48" height="58" rx="3" fill="${CREAM}"/>
    <rect x="168" y="66" width="48" height="58" rx="3" fill="none" stroke="${BRASS}" stroke-width="2"/>
    <circle cx="192" cy="95" r="13" fill="none" stroke="${SLATE}" stroke-width="2"/>
    <circle cx="192" cy="95" r="4" fill="none" stroke="${SLATE}" stroke-width="1.5"/>
    <line x1="176" y1="116" x2="208" y2="116" stroke="${SLATE}" stroke-width="2"/>
    <line x1="180" y1="74" x2="204" y2="74" stroke="${SLATE}" stroke-width="1.5"/>
  </g>`;
}

function pegboard(variant) {
  let holes = '';
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 7; c++) {
      holes += `<circle cx="${48 + c * 22}" cy="${208 + r * 22}" r="2.4" fill="#241512" opacity="0.9"/>`;
    }
  }
  const tool = variant === 'A'
    ? `<g transform="rotate(28 112 248)">
         <rect x="108" y="232" width="8" height="34" rx="3" fill="${BRASS}"/>
         <path d="M104,232 a12,12 0 1 1 16,0 l-4,4 -4,-6 -4,6 Z" fill="${BRASS}"/>
       </g>`
    : `<g>
         <circle cx="112" cy="240" r="15" fill="none" stroke="${BRASS}" stroke-width="4"/>
         <circle cx="112" cy="240" r="15" fill="#BFE3E0" opacity="0.25"/>
         <line x1="112" y1="240" x2="126" y2="252" stroke="#BFE3E0" stroke-width="2" opacity="0.5"/>
         <rect x="122" y="250" width="5" height="18" rx="2" fill="${MAHOGANY_DARK}" transform="rotate(-38 124 258)"/>
       </g>`;
  return `
  <g>
    <rect x="36" y="196" width="160" height="104" rx="6" fill="#3E2622"/>
    <rect x="36" y="196" width="160" height="104" rx="6" fill="none" stroke="${BRASS}" stroke-width="2" opacity="0.5"/>
    ${holes}
    <g transform="rotate(18 66 250)">
      <rect x="63" y="228" width="6" height="40" rx="3" fill="#6B4A2F"/>
      <rect x="56" y="222" width="20" height="12" rx="2" fill="${SLATE}"/>
    </g>
    ${tool}
    <g transform="rotate(-12 158 262)">
      <rect x="152" y="238" width="6" height="44" rx="3" fill="${BRASS}"/>
      <rect x="146" y="232" width="18" height="10" rx="2" fill="${BRASS_LIGHT}"/>
    </g>
  </g>`;
}

function bookshelf(variant) {
  const books = [
    [458, 62, 10, 42, '#7A3B34'], [469, 56, 9, 48, '#2E5A4E'], [479, 66, 11, 38, '#8A6D3B'],
    [491, 58, 9, 46, '#5B3A5E'], [501, 64, 10, 40, '#3E5A7A'],
  ].map(([x, y, w, h, c]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/><rect x="${x}" y="${y + 6}" width="${w}" height="2" fill="${CREAM}" opacity="0.5"/>`).join('');
  const vessel = variant === 'A'
    ? `<g>
         <rect x="544" y="58" width="26" height="46" rx="8" fill="${TEAL}"/>
         <rect x="552" y="46" width="10" height="14" fill="${TEAL}"/>
         <rect x="550" y="42" width="14" height="6" rx="2" fill="#8A6D3B"/>
         <rect x="548" y="66" width="4" height="30" fill="#FFFFFF" opacity="0.25"/>
       </g>`
    : `<g>
         <rect x="542" y="46" width="30" height="5" rx="2" fill="${BRASS}"/>
         <rect x="542" y="99" width="30" height="5" rx="2" fill="${BRASS}"/>
         <path d="M546,51 L568,51 L561,75 L553,75 Z" fill="#D8C9A8" opacity="0.9"/>
         <path d="M546,99 L568,99 L561,75 L553,75 Z" fill="#D8C9A8" opacity="0.9"/>
         <polygon points="548,53 566,53 557,72" fill="${AMBER}"/>
         <polygon points="557,78 566,97 548,97" fill="${AMBER}" opacity="0.85"/>
       </g>`;
  const ledgers = [
    [458, 132, 12, 42, '#4E2A3A'], [471, 138, 10, 36, '#2E4A5A'], [482, 130, 11, 44, '#6B4A2F'],
    [494, 136, 10, 38, '#3A5A3A'],
  ].map(([x, y, w, h, c]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`).join('');
  return `
  <g>
    <rect x="450" y="40" width="164" height="176" rx="6" fill="${MAHOGANY_DARK}"/>
    <rect x="450" y="40" width="164" height="176" rx="6" fill="none" stroke="${BRASS}" stroke-width="2" opacity="0.5"/>
    ${books}
    ${vessel}
    <rect x="456" y="106" width="152" height="8" fill="${MAHOGANY}"/>
    ${ledgers}
    ${gear(556, 152, 15, BRASS, 8)}
    <rect x="520" y="158" width="34" height="8" rx="2" fill="#7A3B34"/>
    <rect x="524" y="150" width="28" height="8" rx="2" fill="#2E5A4E"/>
    <rect x="456" y="176" width="152" height="8" fill="${MAHOGANY}"/>
    <rect x="470" y="190" width="60" height="10" rx="2" fill="#8A6D3B"/>
    <rect x="540" y="192" width="40" height="8" rx="2" fill="#5B3A5E"/>
  </g>`;
}

function fern(variant) {
  const leaves = [
    'M496,232 C488,214 478,206 470,196',
    'M496,232 C496,210 494,198 492,188',
    'M498,232 C506,212 516,202 526,192',
    'M496,232 C484,220 476,214 468,210',
    'M498,232 C510,220 520,212 528,206',
  ].map((d) => `<path d="${d}" fill="none" stroke="${SAGE}" stroke-width="4" stroke-linecap="round"/>`).join('');
  const blossoms = variant === 'A'
    ? `<circle cx="470" cy="196" r="6" fill="${CORAL}"/><circle cx="470" cy="196" r="2" fill="${AMBER}"/>
       <circle cx="526" cy="192" r="6" fill="${CORAL}"/><circle cx="526" cy="192" r="2" fill="${AMBER}"/>`
    : '';
  return `
  <g>
    ${leaves}
    ${blossoms}
    <path d="M472,232 L522,232 L516,254 L478,254 Z" fill="${CORAL}"/>
    <rect x="470" y="230" width="54" height="6" rx="2" fill="#B04A3A"/>
  </g>`;
}

function deskClock(variant) {
  // A: 10:10, B: 3:45.
  const hands = variant === 'A'
    ? `<line x1="320" y1="350" x2="305" y2="335" stroke="${INDIGO}" stroke-width="3.5" stroke-linecap="round"/>
       <line x1="320" y1="350" x2="334" y2="335" stroke="${INDIGO}" stroke-width="2.5" stroke-linecap="round"/>`
    : `<line x1="320" y1="350" x2="334" y2="355" stroke="${INDIGO}" stroke-width="3.5" stroke-linecap="round"/>
       <line x1="320" y1="350" x2="298" y2="350" stroke="${INDIGO}" stroke-width="2.5" stroke-linecap="round"/>`;
  return `
  <g>
    <circle cx="308" cy="338" r="4" fill="${BRASS}"/>
    <circle cx="332" cy="338" r="4" fill="${BRASS}"/>
    <circle cx="320" cy="350" r="32" fill="${BRASS}"/>
    <circle cx="320" cy="350" r="26" fill="${CREAM}"/>
    ${[0, 90, 180, 270].map((a) => {
      const r = (a * Math.PI) / 180;
      return `<circle cx="${(320 + Math.sin(r) * 21).toFixed(1)}" cy="${(350 - Math.cos(r) * 21).toFixed(1)}" r="1.8" fill="${SLATE}"/>`;
    }).join('')}
    ${hands}
    <circle cx="320" cy="350" r="3" fill="${CORAL}"/>
    <rect x="304" y="380" width="8" height="6" rx="2" fill="${BRASS}"/>
    <rect x="328" y="380" width="8" height="6" rx="2" fill="${BRASS}"/>
  </g>`;
}

function catAndStool(variant) {
  const tail = variant === 'A'
    ? `<path d="M78,386 C66,372 72,356 88,352 C100,349 108,356 104,366" fill="none" stroke="${GINGER}" stroke-width="9" stroke-linecap="round"/>`
    : `<path d="M76,392 C64,404 60,420 62,434" fill="none" stroke="${GINGER}" stroke-width="9" stroke-linecap="round"/>`;
  return `
  <g>
    <rect x="66" y="408" width="8" height="34" fill="${MAHOGANY_DARK}"/>
    <rect x="138" y="408" width="8" height="34" fill="${MAHOGANY_DARK}"/>
    <rect x="58" y="400" width="96" height="10" rx="3" fill="${MAHOGANY}"/>
    <ellipse cx="106" cy="390" rx="38" ry="17" fill="${GINGER}"/>
    <ellipse cx="106" cy="396" rx="24" ry="9" fill="${CREAM}" opacity="0.85"/>
    <circle cx="140" cy="378" r="15" fill="${GINGER}"/>
    <polygon points="130,366 134,352 142,364" fill="${GINGER}"/>
    <polygon points="144,364 152,352 154,367" fill="${GINGER}"/>
    <path d="M134,378 q4,3 8,0" fill="none" stroke="${INDIGO}" stroke-width="2" stroke-linecap="round"/>
    <path d="M150,380 q3,2 5,0" fill="none" stroke="${INDIGO}" stroke-width="1.5" stroke-linecap="round"/>
    ${tail}
    <path d="M92,376 q6,-3 12,0" fill="none" stroke="#8A4A2A" stroke-width="2" opacity="0.7"/>
    <path d="M100,384 q6,-3 12,0" fill="none" stroke="#8A4A2A" stroke-width="2" opacity="0.7"/>
  </g>`;
}

function bench(variant) {
  const key = variant === 'A'
    ? `<g>
         <circle cx="484" cy="412" r="8" fill="none" stroke="${BRASS_LIGHT}" stroke-width="4"/>
         <line x1="492" y1="412" x2="516" y2="412" stroke="${BRASS_LIGHT}" stroke-width="4" stroke-linecap="round"/>
         <line x1="508" y1="412" x2="508" y2="420" stroke="${BRASS_LIGHT}" stroke-width="3"/>
         <line x1="514" y1="412" x2="514" y2="420" stroke="${BRASS_LIGHT}" stroke-width="3"/>
       </g>`
    : '';
  return `
  <g>
    <rect x="0" y="330" width="640" height="130" fill="${MAHOGANY}"/>
    <rect x="0" y="330" width="640" height="6" fill="${BRASS_LIGHT}" opacity="0.45"/>
    <line x1="200" y1="336" x2="200" y2="460" stroke="#3A211F" stroke-width="2" opacity="0.7"/>
    <line x1="440" y1="336" x2="440" y2="460" stroke="#3A211F" stroke-width="2" opacity="0.7"/>
    <rect x="238" y="404" width="64" height="10" rx="2" fill="#2E5A4E"/>
    <rect x="244" y="394" width="54" height="10" rx="2" fill="#7A3B34"/>
    ${gear(398, 420, 13, BRASS, 8)}
    ${gear(424, 402, 9, BRASS_LIGHT, 7)}
    <g>
      <rect x="212" y="388" width="10" height="30" rx="3" fill="${BRASS}"/>
      <ellipse cx="217" cy="384" rx="7" ry="10" fill="${AMBER}"/>
      <ellipse cx="217" cy="384" rx="3" ry="5" fill="${CREAM}"/>
    </g>
    ${key}
    <g>
      <ellipse cx="556" cy="428" rx="34" ry="7" fill="${BRASS}" opacity="0.6"/>
      <path d="M532,398 L580,398 L574,424 L538,424 Z" fill="${CREAM}"/>
      <path d="M580,404 q16,4 0,16 q-10,6 -14,-2" fill="none" stroke="${CREAM}" stroke-width="4"/>
      <path d="M544,388 q4,-8 0,-14 M560,388 q-4,-8 0,-14" fill="none" stroke="${CREAM}" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>
      <rect x="534" y="394" width="44" height="4" fill="${CORAL}" opacity="0.8"/>
    </g>
  </g>`;
}

// The full scene for one panel. Defs are included per panel so each SVG
// stands alone; ids are prefixed with the variant to stay unique on the page.
export function buildScene(variant) {
  const p = variant === 'A' ? 'a' : 'b';
  return `<svg viewBox="0 0 640 460" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The clockmaker's workshop, panel ${variant}">
  <defs>
    <linearGradient id="sky-${p}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#141B2D"/><stop offset="1" stop-color="#2A3A5E"/>
    </linearGradient>
    <radialGradient id="lamp-${p}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${AMBER}" stop-opacity="0.34"/>
      <stop offset="1" stop-color="${AMBER}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect x="0" y="0" width="640" height="460" fill="${WALL}"/>
  <rect x="0" y="0" width="640" height="330" fill="${WALL}"/>
  <line x1="0" y1="330" x2="640" y2="330" stroke="#16203A" stroke-width="2"/>
  ${windowLayer(variant, p)}
  ${lamp(p)}
  ${cuckooClock(variant)}
  ${blueprint()}
  ${pegboard(variant)}
  ${bookshelf(variant)}
  ${fern(variant)}
  ${bench(variant)}
  ${deskClock(variant)}
  ${catAndStool(variant)}
  <rect x="0" y="0" width="640" height="460" fill="none" stroke="#0B0F1C" stroke-width="2" opacity="0.6"/>
</svg>`;
}
