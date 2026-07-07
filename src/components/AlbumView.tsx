import { memo } from 'react'
import { SECTIONS, type Section } from '../data/album'
import { useAlbum } from '../store/album'
import StickerCell from './StickerCell'

export default function AlbumView() {
  return (
    <div className="space-y-6">
      {SECTIONS.map((s) => (
        <SectionBlock key={s.id} section={s} />
      ))}
    </div>
  )
}

const SectionBlock = memo(function SectionBlock({ section }: { section: Section }) {
  return (
    <section className="section-cv" aria-label={section.title}>
      <SectionHeader section={section} />
      <div className="grid grid-cols-5 gap-1.5">
        {section.stickers.map((d) => (
          <StickerCell key={d.code} def={d} />
        ))}
      </div>
    </section>
  )
})

function SectionHeader({ section }: { section: Section }) {
  const count = useAlbum((s) => {
    let c = 0
    for (const d of section.stickers) if ((s.items[d.code]?.q ?? 0) >= 1) c++
    return c
  })
  const total = section.stickers.length
  const done = count === total

  return (
    <div className="mb-1.5 flex items-baseline justify-between">
      <h2 className="font-display text-xl font-bold">
        <span className="mr-1">{section.flag}</span>
        {section.team ? `Grupo ${section.team.group} · ${section.title}` : section.title}
      </h2>
      <span className={`text-xs font-semibold ${done ? 'text-foil-300' : 'text-white/60'}`}>
        {done && '★ '}
        {count}/{total}
      </span>
    </div>
  )
}
