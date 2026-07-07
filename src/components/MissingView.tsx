import { useMemo } from 'react'
import { SECTIONS } from '../data/album'
import { useAlbum } from '../store/album'
import { buzz, copyText, toast } from '../lib/toast'

function sectionLabel(id: string): string {
  const s = SECTIONS.find((x) => x.id === id)
  if (!s) return id
  return s.team ? `Grupo ${s.team.group} · ${s.title}` : s.title
}

export default function MissingView() {
  const items = useAlbum((s) => s.items)
  const markStuck = useAlbum((s) => s.markStuck)

  const groups = useMemo(
    () =>
      SECTIONS.map((s) => ({
        id: s.id,
        codes: s.stickers.filter((d) => (items[d.code]?.q ?? 0) === 0).map((d) => d.code),
      })).filter((g) => g.codes.length > 0),
    [items],
  )

  const totalMissing = groups.reduce((acc, g) => acc + g.codes.length, 0)

  async function copyList() {
    const lines = [`*Álbum Copa 2026 — Faltam (${totalMissing})*`]
    for (const g of groups) {
      lines.push(`*${sectionLabel(g.id)}:* ${g.codes.join(', ')}`)
    }
    toast((await copyText(lines.join('\n'))) ? 'Lista copiada! 📋' : 'Não consegui copiar 😕')
  }

  if (totalMissing === 0) {
    return <p className="py-10 text-center text-lg">🎉 Álbum completo — não falta nenhuma!</p>
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => void copyList()}
        className="min-h-11 w-full rounded-lg bg-foil-300 px-4 font-semibold text-emerald-950"
      >
        📋 Copiar lista ({totalMissing} faltando)
      </button>
      <p className="text-xs text-white/60">Tocar numa figurinha marca como colada.</p>
      {groups.map((g) => (
        <section key={g.id} className="section-cv">
          <h2 className="mb-1.5 font-display text-lg font-bold">
            {sectionLabel(g.id)}{' '}
            <span className="text-xs font-normal text-white/60">({g.codes.length})</span>
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {g.codes.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  markStuck(code)
                  buzz()
                  toast(`${code} colada! ✅`)
                }}
                className="min-h-11 rounded-lg border-2 border-dashed border-white/25 bg-white/5 px-3 text-sm font-semibold text-white/80"
              >
                {code}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
