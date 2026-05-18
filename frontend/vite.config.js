/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        // entry points & config — no lógica de negocio testable
        'src/main.jsx',
        'src/App.jsx',
        'src/services/api.js',
        'src/services/authService.js',
        'src/utils/sportEmoji.js',
        // infraestructura de contexto y layout — testeados indirectamente
        'src/context/AuthContext.jsx',
        'src/components/layout/Navbar.jsx',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
      },
    },
  },
})
