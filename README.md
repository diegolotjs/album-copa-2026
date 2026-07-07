# ⚽ Álbum Copa 2026

PWA offline-first para controlar o álbum de figurinhas da Copa do Mundo 2026
(1062 figurinhas). Local-first (IndexedDB) com sincronização em nuvem
(Supabase), snapshots automáticos e instalável no iPhone.

## Stack

- Vite + React + TypeScript + Tailwind CSS 4
- `vite-plugin-pwa` (service worker com auto-update; cacheia SÓ o app shell)
- Zustand (estado global, célula memoizada re-renderiza sozinha)
- Dexie (IndexedDB) — banco local `album-copa-2026` (**nunca renomear**)
- Supabase (Postgres + Auth por link mágico) — plano gratuito
- Deploy: Vercel (plano gratuito)

## Rodar local

```bash
npm install
npm run dev        # abre em http://localhost:5173
```

Sem `.env.local` preenchido o app roda em **modo local** (sem login/nuvem) —
útil para desenvolvimento. Preencha as chaves para testar login e sync.

## Testes e build

```bash
npm test           # merge por figurinha, migração de schema, guarda anti-vazio
npm run build      # gera dist/ (roda tsc antes)
npm run preview    # serve o build de produção localmente
npm run icons      # regenera os ícones do PWA (scripts/generate-icons.mjs)
```

## Configurar o Supabase (uma vez)

1. Crie um projeto gratuito em https://supabase.com (região `sa-east-1`
   recomendada).
2. No **SQL Editor**, cole e execute o conteúdo de `supabase/schema.sql`
   (cria `collections` e `snapshots` com Row Level Security).
3. Em **Authentication → URL Configuration**:
   - Site URL: `https://SEU-APP.vercel.app`
   - Additional Redirect URLs: `http://localhost:5173`
4. Em **Project Settings → API**, copie:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
5. Coloque os valores em `.env.local` (local) e nas Environment Variables da
   Vercel (produção).

> **Hibernação do plano grátis:** projetos Supabase gratuitos são pausados
> após ~1 semana sem uso. O app continua funcionando offline (dados locais);
> para reativar a nuvem, entre no dashboard do Supabase e clique em
> **Restore project**. Nada é perdido.

## Publicar na Vercel

1. Suba o repositório para o GitHub.
2. Em https://vercel.com → **Add New → Project** → importe o repositório.
   Framework detectado: Vite (build `npm run build`, output `dist`).
3. Em **Environment Variables**, adicione `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY`.
4. Deploy. Cada `git push` na branch principal publica automaticamente.
5. Domínio próprio no futuro: **Project → Settings → Domains → Add** — sem
   migração (apenas atualize a Site URL no Supabase).

## Atualizar sem perder dados

Os dados do usuário vivem no IndexedDB (aparelho) + Supabase (nuvem), nunca no
cache do service worker. Regras ao evoluir o app:

1. **Nunca** renomear o banco IndexedDB (`album-copa-2026`) nem apagar chaves
   sem migrar.
2. Mudou o formato do estado? Incremente `SCHEMA_VERSION` em
   `src/lib/migrations.ts` e adicione a migração `versãoAntiga → nova`.
   Um snapshot é criado automaticamente antes de migrar.
3. O deploy de uma nova versão só troca o app shell — o service worker
   atualiza sozinho e os dados permanecem.
4. Snapshots automáticos: 1 por dia de uso + antes de import/reset/migração/
   restauração (últimos 30 mantidos). Tela **Backups** no app (⚙️ → Backups).
5. Export/Import JSON manual em ⚙️ como rede de segurança extra.

## Instalar no iPhone

1. Abra a URL do app no **Safari**.
2. Faça login (link mágico por e-mail — abra o e-mail no próprio iPhone).
3. Toque em **Compartilhar** (quadrado com seta) → **Adicionar à Tela de
   Início** → **Adicionar**.
4. Abra pelo ícone: tela cheia, funciona offline e sincroniza quando conectar.

## Modelo de dados

- `q = 0` → falta · `q = 1` → colada · `q ≥ 2` → repetida (+`q-1`)
- Cada figurinha guarda `updatedAt` — o merge entre aparelhos é **por
  figurinha** (vence o toque mais recente), nunca pelo estado inteiro.
- Seções: Abertura/FWC (20) · 48 seleções × 20 (grupos A–L) · Coca-Cola (14)
  · Especiais E1–E68. Total: **1062**.
