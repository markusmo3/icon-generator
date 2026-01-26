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
    emojiName?: string; // Name of the selected emoji
    iconName?: string; // Icon name to load SVG from
    size?: number; // Percentage of canvas size (inner margin)
    fontFamily?: string; // Font family for text rendering
  };
}
