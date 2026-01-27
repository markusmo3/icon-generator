import {IconRenderer} from './renderer';
import JSZip from 'jszip';
import emojisData from 'emojibase-data/en/data.json';

export class IconExporter {
  private renderer: IconRenderer;

  constructor(renderer: IconRenderer) {
    this.renderer = renderer;
  }

  private getEmojiName(emoji: string): string {
    // Look up emoji name from emojibase data
    const emojiData = emojisData.find((item: any) => item.emoji === emoji);
    if (emojiData && emojiData.label) {
      return emojiData.label.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().substring(0, 30);
    }
    return 'emoji';
  }

  private generateFilename(extension: string, size?: number): string {
    const config = this.renderer.getConfig();
    const parts: string[] = [];

    // Add content (text/emoji/icon name)
    if (config.foreground.type === 'text' && config.foreground.text) {
      // Sanitize text for filename
      const sanitized = config.foreground.text
        .replace(/[^a-zA-Z0-9]/g, '-')
        .substring(0, 20);
      parts.push(sanitized);
    } else if ((config.foreground.type === 'emoji' || config.foreground.type === 'emoji-mono') && config.foreground.emoji) {
      // Look up and use emoji name
      parts.push(this.getEmojiName(config.foreground.emoji));
    } else if (config.foreground.type === 'emoji' || config.foreground.type === 'emoji-mono') {
      // Fallback if no emoji
      parts.push('emoji');
    } else if (config.foreground.type === 'icon' && config.foreground.iconName) {
      // Use icon name
      parts.push(config.foreground.iconName);
    } else {
      parts.push('icon');
    }

    // Add background color (remove #)
    const bgColor = this.extractHexColor(config.background.color);
    parts.push(bgColor);

    // Add foreground color (remove #)
    const fgColor = this.extractHexColor(config.foreground.color);
    parts.push(fgColor);

    // Add size if provided
    if (size) {
      parts.push(`${size}x${size}`);
    }

    return `${parts.join('-')}.${extension}`;
  }

  private extractHexColor(color: string): string {
    // If it's a hex color, remove the #
    if (color.startsWith('#')) {
      return color.substring(1, 7); // Get first 6 chars (ignore alpha if present)
    }

    // If it's rgba/rgb, convert to hex
    const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbaMatch) {
      const r = parseInt(rgbaMatch[1]).toString(16).padStart(2, '0');
      const g = parseInt(rgbaMatch[2]).toString(16).padStart(2, '0');
      const b = parseInt(rgbaMatch[3]).toString(16).padStart(2, '0');
      return `${r}${g}${b}`;
    }

    return '000000'; // fallback
  }

  exportPNG(size: number): void {
    // Generate SVG
    const svg = this.renderer.generateSVG(size);

    // Convert SVG to PNG via canvas
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const img = new Image();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      // Export as PNG
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return;
        const pngUrl = URL.createObjectURL(pngBlob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = this.generateFilename('png', size);
        a.click();
        URL.revokeObjectURL(pngUrl);
      });
    };

    img.src = url;
  }

  exportSVG(): void {
    // Use the renderer's SVG generation
    const svg = this.renderer.generateSVG(512);

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.generateFilename('svg');
    a.click();
    URL.revokeObjectURL(url);
  }

  async exportFaviconPack(): Promise<void> {
    const zip = new JSZip();
    const config = this.renderer.getConfig();

    // Common favicon sizes for websites
    const sizes = [16, 32, 180, 192, 512];

    // Create a promise array for all PNG generations
    const pngPromises = sizes.map(size => {
      return new Promise<{size: number, blob: Blob}>((resolve) => {
        const svg = this.renderer.generateSVG(size);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        const img = new Image();
        const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);

          canvas.toBlob((pngBlob) => {
            if (pngBlob) {
              resolve({size, blob: pngBlob});
            }
          });
        };

        img.src = url;
      });
    });

    // Wait for all PNGs to be generated
    const pngs = await Promise.all(pngPromises);

    // Add PNGs to zip
    pngs.forEach(({size, blob}) => {
      if (size === 180) {
        // Apple touch icon
        zip.file('apple-touch-icon.png', blob);
      } else if (size === 192 || size === 512) {
        // Android chrome icons
        zip.file(`android-chrome-${size}x${size}.png`, blob);
      } else if (size === 16 || size === 32) {
        // Standard favicon sizes - add to root
        zip.file(`favicon-${size}x${size}.png`, blob);
      } else {
        // Other sizes
        zip.file(`icon-${size}x${size}.png`, blob);
      }
    });

    // Add favicon.ico (multi-resolution ICO with 16x16 and 32x32)
    // For simplicity, we'll just use the 32x32 PNG renamed
    const favicon32 = pngs.find(p => p.size === 32);
    if (favicon32) {
      zip.file('favicon.ico', favicon32.blob);
    }

    // Add SVG favicon
    const svg = this.renderer.generateSVG(512);
    zip.file('favicon.svg', svg);

    // Create site.webmanifest
    const manifest = {
      name: "Your App Name",
      short_name: "App",
      icons: [
        {
          src: "/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "/android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png"
        }
      ],
      theme_color: config.background.color,
      background_color: config.background.color,
      display: "standalone"
    };
    zip.file('site.webmanifest', JSON.stringify(manifest, null, 2));

    // Create HTML snippet with all the necessary meta tags
    const htmlSnippet = `<!-- Favicon and App Icons -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="${config.background.color}">`;

    zip.file('_HTML_SNIPPET.txt', htmlSnippet);

    // Create README
    const readme = `Favicon Pack
============

This package contains all the necessary favicon files for your website.

Files included:
- favicon.ico (32x32, for legacy browsers)
- favicon.svg (vector, modern browsers)
- favicon-16x16.png
- favicon-32x32.png
- icon-48x48.png
- icon-64x64.png
- icon-128x128.png
- apple-touch-icon.png (180x180, for iOS)
- android-chrome-192x192.png
- android-chrome-512x512.png
- site.webmanifest (web app manifest)
- HTML_SNIPPET.txt (copy-paste into your <head> tag)

Installation:
1. Copy all files to your website's root directory (or /public folder)
2. Add the contents of HTML_SNIPPET.txt to your HTML <head> section
3. Update the "name" and "short_name" in site.webmanifest if needed

That's it! Your website now has complete favicon support for all devices and browsers.
`;

    zip.file('_README.txt', readme);

    // Generate and download the zip
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'favicon-pack.zip';
    a.click();
    URL.revokeObjectURL(url);
  }
}
