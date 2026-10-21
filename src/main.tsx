import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Restore theme and motion preferences
try {
  const savedTheme = localStorage.getItem('healthsense_theme') || 'midnight'
  document.documentElement.setAttribute('data-theme', savedTheme)

  const savedMotion = localStorage.getItem('healthsense_motion') || 'smooth'
  document.documentElement.setAttribute('data-motion', savedMotion)
} catch {
  // Ignore localStorage issues in restricted environments
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
