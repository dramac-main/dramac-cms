/**
 * Locale Fix Script - Replaces all hardcoded en-US/USD/UTC with centralized locale-config imports
 * Run with: node scripts/fix-locale.js
 */
const fs = require('fs');
const path = require('path');

// Files/patterns to SKIP (intentionally USD or already fixed)
const SKIP_FILES = [
  'locale-config.ts',
  'plans.ts',
  'analytics-utils.ts',
  'quote-utils.ts',
  'paddle.ts',
  'paddle-actions.ts',
  'paddle-webhook-handler.ts',
  'lemon-squeezy.ts',
  'module-catalog.ts',
  'module-registry.ts',
  'module-pricing-service.ts',
  'stripe-config.ts',
  'fix-locale.js',
];

const SKIP_PATHS = [
  'checkout/module',
  'developer/revenue',
  'api/developer/statements',
  'marketplace/',
];

function shouldSkip(filePath) {
  const base = path.basename(filePath);
  if (SKIP_FILES.includes(base)) return true;
  for (const p of SKIP_PATHS) {
    if (filePath.replace(/\\/g, '/').includes(p)) return true;
  }
  // Skip admin page.tsx specifically (platform billing)
  if (filePath.replace(/\\/g, '/').endsWith('/admin/page.tsx')) return true;
  return false;
}

function walk(dir, ext) {
  let results = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const full = path.join(dir, item.name);
      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        results = results.concat(walk(full, ext));
      } else if (item.isFile() && ext.some(e => item.name.endsWith(e))) {
        results.push(full);
      }
    }
  } catch (e) {}
  return results;
}

const srcDir = path.join(__dirname, '..', 'src');
const files = walk(srcDir, ['.ts', '.tsx']);
let totalChanges = 0;
const changedFiles = [];

for (const file of files) {
  if (shouldSkip(file)) continue;
  
  let content = fs.readFileSync(file, 'utf8');
  let fileChanges = 0;
  let needsLocaleImport = false;
  let needsCurrencyImport = false;
  let needsCurrencySymbolImport = false;
  let needsTimezoneImport = false;
  
  // Pattern 1: Intl.NumberFormat('en-US' or Intl.DateTimeFormat('en-US'
  if (/Intl\.(NumberFormat|DateTimeFormat)\(['"]en-US['"]/.test(content)) {
    content = content.replace(/Intl\.(NumberFormat|DateTimeFormat)\(['"]en-US['"]/g, (match, type) => {
      fileChanges++;
      needsLocaleImport = true;
      return `Intl.${type}(DEFAULT_LOCALE`;
    });
  }
  
  // Pattern 2: toLocaleDateString('en-US' or ("en-US"
  if (/\.toLocaleDateString\(['"]en-US['"]/.test(content)) {
    content = content.replace(/\.toLocaleDateString\(['"]en-US['"]/g, () => {
      fileChanges++;
      needsLocaleImport = true;
      return '.toLocaleDateString(DEFAULT_LOCALE';
    });
  }
  
  // Pattern 3: toLocaleTimeString('en-US'
  if (/\.toLocaleTimeString\(['"]en-US['"]/.test(content)) {
    content = content.replace(/\.toLocaleTimeString\(['"]en-US['"]/g, () => {
      fileChanges++;
      needsLocaleImport = true;
      return '.toLocaleTimeString(DEFAULT_LOCALE';
    });
  }
  
  // Pattern 4: toLocaleString('en-US'
  if (/\.toLocaleString\(['"]en-US['"]/.test(content)) {
    content = content.replace(/\.toLocaleString\(['"]en-US['"]/g, () => {
      fileChanges++;
      needsLocaleImport = true;
      return '.toLocaleString(DEFAULT_LOCALE';
    });
  }
  
  // Pattern 5: currency-related replacements - line by line
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip demo data lines (have both id: and name: on same line)
    if (line.includes('id:') && line.includes('name:')) continue;
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;
    
    let modified = line;
    
    // currency: 'USD' or currency: "USD"
    if (/currency\s*[:]\s*['"]USD['"]/.test(modified) && !modified.includes('currencyCode')) {
      modified = modified.replace(/currency(\s*[:]\s*)['"]USD['"]/g, (m, sep) => {
        fileChanges++;
        needsCurrencyImport = true;
        return `currency${sep}DEFAULT_CURRENCY`;
      });
    }
    
    // || 'USD' or || "USD"
    if (/\|\|\s*['"]USD['"]/.test(modified) && !modified.includes('currencyCode')) {
      modified = modified.replace(/\|\|\s*['"]USD['"]/g, () => {
        fileChanges++;
        needsCurrencyImport = true;
        return '|| DEFAULT_CURRENCY';
      });
    }
    
    // currency = 'USD' as function default param
    if (/currency\s*=\s*['"]USD['"]/.test(modified) && !modified.includes('===') && !modified.includes('!==')) {
      modified = modified.replace(/currency\s*=\s*['"]USD['"]/g, () => {
        fileChanges++;
        needsCurrencyImport = true;
        return 'currency = DEFAULT_CURRENCY';
      });
    }
    
    // || 'UTC'
    if (/\|\|\s*['"]UTC['"]/.test(modified)) {
      modified = modified.replace(/\|\|\s*['"]UTC['"]/g, () => {
        fileChanges++;
        needsTimezoneImport = true;
        return '|| DEFAULT_TIMEZONE';
      });
    }
    
    // timezone: 'UTC' (not in dropdown values)
    if (/timezone\s*[:]\s*['"]UTC['"]/.test(modified) && !modified.includes('value:') && !modified.includes('label:')) {
      modified = modified.replace(/timezone(\s*[:]\s*)['"]UTC['"]/g, (m, sep) => {
        fileChanges++;
        needsTimezoneImport = true;
        return `timezone${sep}DEFAULT_TIMEZONE`;
      });
    }
    
    // timezone = 'UTC' (not comparison)
    if (/timezone\s*=\s*['"]UTC['"]/.test(modified) && !modified.includes('===') && !modified.includes('!==')) {
      modified = modified.replace(/timezone\s*=\s*['"]UTC['"]/g, () => {
        fileChanges++;
        needsTimezoneImport = true;
        return 'timezone = DEFAULT_TIMEZONE';
      });
    }
    
    // currency = '$' as default
    if (/currency\s*=\s*['"]\$['"]/.test(modified) && !modified.includes('===')) {
      modified = modified.replace(/currency\s*=\s*['"]\$['"]/g, () => {
        fileChanges++;
        needsCurrencySymbolImport = true;
        return 'currency = DEFAULT_CURRENCY_SYMBOL';
      });
    }
    
    lines[i] = modified;
  }
  content = lines.join('\n');
  
  // Pattern for manifest/config: default: 'UTC'
  if (file.includes('manifest') || file.includes('config')) {
    if (/default:\s*['"]UTC['"]/.test(content)) {
      content = content.replace(/default:\s*['"]UTC['"]/g, () => {
        fileChanges++;
        needsTimezoneImport = true;
        return 'default: DEFAULT_TIMEZONE';
      });
    }
  }
  
  if (fileChanges > 0) {
    // Build import list
    const imports = [];
    if (needsLocaleImport) imports.push('DEFAULT_LOCALE');
    if (needsCurrencyImport) imports.push('DEFAULT_CURRENCY');
    if (needsCurrencySymbolImport) imports.push('DEFAULT_CURRENCY_SYMBOL');
    if (needsTimezoneImport) imports.push('DEFAULT_TIMEZONE');
    
    if (imports.length > 0) {
      const hasLocaleImport = content.includes("from '@/lib/locale-config'") || content.includes('from "@/lib/locale-config"');
      
      if (!hasLocaleImport) {
        const importLine = `import { ${imports.join(', ')} } from '@/lib/locale-config'\n`;
        
        // Find last import statement
        const importMatches = [...content.matchAll(/^import\s+.+from\s+['"][^'"]+['"]\s*;?\s*$/gm)];
        if (importMatches.length > 0) {
          const lastMatch = importMatches[importMatches.length - 1];
          const insertIdx = lastMatch.index + lastMatch[0].length + 1;
          content = content.substring(0, insertIdx) + importLine + content.substring(insertIdx);
        } else {
          // Check for multi-line imports
          const lines2 = content.split('\n');
          let lastImportEnd = -1;
          let inImport = false;
          for (let i = 0; i < lines2.length; i++) {
            if (lines2[i].trimStart().startsWith('import ')) inImport = true;
            if (inImport && (lines2[i].includes("from '") || lines2[i].includes('from "'))) {
              lastImportEnd = i;
              inImport = false;
            }
          }
          if (lastImportEnd >= 0) {
            lines2.splice(lastImportEnd + 1, 0, importLine.trimEnd());
            content = lines2.join('\n');
          } else {
            content = importLine + content;
          }
        }
      } else {
        // Import exists — merge in missing names
        const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]@\/lib\/locale-config['"]/;
        const match = content.match(importRegex);
        if (match) {
          const existing = match[1].split(',').map(s => s.trim()).filter(Boolean);
          const toAdd = imports.filter(i => !existing.includes(i));
          if (toAdd.length > 0) {
            const all = [...existing, ...toAdd];
            content = content.replace(match[0], `import { ${all.join(', ')} } from '@/lib/locale-config'`);
          }
        }
      }
    }
    
    fs.writeFileSync(file, content, 'utf8');
    totalChanges += fileChanges;
    changedFiles.push(path.relative(srcDir, file) + ` (${fileChanges} changes)`);
  }
}

console.log(`Total changes: ${totalChanges}`);
console.log(`Files changed: ${changedFiles.length}`);
changedFiles.forEach(f => console.log(`  ${f}`));
