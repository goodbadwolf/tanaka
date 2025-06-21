# TypeScript Types

This directory contains TypeScript type definitions for the Tanaka extension.

## Generated Types

The `generated/` subdirectory contains TypeScript types automatically generated from Rust models using [ts-rs](https://github.com/Aleph-Alpha/ts-rs).

### Usage

Import all types from the barrel export:

```typescript
import type { Tab, SyncRequest, SyncResponse } from './types/generated';
```

### Generating Types

To regenerate types from Rust models:

```bash
pnpm run gen:api-models
```

This command:

1. Runs `cargo test` to trigger ts-rs type generation
2. Creates individual `.ts` files for each Rust type
3. Generates an `index.ts` barrel export for convenient imports

### Adding New Types

1. Add `#[derive(TS)]` and `#[ts(export)]` to your Rust struct in `server/src/models.rs`
2. Run `pnpm run gen:api-models`
3. The new type will be available in the barrel export automatically
