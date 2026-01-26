# Yet Another Icon Generator

A lightweight, client-side icon generator that runs entirely in the browser. Create simple icons with customizable backgrounds (solid colors, transparent, or gradients) and foregrounds (text, emoji, or Tabler Icons).

## Features

- 🎨 **HSLA Color Picking** - Full transparency support with vanilla-colorful HSLA color picker
- 🌙 **Dark Mode** - Toggle between light and dark themes with persistent preference
- 🎭 **Background Options**
  - Solid colors with full transparency support
  - Transparent backgrounds
  - Linear gradients with adjustable angle (0-360°)
  - Radial gradients with size control
  - Customizable border radius (0-100%)
- ✏️ **Foreground Options**
  - Custom text with 18+ font family choices (dynamically loaded from your system with Font Access API)
  - Color emoji (high-resolution using Noto Color Emoji)
  - Monochrome emoji (customizable color using Noto Emoji)
  - 5000+ MIT-licensed Tabler Icons with live search
  - Adjustable size control for all foreground types (20-100%)
- 👁️ **Live Preview** - Five SVG previews showing real-time changes (512×512, 64×64, 32×32, 24×24, 16×16)
- 💾 **Export Formats**
  - PNG at multiple sizes: 16×16, 24×24, 32×32, 64×64, 128×128, 256×256, 512×512
  - SVG (vector format)
  - Descriptive filenames including content and colors (e.g., `logo-667eea-ffffff-256x256.png`)
- 🔗 **Shareable URLs** - All settings encoded in URL for easy sharing
- 🚀 **Zero Backend** - Runs completely in the browser
- 📦 **Lightweight** - Built with TypeScript and Vite, minimal dependencies

## Technology Stack

- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Vanilla JavaScript** - No heavy frameworks
- **SVG Rendering** - Scalable vector graphics for all previews
- **GitHub Actions** - Automated deployment to GitHub Pages

## License

This project was developed with AI assistance (GitHub Copilot) and is licensed under the MIT License.

## Credits

- [Tabler Icons](https://tabler-icons.io/) - MIT licensed icon set (5000+ icons)
- [vanilla-colorful](https://github.com/web-padawan/vanilla-colorful) - Lightweight color picker
- [Emojibase](https://emojibase.dev/) - Comprehensive emoji dataset
- [Noto Fonts](https://fonts.google.com/noto) - Google's emoji fonts for high-quality rendering
