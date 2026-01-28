/**
 * DRAMAC CMS CSS Variables Generator Script
 * 
 * Generates CSS custom properties from the brand configuration.
 * Run this script to update the generated CSS when brand colors change.
 * 
 * Usage: npx tsx scripts/generate-brand-css.ts
 * 
 * @module scripts/generate-brand-css
 */

import { generateBrandCss } from '../src/config/brand/css-generator';
import { writeFileSync } from 'fs';
import { join } from 'path';

const OUTPUT_PATH = join(__dirname, '../src/styles/brand-variables.css');

function main() {
  console.log('🎨 Generating brand CSS variables...\n');
  
  const css = generateBrandCss();
  
  writeFileSync(OUTPUT_PATH, css, 'utf-8');
  
  console.log(`✅ Generated brand CSS at: ${OUTPUT_PATH}`);
  console.log('\n📝 To use these variables, import in your globals.css:');
  console.log('   @import "./brand-variables.css";');
}

main();
