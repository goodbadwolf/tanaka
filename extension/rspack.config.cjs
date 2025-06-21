const { defineConfig } = require('@rspack/cli');
const { rspack } = require('@rspack/core');
const RefreshPlugin = require('@rspack/plugin-react-refresh');
const HtmlRspackPlugin = require('html-rspack-plugin');
const { resolve } = require('path');

const isDev = process.env.NODE_ENV === 'development';
const buildEnv = process.env.BUILD_ENV || 'development';

module.exports = defineConfig({
  context: __dirname,
  mode: isDev ? 'development' : 'production',

  entry: {
    background: './src/background.ts',
    'popup/popup': './src/popup/popup.tsx',
    'settings/settings': './src/settings/settings.tsx',
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
              },
              transform: {
                react: {
                  runtime: 'automatic',
                  importSource: 'preact',
                  development: isDev,
                  refresh: isDev,
                },
              },
            },
          },
        },
      },
      {
        test: /\.css$/,
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
      template: './src/popup/popup.html',
      filename: 'popup/popup.html',
      chunks: ['popup/popup'],
      inject: true,
    }),

    new HtmlRspackPlugin({
      template: './src/settings/settings.html',
      filename: 'settings/settings.html',
      chunks: ['settings/settings'],
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
  ].filter(Boolean),

  optimization: {
    minimize: !isDev,
    runtimeChunk: false,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        yjs: {
          test: /[\\/]node_modules[\\/]yjs/,
          name: 'vendor-yjs',
          priority: 10,
        },
        preact: {
          test: /[\\/]node_modules[\\/]preact/,
          name: 'vendor-preact',
          priority: 9,
        },
        polyfill: {
          test: /[\\/]node_modules[\\/]webextension-polyfill/,
          name: 'vendor-polyfill',
          priority: 8,
        },
      },
    },
  },

  devServer: {
    hot: true,
    port: 3000,
    devMiddleware: {
      writeToDisk: true,
    },
  },

  devtool: isDev ? 'source-map' : false,

  experiments: {
    css: true,
  },
});