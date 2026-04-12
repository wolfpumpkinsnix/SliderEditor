import './app.css'
import './styles/editor.css'
import './styles/presentation.css'
import './styles/properties.css'
import './components/app_shell/app_shell.ts'
import { flushPersist } from './state/signalsStore.ts'

window.addEventListener('beforeunload', () => flushPersist())

const app = document.getElementById('app')!
app.replaceChildren(document.createElement('app-shell'))
