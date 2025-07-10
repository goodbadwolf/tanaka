/**
 * Gets a display name for a component, useful for HOCs and debugging.
 * @param Component - The component to get the display name from
 * @param fallback - Fallback name if component has no name (default: 'Component')
 */
export function getComponentDisplayName<T extends { displayName?: string; name?: string }>(
  Component: T,
  fallback = 'UnnamedComponent',
): string {
  return Component.displayName ?? Component.name ?? fallback;
}

/**
 * Creates a wrapped display name for HOCs.
 * @param hocName - Name of the HOC (e.g., 'withTheme')
 * @param Component - The wrapped component
 * @example
 * // Returns "withTheme(MyComponent)"
 * getWrappedDisplayName('withTheme', MyComponent)
 */
export function getWrappedDisplayName<T extends { displayName?: string; name?: string }>(
  hocName: string,
  Component: T,
): string {
  return `${hocName}(${getComponentDisplayName(Component)})`;
}

/**
 * Sets the display name on a wrapped component for HOCs.
 * @param hocName - Name of the HOC (e.g., 'withTheme')
 * @param OriginalComponent - The original component being wrapped
 * @param WrappedComponent - The component to set the display name on
 * @returns The wrapped component with display name set
 * @example
 * return setWrappedDisplayName('withTheme', Component, ThemedComponent);
 */
export function setWrappedDisplayName<
  T extends { displayName?: string },
  U extends { displayName?: string; name?: string },
>(hocName: string, OriginalComponent: U, WrappedComponent: T): T {
  WrappedComponent.displayName = getWrappedDisplayName(hocName, OriginalComponent);
  return WrappedComponent;
}
