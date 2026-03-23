const fs = require('fs');
const c = fs.readFileSync('node_modules/react-dom/cjs/react-dom-client.production.js', 'utf8');
const lines = c.split('\n');

// Find line with error 310 and show surrounding context
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('formatProdErrorMessage(310)')) {
    const start = Math.max(0, i - 20);
    const end = Math.min(lines.length, i + 5);
    console.log(`\n=== Context around line ${i+1} (error 310) ===\n`);
    for (let j = start; j < end; j++) {
      const marker = j === i ? ' >>>' : '    ';
      console.log(`${marker} ${j+1}: ${lines[j]}`);
    }
  }
}

// Also check the development version for the full error message
try {
  const dev = fs.readFileSync('node_modules/react-dom/cjs/react-dom-client.development.js', 'utf8');
  const devLines = dev.split('\n');
  // Search for "more hooks" or "Rendered more" in dev code
  for (let i = 0; i < devLines.length; i++) {
    if (devLines[i].includes('more hooks') || devLines[i].includes('Rendered more') || devLines[i].includes('fewer hooks') || devLines[i].includes('Rendered fewer')) {
      const start = Math.max(0, i - 3);
      const end = Math.min(devLines.length, i + 3);
      console.log(`\n=== Dev message at line ${i+1} ===`);
      for (let j = start; j < end; j++) {
        console.log(`  ${j+1}: ${devLines[j]}`);
      }
    }
  }
} catch(e) {
  console.log('Could not read dev file:', e.message);
}
