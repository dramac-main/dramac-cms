const fs = require("fs");
const c = fs.readFileSync(
  "node_modules/react-dom/cjs/react-dom-client.production.js",
  "utf8",
);

// Search for error 310 directly
const lines = c.split("\n");
for (let i = 0; i < lines.length; i++) {
  if (
    lines[i].includes("310") &&
    (lines[i].includes("Error") ||
      lines[i].includes("error") ||
      lines[i].includes("throw"))
  ) {
    console.log(`Line ${i + 1}: ${lines[i].substring(0, 200)}`);
  }
}

// Check format of error throwing
const throwPatterns = c.match(/throw.{0,50}310/g);
if (throwPatterns) {
  console.log("\nThrow patterns with 310:");
  throwPatterns.forEach((p) => console.log("  " + p));
}

// Check for formatProdErrorMessage or similar
const errorFunc = c.match(/(formatProdErrorMessage|Error\().{0,30}310/g);
if (errorFunc) {
  console.log("\nError function patterns with 310:");
  errorFunc.forEach((p) => console.log("  " + p));
}

// Check what the error URL format looks like
const urlPattern = c.match(/react\.dev\/errors\/\d+/g);
if (urlPattern) {
  console.log("\nReact error URLs found (sample):");
  const unique = [...new Set(urlPattern)].slice(0, 10);
  unique.forEach((u) => console.log("  " + u));
}

// Search for error 310 by looking at the line before/after
const idx310 = c.indexOf("310");
if (idx310 > -1) {
  // Look for context around first occurrence of 310
  const start = Math.max(0, idx310 - 100);
  const end = Math.min(c.length, idx310 + 100);
  console.log(
    "\nContext around first 310:",
    c.substring(start, end).substring(0, 200),
  );
}
