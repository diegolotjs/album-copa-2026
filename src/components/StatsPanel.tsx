import { useMemo } from 'react'
import { ALL_STICKERS, SECTIONS, TOTAL } from '../data/album'
import { useAlbum } from '../store/album'

export default function StatsPanel() {
  const items = useAlbum((s) => s.items)

  const stats = useMemo(() => {
    let stuck = 0
    let dupes = 0
    for (const d of ALL_STICKERS) {
      const q = items[d.code]?.q ?? 0
      if (q >= 1) stuck++
      if (q > 1) dupes += q - 1
    }
    const perTeam = SECTIONS.filter((s) => s.team).map((s) => {
      let c = 0
      for (const d of s.stickers) if ((items[d.code]?.q ?? 0) >= 1) c++
      return { id: s.id, flag: s.flag ?? '', count: c, total: s.stickers.length }
    })
    return {
      stuck,
      missing: TOTAL - stuck,
      dupes,
      pct: TOTAL ? (stuck / TOTAL) * 100 : 0,
      perTeam,
    }
  }, [items])

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-display text-lg font-bold text-foil-300">
          {stats.pct.toFixed(1).replace('.', ',')}%
        </span>
        <span className="text-white/80">
          <b className="text-emerald-300">{stats.stuck}</b> coladas ·{' '}
          <b className="text-white">{stats.missing}</b> faltam ·{' '}
          <b className="text-foil-300">{stats.dupes}</b> repetidas
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(stats.pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 overflow-hidden rounded-full bg-white/10"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-foil-300 transition-[width] duration-300"
          style={{ width: `${stats.pct}%` }}
        />
      </div>
      <div className="flex gap-1 overflow-x-auto pb-0.5 text-[10px] leading-none [-webkit-overflow-scrolling:touch]">
        {stats.perTeam.map((t) => (
          <span
            key={t.id}
            className={`flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-1 ${
              t.count === t.total ? 'bg-foil-300/20 text-foil-300' : 'bg-white/10 text-white/70'
            }`}
          >
            {t.flag} {t.count}/{t.total}
          </span>
        ))}
      </div>
    </div>
  )
}
