import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import RefreshPlugin from '@rspack/plugin-react-refresh';
import HtmlRspackPlugin from 'html-rspack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === 'development';
const buildEnv = process.env.BUILD_ENV || 'development';
const isAnalyze = process.env.RSPACK_BUNDLE_ANALYZE === 'true';
const isWebapp = process.env.WEBAPP_MODE === 'true';

export default defineConfig({
  context: __dirname,
  mode: isDev ? 'development' : 'production',

  entry: {
    background: './src/background.ts',
    'popup/popup': './src/popup/popup.tsx',
    'settings/settings': './src/settings/settings.tsx',
    webapp: './src/webapp/index.tsx',
  },

  output: {
    path: resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    extensionAlias: {
      '.js': ['.ts', '.js'],
      '.jsx': ['.tsx', '.jsx']
    },
    alias: {
      '@': resolve(__dirname, 'src'),
      '@env': resolve(__dirname, `src/config/environments/${buildEnv}.ts`),
      'react': 'preact/compat',
      'react-dom': 'preact/compat',
      ...(isWebapp ? {
        'webextension-polyfill': resolve(__dirname, 'src/browser/mock-polyfill.ts'),
      } : {}),
    },
  },

  module: {
    rules: [
      {
        test: /\.(jsx?|tsx?)$/,
        exclude: /node_modules/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
                decorators: true,
              },
              transform: {
                legacyDecorator: true,
                decoratorMetadata: true,
                react: {
                  runtime: 'automatic',
                  importSource: 'preact',
                  development: isDev,
                  refresh: isDev,
                },
              },
              target: 'es2020',
            },
          },
        },
      },
      {
        test: /\.module\.css$/,
        type: 'css/module',
      },
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        type: 'css',
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name][ext]',
        },
      },
    ],
  },

  plugins: [
    isDev && new RefreshPlugin(),

    new HtmlRspackPlugin({
      template: './src/popup/popup-template.html',
      filename: 'popup/popup.html',
      chunks: ['popup/popup'],
      inject: false,
    }),

    new HtmlRspackPlugin({
      template: './src/settings/settings-template.html',
      filename: 'settings/settings.html',
      chunks: ['settings/settings'],
      inject: false,
    }),

    new HtmlRspackPlugin({
      template: './src/webapp/index.html',
      filename: 'index.html',
      chunks: ['webapp'],
      inject: true,
    }),

    new rspack.CopyRspackPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'icons', to: 'icons' },
      ],
    }),

    new rspack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.BUILD_ENV': JSON.stringify(buildEnv),
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    }),

    isAnalyze && new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html',
      openAnalyzer: true,
      generateStatsFile: true,
      statsFilename: 'bundle-stats.json',
    }),
  ].filter(Boolean),

  optimization: {
    minimize: !isDev,
    minimizer: !isDev ? [
      new rspack.SwcJsMinimizerRspackPlugin({
        minimizerOptions: {
          format: {
            comments: false,
            ascii_only: true,
          },
          compress: {
            passes: 2,
            drop_console: buildEnv === 'production',
            drop_debugger: true,
            pure_funcs: buildEnv === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
            collapse_vars: true,
            reduce_vars: true,
            sequences: true,
            dead_code: true,
            conditionals: true,
            evaluate: true,
            if_return: true,
            join_vars: true,
            loops: true,
            unused: true,
          },
          mangle: {
            toplevel: true,
            keep_classnames: false,
            keep_fnames: false,
            safari10: true,
          },
        },
      }),
    ] : [],
    sideEffects: false, // Enable tree shaking
    usedExports: true, // Mark used exports
    innerGraph: true, // Enable inner graph optimizations
    runtimeChunk: false,
    splitChunks: false,
  },

  devServer: {
    hot: true,
    port: 3000,
    devMiddleware: {
      writeToDisk: true,
    },
    historyApiFallback: {
      index: '/index.html',
    },
    open: true,
  },

  devtool: isDev ? 'source-map' : false,

  experiments: {
    css: true,
  },
});
