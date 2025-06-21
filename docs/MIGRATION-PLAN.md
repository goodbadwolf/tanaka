# Tanaka Extension - React Migration Strategy with Rspack

## Overview

Migration strategy using **Rspack** (Rust-based webpack alternative) instead of Vite, while keeping Manifest V2, retaining Yjs, and adopting React.

## Why Rspack for Tanaka

### Advantages over Vite:

1. **Webpack Compatibility**: Easier migration path, mature plugin ecosystem
2. **Rust Performance**: 5-10x faster than webpack, comparable to Vite
3. **Better Code Splitting**: Advanced chunking strategies for extensions
4. **Built-in React Fast Refresh**: First-class React support
5. **Production Optimizations**: Better tree-shaking and minification

## Rspack Configuration

### 1. Initial Setup

```bash
# Remove Vite dependencies
pnpm remove vite @vitejs/plugin-react

# Add Rspack
pnpm add -D @rspack/cli @rspack/core
pnpm add -D @rspack/plugin-react-refresh react-refresh
pnpm add -D @rspack/plugin-html

# Type definitions
pnpm add -D @types/node @types/react @types/react-dom
```

### 2. Rspack Configuration

```typescript
// rspack.config.ts
import { defineConfig } from "@rspack/cli";
import { rspack } from "@rspack/core";
import RefreshPlugin from "@rspack/plugin-react-refresh";
import { resolve } from "path";

const isDev = process.env.NODE_ENV === "development";

export default defineConfig({
  context: __dirname,
  mode: isDev ? "development" : "production",

  entry: {
    background: "./src/background/background.ts",
    "popup/popup": "./src/pages/popup/main.tsx",
    "settings/settings": "./src/pages/settings/main.tsx",
  },

  output: {
    path: resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
    // Prevent runtime chunk that breaks extension CSP
    runtimeChunk: false,
  },

  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    alias: {
      "@": resolve(__dirname, "src"),
      "@env": resolve(
        __dirname,
        `src/config/environments/${process.env.BUILD_ENV || "development"}.ts`
      ),
      // For Preact compatibility
      react: isDev ? "@preact/compat" : "preact/compat",
      "react-dom": isDev ? "@preact/compat" : "preact/compat",
    },
  },

  module: {
    rules: [
      {
        test: /\.(jsx?|tsx?)$/,
        exclude: /node_modules/,
        use: {
          loader: "builtin:swc-loader",
          options: {
            sourceMap: true,
            jsc: {
              parser: {
                syntax: "typescript",
                tsx: true,
              },
              transform: {
                react: {
                  runtime: "automatic",
                  development: isDev,
                  refresh: isDev,
                  // For Preact
                  importSource: "preact",
                },
              },
            },
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: "builtin:lightningcss-loader",
            options: {
              targets: "firefox >= 91",
            },
          },
        ],
        type: "css",
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
        generator: {
          filename: "assets/[name][ext]",
        },
      },
    ],
  },

  plugins: [
    // React Fast Refresh for development
    isDev && new RefreshPlugin(),

    // HTML generation for popup and settings
    new rspack.HtmlRspackPlugin({
      template: "./src/pages/popup/popup.html",
      filename: "popup/popup.html",
      chunks: ["popup/popup"],
      inject: true,
    }),

    new rspack.HtmlRspackPlugin({
      template: "./src/pages/settings/settings.html",
      filename: "settings/settings.html",
      chunks: ["settings/settings"],
      inject: true,
    }),

    // Copy manifest and icons
    new rspack.CopyRspackPlugin({
      patterns: [
        { from: "manifest.json", to: "manifest.json" },
        { from: "icons", to: "icons" },
      ],
    }),

    // Define environment variables
    new rspack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
      "process.env.BUILD_ENV": JSON.stringify(
        process.env.BUILD_ENV || "development"
      ),
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    }),

    // Bundle analyzer for production
    !isDev &&
      new (require("@rspack/plugin-bundle-analyzer").BundleAnalyzerPlugin)({
        analyzerMode: "static",
        openAnalyzer: false,
      }),
  ].filter(Boolean),

  optimization: {
    minimize: !isDev,
    minimizer: [
      new rspack.SwcJsMinimizerRspackPlugin(),
      new rspack.LightningCssMinimizerRspackPlugin(),
    ],
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        // Yjs in separate chunk
        yjs: {
          test: /[\\/]node_modules[\\/]yjs/,
          name: "vendor-yjs",
          priority: 10,
        },
        // React/Preact in separate chunk
        react: {
          test: /[\\/]node_modules[\\/](p?react|scheduler)/,
          name: "vendor-react",
          priority: 9,
        },
        // Other vendors
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendor",
          priority: 8,
        },
      },
    },
  },

  devServer: {
    hot: true,
    port: 3000,
    // Write to disk for extension reloading
    devMiddleware: {
      writeToDisk: true,
    },
  },

  experiments: {
    css: true,
  },
});
```

### 3. Multi-Environment Build Script

```typescript
// scripts/build-rspack.ts
import { spawn } from "child_process";
import { resolve } from "path";

const environments = ["development", "staging", "production"];

async function buildEnvironment(env: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("rspack", ["build"], {
      env: {
        ...process.env,
        NODE_ENV: "production",
        BUILD_ENV: env,
      },
      stdio: "inherit",
    });

    child.on("close", (code) => {
      if (code === 0) {
        console.log(`✓ Built for ${env}`);
        resolve();
      } else {
        reject(new Error(`Build failed for ${env}`));
      }
    });
  });
}

async function buildAll() {
  for (const env of environments) {
    await buildEnvironment(env);
    // Move dist to dist-{env}
    await fs.rename("./dist", `./dist-${env}`);
  }
}

buildAll().catch(console.error);
```

### 4. Package.json Updates

```json
{
  "scripts": {
    "dev": "BUILD_ENV=development rspack serve",
    "dev:staging": "BUILD_ENV=staging rspack serve",
    "build": "rspack build",
    "build:all": "tsx scripts/build-rspack.ts",
    "watch": "rspack build --watch",
    "analyze": "ANALYZE=true rspack build",
    "type-check": "tsc --noEmit",
    "lint": "eslint src/**/*.{ts,tsx}",
    "test": "vitest",
    "extension:run": "web-ext run --source-dir dist",
    "dev:extension": "concurrently \"pnpm watch\" \"pnpm extension:run\""
  },
  "devDependencies": {
    "@rspack/cli": "^0.5.0",
    "@rspack/core": "^0.5.0",
    "@rspack/plugin-react-refresh": "^0.5.0",
    "@rspack/plugin-html": "^0.5.0",
    "@rspack/plugin-bundle-analyzer": "^0.5.0",
    "react-refresh": "^0.14.0",
    "concurrently": "^8.2.0"
  }
}
```

### 5. Development Workflow with Rspack

```typescript
// scripts/dev-server.ts
import { createServer } from "@rspack/dev-server";
import { rspack } from "@rspack/core";
import config from "../rspack.config";

// Custom dev server with extension hot reload
async function startDevServer() {
  const compiler = rspack(config);

  // Watch for changes and notify extension
  compiler.hooks.afterEmit.tap("ExtensionReload", () => {
    // Send reload message to extension
    fetch("http://localhost:9090/reload", { method: "POST" }).catch(() => {});
  });

  const server = await createServer(
    {
      ...config.devServer,
      setupMiddlewares: (middlewares, devServer) => {
        // Add custom reload endpoint
        devServer.app.post("/reload", (req, res) => {
          // Extension reload logic
          res.json({ reloaded: true });
        });
        return middlewares;
      },
    },
    compiler
  );

  await server.start();
}
```

### 6. React Component Structure with Rspack

```tsx
// src/pages/popup/main.tsx
import { render } from "preact";
import { PopupApp } from "./App";
import "./popup.css";

// Enable React DevTools for Preact
if (process.env.NODE_ENV === "development") {
  require("preact/debug");
}

render(<PopupApp />, document.getElementById("root")!);

// Hot Module Replacement
if (module.hot) {
  module.hot.accept("./App", () => {
    const NextApp = require("./App").PopupApp;
    render(<NextApp />, document.getElementById("root")!);
  });
}
```

### 7. Advanced Rspack Features for Extensions

```typescript
// rspack.config.ts - Advanced configuration
export default defineConfig({
  // ... base config ...

  module: {
    rules: [
      // Web Workers for heavy computations
      {
        test: /\.worker\.(js|ts)$/,
        use: {
          loader: "builtin:worker-loader",
          options: {
            inline: "no-fallback",
          },
        },
      },

      // WASM support for future features
      {
        test: /\.wasm$/,
        type: "webassembly/async",
      },
    ],
  },

  plugins: [
    // Content Security Policy plugin
    new ContentSecurityPolicyPlugin({
      policy: {
        "script-src": ["'self'"],
        "object-src": ["'none'"],
        "style-src": ["'self'", "'unsafe-inline'"],
      },
    }),

    // Extension manifest transformer
    new ExtensionManifestPlugin({
      transform: (manifest) => ({
        ...manifest,
        version: process.env.npm_package_version,
        // Add permissions based on features
        permissions: [
          ...manifest.permissions,
          process.env.BUILD_ENV === "development" && "http://localhost/*",
        ].filter(Boolean),
      }),
    }),
  ],

  // Advanced optimizations
  optimization: {
    moduleIds: "deterministic",
    chunkIds: "deterministic",
    sideEffects: false,
    usedExports: true,
    innerGraph: true,
    // Rspack-specific optimizations
    removeAvailableModules: true,
    removeEmptyChunks: true,
    mergeDuplicateChunks: true,
  },
});
```

### 8. Testing Setup with Rspack

```typescript
// vitest.config.ts - Works alongside Rspack
import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      // Match Rspack aliases
      react: "preact/compat",
      "react-dom": "preact/compat",
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    globals: true,
  },
});
```

### 9. Performance Monitoring

```typescript
// rspack.config.ts - Performance budgets
export default defineConfig({
  performance: {
    hints: "warning",
    maxEntrypointSize: 250000, // 250kb
    maxAssetSize: 200000, // 200kb
    assetFilter: (assetFilename) => {
      // Ignore source maps and vendor chunks
      return (
        !assetFilename.endsWith(".map") && !assetFilename.includes("vendor-")
      );
    },
  },

  plugins: [
    // Custom plugin to track build metrics
    new BuildMetricsPlugin({
      onComplete: (stats) => {
        console.log("Build Metrics:", {
          time: stats.time,
          assets: stats.assets.map((a) => ({
            name: a.name,
            size: a.size,
            gzipped: a.gzippedSize,
          })),
        });
      },
    }),
  ],
});
```

### 10. Rspack vs Vite Comparison

| Feature            | Rspack              | Vite       |
| ------------------ | ------------------- | ---------- |
| Build Speed        | ⚡⚡⚡⚡⚡          | ⚡⚡⚡⚡   |
| HMR Speed          | ⚡⚡⚡⚡            | ⚡⚡⚡⚡⚡ |
| Bundle Size        | Better optimization | Good       |
| Plugin Ecosystem   | Webpack-compatible  | Growing    |
| React Support      | First-class         | Via plugin |
| Extension Features | Excellent           | Good       |
| Learning Curve     | Webpack-like        | Simpler    |

## Migration Timeline with Rspack

### Week 1: Setup

- [x] Replace Vite with Rspack
- [x] Configure multi-environment builds
- [x] Set up React/Preact with Fast Refresh
- [x] Implement extension auto-reload

### Week 2: Migration

- [ ] Port popup to React
- [ ] Port settings to React
- [ ] Set up code splitting for Yjs
- [ ] Configure CSP compliance

### Week 3: Optimization

- [ ] Implement lazy loading
- [ ] Add bundle analysis
- [ ] Optimize chunk splitting
- [ ] Add performance monitoring

### Week 4: Production

- [ ] Add source map configuration
- [ ] Set up CI/CD with Rspack
- [ ] Create production builds
- [ ] Performance testing

## Conclusion

Rspack provides:

- **Webpack compatibility** with existing plugin ecosystem
- **Rust performance** for faster builds
- **Better optimization** for production bundles
- **First-class React support** with Fast Refresh
- **Advanced features** like Module Federation for future micro-frontend architecture

The trade-off is slightly more complex configuration compared to Vite, but you gain more control and better optimization capabilities for a production extension.
