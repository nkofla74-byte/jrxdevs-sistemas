'use client'

import { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('jrx_theme') as 'dark' | 'light' | null
    if (saved) {
      setTheme(saved)
      document.documentElement.setAttribute('data-theme', saved)
    }
  }, [])

  function toggle() {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('jrx_theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border)',
        color: 'var(--text-secondary)',
      }}
      title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      <span className="text-lg">{theme === 'dark' ? '☀️' : '🌙'}</span>
      <span className="text-xs font-medium hidden sm:block">
        {theme === 'dark' ? 'Claro' : 'Oscuro'}
      </span>
    </button>
  )
}