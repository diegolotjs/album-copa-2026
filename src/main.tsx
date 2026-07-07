import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App'
import { initAuth } from './store/auth'

initAuth()

// Auto-update do service worker. O SW cacheia SÓ o app shell — os dados
// vivem no IndexedDB e sobrevivem a qualquer atualização de versão.
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(<App />)
