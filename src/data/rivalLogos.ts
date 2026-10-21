export interface RivalClubPreset {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string; // Base64 SVG or web image
}

export const RIVAL_PRESETS: RivalClubPreset[] = [
  {
    id: 'trasandino',
    name: 'Trasandino de Los Andes',
    shortName: 'Trasandino',
    // Accurate SVG representation of Trasandino 1906 crest (Condor with soccer ball, green/white/blue)
    logoUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
      <path d="M80 8 C120 8 145 25 145 70 C145 115 110 148 80 156 C50 148 15 115 15 70 C15 25 40 8 80 8 Z" fill="%232b6e3f" stroke="%23111827" stroke-width="4"/>
      <path d="M80 14 C115 14 138 30 138 70 C138 110 106 142 80 150 C54 142 22 110 22 70 C22 30 45 14 80 14 Z" fill="%23ffffff" stroke="%232563eb" stroke-width="3"/>
      <path d="M80 18 L134 40 L134 68 C134 105 105 136 80 144 C55 136 26 105 26 68 L26 40 Z" fill="%232563eb"/>
      <path d="M80 50 C95 50 130 65 130 95 C130 120 105 138 80 144 C55 138 30 120 30 95 C30 65 65 50 80 50 Z" fill="%2315803d"/>
      <rect x="36" y="22" width="88" height="24" rx="4" fill="%23fde047" stroke="%231e293b" stroke-width="2"/>
      <text x="80" y="38" font-family="Arial, sans-serif" font-weight="900" font-size="11" fill="%230f172a" text-anchor="middle" letter-spacing="1">TRASANDINO</text>
      <text x="80" y="47" font-family="Arial, sans-serif" font-weight="bold" font-size="8" fill="%230f172a" text-anchor="middle">1906</text>
      <!-- Condor wings & ball in shield -->
      <path d="M80 65 L95 85 L125 72 L110 95 L80 90 L50 95 L35 72 L65 85 Z" fill="%23ffffff" stroke="%230f172a" stroke-width="2"/>
      <circle cx="80" cy="112" r="15" fill="%2392400e" stroke="%23ffffff" stroke-width="2"/>
      <path d="M72 105 L88 119 M88 105 L72 119 M80 97 L80 127" stroke="%23ffffff" stroke-width="1.5"/>
    </svg>`
  },
  {
    id: 'wanderers',
    name: 'Santiago Wanderers',
    shortName: 'Wanderers',
    logoUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r="72" fill="%2315803d" stroke="%23ffffff" stroke-width="6"/>
      <circle cx="80" cy="80" r="64" fill="%23166534"/>
      <text x="80" y="98" font-family="Arial, sans-serif" font-weight="900" font-size="52" fill="%23ffffff" text-anchor="middle">W</text>
      <text x="80" y="125" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="%23ffffff" text-anchor="middle" letter-spacing="2">1892</text>
    </svg>`
  },
  {
    id: 'everton',
    name: 'Everton de Viña del Mar',
    shortName: 'Everton',
    logoUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
      <path d="M80 10 L140 30 L140 90 C140 125 105 148 80 154 C55 148 20 125 20 90 L20 30 Z" fill="%231e3a8a" stroke="%23eab308" stroke-width="5"/>
      <rect x="25" y="70" width="110" height="26" fill="%23eab308"/>
      <text x="80" y="88" font-family="Arial, sans-serif" font-weight="900" font-size="14" fill="%231e3a8a" text-anchor="middle" letter-spacing="1">EVERTON</text>
    </svg>`
  },
  {
    id: 'lacalera',
    name: 'Unión La Calera',
    shortName: 'La Calera',
    logoUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r="70" fill="%23dc2626" stroke="%23ffffff" stroke-width="6"/>
      <circle cx="80" cy="80" r="58" fill="%23ffffff"/>
      <text x="80" y="75" font-family="Arial, sans-serif" font-weight="900" font-size="28" fill="%23dc2626" text-anchor="middle">ULC</text>
      <text x="80" y="105" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="%231e293b" text-anchor="middle">LA CALERA</text>
    </svg>`
  },
  {
    id: 'limache',
    name: 'Deportes Limache',
    shortName: 'Limache',
    logoUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
      <path d="M80 12 L140 40 L120 135 L80 152 L40 135 L20 40 Z" fill="%23dc2626" stroke="%230f172a" stroke-width="6"/>
      <path d="M80 18 L132 44 L114 130 L80 145 L46 130 L28 44 Z" fill="%23000000"/>
      <text x="80" y="85" font-family="Arial, sans-serif" font-weight="900" font-size="24" fill="%23ffffff" text-anchor="middle">CDL</text>
      <text x="80" y="105" font-family="Arial, sans-serif" font-weight="bold" font-size="9" fill="%23dc2626" text-anchor="middle">LIMACHE</text>
    </svg>`
  },
  {
    id: 'colocolo',
    name: 'Colo-Colo',
    shortName: 'Colo-Colo',
    logoUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r="70" fill="%23ffffff" stroke="%23000000" stroke-width="6"/>
      <path d="M80 15 C115 15 145 45 145 80 L15 80 C15 45 45 15 80 15 Z" fill="%23ffffff"/>
      <circle cx="80" cy="70" r="30" fill="%23000000"/>
      <text x="80" y="130" font-family="Arial, sans-serif" font-weight="900" font-size="14" fill="%23000000" text-anchor="middle" letter-spacing="1">COLO-COLO</text>
    </svg>`
  },
  {
    id: 'udechile',
    name: 'Universidad de Chile',
    shortName: 'U. de Chile',
    logoUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r="70" fill="%231e3a8a" stroke="%23dc2626" stroke-width="6"/>
      <text x="80" y="105" font-family="Arial, sans-serif" font-weight="900" font-size="70" fill="%23ffffff" text-anchor="middle">U</text>
    </svg>`
  },
  {
    id: 'ucatolica',
    name: 'Universidad Católica',
    shortName: 'U. Católica',
    logoUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
      <path d="M80 15 L135 35 L135 90 C135 125 105 148 80 152 C55 148 25 125 25 90 L25 35 Z" fill="%23ffffff" stroke="%232563eb" stroke-width="5"/>
      <rect x="70" y="40" width="20" height="85" fill="%23dc2626"/>
      <rect x="40" y="60" width="80" height="20" fill="%23dc2626"/>
      <text x="80" y="140" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="%232563eb" text-anchor="middle">UC</text>
    </svg>`
  },
  {
    id: 'palestino',
    name: 'Club Deportivo Palestino',
    shortName: 'Palestino',
    logoUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
      <path d="M80 12 L138 32 L138 88 C138 122 105 146 80 152 C55 146 22 122 22 88 L22 32 Z" fill="%23ffffff" stroke="%2316a34a" stroke-width="5"/>
      <rect x="25" y="35" width="37" height="110" fill="%2316a34a"/>
      <rect x="62" y="35" width="36" height="110" fill="%23ffffff"/>
      <rect x="98" y="35" width="37" height="110" fill="%23dc2626"/>
      <polygon points="25,35 80,85 25,135" fill="%23000000"/>
    </svg>`
  },
  {
    id: 'unionespanola',
    name: 'Unión Española',
    shortName: 'U. Española',
    logoUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
      <path d="M80 12 L138 32 L138 88 C138 122 105 146 80 152 C55 146 22 122 22 88 L22 32 Z" fill="%23dc2626" stroke="%23facc15" stroke-width="5"/>
      <circle cx="80" cy="85" r="36" fill="%23facc15"/>
      <text x="80" y="94" font-family="Arial, sans-serif" font-weight="900" font-size="28" fill="%23dc2626" text-anchor="middle">UE</text>
    </svg>`
  }
];

export function findRivalPresetByOpponentName(opponentName?: string): RivalClubPreset | undefined {
  if (!opponentName || typeof opponentName !== 'string') return undefined;
  const lower = opponentName.toLowerCase().trim();
  if (!lower) return undefined;
  return RIVAL_PRESETS.find(
    (r) =>
      lower.includes((r.shortName || '').toLowerCase()) ||
      lower.includes((r.name || '').toLowerCase()) ||
      (r.id && lower.includes(r.id.toLowerCase()))
  );
}
