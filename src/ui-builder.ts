import {getNestedValue, Parameter, setNestedValue} from './parameters';
import '@simonwep/pickr/dist/themes/classic.min.css';
import Pickr from '@simonwep/pickr';

export type ConfigChangeCallback = (config: any) => void;

export class ParameterUIBuilder {
  private config: any;
  private onChange: ConfigChangeCallback;
  private parameters: Parameter[] = [];

  constructor(initialConfig: any, onChange: ConfigChangeCallback) {
    this.config = initialConfig;
    this.onChange = onChange;
  }

  public buildUI(container: HTMLElement, parameters: Parameter[]): void {
    this.parameters = parameters; // Store for later use in updateControlStates

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

      const labelText = document.createElement('span');
      labelText.textContent = option.label;

      label.appendChild(input);
      label.appendChild(labelText);
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
    button.className = 'color-picker-btn outline-button';
    button.dataset.target = param.id;
    // Set initial color
    button.style.backgroundColor = input.value;
    button.setAttribute('aria-label', 'Pick color');

    inputGroup.appendChild(input);
    inputGroup.appendChild(button);

    container.appendChild(label);
    container.appendChild(inputGroup);

    input.addEventListener('input', () => {
      const color = input.value;
      // Accept hex (6 or 8 chars with alpha) or rgba format
      if (/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(color) || /^rgba?\([\d\s,.]+\)$/.test(color)) {
        setNestedValue(this.config, param.id, color);
        button.style.backgroundColor = color;
        this.handleChange();
      }
    });

    // Create Pickr instance
    const pickr = Pickr.create({
      el: button,
      theme: 'classic',
      default: input.value,
      swatches: [
        // Row 1: All 700 shades (intense/darker colors) - 14 colors + grey
        '#D32F2F', // Red 700
        '#C2185B', // Pink 700
        '#7B1FA2', // Purple 700
        '#303F9F', // Indigo 700
        '#1976D2', // Blue 700
        '#0288D1', // Light Blue 700
        '#00796B', // Teal 700
        '#388E3C', // Green 700
        '#689F38', // Light Green 700
        '#FBC02D', // Yellow 700
        '#FFA000', // Amber 700
        '#F57C00', // Orange 700
        '#E64A19', // Deep Orange 700
        '#5D4037', // Brown 700
        '#616161', // Grey 700
        // Row 2: All 500 shades (medium colors) - 14 colors + grey
        '#F44336', // Red 500
        '#E91E63', // Pink 500
        '#9C27B0', // Purple 500
        '#3F51B5', // Indigo 500
        '#2196F3', // Blue 500
        '#03A9F4', // Light Blue 500
        '#009688', // Teal 500
        '#4CAF50', // Green 500
        '#8BC34A', // Light Green 500
        '#FFEB3B', // Yellow 500
        '#FFC107', // Amber 500
        '#FF9800', // Orange 500
        '#FF5722', // Deep Orange 500
        '#795548', // Brown 500
        '#9E9E9E', // Grey 500
        // Row 3: All 300 shades (pastel/lighter colors) - 14 colors + grey
        '#E57373', // Red 300
        '#F06292', // Pink 300
        '#BA68C8', // Purple 300
        '#7986CB', // Indigo 300
        '#64B5F6', // Blue 300
        '#4FC3F7', // Light Blue 300
        '#4DB6AC', // Teal 300
        '#81C784', // Green 300
        '#AED581', // Light Green 300
        '#FFF176', // Yellow 300
        '#FFD54F', // Amber 300
        '#FFB74D', // Orange 300
        '#FF8A65', // Deep Orange 300
        '#A1887F', // Brown 300
        '#E0E0E0', // Grey 300
      ],
      position: 'bottom-end',
      comparison: false,
      components: {
        preview: false,
        opacity: true,
        hue: true,
        interaction: {
          hex: true,
          rgba: true,
          hsla: true,
          input: true,
          save: false
        }
      }
    });

    pickr.on('change', (color: any) => {
      if (!color) return;

      const rgbaColor = color.toRGBA();
      const alpha = rgbaColor[3];

      let colorValue: string;
      if (alpha < 1) {
        // Use hex with alpha
        colorValue = color.toHEXA().toString();
      } else {
        // Use hex without alpha
        colorValue = color.toHEXA().toString(0); // No alpha
      }

      input.value = colorValue.toUpperCase();
      button.style.backgroundColor = colorValue;
      setNestedValue(this.config, param.id, colorValue);
      this.handleChange();
      pickr.applyColor(true)
    });

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

    const input = document.createElement('textarea');
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

    label.appendChild(document.createTextNode(param.label));
    container.appendChild(label);
    container.appendChild(input);

    return container;
  }

  private handleChange(): void {
    this.updateControlStates();
    this.onChange(this.config);
  }

  private updateControlStates(): void {
    // Update visibility of controls based on their conditions
    document.querySelectorAll('.control-group[data-param-id]').forEach(element => {
      const paramId = (element as HTMLElement).dataset.paramId;
      if (!paramId) return;

      const param = this.findParameter(paramId);
      if (!param) return;

      if (param.condition) {
        const shouldShow = param.condition(this.config);
        if (shouldShow) {
          (element as HTMLElement).style.display = '';
        } else {
          (element as HTMLElement).style.display = 'none';
        }
      }
    });
  }

  private findParameter(paramId: string): Parameter | undefined {
    return this.parameters.find(p => p.id === paramId);
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
