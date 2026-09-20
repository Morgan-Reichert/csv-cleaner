import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles.css'
import './styles-rapport.css'

const theme =
  localStorage.getItem('csvpropre-theme') ??
  (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'sombre' : 'clair')
document.documentElement.setAttribute('data-theme', theme)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
