/**
 * DRAMAC Studio Component State Styles
 * 
 * Injects dynamic CSS for component state effects (hover, active, focus).
 * This enables real interactive behavior on the canvas.
 * 
 * @phase STUDIO-22 - Component States
 */

'use client';

import { useMemo } from 'react';
import { useEditorStore } from '@/lib/studio/store';
import type { StudioComponent, TransitionSettings } from '@/types/studio';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert camelCase to kebab-case
 */
function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Format CSS value with appropriate units
 */
function formatCSSValue(property: string, value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  
  if (typeof value === 'number') {
    // Transform properties
    if (property === 'scale' || property === 'scaleX' || property === 'scaleY') {
      return `scale(${value})`;
    }
    if (property === 'rotate') {
      return `rotate(${value}deg)`;
    }
    if (property === 'translateX') {
      return `translateX(${value}px)`;
    }
    if (property === 'translateY') {
      return `translateY(${value}px)`;
    }
    if (property === 'skewX') {
      return `skewX(${value}deg)`;
    }
    if (property === 'skewY') {
      return `skewY(${value}deg)`;
    }
    if (property === 'opacity') {
      return String(value);
    }
    // Pixel values
    return `${value}px`;
  }
  
  return String(value);
}

/**
 * Generate CSS from state overrides
 */
function generateStateOverrideCSS(
  overrides: Record<string, unknown>
): string {
  const declarations: string[] = [];
  const transforms: string[] = [];
  
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined || value === null) continue;
    
    const cssValue = formatCSSValue(key, value);
    if (!cssValue) continue;
    
    // Collect transform properties
    if (['scale', 'scaleX', 'scaleY', 'rotate', 'translateX', 'translateY', 'skewX', 'skewY'].includes(key)) {
      transforms.push(cssValue);
    } else {
      // Regular properties
      const cssProperty = camelToKebab(key);
      declarations.push(`${cssProperty}: ${cssValue}`);
    }
  }
  
  // Combine transforms
  if (transforms.length > 0) {
    declarations.push(`transform: ${transforms.join(' ')}`);
  }
  
  return declarations.join('; ');
}

/**
 * Generate transition CSS
 */
function generateTransitionCSS(transition?: TransitionSettings): string {
  if (!transition || transition.property === 'none') {
    return 'transition: all 200ms ease-out';
  }
  
  let property = transition.property;
  if (property === 'colors') {
    property = 'background-color, color, border-color' as never;
  } else if (property === 'shadow') {
    property = 'box-shadow, text-shadow' as never;
  }
  
  const delay = transition.delay ? ` ${transition.delay}ms` : '';
  return `transition: ${property} ${transition.duration}ms ${transition.easing}${delay}`;
}

/**
 * Generate CSS for a single component's states
 */
function generateComponentStateCSS(component: StudioComponent): string {
  if (!component.states) return '';
  
  const lines: string[] = [];
  const selector = `[data-component-id="${component.id}"]`;
  
  // Add transition to the base element
  const transitionCSS = generateTransitionCSS(component.transition);
  lines.push(`${selector} { ${transitionCSS}; }`);
  
  // Hover state
  if (component.states.hover && Object.keys(component.states.hover).length > 0) {
    const css = generateStateOverrideCSS(component.states.hover);
    if (css) {
      lines.push(`${selector}:hover { ${css}; }`);
    }
  }
  
  // Active state
  if (component.states.active && Object.keys(component.states.active).length > 0) {
    const css = generateStateOverrideCSS(component.states.active);
    if (css) {
      lines.push(`${selector}:active { ${css}; }`);
    }
  }
  
  // Focus state
  if (component.states.focus && Object.keys(component.states.focus).length > 0) {
    const css = generateStateOverrideCSS(component.states.focus);
    if (css) {
      lines.push(`${selector}:focus, ${selector}:focus-visible { ${css}; }`);
    }
  }
  
  return lines.join('\n');
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Renders a <style> tag with all component state CSS
 */
export function ComponentStateStyles() {
  const components = useEditorStore((s) => s.data.components);
  
  // Generate CSS for all components with states
  const stateCSS = useMemo(() => {
    const cssBlocks: string[] = [
      '/* DRAMAC Studio - Component State Styles */',
      '/* These styles enable hover, active, and focus effects */',
    ];
    
    for (const component of Object.values(components)) {
      if (component.states && Object.keys(component.states).length > 0) {
        const css = generateComponentStateCSS(component);
        if (css) {
          cssBlocks.push(`/* ${component.type} - ${component.id} */`);
          cssBlocks.push(css);
        }
      }
    }
    
    return cssBlocks.join('\n');
  }, [components]);
  
  // Don't render if no state CSS needed
  if (!stateCSS.includes(':hover') && !stateCSS.includes(':active') && !stateCSS.includes(':focus')) {
    return null;
  }
  
  return (
    <style
      dangerouslySetInnerHTML={{ __html: stateCSS }}
      data-studio-state-styles
    />
  );
}
