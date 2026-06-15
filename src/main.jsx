import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Rituals from './Rituals.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Rituals />
  </StrictMode>,
)
