import { memo } from 'react'
import type { StickerDef } from '../data/album'
import { useAlbum } from '../store/album'
import { buzz } from '../lib/toast'

function cellClasses(q: number): string {
  if (q === 0) return 'border-2 border-dashed border-white/25 bg-white/5 text-white/50'
  if (q === 1) return 'border-2 border-emerald-300/60 bg-pitch-600 text-white shadow'
  return 'border-2 border-foil-600 foil text-emerald-950 shadow'
}

/**
 * Célula memoizada: só re-renderiza quando o item DELA muda no store —
 * um toque não re-renderiza as outras 1061 células.
 */
const StickerCell = memo(function StickerCell({ def }: { def: StickerDef }) {
  const item = useAlbum((s) => s.items[def.code])
  const tap = useAlbum((s) => s.tap)
  const q = item?.q ?? 0

  return (
    <button
      type="button"
      onClick={() => {
        tap(def.code)
        buzz()
      }}
      aria-label={`${def.code} — ${q === 0 ? 'falta' : q === 1 ? 'colada' : `repetida +${q - 1}`}`}
      className={`relative flex min-h-14 min-w-11 flex-col items-center justify-center rounded-lg transition-colors duration-100 select-none ${cellClasses(q)}`}
    >
      <span className="text-[10px] font-semibold leading-none opacity-80">{def.top}</span>
      <span className="font-display text-2xl font-bold leading-tight">
        {def.icon && <span className="mr-0.5 align-middle text-sm">{def.icon}</span>}
        {def.main}
      </span>
      {q >= 2 && (
        <span className="absolute -right-1.5 -top-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
          +{q - 1}
        </span>
      )}
    </button>
  )
})

export default StickerCell
