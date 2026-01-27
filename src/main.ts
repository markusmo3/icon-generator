import 'vanilla-colorful/hsla-string-color-picker.js';
import {IconRenderer} from './renderer';
import {IconExporter} from './exporter';
import {IconConfig} from './types';
import {getAllIcons, IconData, searchIcons} from './icons';
import {buildDefaultConfig, getInitialConfig, initializeFontOptions, PARAMETERS, updateURL} from './parameters';
import {ParameterUIBuilder} from './ui-builder';
import emojisData from 'emojibase-data/en/data.json';
import '../index.css';

class IconGeneratorApp {
  private renderer: IconRenderer;
  private exporter: IconExporter;
  private uiBuilder: ParameterUIBuilder;

  private preview512: HTMLElement;
  private preview64: HTMLElement;
  private preview32: HTMLElement;
  private preview24: HTMLElement;
  private preview16: HTMLElement;

  private allIcons: IconData[] = [];

  constructor() {
    // Get initial config from URL or use good-looking defaults
    const initialConfig = getInitialConfig() as IconConfig;

    this.renderer = new IconRenderer(initialConfig);
    this.exporter = new IconExporter(this.renderer);

    // Initialize UI builder
    this.uiBuilder = new ParameterUIBuilder(initialConfig, (config) => {
      this.renderer.setConfig(config as IconConfig);
      this.updateIconSelectorState();
      this.updateEmojiSelectorState();
      this.updatePreviews();
      // Update URL with new config
      updateURL(config);
    });

    this.preview512 = document.getElementById('preview-512') as HTMLElement;
    this.preview64 = document.getElementById('preview-64') as HTMLElement;
    this.preview32 = document.getElementById('preview-32') as HTMLElement;
    this.preview24 = document.getElementById('preview-24') as HTMLElement;
    this.preview16 = document.getElementById('preview-16') as HTMLElement;

    this.init();
  }

  private async init(): Promise<void> {
    // Initialize theme toggle
    this.initThemeToggle();

    // Initialize font options from browser
    await initializeFontOptions();

    // Build UI from parameters
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      sidebar.innerHTML = ''; // Clear existing controls
      this.uiBuilder.buildUI(sidebar, PARAMETERS);

      // Add icon selector button after UI is built
      this.addIconSelectorControl(sidebar);
      // Add emoji selector button
      this.addEmojiSelectorControl(sidebar);

      // Update visibility of selectors based on initial config
      this.updateIconSelectorState();
      this.updateEmojiSelectorState();
    }

    this.initDownloadButtons();
    this.initIconModal();
    this.initEmojiModal();
    this.initConfigModal();
    this.initResetButton();

    // Load icons asynchronously
    this.allIcons = await getAllIcons();

    this.updatePreviews();
  }

  private addIconSelectorControl(sidebar: HTMLElement): void {
    // Find the foreground section
    const sections = sidebar.querySelectorAll('.control-section');
    let foregroundSection: Element | null = null;

    sections.forEach(section => {
      const h2 = section.querySelector('h2');
      if (h2 && h2.textContent === 'Foreground') {
        foregroundSection = section;
      }
    });

    if (!foregroundSection) return;

    // Create icon selector control
    const controlGroup = document.createElement('div');
    controlGroup.className = 'control-group';
    controlGroup.dataset.paramId = 'foreground.icon-selector';

    const label = document.createElement('label');
    label.textContent = 'Icon:';

    const button = document.createElement('button');
    button.id = 'icon-select-btn';
    button.type = 'button';
    button.className = 'outline-button'
    button.textContent = 'Select Icon';

    controlGroup.appendChild(label);
    controlGroup.appendChild(button);
    (foregroundSection as HTMLElement).appendChild(controlGroup);

    // No longer disabling controls
  }

  private addEmojiSelectorControl(sidebar: HTMLElement): void {
    // Find the foreground section
    const sections = sidebar.querySelectorAll('.control-section');
    let foregroundSection: Element | null = null;

    sections.forEach(section => {
      const h2 = section.querySelector('h2');
      if (h2 && h2.textContent === 'Foreground') {
        foregroundSection = section;
      }
    });

    if (!foregroundSection) return;

    // Create emoji selector control
    const controlGroup = document.createElement('div');
    controlGroup.className = 'control-group';
    controlGroup.dataset.paramId = 'foreground.emoji-selector';

    const label = document.createElement('label');
    label.textContent = 'Select Emoji:';

    const button = document.createElement('button');
    button.id = 'emoji-select-btn';
    button.type = 'button';
    button.className = 'outline-button';
    button.textContent = 'Select Emoji';

    controlGroup.appendChild(label);
    controlGroup.appendChild(button);
    (foregroundSection as HTMLElement).appendChild(controlGroup);

    // No longer disabling controls
  }

  private updateIconSelectorState(): void {
    const config = this.renderer.getConfig();
    const iconSelectorControl = document.querySelector('[data-param-id="foreground.icon-selector"]') as HTMLElement;

    if (iconSelectorControl) {
      // Hide icon selector when foreground type is emoji or emoji-mono
      if (config.foreground.type === 'icon') {
        iconSelectorControl.style.display = '';
      } else {
        iconSelectorControl.style.display = 'none';
      }
    }
  }

  private updateEmojiSelectorState(): void {
    const config = this.renderer.getConfig();
    const emojiSelectorControl = document.querySelector('[data-param-id="foreground.emoji-selector"]') as HTMLElement;

    if (emojiSelectorControl) {
      // Hide emoji selector when foreground type is not emoji or emoji-mono
      if (config.foreground.type === 'emoji' || config.foreground.type === 'emoji-mono') {
        emojiSelectorControl.style.display = '';
      } else {
        emojiSelectorControl.style.display = 'none';
      }
    }
  }

  private initDownloadButtons(): void {
    const downloadButtons = document.querySelectorAll('.download-btn');
    downloadButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const format = target.dataset.format;
        const size = target.dataset.size;

        if (format === 'png' && size) {
          this.exporter.exportPNG(parseInt(size));
        } else if (format === 'svg') {
          this.exporter.exportSVG();
        } else if (format === 'favicon-pack') {
          this.exporter.exportFaviconPack();
        }
      });
    });
  }

  private initIconModal(): void {
    const modal = document.getElementById('icon-modal');
    const openBtn = document.getElementById('icon-select-btn');
    const closeBtn = document.getElementById('icon-modal-close');
    const iconSearch = document.getElementById('icon-search') as HTMLInputElement;

    openBtn?.addEventListener('click', () => {
      modal?.classList.remove('hidden');
      this.renderIconGrid(this.allIcons);
    });

    closeBtn?.addEventListener('click', () => {
      modal?.classList.add('hidden');
    });

    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });

    iconSearch?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const filtered = searchIcons(target.value, this.allIcons);
      this.renderIconGrid(filtered);
    });
  }

  private initEmojiModal(): void {
    const modal = document.getElementById('emoji-modal');
    const openBtn = document.getElementById('emoji-select-btn');
    const closeBtn = document.getElementById('emoji-modal-close');
    const emojiSearch = document.getElementById('emoji-search') as HTMLInputElement;

    // Get all emojis from emojibase
    const emojis = this.getAllEmojis();

    openBtn?.addEventListener('click', () => {
      modal?.classList.remove('hidden');
      this.renderEmojiGrid(emojis);
    });

    closeBtn?.addEventListener('click', () => {
      modal?.classList.add('hidden');
    });

    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });

    emojiSearch?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const query = target.value.toLowerCase();
      const filtered = emojis.filter(emoji =>
        emoji.name.toLowerCase().includes(query) ||
        (emoji.keywords && emoji.keywords.some(k => k.toLowerCase().includes(query)))
      );
      this.renderEmojiGrid(filtered);
    });
  }

  private getAllEmojis(): Array<{emoji: string, name: string, keywords?: string[]}> {
    // Convert emojibase data to our format
    return emojisData
      .filter((item: any) => item.emoji) // Only items with emoji character
      .map((item: any) => ({
        emoji: item.emoji,
        name: item.label || item.annotation || 'Unknown',
        keywords: item.tags || []
      }));
  }

  private renderEmojiGrid(emojis: Array<{emoji: string, name: string, keywords?: string[]}>): void {
    const emojiGrid = document.getElementById('emoji-grid');
    if (!emojiGrid) return;

    emojiGrid.innerHTML = '';

    // Show all emojis - they're lightweight so no lazy loading needed
    emojis.forEach(emojiItem => {
      const item = document.createElement('div');
      item.className = 'picker-item emoji';
      item.textContent = emojiItem.emoji;
      item.title = emojiItem.name; // Tooltip instead of text label

      item.addEventListener('click', () => {
        this.selectEmoji(emojiItem.emoji);
        document.getElementById('emoji-modal')?.classList.add('hidden');
      });

      emojiGrid.appendChild(item);
    });
  }

  private selectEmoji(emoji: string): void {
    const config = this.renderer.getConfig();
    config.foreground.emoji = emoji;
    this.renderer.setConfig(config);

    // Update URL to persist the selection
    updateURL(config);

    this.updatePreviews();
  }

  private renderIconGrid(icons: IconData[]): void {
    const iconGrid = document.getElementById('icon-grid');
    if (!iconGrid) return;

    iconGrid.innerHTML = '';

    // Show all icons with lazy loading for performance
    icons.forEach((icon, index) => {
      const item = document.createElement('div');
      item.className = 'picker-item';
      item.title = icon.displayName; // Tooltip instead of text label

      // Use lazy loading for icons - create a placeholder that loads on intersection
      if (index < 50) {
        // Load first 50 immediately
        item.innerHTML = icon.svg;
      } else {
        // Lazy load the rest
        item.innerHTML = '<div class="icon-placeholder" data-index="' + index + '"></div>';
        item.dataset.iconIndex = index.toString();
      }

      item.addEventListener('click', () => {
        this.selectIcon(icon);
        document.getElementById('icon-modal')?.classList.add('hidden');
      });

      iconGrid.appendChild(item);
    });

    // Set up lazy loading for icons
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const item = entry.target as HTMLElement;
            const index = parseInt(item.dataset.iconIndex || '0');
            if (index >= 50 && icons[index]) {
              const placeholder = item.querySelector('.icon-placeholder');
              if (placeholder) {
                placeholder.outerHTML = icons[index].svg;
                observer.unobserve(item);
              }
            }
          }
        });
      }, {
        root: iconGrid,
        rootMargin: '50px'
      });

      // Observe all lazy items
      iconGrid.querySelectorAll('[data-icon-index]').forEach(item => {
        observer.observe(item);
      });
    } else {
      // Fallback: load all icons immediately if IntersectionObserver not supported
      icons.forEach((icon, index) => {
        if (index >= 50) {
          const item = iconGrid.children[index] as HTMLElement;
          const placeholder = item.querySelector('.icon-placeholder');
          if (placeholder) {
            placeholder.outerHTML = icon.svg;
          }
        }
      });
    }
  }

  private selectIcon(icon: IconData): void {
    const config = this.renderer.getConfig();
    config.foreground.iconName = icon.name;
    this.renderer.setConfig(config);

    // Update URL to persist the selection
    updateURL(config);

    this.updatePreviews();
  }


  private updatePreviews(): void {
    // Use single SVG generation for all previews (more efficient)
    this.renderer.renderToMultipleElements([
      { element: this.preview512, size: 512 },
      { element: this.preview64, size: 64 },
      { element: this.preview32, size: 32 },
      { element: this.preview24, size: 24 },
      { element: this.preview16, size: 16 }
    ]);
  }

  private initConfigModal(): void {
    const modal = document.getElementById('config-modal');
    const openBtn = document.getElementById('config-toggle');
    const closeBtn = document.getElementById('config-modal-close');
    const textarea = document.getElementById('config-textarea') as HTMLTextAreaElement;
    const applyBtn = document.getElementById('config-apply-btn');
    const copyBtn = document.getElementById('config-copy-btn');
    const resetBtn = document.getElementById('config-reset-btn');
    const errorDiv = document.getElementById('config-error');

    openBtn?.addEventListener('click', () => {
      // Get current config and display as formatted JSON
      const config = this.renderer.getConfig();
      textarea.value = JSON.stringify(config, null, 2);
      errorDiv!.style.display = 'none';
      modal?.classList.remove('hidden');
    });

    closeBtn?.addEventListener('click', () => {
      modal?.classList.add('hidden');
    });

    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });

    applyBtn?.addEventListener('click', () => {
      try {
        const newConfig = JSON.parse(textarea.value);
        this.renderer.setConfig(newConfig as IconConfig);
        this.uiBuilder.updateConfig(newConfig);
        updateURL(newConfig);
        this.updatePreviews();
        errorDiv!.style.display = 'none';
        errorDiv!.textContent = '';
      } catch (e) {
        errorDiv!.style.display = 'block';
        errorDiv!.textContent = `Error: ${(e as Error).message}`;
      }
    });

    copyBtn?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(textarea.value);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = originalText;
        }, 2000);
      } catch (e) {
        errorDiv!.style.display = 'block';
        errorDiv!.textContent = 'Failed to copy to clipboard';
      }
    });

    resetBtn?.addEventListener('click', () => {
      // Confirm with user before resetting
      if (confirm('Reset to default settings? This will clear the current configuration.')) {
        // Get default config
        const defaultConfig = buildDefaultConfig();

        // Update textarea to show default config
        textarea.value = JSON.stringify(defaultConfig, null, 2);

        // Update renderer and UI
        this.renderer.setConfig(defaultConfig as IconConfig);
        this.uiBuilder.updateConfig(defaultConfig);

        // Update visibility states
        this.updateIconSelectorState();
        this.updateEmojiSelectorState();

        // Remove URL parameter and update to clean URL
        const url = new URL(window.location.href);
        url.searchParams.delete('c');
        window.history.replaceState({}, '', url.toString());

        // Update previews
        this.updatePreviews();

        // Clear any errors
        errorDiv!.style.display = 'none';
        errorDiv!.textContent = '';
      }
    });
  }

  private initResetButton(): void {
    // This method is no longer needed - reset is now in config modal
  }

  private initThemeToggle(): void {
    const themeToggle = document.getElementById('theme-toggle');

    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
    }

    // Toggle theme on click
    themeToggle?.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');

      // Save preference
      if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
      } else {
        localStorage.setItem('theme', 'light');
      }
    });
  }
}

// Initialize app
new IconGeneratorApp();
