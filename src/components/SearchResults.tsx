import { useMemo } from 'react'
import { ALL_STICKERS, SECTIONS } from '../data/album'
import { useAlbum } from '../store/album'
import { buzz } from '../lib/toast'

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')

const SEARCHABLE = ALL_STICKERS.map((d) => ({ def: d, text: norm(`${d.code} ${d.search}`) }))

export default function SearchResults() {
  const query = useAlbum((s) => s.query)
  const items = useAlbum((s) => s.items)
  const tap = useAlbum((s) => s.tap)
  const mode = useAlbum((s) => s.mode)

  const q = norm(query.trim())
  const results = useMemo(
    () => SEARCHABLE.filter((e) => e.text.includes(q)).slice(0, 80),
    [q],
  )

  if (results.length === 0) {
    return <p className="py-10 text-center text-white/70">Nada encontrado para “{query}”.</p>
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-white/60">
        {results.length} resultado(s) — tocar {mode === 'add' ? 'adiciona' : 'remove'}.
      </p>
      <ul className="space-y-1.5">
        {results.map(({ def }) => {
          const qty = items[def.code]?.q ?? 0
          const section = SECTIONS.find((s) => s.id === def.sectionId)
          return (
            <li key={def.code}>
              <button
                type="button"
                onClick={() => {
                  tap(def.code)
                  buzz()
                }}
                className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left ${
                  qty === 0
                    ? 'border-2 border-dashed border-white/20 bg-white/5'
                    : qty === 1
                      ? 'bg-pitch-600'
                      : 'foil text-emerald-950'
                }`}
              >
                <span className="font-display text-lg font-bold">{def.code}</span>
                <span className={`text-xs ${qty >= 2 ? 'text-emerald-900' : 'text-white/60'}`}>
                  {section?.flag} {section?.team ? section.title : section?.title}
                </span>
                <span className="ml-auto text-xs font-semibold">
                  {qty === 0 ? 'falta' : qty === 1 ? 'colada ✓' : `repetida +${qty - 1}`}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
