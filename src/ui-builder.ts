import {getNestedValue, Parameter, setNestedValue} from './parameters';

export type ConfigChangeCallback = (config: any) => void;

export class ParameterUIBuilder {
  private config: any;
  private onChange: ConfigChangeCallback;
  private colorPickerModal: HTMLElement | null = null;
  private currentColorTarget: string | null = null;

  constructor(initialConfig: any, onChange: ConfigChangeCallback) {
    this.config = initialConfig;
    this.onChange = onChange;
  }

  public buildUI(container: HTMLElement, parameters: Parameter[]): void {
    // Group parameters
    const groups = new Map<string, Parameter[]>();
    parameters.forEach(param => {
      if (!groups.has(param.group)) {
        groups.set(param.group, []);
      }
      groups.get(param.group)!.push(param);
    });

    // Build UI for each group
    groups.forEach((params, groupName) => {
      const section = document.createElement('section');
      section.className = 'control-section';

      const heading = document.createElement('h2');
      heading.textContent = groupName;
      section.appendChild(heading);

      params.forEach(param => {
        const controlGroup = this.buildControl(param);
        section.appendChild(controlGroup);
      });

      container.appendChild(section);
    });

    // Initialize color picker modal
    this.initColorPickerModal();

    // Update visibility/enabled states
    this.updateControlStates();
  }

  private buildControl(param: Parameter): HTMLElement {
    const container = document.createElement('div');
    container.className = 'control-group';
    container.dataset.paramId = param.id;

    switch (param.type) {
      case 'radio':
        return this.buildRadioControl(param, container);
      case 'color':
        return this.buildColorControl(param, container);
      case 'range':
        return this.buildRangeControl(param, container);
      case 'select':
        return this.buildSelectControl(param, container);
      case 'text':
        return this.buildTextControl(param, container);
      case 'checkbox':
        return this.buildCheckboxControl(param, container);
      default:
        return container;
    }
  }

  private buildRadioControl(param: Parameter & { options: any[] }, container: HTMLElement): HTMLElement {
    const radioGroup = document.createElement('div');
    radioGroup.className = 'radio-group';

    param.options.forEach(option => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = param.id;
      input.value = option.value;
      input.checked = getNestedValue(this.config, param.id) === option.value;

      input.addEventListener('change', () => {
        setNestedValue(this.config, param.id, option.value);
        this.handleChange();
      });

      label.appendChild(input);
      label.appendChild(document.createTextNode(option.label));
      radioGroup.appendChild(label);
    });

    container.appendChild(radioGroup);
    return container;
  }

  private buildColorControl(param: Parameter, container: HTMLElement): HTMLElement {
    const label = document.createElement('label');
    label.textContent = param.label + ':';

    const inputGroup = document.createElement('div');
    inputGroup.className = 'color-input-group';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'color-hex-input';
    input.value = getNestedValue(this.config, param.id);
    input.placeholder = '#000000 or rgba(...)';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'color-picker-btn';
    button.dataset.target = param.id;
    // Set initial color
    button.style.backgroundColor = input.value;
    button.setAttribute('aria-label', 'Pick color');

    input.addEventListener('input', () => {
      const color = input.value;
      // Accept hex (6 or 8 chars with alpha) or rgba format
      if (/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(color) || /^rgba?\([\d\s,.]+\)$/.test(color)) {
        setNestedValue(this.config, param.id, color);
        button.style.backgroundColor = color;
        this.handleChange();
      }
    });

    button.addEventListener('click', () => {
      this.openColorPicker(param.id, input);
    });

    inputGroup.appendChild(input);
    inputGroup.appendChild(button);

    container.appendChild(label);
    container.appendChild(inputGroup);

    return container;
  }

  private buildRangeControl(param: Parameter & { min: number; max: number; step?: number; unit?: string }, container: HTMLElement): HTMLElement {
    const label = document.createElement('label');
    label.textContent = param.label + ':';

    const rangeWrapper = document.createElement('div');
    rangeWrapper.className = 'range-wrapper';

    const input = document.createElement('input');
    input.type = 'range';
    input.min = param.min.toString();
    input.max = param.max.toString();
    input.step = (param.step || 1).toString();
    input.value = getNestedValue(this.config, param.id).toString();

    const valueSpan = document.createElement('span');
    valueSpan.className = 'range-value';
    valueSpan.textContent = input.value + (param.unit || '');

    input.addEventListener('input', () => {
      const value = parseFloat(input.value);
      valueSpan.textContent = input.value + (param.unit || '');
      setNestedValue(this.config, param.id, value);
      this.handleChange();
    });

    rangeWrapper.appendChild(input);
    rangeWrapper.appendChild(valueSpan);

    container.appendChild(label);
    container.appendChild(rangeWrapper);

    return container;
  }

  private buildSelectControl(param: Parameter & { options: any[] }, container: HTMLElement): HTMLElement {
    const label = document.createElement('label');
    label.textContent = param.label + ':';

    const select = document.createElement('select');
    select.className = 'select-input';

    param.options.forEach(option => {
      const optionEl = document.createElement('option');
      optionEl.value = option.value;
      optionEl.textContent = option.label;
      optionEl.selected = getNestedValue(this.config, param.id) === option.value;
      select.appendChild(optionEl);
    });

    select.addEventListener('change', () => {
      setNestedValue(this.config, param.id, select.value);
      this.handleChange();
    });

    container.appendChild(label);
    container.appendChild(select);
    return container;
  }

  private buildTextControl(param: Parameter & { maxLength?: number }, container: HTMLElement): HTMLElement {
    const label = document.createElement('label');
    label.textContent = param.label + ':';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = getNestedValue(this.config, param.id);
    if (param.maxLength) input.maxLength = param.maxLength;

    input.addEventListener('input', () => {
      setNestedValue(this.config, param.id, input.value);
      this.handleChange();
    });

    container.appendChild(label);
    container.appendChild(input);
    return container;
  }

  private buildCheckboxControl(param: Parameter, container: HTMLElement): HTMLElement {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = getNestedValue(this.config, param.id);

    input.addEventListener('change', () => {
      setNestedValue(this.config, param.id, input.checked);
      this.handleChange();
    });

    label.appendChild(input);
    label.appendChild(document.createTextNode(param.label));
    container.appendChild(label);

    return container;
  }

  private handleChange(): void {
    this.updateControlStates();
    this.onChange(this.config);
  }

  private updateControlStates(): void {
    // All controls are always enabled - no conditional disabling
  }

  private initColorPickerModal(): void {
    this.colorPickerModal = document.getElementById('color-picker-modal');
    const container = document.getElementById('color-picker-container');

    if (!container) return;

    // Create the HSLA string color picker element
    const colorPicker = document.createElement('hsla-string-color-picker') as any;
    container.innerHTML = '';
    container.appendChild(colorPicker);

    // Update preview as user picks color
    colorPicker.addEventListener('color-changed', (event: any) => {
      if (!this.currentColorTarget) return;

      const button = document.querySelector(`[data-target="${this.currentColorTarget}"]`) as HTMLButtonElement;
      const input = button?.previousElementSibling as HTMLInputElement;
      if (input) {
        const hsla = event.detail.value;
        let colorValue = this.hslaToHex(hsla);
        input.value = colorValue.toUpperCase();
        if (button) {
          button.style.backgroundColor = colorValue;
        }

        // Trigger input event to update the config
        const inputEvent = new Event('input', { bubbles: true });
        input.dispatchEvent(inputEvent);
      }
    });

    // Close on click outside the popup
    const closeModal = () => {
      this.colorPickerModal?.classList.add('hidden');
      this.currentColorTarget = null;
    };

    document.addEventListener('click', (e) => {
      if (!this.colorPickerModal?.classList.contains('hidden')) {
        const pickerContainer = document.getElementById('color-picker-container');
        if (pickerContainer && !pickerContainer.contains(e.target as Node)) {
          // Check if click is not on a color picker button
          if (!(e.target as Element).closest('.color-picker-btn')) {
            closeModal();
          }
        }
      }
    });
  }

  private openColorPicker(paramId: string, input: HTMLInputElement): void {
    this.currentColorTarget = paramId;

    const colorPicker = document.querySelector('#color-picker-container hsla-string-color-picker') as any;
    if (colorPicker) {
      const colorValue = input.value;
      let hsla: string;

      // Check if it's rgba format
      if (colorValue.startsWith('rgba(') || colorValue.startsWith('rgb(')) {
        hsla = this.rgbaToHsla(colorValue);
      } else {
        // Convert hex to HSLA
        hsla = this.hexToHsla(colorValue);
      }

      colorPicker.color = hsla;
    }

    this.colorPickerModal?.classList.remove('hidden');
  }

  // Convert rgba to HSLA string
  private rgbaToHsla(rgba: string): string {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
    if (!match) return 'hsla(0, 0%, 0%, 1)';

    const r = parseInt(match[1]) / 255;
    const g = parseInt(match[2]) / 255;
    const b = parseInt(match[3]) / 255;
    const a = match[4] ? parseFloat(match[4]) : 1;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return `hsla(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%, ${a})`;
  }

  // Convert hex to HSLA string
  private hexToHsla(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    let a = 1
    const maybeAlpha = hex.slice(7, 9)
    if (maybeAlpha) {
      a = parseInt(maybeAlpha, 16) / 255;
    }

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return `hsla(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%, ${a})`;
  }

  // Convert HSLA string to hex
  private hslaToHex(hsla: string): string {
    const match = hsla.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%,\s*(\d+.?\d*)/);
    if (!match) return '#000000';

    const h = parseInt(match[1]) / 360;
    const s = parseInt(match[2]) / 100;
    const l = parseInt(match[3]) / 100;
    const a = parseFloat(match[4]);

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    if (a == 1) {
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    } else {
      return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`;
    }
  }


  private updateInputValues(): void {
    // Update all color inputs to reflect config changes
    document.querySelectorAll('.color-hex-input').forEach((input) => {
      const button = input.nextElementSibling as HTMLButtonElement;
      if (button && button.dataset.target) {
        const value = getNestedValue(this.config, button.dataset.target);
        (input as HTMLInputElement).value = value;
        // Update button color as well
        if (button.classList.contains('color-picker-btn')) {
          button.style.backgroundColor = value;
        }
      }
    });
  }

  public updateConfig(newConfig: any): void {
    this.config = newConfig;
    this.updateInputValues();
    this.updateControlStates();
  }
}
