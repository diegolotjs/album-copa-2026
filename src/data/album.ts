// Definição estática do álbum — 1062 figurinhas.
// 20 (Abertura/FWC) + 48 seleções x 20 + 14 Coca-Cola + 68 Especiais.

export interface Team {
  abbr: string
  name: string
  flag: string
  group: string
}

export interface StickerDef {
  code: string
  sectionId: string
  /** rótulo pequeno em cima da célula (ex.: BRA, FWC, CC, E) */
  top: string
  /** rótulo principal da célula (ex.: 13, 00) */
  main: string
  /** ícone especial: escudo (nº 1) / foto do time (nº 13) */
  icon?: string
  /** texto pesquisável extra (nome da seleção etc.) */
  search: string
}

export interface Section {
  id: string
  title: string
  flag?: string
  team?: Team
  stickers: StickerDef[]
}

const G = (group: string, teams: [string, string, string][]): Team[] =>
  teams.map(([abbr, name, flag]) => ({ abbr, name, flag, group }))

export const TEAMS: Team[] = [
  ...G('A', [['MEX', 'México', '🇲🇽'], ['RSA', 'África do Sul', '🇿🇦'], ['KOR', 'Coréia do Sul', '🇰🇷'], ['CZE', 'Rep. Tcheca', '🇨🇿']]),
  ...G('B', [['CAN', 'Canadá', '🇨🇦'], ['BIH', 'Bósnia', '🇧🇦'], ['QAT', 'Catar', '🇶🇦'], ['SUI', 'Suíça', '🇨🇭']]),
  ...G('C', [['BRA', 'Brasil', '🇧🇷'], ['MAR', 'Marrocos', '🇲🇦'], ['HAI', 'Haiti', '🇭🇹'], ['SCO', 'Escócia', '🏴󠁧󠁢󠁳󠁣󠁴󠁿']]),
  ...G('D', [['USA', 'Estados Unidos', '🇺🇸'], ['PAR', 'Paraguai', '🇵🇾'], ['AUS', 'Austrália', '🇦🇺'], ['TUR', 'Turquia', '🇹🇷']]),
  ...G('E', [['GER', 'Alemanha', '🇩🇪'], ['CUW', 'Curaçao', '🇨🇼'], ['CIV', 'Costa do Marfim', '🇨🇮'], ['ECU', 'Equador', '🇪🇨']]),
  ...G('F', [['NED', 'Holanda', '🇳🇱'], ['JPN', 'Japão', '🇯🇵'], ['SWE', 'Suécia', '🇸🇪'], ['TUN', 'Tunísia', '🇹🇳']]),
  ...G('G', [['BEL', 'Bélgica', '🇧🇪'], ['EGY', 'Egito', '🇪🇬'], ['IRN', 'Irã', '🇮🇷'], ['NZL', 'Nova Zelândia', '🇳🇿']]),
  ...G('H', [['ESP', 'Espanha', '🇪🇸'], ['CPV', 'Cabo Verde', '🇨🇻'], ['KSA', 'Arábia Saudita', '🇸🇦'], ['URU', 'Uruguai', '🇺🇾']]),
  ...G('I', [['FRA', 'França', '🇫🇷'], ['SEN', 'Senegal', '🇸🇳'], ['IRQ', 'Iraque', '🇮🇶'], ['NOR', 'Noruega', '🇳🇴']]),
  ...G('J', [['ARG', 'Argentina', '🇦🇷'], ['ALG', 'Argélia', '🇩🇿'], ['AUT', 'Áustria', '🇦🇹'], ['JOR', 'Jordânia', '🇯🇴']]),
  ...G('K', [['POR', 'Portugal', '🇵🇹'], ['COD', 'Congo', '🇨🇩'], ['UZB', 'Uzbequistão', '🇺🇿'], ['COL', 'Colômbia', '🇨🇴']]),
  ...G('L', [['ENG', 'Inglaterra', '🏴󠁧󠁢󠁥󠁮󠁧󠁿'], ['CRO', 'Croácia', '🇭🇷'], ['GHA', 'Gana', '🇬🇭'], ['PAN', 'Panamá', '🇵🇦']]),
]

function buildSections(): Section[] {
  const sections: Section[] = []

  // 1) Abertura / FIFA World Cup History
  const opening: StickerDef[] = [
    { code: '00', sectionId: 'opening', top: 'COPA', main: '00', search: 'abertura copa 2026 00' },
  ]
  for (let i = 1; i <= 19; i++) {
    opening.push({
      code: `FWC${i}`,
      sectionId: 'opening',
      top: 'FWC',
      main: String(i),
      search: `fwc fifa world cup history FWC${i}`,
    })
  }
  sections.push({ id: 'opening', title: 'Abertura & FIFA World Cup History', flag: '🏆', stickers: opening })

  // 2) 48 seleções, 20 figurinhas cada
  for (const team of TEAMS) {
    const stickers: StickerDef[] = []
    for (let n = 1; n <= 20; n++) {
      stickers.push({
        code: `${team.abbr}${n}`,
        sectionId: team.abbr,
        top: team.abbr,
        main: String(n),
        icon: n === 1 ? '🛡️' : n === 13 ? '👥' : undefined,
        search: `${team.name} ${team.abbr} grupo ${team.group} ${team.abbr}${n}`,
      })
    }
    sections.push({ id: team.abbr, title: team.name, flag: team.flag, team, stickers })
  }

  // 3) Coca-Cola
  const coca: StickerDef[] = []
  for (let i = 1; i <= 14; i++) {
    coca.push({ code: `CC${i}`, sectionId: 'coca', top: 'CC', main: String(i), search: `coca cola CC${i}` })
  }
  sections.push({ id: 'coca', title: 'Coca-Cola', flag: '🥤', stickers: coca })

  // 4) Especiais metalizadas
  const special: StickerDef[] = []
  for (let i = 1; i <= 68; i++) {
    special.push({ code: `E${i}`, sectionId: 'special', top: 'ESP', main: String(i), search: `especial metalizada E${i}` })
  }
  sections.push({ id: 'special', title: 'Especiais Metalizadas', flag: '✨', stickers: special })

  return sections
}

export const SECTIONS: Section[] = buildSections()

export const ALL_STICKERS: StickerDef[] = SECTIONS.flatMap((s) => s.stickers)

export const STICKER_BY_CODE: Map<string, StickerDef> = new Map(
  ALL_STICKERS.map((s) => [s.code, s]),
)

export const TOTAL = ALL_STICKERS.length // deve ser 1062
