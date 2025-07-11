import { ComponentType, createElement, useEffect, useState } from 'react';

interface UseHashRouterOptions<TRoutes extends Record<string, ComponentType>> {
  defaultRoute?: keyof TRoutes | string;
  routes?: TRoutes;
  strict?: boolean;
}

/**
 * Custom hook for hash-based routing
 * @param options - Configuration options including routes
 * @returns Router object with navigation methods and Component
 */
export function useHashRouter<
  TRoutes extends Record<string, ComponentType> = Record<string, ComponentType>,
>(options: UseHashRouterOptions<TRoutes> = {}) {
  const { defaultRoute = '', routes, strict = false } = options;
  const prefix = '#/';
  // Parse the current hash
  const getHashRoute = () => {
    const hash = window.location.hash;
    if (hash.startsWith(prefix)) {
      return hash.slice(prefix.length) || defaultRoute;
    }
    return defaultRoute;
  };

  const [currentRoute, setCurrentRoute] = useState(getHashRoute);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(getHashRoute());
    };

    window.addEventListener('hashchange', handleHashChange);

    // Handle initial load if hash exists
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [prefix, defaultRoute]);

  const navigate = (route: string) => {
    if (strict && !routes?.[route]) {
      console.warn(`Invalid route: ${route}`);
      return;
    }
    window.location.hash = `${prefix}${route}`;
  };

  const Component =
    routes?.[currentRoute as keyof TRoutes] ?? routes?.[defaultRoute as keyof TRoutes] ?? null;

  const render = (props: Record<string, unknown> = {}) => {
    if (!Component) return null;
    return createElement(Component, props);
  };

  return {
    currentRoute,
    navigate,
    isActive: (route: string) => currentRoute === route,
    Component,
    render,
  };
}

/**
 * Hook for getting hash params (e.g., #/section?id=123)
 */
export function useHashParams() {
  const [params, setParams] = useState<URLSearchParams>(() => {
    const hash = window.location.hash;
    const queryIndex = hash.indexOf('?');
    if (queryIndex > -1) {
      return new URLSearchParams(hash.slice(queryIndex + 1));
    }
    return new URLSearchParams();
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const queryIndex = hash.indexOf('?');
      if (queryIndex > -1) {
        setParams(new URLSearchParams(hash.slice(queryIndex + 1)));
      } else {
        setParams(new URLSearchParams());
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return params;
}
