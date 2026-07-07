import { useCallback, useEffect, useState } from 'react'
import { createSnapshot, getSnapshotItems, listSnapshots, type SnapshotRow } from '../lib/backup'
import { replaceLocalItems } from '../lib/db'
import { markDirty } from '../lib/sync'
import { toast } from '../lib/toast'
import { useAlbum } from '../store/album'
import type { ItemMap } from '../lib/types'

export default function BackupsView({ userId }: { userId: string | null }) {
  const [rows, setRows] = useState<SnapshotRow[] | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    if (!userId) return
    setRows(await listSnapshots(userId))
  }, [userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  if (!userId) {
    return (
      <p className="py-10 text-center text-white/70">
        Backups na nuvem ficam disponíveis quando a conta está conectada.
      </p>
    )
  }

  async function backupNow() {
    setBusy(true)
    const ok = await createSnapshot(userId!, useAlbum.getState().items, 'manual')
    setBusy(false)
    toast(ok ? 'Backup criado! ☁️' : 'Falha ao criar backup 😕')
    void refresh()
  }

  async function restore(row: SnapshotRow) {
    const when = formatDate(row.created_at)
    if (!window.confirm(`Restaurar o backup de ${when}?\n\nO estado ATUAL será salvo num novo backup antes.`)) return
    setBusy(true)
    try {
      // 1. snapshot do estado atual ANTES de restaurar
      await createSnapshot(userId!, useAlbum.getState().items, 'pré-restauração')
      // 2. busca o snapshot e aplica com updatedAt = agora (vence no merge)
      const snapItems = await getSnapshotItems(row.id)
      if (!snapItems) {
        toast('Não consegui ler esse backup 😕')
        return
      }
      const now = Date.now()
      const restored: ItemMap = {}
      for (const [code, item] of Object.entries(snapItems)) restored[code] = { ...item, u: now }
      useAlbum.setState({ items: restored })
      await replaceLocalItems(restored)
      markDirty()
      toast('Backup restaurado! ✅')
      void refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="font-display text-2xl font-bold">☁️ Backups</h2>
      <p className="text-xs text-white/60">
        Um backup automático é criado a cada dia de uso e antes de importar, zerar, migrar ou
        restaurar. Os últimos 30 são mantidos.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void backupNow()}
        className="min-h-11 w-full rounded-lg bg-foil-300 font-semibold text-emerald-950 disabled:opacity-60"
      >
        Criar backup agora
      </button>

      {rows === null ? (
        <p className="py-6 text-center text-white/60">Carregando…</p>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-white/60">Nenhum backup ainda.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center gap-2 rounded-lg bg-white/5 p-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{formatDate(row.created_at)}</p>
                <p className="text-xs text-white/60">{row.reason}</p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void restore(row)}
                className="min-h-11 rounded-lg bg-white/10 px-3 text-sm font-semibold disabled:opacity-60"
              >
                Restaurar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}
