import { useMemo, useState } from 'react'
import { ALL_STICKERS, SECTIONS } from '../data/album'
import { useAlbum } from '../store/album'
import { copyText, toast } from '../lib/toast'

function sectionLabel(id: string): string {
  const s = SECTIONS.find((x) => x.id === id)
  if (!s) return id
  return s.team ? `${s.flag} ${s.title}` : `${s.flag} ${s.title}`
}

export default function DupesView() {
  const items = useAlbum((s) => s.items)

  const dupes = useMemo(
    () =>
      ALL_STICKERS.filter((d) => (items[d.code]?.q ?? 0) >= 2).map((d) => ({
        code: d.code,
        sectionId: d.sectionId,
        extra: (items[d.code]?.q ?? 0) - 1,
        reserved: items[d.code]?.r ?? '',
      })),
    [items],
  )

  const totalExtra = dupes.reduce((acc, d) => acc + d.extra, 0)

  async function copyList() {
    const lines = [`*Álbum Copa 2026 — Repetidas (${totalExtra})*`]
    for (const d of dupes) {
      lines.push(`${d.code} (+${d.extra})${d.reserved ? ` — reservada p/ ${d.reserved}` : ''}`)
    }
    toast((await copyText(lines.join('\n'))) ? 'Lista copiada! 📋' : 'Não consegui copiar 😕')
  }

  if (dupes.length === 0) {
    return <p className="py-10 text-center text-white/70">Nenhuma repetida por enquanto.</p>
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => void copyList()}
        className="min-h-11 w-full rounded-lg bg-foil-300 px-4 font-semibold text-emerald-950"
      >
        📋 Copiar lista ({totalExtra} repetidas)
      </button>
      <ul className="space-y-2">
        {dupes.map((d) => (
          <li key={d.code} className="flex items-center gap-2 rounded-lg bg-white/5 p-2">
            <span className="foil min-w-16 rounded-md px-2 py-1.5 text-center font-display text-lg font-bold text-emerald-950">
              {d.code}
            </span>
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold">+{d.extra}</span>
            <span className="hidden text-xs text-white/50 sm:block">{sectionLabel(d.sectionId)}</span>
            <ReserveInput code={d.code} value={d.reserved} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function ReserveInput({ code, value }: { code: string; value: string }) {
  const setReserved = useAlbum((s) => s.setReserved)
  const [text, setText] = useState(value)

  return (
    <input
      type="text"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        if (text !== value) {
          setReserved(code, text.trim())
          if (text.trim()) toast(`${code} reservada p/ ${text.trim()}`)
        }
      }}
      placeholder="Reservar para…"
      aria-label={`Reservar ${code} para`}
      className="min-h-11 w-full min-w-0 flex-1 rounded-lg border border-white/15 bg-white/10 px-2 text-sm placeholder:text-white/40 focus:border-foil-300"
    />
  )
}
