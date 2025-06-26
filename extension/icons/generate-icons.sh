#!/bin/bash
set -euo pipefail

# Ensure ImageMagick 'convert' is available
if ! command -v convert >/dev/null 2>&1; then
  echo "Error: 'convert' (ImageMagick) not found; please install it." >&2
  exit 1
fi

# Generate simple placeholder icons for Tanaka extension
# These are basic colored squares with "T" letter

# Generate a simple SVG icon
echo '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
       <rect width="128" height="128" fill="#4A90E2" rx="16"/>
       <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="72" font-weight="bold"
     fill="white" text-anchor="middle" dominant-baseline="middle">T</text>
     </svg>' >icon.svg

for size in 16 32 48 128; do
  convert icon.svg -resize ${size}x${size} icon-${size}.png
done

echo "Generated icon files:"
ls -la ./*.png ./*.svg
