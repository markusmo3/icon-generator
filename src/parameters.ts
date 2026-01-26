// Parameter definition system for easy addition of new controls

export type ParameterType = 'color' | 'range' | 'select' | 'radio' | 'text' | 'checkbox';

export interface BaseParameter {
  id: string;
  label: string;
  type: ParameterType;
  group: string;
  defaultValue: any;
  condition?: (config: any) => boolean; // Optional: when to show/enable this parameter
}

export interface ColorParameter extends BaseParameter {
  type: 'color';
  defaultValue: string;
}

export interface RangeParameter extends BaseParameter {
  type: 'range';
  defaultValue: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

export interface SelectParameter extends BaseParameter {
  type: 'select';
  defaultValue: string;
  options: { value: string; label: string }[];
}

export interface RadioParameter extends BaseParameter {
  type: 'radio';
  defaultValue: string;
  options: { value: string; label: string }[];
  horizontal?: boolean;
}

export interface TextParameter extends BaseParameter {
  type: 'text';
  defaultValue: string;
  maxLength?: number;
}

export interface CheckboxParameter extends BaseParameter {
  type: 'checkbox';
  defaultValue: boolean;
}

export type Parameter =
  | ColorParameter
  | RangeParameter
  | SelectParameter
  | RadioParameter
  | TextParameter
  | CheckboxParameter;

// Define all parameters here - easy to add new ones!
export const PARAMETERS: Parameter[] = [
  // Background parameters
  {
    id: 'background.type',
    label: 'Type',
    type: 'radio',
    group: 'Background',
    defaultValue: 'solid',
    options: [
      { value: 'solid', label: 'Solid' },
      { value: 'transparent', label: 'Transparent' },
      { value: 'linear-gradient', label: 'Linear Gradient' },
      { value: 'radial-gradient', label: 'Radial Gradient' },
    ],
  },
  {
    id: 'background.color',
    label: 'Color',
    type: 'color',
    group: 'Background',
    defaultValue: '#4a90e2',
  },
  {
    id: 'background.gradientColor',
    label: 'Gradient Color 2',
    type: 'color',
    group: 'Background',
    defaultValue: '#357abd',
    condition: (config) => config.background.type.includes('gradient'),
  },
  {
    id: 'background.gradientAngle',
    label: 'Gradient Angle',
    type: 'range',
    group: 'Background',
    defaultValue: 45,
    min: 0,
    max: 360,
    step: 1,
    unit: '°',
    condition: (config) => config.background.type === 'linear-gradient',
  },
  {
    id: 'background.gradientSize',
    label: 'Gradient Size',
    type: 'range',
    group: 'Background',
    defaultValue: 50,
    min: 10,
    max: 150,
    step: 1,
    unit: '%',
    condition: (config) => config.background.type === 'radial-gradient',
  },
  {
    id: 'background.borderRadius',
    label: 'Border Radius',
    type: 'range',
    group: 'Background',
    defaultValue: 0,
    min: 0,
    max: 50,
    step: 1,
    unit: '%',
  },

  // Foreground parameters
  {
    id: 'foreground.type',
    label: 'Type',
    type: 'radio',
    group: 'Foreground',
    defaultValue: 'text',
    options: [
      { value: 'text', label: 'Text' },
      { value: 'emoji', label: 'Emoji' },
      { value: 'emoji-mono', label: 'Emoji Mono' },
      { value: 'icon', label: 'Icon' },
    ],
  },
  {
    id: 'foreground.color',
    label: 'Color',
    type: 'color',
    group: 'Foreground',
    defaultValue: '#ffffff',
  },
  {
    id: 'foreground.text',
    label: 'Text',
    type: 'text',
    group: 'Foreground',
    defaultValue: 'A',
    maxLength: 3,
    condition: (config) => config.foreground.type !== 'icon',
  },
  {
    id: 'foreground.size',
    label: 'Size',
    type: 'range',
    group: 'Foreground',
    defaultValue: 80,
    min: 20,
    max: 100,
    step: 5,
    unit: '%',
  },
  {
    id: 'foreground.fontFamily',
    label: 'Font Family',
    type: 'select',
    group: 'Foreground',
    defaultValue: 'sans-serif',
    options: [], // Will be populated dynamically from browser fonts
    condition: (config) => config.foreground.type === 'text',
  },
];

// Helper to get/set nested values using dot notation
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

export function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

// Build default config from parameters
export function buildDefaultConfig(): any {
  const config: any = {};
  PARAMETERS.forEach(param => {
    setNestedValue(config, param.id, param.defaultValue);
  });
  return config;
}

// Encode config to URL-safe base64
export function encodeConfigToURL(config: any): string {
  const json = JSON.stringify(config);
  const base64 = btoa(json);
  // Make URL-safe
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Decode config from URL-safe base64
export function decodeConfigFromURL(encoded: string): any | null {
  try {
    // Convert back from URL-safe
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    const json = atob(base64);
    return JSON.parse(json);
  } catch (e) {
    console.error('Failed to decode config from URL:', e);
    return null;
  }
}

// Get config from URL or use defaults with good-looking values
export function getInitialConfig(): any {
  const urlParams = new URLSearchParams(window.location.search);
  const encoded = urlParams.get('c');

  if (encoded) {
    const decoded = decodeConfigFromURL(encoded);
    if (decoded) {
      return decoded;
    }
  }

  // Good-looking defaults
  return {
    background: {
      type: 'linear-gradient',
      color: '#667eea',
      gradientColor: '#764ba2',
      gradientAngle: 135,
      gradientSize: 50,
      borderRadius: 20,
    },
    foreground: {
      type: 'emoji',
      color: '#ffffff',
      text: '🎨',
      size: 80,
    },
    palette: 'custom',
  };
}

// Update URL with current config
export function updateURL(config: any): void {
  const encoded = encodeConfigToURL(config);
  const url = new URL(window.location.href);
  url.searchParams.set('c', encoded);
  window.history.replaceState({}, '', url.toString());
}

// Load available fonts from browser
export async function loadAvailableFonts(): Promise<{ value: string; label: string }[]> {
  const fonts: { value: string; label: string }[] = [
    // Always include generic families first
    { value: 'sans-serif', label: 'Sans Serif' },
    { value: 'serif', label: 'Serif' },
    { value: 'monospace', label: 'Monospace' },
    { value: 'cursive', label: 'Cursive' },
    { value: 'fantasy', label: 'Fantasy' },
  ];

  try {
    // Check if Font Access API is available (Chrome 103+, Edge 103+)
    if ('queryLocalFonts' in window) {
      const availableFonts = await (window as any).queryLocalFonts();

      // Extract unique font families
      const fontFamilies = new Set<string>();
      availableFonts.forEach((font: any) => {
        if (font.family) {
          fontFamilies.add(font.family);
        }
      });

      // Sort alphabetically and add to list
      const sortedFonts = Array.from(fontFamilies).sort();
      sortedFonts.forEach(family => {
        // Quote font names with spaces
        const value = family.includes(' ') ? `"${family}"` : family;
        fonts.push({ value, label: family });
      });

      console.log("Loaded", fonts.length, "fonts from Font Access API");
      return fonts;
    }
  } catch (error) {
    console.warn('Font Access API not available or permission denied:', error);
  }

  // Fallback: Use common system fonts
  const commonFonts = [
    'Arial',
    'Arial Black',
    'Comic Sans MS',
    'Courier New',
    'Georgia',
    'Impact',
    'Lucida Console',
    'Lucida Sans Unicode',
    'Palatino Linotype',
    'Tahoma',
    'Times New Roman',
    'Trebuchet MS',
    'Verdana',
  ];

  commonFonts.forEach(family => {
    const value = family.includes(' ') ? `"${family}"` : family;
    fonts.push({ value, label: family });
  });

  return fonts;
}

// Initialize font options for the fontFamily parameter
export async function initializeFontOptions(): Promise<void> {
  const fontFamilyParam = PARAMETERS.find(p => p.id === 'foreground.fontFamily') as SelectParameter;
  if (fontFamilyParam) {
    fontFamilyParam.options = await loadAvailableFonts();
  }
}

