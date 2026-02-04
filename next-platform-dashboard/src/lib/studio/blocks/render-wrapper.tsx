/**
 * DRAMAC Studio - Unified Render Wrapper
 * 
 * Wraps all component renders with universal features:
 * - Animations
 * - Hover effects
 * - Visibility controls
 * - Custom spacing
 * - Accessibility attributes
 * 
 * @phase STUDIO-30 - Component Superpowers
 */

"use client";

import React, { useMemo, forwardRef, type ElementType } from "react";
import { cn } from "@/lib/utils";
import { 
  type UniversalProps, 
  type AnimationPreset,
  type AnimationDelay,
  type HoverEffect,
  getUniversalClasses, 
  getUniversalStyles 
} from "../registry/universal-props";

// =============================================================================
// TYPES
// =============================================================================

type HTMLTag = "div" | "section" | "article" | "aside" | "header" | "footer" | "main" | "nav" | "span";

interface RenderWrapperProps extends UniversalProps {
  children: React.ReactNode;
  componentType: string;
  componentId: string;
  className?: string;
  style?: React.CSSProperties;
  as?: HTMLTag;
}

// =============================================================================
// RENDER WRAPPER COMPONENT
// =============================================================================

/**
 * RenderWrapper - Wraps component renders with universal features
 * 
 * Apply to any component to add animation, hover, visibility, and spacing features.
 */
export const RenderWrapper = forwardRef<HTMLElement, RenderWrapperProps>(
  function RenderWrapper(
    {
      children,
      componentType,
      componentId,
      className,
      style,
      as = "div",
      // Universal props
      animation,
      animationDelay,
      animationDuration,
      hover,
      hideOnMobile,
      hideOnTablet,
      hideOnDesktop,
      marginTop,
      marginBottom,
      paddingTop,
      paddingBottom,
      customClassName,
      customId,
      ariaLabel,
    },
    ref
  ) {
    // Compute classes
    const computedClasses = useMemo(() => {
      const universalClasses = getUniversalClasses({
        animation,
        animationDelay,
        hover,
        hideOnMobile,
        hideOnTablet,
        hideOnDesktop,
        customClassName,
      });
      
      return cn(universalClasses, className);
    }, [
      animation, 
      animationDelay, 
      hover, 
      hideOnMobile, 
      hideOnTablet, 
      hideOnDesktop, 
      customClassName, 
      className
    ]);
    
    // Compute styles
    const computedStyles = useMemo(() => {
      const universalStyles = getUniversalStyles({
        animationDuration,
        marginTop,
        marginBottom,
        paddingTop,
        paddingBottom,
      });
      
      return { ...universalStyles, ...style };
    }, [
      animationDuration, 
      marginTop, 
      marginBottom, 
      paddingTop, 
      paddingBottom, 
      style
    ]);
    
    // Create element with dynamic tag
    const Component = as;
    
    return (
      <Component
        ref={ref as React.Ref<HTMLDivElement>}
        className={computedClasses || undefined}
        style={Object.keys(computedStyles).length > 0 ? computedStyles : undefined}
        id={customId || undefined}
        aria-label={ariaLabel || undefined}
        data-component-type={componentType}
        data-component-id={componentId}
      >
        {children}
      </Component>
    );
  }
);

// =============================================================================
// HOC FOR UNIVERSAL PROPS
// =============================================================================

/**
 * withUniversalProps - HOC to add universal props to any render component
 * 
 * Wraps a component with RenderWrapper to apply universal features.
 * 
 * @example
 * const EnhancedHero = withUniversalProps(HeroRender, "Hero");
 */
export function withUniversalProps<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentType: string
): React.FC<P & UniversalProps & { componentId: string }> {
  function WithUniversalProps(props: P & UniversalProps & { componentId: string }) {
    const {
      componentId,
      animation,
      animationDelay,
      animationDuration,
      hover,
      hideOnMobile,
      hideOnTablet,
      hideOnDesktop,
      marginTop,
      marginBottom,
      paddingTop,
      paddingBottom,
      customClassName,
      customId,
      ariaLabel,
      ...componentProps
    } = props as P & UniversalProps & { componentId: string };
    
    return (
      <RenderWrapper
        componentType={componentType}
        componentId={componentId}
        animation={animation as AnimationPreset | undefined}
        animationDelay={animationDelay as AnimationDelay | undefined}
        animationDuration={animationDuration as number | undefined}
        hover={hover as HoverEffect | undefined}
        hideOnMobile={hideOnMobile as boolean | undefined}
        hideOnTablet={hideOnTablet as boolean | undefined}
        hideOnDesktop={hideOnDesktop as boolean | undefined}
        marginTop={marginTop as number | undefined}
        marginBottom={marginBottom as number | undefined}
        paddingTop={paddingTop as number | undefined}
        paddingBottom={paddingBottom as number | undefined}
        customClassName={customClassName as string | undefined}
        customId={customId as string | undefined}
        ariaLabel={ariaLabel as string | undefined}
      >
        <WrappedComponent {...(componentProps as unknown as P)} />
      </RenderWrapper>
    );
  }
  
  WithUniversalProps.displayName = `WithUniversalProps(${componentType})`;
  return WithUniversalProps;
}

// =============================================================================
// UTILITY HOOK
// =============================================================================

/**
 * useUniversalProps - Hook to compute universal classes and styles
 * 
 * Use this in custom render components to apply universal props directly.
 * 
 * @example
 * function MyComponent(props) {
 *   const { classes, styles, attrs } = useUniversalProps(props);
 *   return <div className={cn(classes, "my-styles")} style={styles} {...attrs}>...</div>;
 * }
 */
export function useUniversalProps(props: Partial<UniversalProps> & { componentId?: string }) {
  const classes = useMemo(() => getUniversalClasses(props), [
    props.animation,
    props.animationDelay,
    props.hover,
    props.hideOnMobile,
    props.hideOnTablet,
    props.hideOnDesktop,
    props.customClassName,
  ]);
  
  const styles = useMemo(() => getUniversalStyles(props), [
    props.animationDuration,
    props.marginTop,
    props.marginBottom,
    props.paddingTop,
    props.paddingBottom,
  ]);
  
  const attrs = useMemo(() => ({
    id: props.customId || undefined,
    "aria-label": props.ariaLabel || undefined,
    "data-component-id": props.componentId || undefined,
  }), [props.customId, props.ariaLabel, props.componentId]);
  
  return { classes, styles, attrs };
}
