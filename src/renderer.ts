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
      svg += `<rect width="1" height="1" y="0" x="0" fill="#000000" fill-opacity="0.01" />`;
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

      // Split text by newlines
      const lines = textContent.split('\n');

      // Check if monospace mode is enabled (but ignore it for emojis)
      const monospaceMode = (this.config.foreground.monospace || false) && type === 'text';

      let fontSize: number;
      let charWidth = 0;

      if (monospaceMode) {
        // In monospace mode, calculate optimal character width and font size together
        const longestLineLength = Math.max(...lines.map(line => line.length));
        const lineCount = lines.length;

        if (longestLineLength > 0) {
          // Character width is determined by dividing maxSize by longest line length
          charWidth = maxSize / longestLineLength;

          // Font size is constrained by:
          // 1. Width: character width
          // 2. Height: total text height must fit within maxSize

          // For height calculation, we need to account for the actual text height
          // Text height ≈ fontSize (line height when lineHeight = 1)
          // Total height = lineCount * fontSize
          const maxFontSizeByWidth = charWidth;
          const maxFontSizeByHeight = maxSize / lineCount;

          fontSize = Math.min(maxFontSizeByHeight, maxFontSizeByWidth);
        } else {
          fontSize = maxSize;
        }
      } else {
        // Normal mode: Calculate font size for each line and take the smallest
        const lineCount = lines.length;

        // Start with a font size based on width constraints
        fontSize = maxSize;
        lines.forEach(line => {
          if (line.trim()) {
            const lineFontSize = this.calculateFontSize(line, maxSize, fontFamily);
            fontSize = Math.min(fontSize, lineFontSize);
          }
        });

        // Also constrain by vertical space
        // Total height = lineCount * fontSize (since lineHeight = 1)
        const maxFontSizeByHeight = maxSize / lineCount;
        fontSize = Math.min(fontSize, maxFontSizeByHeight);
      }

      const lineHeight = fontSize;

      const isEmoji = type === 'emoji' || type === 'emoji-mono';

      // Build text element
      if (monospaceMode && charWidth > 0) {
        // In monospace mode, draw each character individually
        let textElement = '';

        // Calculate the actual text block dimensions
        const totalTextHeight = lines.length * lineHeight;
        const textBlockTop = (size - totalTextHeight) / 2;
        const ascent = fontSize * 0.85;
        const firstLineY = textBlockTop + ascent;

        // Get text styling properties
        const fontWeight = this.config.foreground.fontWeight || 'normal';
        const fontStyle = this.config.foreground.fontStyle || 'normal';
        const textDecoration = this.config.foreground.textDecoration || 'none';

        lines.forEach((line, lineIndex) => {
          const lineY = firstLineY + lineIndex * lineHeight;
          const lineWidth = charWidth * line.length;
          const startX = size / 2 - lineWidth / 2;

          // Draw each character at exact positions
          for (let charIndex = 0; charIndex < line.length; charIndex++) {
            const char = line[charIndex];
            const charX = startX + charIndex * charWidth + charWidth / 2;

            textElement += `<text x="${charX}" y="${lineY}" font-size="${fontSize}" fill="${color}" text-anchor="middle" font-family='${fontFamily}' font-weight="${fontWeight}" font-style="${fontStyle}" text-decoration="${textDecoration}">${this.escapeXml(char)}</text>`;
          }
        });

        return textElement;
      } else if (isEmoji) {
        // For emojis, use foreignObject with HTML for better rendering
        // Center the foreignObject square in the canvas
        const x = (size - maxSize) / 2;
        const y = (size - maxSize) / 2;

        // Remove quotes from fontFamily for inline style
        const fontFamilyForStyle = fontFamily.replace(/"/g, '');

        // Set line-height to ~93% of maxSize to compensate for text baseline offset
        // This ensures the emoji appears vertically centered
        const adjustedLineHeight = maxSize * 0.93;

        let textElement = `<foreignObject x="${x}" y="${y}" width="${maxSize}" height="${maxSize}">`;

        lines.forEach(line => {
          textElement += `<div xmlns="http://www.w3.org/1999/xhtml" style="font-family:${fontFamilyForStyle};font-size:${fontSize}px;line-height:${adjustedLineHeight}px;color:${color};margin:0;padding:0;text-align:center;">${this.escapeXml(line)}</div>`;
        });

        textElement += `</foreignObject>`;
        return textElement;
      } else {
        // For text, use standard SVG text with baseline calculations
        const totalTextHeight = lines.length * lineHeight;
        const textBlockTop = (size - totalTextHeight) / 2;
        const ascent = fontSize * 0.85;
        const firstLineY = textBlockTop + ascent;

        const fontWeight = this.config.foreground.fontWeight || 'normal';
        const fontStyle = this.config.foreground.fontStyle || 'normal';
        const textDecoration = this.config.foreground.textDecoration || 'none';

        let textElement = `<text x="50%" y="${firstLineY}" font-size="${fontSize}" fill="${color}" text-anchor="middle" font-family='${fontFamily}' font-weight="${fontWeight}" font-style="${fontStyle}" text-decoration="${textDecoration}">`;

        lines.forEach((line, index) => {
          const dy = index === 0 ? 0 : lineHeight;
          textElement += `<tspan x="50%" dy="${dy}">${this.escapeXml(line)}</tspan>`;
        });

        textElement += '</text>';
        return textElement;
      }
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
