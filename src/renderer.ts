import {IconConfig} from './types';
import {getIconSvg} from './icons';

export class IconRenderer {
  private config: IconConfig;

  constructor(initialConfig: IconConfig) {
    this.config = initialConfig;
  }

  setConfig(config: IconConfig): void {
    this.config = config;
  }

  getConfig(): IconConfig {
    return this.config;
  }

  // Generate SVG string from config
  generateSVG(size: number = 512): string {
    const borderRadius = (this.config.background.borderRadius || 0) * size / 100;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;

    // Add defs for gradients if needed
    if (this.config.background.type === 'linear-gradient' && this.config.background.gradientColor) {
      const angle = this.config.background.gradientAngle || 0;
      const rad = angle * (Math.PI / 180);
      const x1 = 50 + Math.cos(rad) * 50;
      const y1 = 50 + Math.sin(rad) * 50;
      const x2 = 50 - Math.cos(rad) * 50;
      const y2 = 50 - Math.sin(rad) * 50;

      svg += `<defs>
        <linearGradient id="bgGradient" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
          <stop offset="0%" style="stop-color:${this.config.background.color}" />
          <stop offset="100%" style="stop-color:${this.config.background.gradientColor}" />
        </linearGradient>
      </defs>`;
    } else if (this.config.background.type === 'radial-gradient' && this.config.background.gradientColor) {
      const radiusPercent = (this.config.background.gradientSize || 50);

      svg += `<defs>
        <radialGradient id="bgGradient" cx="50%" cy="50%" r="${radiusPercent}%">
          <stop offset="0%" style="stop-color:${this.config.background.color}" />
          <stop offset="100%" style="stop-color:${this.config.background.gradientColor}" />
        </radialGradient>
      </defs>`;
    }

    let alpha = 1.0;
    if (this.config.background.type !== 'transparent') {
      let fill = this.config.background.color;
      if (this.config.background.type.includes('gradient')) {
        fill = 'url(#bgGradient)';
      }
      if (fill.match(/#[0-9a-fA-F]{8}$/)) {
        alpha = parseInt(fill.slice(-2), 16) / 255;
      }

      if (borderRadius > 0) {
        svg += `<rect width="${size}" height="${size}" rx="${borderRadius}" ry="${borderRadius}" fill="${fill}" fill-opacity="${alpha}" />`;
      } else {
        svg += `<rect width="${size}" height="${size}" fill="${fill}" fill-opacity="${alpha}" />`;
      }
    } else {
      alpha = 0;
    }

    if (alpha <= 0.01) {
      // somehow emojis and text get cut off on fully transparent backgrounds in some browsers
      // this workaround prevents that
      svg += `<rect width="1" height="1" y="${size}" x="${size}" fill="#000000" fill-opacity="0.01" />`;
    }

    // Add foreground
    svg += this.generateForegroundSVG(size);

    svg += '</svg>';
    return svg;
  }

  private generateForegroundSVG(size: number): string {
    const { type, color, text, emoji, iconName } = this.config.foreground;
    const percentageSize = (this.config.foreground.size || 80) / 100;
    const maxSize = size * percentageSize;

    if (type === 'text' || type === 'emoji' || type === 'emoji-mono') {
      let fontFamily = this.config.foreground.fontFamily || 'sans-serif';

      // Override for emoji types
      if (type === 'emoji-mono') {
        fontFamily = '"Noto Emoji", "Segoe UI Symbol", "Noto Color Emoji"';
      } else if (type === 'emoji') {
        fontFamily = '"Noto Color Emoji", "Segoe UI Emoji"';
      }

      // Use emoji field for emoji types, text field for text type
      let textContent: string;
      if (type === 'emoji' || type === 'emoji-mono') {
        textContent = emoji || '🎨';
      } else {
        textContent = text || ' ';
      }

      // Calculate font size that fits within maxSize
      const fontSize = this.calculateFontSize(textContent, maxSize, fontFamily);

      // Center position with better vertical alignment
      const y = size / 2 + fontSize * 0.35;

      return `<text x="50%" y="${y}" font-size="${fontSize}" fill="${color}" text-anchor="middle" font-family='${fontFamily}'>${this.escapeXml(textContent)}</text>`;
    }

    if (type === 'icon' && iconName) {
      const iconSvg = getIconSvg(iconName);
      if (iconSvg) {
        return this.generateIconSVG(iconSvg, size, color, maxSize);
      }
    }

    return '';
  }

  private calculateFontSize(text: string, maxSize: number, fontFamily: string): number {
    // Create a temporary canvas to measure text
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return maxSize * 0.65;

    let fontSize = maxSize;
    ctx.font = `${fontSize}px ${fontFamily}`;
    let metrics = ctx.measureText(text);

    // If text is wider than maxSize, scale down the font
    if (metrics.width > maxSize) {
      fontSize = (maxSize / metrics.width) * fontSize;
    }

    return fontSize;
  }

  private generateIconSVG(svgString: string, size: number, color: string, iconSize: number): string {
    // Parse the icon SVG and extract its content
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
    const iconSvg = svgDoc.querySelector('svg');

    if (!iconSvg) return '';

    const offset = (size - iconSize) / 2;
    iconSvg.setAttribute("x", offset.toString());
    iconSvg.setAttribute("y", offset.toString());
    iconSvg.setAttribute("width", iconSize.toString());
    iconSvg.setAttribute("height", iconSize.toString());
    iconSvg.setAttribute("stroke", color);
    return iconSvg.outerHTML;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // Render to multiple containers using a single SVG generation (more efficient)
  renderToMultipleElements(containers: Array<{element: HTMLElement, size: number}>): void {
    // Generate SVG once at the largest size
    const baseSvg = this.generateSVG(512);

    // Parse the SVG to clone it
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(baseSvg, 'image/svg+xml');
    const baseSvgElement = svgDoc.querySelector('svg');

    if (!baseSvgElement) return;

    // Clone and scale for each container
    containers.forEach(({element, size}) => {
      const clonedSvg = baseSvgElement.cloneNode(true) as SVGElement;
      clonedSvg.setAttribute('width', size.toString());
      clonedSvg.setAttribute('height', size.toString());
      element.innerHTML = '';
      element.appendChild(clonedSvg);
    });
  }

  // Legacy method for backward compatibility - converts SVG to canvas
  render(canvas: HTMLCanvasElement): void {
    const svg = this.generateSVG(canvas.width);
    const img = new Image();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
      URL.revokeObjectURL(url);
    };

    img.src = url;
  }
}
