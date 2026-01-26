import {defineConfig} from 'vite'

export default defineConfig({
  base: '/icon-generator/',
  assetsInclude: ['**/*.svg'],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
  publicDir: 'public',
  server: {
    fs: {
      // Allow serving files from node_modules
      allow: ['..']
    }
  },
  resolve: {
    alias: {
      '@tabler/icons': '/node_modules/@tabler/icons'
    }
  }
})
