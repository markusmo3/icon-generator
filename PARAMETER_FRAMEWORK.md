# Parameter Framework - Usage Guide

## Overview

This new parameter framework allows you to easily add new configurable parameters without manually creating HTML or wiring up event handlers. Simply define parameters in `parameters.ts` and the UI is automatically generated!

## How to Add a New Parameter

### Step 1: Define the Parameter in `parameters.ts`

Add a new entry to the `PARAMETERS` array:

```typescript
{
  id: 'background.shadowBlur',
  label: 'Shadow Blur',
  type: 'range',
  group: 'Background',
  defaultValue: 0,
  min: 0,
  max: 50,
  step: 1,
  unit: 'px',
  condition: (config) => config.background.type !== 'transparent',
}
```

### Step 2: Update TypeScript Types

Add the new property to `types.ts`:

```typescript
export interface IconConfig {
  background: {
    // ...existing properties...
    shadowBlur?: number;
  };
  // ...
}
```

### Step 3: Use in Renderer

Access the value in `renderer.ts`:

```typescript
const shadowBlur = this.config.background.shadowBlur || 0;
if (shadowBlur > 0) {
  ctx.shadowBlur = shadowBlur;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
}
```

That's it! The UI will be automatically generated and wired up.

## Parameter Types

### 1. **Range Slider**
```typescript
{
  id: 'background.borderRadius',
  type: 'range',
  min: 0,
  max: 50,
  step: 1,
  unit: '%',
}
```

### 2. **Color Picker**
```typescript
{
  id: 'background.color',
  type: 'color',
  defaultValue: '#4a90e2',
}
```

### 3. **Radio Buttons**
```typescript
{
  id: 'foreground.type',
  type: 'radio',
  options: [
    { value: 'text', label: 'Text' },
    { value: 'emoji', label: 'Emoji' },
  ],
}
```

### 4. **Select Dropdown**
```typescript
{
  id: 'palette',
  type: 'select',
  options: [
    { value: 'ocean', label: 'Ocean Blue' },
    { value: 'sunset', label: 'Sunset Orange' },
  ],
}
```

### 5. **Text Input**
```typescript
{
  id: 'foreground.text',
  type: 'text',
  maxLength: 3,
}
```

### 6. **Checkbox**
```typescript
{
  id: 'advanced.antialiasing',
  type: 'checkbox',
  defaultValue: true,
}
```

## Conditional Visibility

Parameters can be shown/hidden based on other values:

```typescript
{
  id: 'background.gradientAngle',
  // ...
  condition: (config) => config.background.type === 'linear-gradient',
}
```

This automatically disables the control when the condition is false.

## Grouping

Parameters are automatically grouped by the `group` property:

```typescript
{
  id: 'background.color',
  group: 'Background',  // Creates a "Background" section
  // ...
}
```

## Nested Property Paths

Use dot notation for nested config properties:

```typescript
{
  id: 'background.shadow.blur',  // Creates config.background.shadow.blur
  // ...
}
```

## Color Palettes

Add new palettes in the `COLOR_PALETTES` object:

```typescript
export const COLOR_PALETTES: Record<string, { bg: string; fg: string; gradient?: string }> = {
  'my-palette': { 
    bg: '#123456', 
    fg: '#ffffff', 
    gradient: '#654321' 
  },
};
```

Then add it to the palette selector options.

## Current Parameters

### Background
- Type (solid, transparent, linear-gradient, radial-gradient)
- Color
- Gradient Color 2 (conditional)
- Gradient Angle (linear gradient only)
- Gradient Size (radial gradient only)
- Border Radius

### Foreground
- Type (text, emoji, emoji-mono, icon)
- Color
- Text/Emoji (conditional)
- Size (percentage)

### Quick Presets
- Color Palette selector

## Benefits

✅ **No manual HTML creation** - UI is generated automatically  
✅ **No manual event wiring** - All handled by the framework  
✅ **Type-safe** - TypeScript ensures correctness  
✅ **Easy to maintain** - All parameters in one place  
✅ **Conditional logic** - Show/hide controls based on other values  
✅ **Consistent UI** - All controls follow the same pattern  

## Future Enhancements

Easy additions you could make:

1. **Padding/Margin controls**
2. **Font family selector**
3. **Icon size independent of text size**
4. **Multiple gradient stops**
5. **Pattern overlays**
6. **Export format options**
7. **Image upload for backgrounds**
8. **Animation settings**

Just define the parameter and implement the rendering logic!
