/**
 * Initialize theme to prevent flash of unstyled content (FOUC)
 * This script should be included in place in all HTML entry points
 */
(() => {
  try {
    if (typeof Storage === 'undefined') {
      console.warn('localStorage not available');
      return;
    }

    const mantineColorScheme = localStorage.getItem('mantine-color-scheme-value');

    const validSchemes = ['light', 'dark', 'auto'];
    if (mantineColorScheme && validSchemes.includes(mantineColorScheme)) {
      document.documentElement.setAttribute('data-mantine-color-scheme', mantineColorScheme);
    } else {
      document.documentElement.setAttribute('data-mantine-color-scheme', 'auto');
    }

    if (mantineColorScheme === 'auto' || !mantineColorScheme) {
      if (window.matchMedia) {
        try {
          const prefersDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const prefersDark = prefersDarkQuery.matches;
          const systemScheme = prefersDark ? 'dark' : 'light';
          document.documentElement.setAttribute('data-mantine-color-scheme', systemScheme);
        } catch (e) {
          document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
        }
      } else {
        document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
      }
    }
  } catch (error) {
    console.error('Error setting initial theme:', error);
    document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
  }
})();
