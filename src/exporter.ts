import {IconRenderer} from './renderer';

export class IconExporter {
  private renderer: IconRenderer;

  constructor(renderer: IconRenderer) {
    this.renderer = renderer;
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
    } else if ((config.foreground.type === 'emoji' || config.foreground.type === 'emoji-mono') && config.foreground.emojiName) {
      // Use actual emoji name, sanitized
      const sanitized = config.foreground.emojiName
        .replace(/[^a-zA-Z0-9]/g, '-')
        .toLowerCase()
        .substring(0, 30);
      parts.push(sanitized);
    } else if ((config.foreground.type === 'emoji' || config.foreground.type === 'emoji-mono')) {
      // Fallback if no emoji name
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
}
