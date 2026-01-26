import iconsOutlineRaw from '@tabler/icons/tabler-nodes-outline.json?raw';
import iconsFilledRaw from '@tabler/icons/tabler-nodes-filled.json?raw';

export interface IconData {
  name: string; // hyphenated name for storage (e.g., "brand-finder")
  displayName: string; // user-friendly name for display (e.g., "brand finder")
  svg: string;
}

// This will be populated at runtime
let iconsCache: Map<string, string> = new Map();

// Create SVG from path data
function createSvgFromPaths(pathData: any[], filled: boolean = false): string {
  const pathElements = pathData.map(item => {
    const [elementType, attributes] = item;

    if (elementType === 'path') {
      const d = attributes.d || '';
      // Check if it's the background path
      if (d.startsWith('M0 0')) {
        return `<path stroke="none" fill="none" d="${d}" />`;
      }
      return `<path d="${d}" />`;
    }

    return '';
  }).join('');

  if (filled) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">${pathElements}</svg>`;
  } else {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${pathElements}</svg>`;
  }
}

export async function getAllIcons(): Promise<IconData[]> {
  if (iconsCache.size > 0) {
    return Array.from(iconsCache.entries()).map(([name, svg]) => ({
      name,
      displayName: name.replace(/-/g, ' '),
      svg
    }));
  }

  const icons: IconData[] = [];

  try {
    // Parse the outline icons JSON
    const iconsOutline = JSON.parse(iconsOutlineRaw) as Record<string, any[]>;

    // Convert each outline icon to SVG
    Object.entries(iconsOutline).forEach(([name, paths]) => {
      const displayName = name.replace(/-/g, ' ');
      const svg = createSvgFromPaths(paths, false);

      icons.push({
        name,
        displayName,
        svg
      });
    });

    // Parse the filled icons JSON
    const iconsFilled = JSON.parse(iconsFilledRaw) as Record<string, any[]>;

    // Convert each filled icon to SVG
    Object.entries(iconsFilled).forEach(([name, paths]) => {
      const nameWithSuffix = `${name}-filled`;
      const displayName = `${name.replace(/-/g, ' ')} (filled)`;
      const svg = createSvgFromPaths(paths, true);

      icons.push({
        name: nameWithSuffix,
        displayName,
        svg
      });
    });
  } catch (error) {
    console.error('Failed to load icons from JSON:', error);
  }

  // Populate the Map cache
  icons.sort((a, b) => a.name.localeCompare(b.name));
  icons.forEach(icon => {
    iconsCache.set(icon.name, icon.svg);
  });

  console.log(`Loaded ${iconsCache.size} icons from JSON (outline + filled)`);
  return icons;
}

export function searchIcons(query: string, icons: IconData[]): IconData[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return icons;

  return icons.filter(icon =>
    icon.displayName.includes(lowerQuery) || icon.name.includes(lowerQuery)
  );
}

export function getIconSvg(iconName: string): string | null {
  return iconsCache.get(iconName) || null;
}
