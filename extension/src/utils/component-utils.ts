import type { ReactNode } from 'react';

/**
 * Renders a component that can be either a function returning JSX or JSX itself
 * @param component - The component to render (function or JSX)
 * @returns The rendered component
 */
export function renderComponent(component: ReactNode | (() => ReactNode)): ReactNode {
  return typeof component === 'function' ? component() : component;
}
