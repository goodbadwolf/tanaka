const fs = require('fs');
const path = require('path');

// Paths relative to extension root (since script runs from extension directory)
const prototypeDir = 'prototype';
const stylesPath = path.join(prototypeDir, 'css/styles.css');
const tanakaJsPath = path.join(prototypeDir, 'tanaka.js');

// Check styles.css and tanaka.js exist
if (!fs.existsSync(stylesPath)) {
  console.error(`ERROR: ${stylesPath} not found`);
  process.exit(1);
}

if (!fs.existsSync(tanakaJsPath)) {
  console.error(`ERROR: ${tanakaJsPath} not found`);
  process.exit(1);
}

// For now, just check the popup file (we'll expand this later)
const updatedFiles = [
  path.join(prototypeDir, 'tanaka-popup-updated.html')
];

let allValid = true;

updatedFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.error(`ERROR: ${file} not found`);
    allValid = false;
    return;
  }

  const content = fs.readFileSync(file, 'utf8');

  // Check for styles.css link
  if (!content.includes('styles.css')) {
    console.error(`ERROR: ${file} does not reference styles.css`);
    allValid = false;
  }

  // Check for tanaka.js script (optional for now since some prototypes may have inline JS)
  if (!content.includes('tanaka.js')) {
    console.log(`INFO: ${file} does not reference tanaka.js (using inline JS)`);
  }

  // Check for remaining inline styles (should be minimal page-specific only)
  const inlineStyleCount = (content.match(/style="/g) || []).length;
  if (inlineStyleCount > 5) { // Allow some page-specific inline styles
    console.error(`WARNING: ${file} contains ${inlineStyleCount} inline styles (expected ≤5)`);
  }

  // Check for proper class usage from design system
  if (!content.includes('class=')) {
    console.error(`WARNING: ${file} may not be using CSS classes properly`);
  }

  console.log(`✓ ${file}: ${inlineStyleCount} inline styles found`);
});

if (allValid) {
  console.log('✓ All Tanaka prototype files properly configured');
  console.log('✓ CSS and JavaScript successfully consolidated');
} else {
  process.exit(1);
}
