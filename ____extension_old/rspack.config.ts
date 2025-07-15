import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import HtmlRspackPlugin from 'html-rspack-plugin';
import { dirname, resolve } from 'path';
import * as sass from 'sass';
import { fileURLToPath } from 'url';
import { VueLoaderPlugin } from 'vue-loader';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === 'development';
const buildEnv = process.env.BUILD_ENV || 'development';
const isAnalyze = process.env.RSPACK_BUNDLE_ANALYZE === 'true';

type AppMode = 'extension' | 'playground';

const appMode: AppMode = (process.env.APP_MODE || 'extension') as AppMode;

export default defineConfig({
  context: __dirname,
  mode: isDev ? 'development' : 'production',

  entry: appMode === 'playground'
    ? {
        playground: './src/playground-vue/index.ts',
      }
    : {
        background: './src/background.ts',
        'workers/crdt-worker': './src/workers/crdt-worker.ts',
      },

  output: {
    path: resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },

  resolve: {
    extensions: ['.ts', '.js', '.vue'],
    extensionAlias: {
      '.js': ['.ts', '.js'],
    },
    alias: {
      '@': resolve(__dirname, 'src'),
      '@env': resolve(__dirname, `src/config/environments/${buildEnv}.ts`),
      ...(appMode !== 'extension'
        ? {
            'webextension-polyfill': resolve(__dirname, 'src/browser/__mocks__/mock-polyfill.ts'),
          }
        : {}),
    },
  },

  experiments: {
    css: appMode === 'playground' ? false : true,
  },

  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          experimentalInlineMatchResource: true,
        },
      },
      {
        test: /\.(js|ts)$/,
        exclude: /node_modules/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                decorators: true,
              },
              transform: {
                legacyDecorator: true,
                decoratorMetadata: true,
              },
              target: 'es2020',
            },
          },
        },
      },
      ...(appMode === 'playground'
        ? [
            // Vue CSS handling (scoped styles)
            {
              test: /\.css$/,
              use: ['style-loader', 'css-loader'],
            },
          ]
        : [
            // Regular CSS modules handling
            {
              test: /\.module\.css$/,
              type: 'css/module',
              parser: {
                namedExports: false,
              },
            },
            {
              test: /\.css$/,
              exclude: /\.module\.css$/,
              type: 'css',
            },
          ]),
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                auto: true,
                localIdentName: isDev ? '[name]__[local]--[hash:base64:5]' : '[hash:base64:8]',
              },
              sourceMap: isDev,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  'autoprefixer',
                  'postcss-preset-env',
                  !isDev && ['cssnano', { preset: 'default' }],
                ].filter(Boolean),
              },
              sourceMap: isDev,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              implementation: sass,
              sourceMap: isDev,
            },
          },
        ],
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
    appMode === 'playground' && new VueLoaderPlugin(),

    appMode === 'playground' && new HtmlRspackPlugin({
      template: './src/playground-vue/index.html',
      filename: 'playground/index.html',
      chunks: ['playground'],
      inject: true,
    }),

    appMode !== 'playground' && new rspack.CopyRspackPlugin({
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

    isAnalyze &&
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: 'bundle-report.html',
        openAnalyzer: true,
        generateStatsFile: true,
        statsFilename: 'bundle-stats.json',
      }),
  ].filter(Boolean),

  optimization: {
    minimize: !isDev,
    minimizer: !isDev
      ? [
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
                pure_funcs:
                  buildEnv === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
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
        ]
      : [],
    sideEffects: false, // Enable tree shaking
    usedExports: true, // Mark used exports
    innerGraph: true, // Enable inner graph optimizations
    runtimeChunk: false,
    splitChunks: false,
  },

  devServer: {
    hot: true,
    liveReload: true,
    watchFiles: ['src/**/*.vue'],
    port: 3000,
    client: {
      overlay: {
        errors: true,
        warnings: false,
        runtimeErrors: true,
      },
    },
    devMiddleware: {
      writeToDisk: true,
    },
    historyApiFallback: {
      index: appMode === 'playground' ? '/playground/index.html' : '/index.html',
    },
    open: appMode === 'playground' ? '/playground/index.html' : true,
  },

  devtool: isDev ? 'source-map' : false,
});
