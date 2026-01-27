export type BackgroundType = 'solid' | 'transparent' | 'linear-gradient' | 'radial-gradient';
export type ForegroundType = 'text' | 'emoji' | 'emoji-mono' | 'icon';

export interface IconConfig {
  background: {
    type: BackgroundType;
    color: string;
    gradientColor?: string;
    gradientAngle?: number;
    gradientSize?: number; // For radial gradient radius (percentage)
    borderRadius?: number; // Percentage of canvas size
  };
  foreground: {
    type: ForegroundType;
    color: string;
    text?: string;
    emoji?: string; // Selected emoji (separate from text)
    iconName?: string; // Icon name to load SVG from
    size?: number; // Percentage of canvas size (inner margin)
    fontFamily?: string; // Font family for text rendering
    fontWeight?: string; // Font weight (normal, bold, 100-900)
    fontStyle?: string; // Font style (normal, italic, oblique)
    textDecoration?: string; // Text decoration (none, underline, overline, line-through)
    monospace?: boolean; // Force monospace character spacing
  };
}
