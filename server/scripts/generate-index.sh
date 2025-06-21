#!/bin/bash

# Script to generate index.ts barrel export for generated TypeScript types

# Get the directory where types are generated
TYPES_DIR="${1:-../../extension/src/types/generated}"

# Check if directory exists
if [ ! -d "$TYPES_DIR" ]; then
    echo "Error: Types directory not found: $TYPES_DIR"
    exit 1
fi

# Create index.ts content
INDEX_FILE="$TYPES_DIR/index.ts"

echo "// This file re-exports all generated types from ts-rs" > "$INDEX_FILE"
echo "// Auto-generated barrel export file" >> "$INDEX_FILE"
echo "" >> "$INDEX_FILE"

# Find all .ts files (excluding index.ts) and generate exports
for file in "$TYPES_DIR"/*.ts; do
    if [ -f "$file" ] && [ "$(basename "$file")" != "index.ts" ]; then
        # Extract filename without extension
        filename=$(basename "$file" .ts)
        echo "export type { $filename } from './$filename';" >> "$INDEX_FILE"
    fi
done

echo "Generated index.ts with $(ls -1 "$TYPES_DIR"/*.ts | grep -v index.ts | wc -l) exports"