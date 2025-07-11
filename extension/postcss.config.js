const isProduction = process.env.NODE_ENV === 'production';

export default {
  plugins: [
    'autoprefixer',
    ['postcss-preset-env', {
      stage: 3,
      features: {
        'nesting-rules': true,
        'custom-properties': true,
        'custom-media-queries': true,
      },
    }],
    // Only run PurgeCSS in production builds
    isProduction && ['@fullhuman/postcss-purgecss', {
      content: [
        './src/**/*.{js,jsx,ts,tsx}',
        './src/**/*.html',
      ],
      defaultExtractor: content => {
        // Extract all possible class names, including Mantine's dynamic classes
        const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];
        const innerMatches = content.match(/[^<>"'`\s.()]*[^<>"'`\s.():]/g) || [];
        return broadMatches.concat(innerMatches);
      },
      safelist: {
        // Always keep these patterns
        standard: [
          /^tnk-/,           // All our custom classes
          /^mantine-/,       // All Mantine classes
          /^theme-/,         // Theme classes
          /data-/,           // Data attributes
          /is-/,             // State classes
          /--/,              // BEM modifiers
        ],
        deep: [
          /^mantine/,        // Deep match for all Mantine classes
        ],
        greedy: [
          /active$/,
          /disabled$/,
          /error$/,
          /focus/,
          /hover/,
          /loading$/,
        ],
      },
      // CSS variables should always be kept
      variables: true,
      // Keep all keyframes
      keyframes: true,
      // Keep font faces
      fontFace: true,
    }],
  ].filter(Boolean),
};
