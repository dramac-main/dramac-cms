const fs = require('fs');
const path = require('path');

function findFiles(dir) {
  let results = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules' && item.name !== '.next') {
        results = results.concat(findFiles(fullPath));
      } else if (item.isFile() && /\.(tsx?|jsx?)$/.test(item.name)) {
        results.push(fullPath);
      }
    }
  } catch (e) {}
  return results;
}

const hookNames = [
  'useState', 'useEffect', 'useMemo', 'useCallback', 'useRef',
  'useContext', 'useReducer', 'useId', 'useLayoutEffect',
  'useInsertionEffect', 'useImperativeHandle', 'useSyncExternalStore',
  'useTransition', 'useDeferredValue', 'useOptimistic', 'useActionState',
  'useFormStatus', 'useRouter', 'usePathname', 'useSearchParams',
  'useParams', 'useSelectedLayoutSegment', 'useSelectedLayoutSegments'
];

const hookPattern = new RegExp(`\\b(${hookNames.join('|')})\\s*\\(`, 'g');

const allFiles = findFiles(path.join(__dirname, '..', 'src'));
const issues = [];

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');

  // Only check client components
  if (!content.includes('"use client"') && !content.includes("'use client'")) continue;

  const lines = content.split('\n');
  const relPath = path.relative(path.join(__dirname, '..'), file).replace(/\\/g, '/');

  // Strategy 1: Find hooks inside if blocks
  // Look for patterns where an if block contains hook calls
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Detect if blocks at various indent levels
    if (/^\s*if\s*\(/.test(lines[i])) {
      // Gather the contents of the if block
      let ifContent = '';
      let j = i;
      let braceCount = 0;
      let started = false;

      while (j < Math.min(i + 30, lines.length)) {
        const l = lines[j];
        for (const ch of l) {
          if (ch === '{') { braceCount++; started = true; }
          if (ch === '}') braceCount--;
        }
        ifContent += l + '\n';
        if (started && braceCount <= 0) break;
        j++;
      }

      // Check if the if block contains hook calls
      const hookMatches = [...ifContent.matchAll(hookPattern)];
      for (const match of hookMatches) {
        // Exclude hooks in event handlers, inner functions, etc.
        // Find the line number of the hook within the if block
        const hookLines = ifContent.split('\n');
        for (let k = 0; k < hookLines.length; k++) {
          if (hookLines[k].includes(match[1] + '(')) {
            issues.push({
              file: relPath,
              line: i + 1 + k,
              type: 'HOOK_IN_IF',
              hook: match[1],
              ifCondition: trimmed.substring(0, 100),
              hookLine: hookLines[k].trim().substring(0, 100)
            });
          }
        }
      }
    }
  }

  // Strategy 2: Find components with hooks after early returns
  // Parse component functions and track returns vs hooks
  const componentPattern = /(?:export\s+(?:default\s+)?)?(?:function|const)\s+([A-Z]\w*)\s*[=(]/;
  let inComponent = false;
  let componentName = '';
  let braceDepth = 0;
  let foundReturn = false;
  let returnLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    const compMatch = trimmed.match(componentPattern);
    if (compMatch) {
      inComponent = true;
      componentName = compMatch[1];
      braceDepth = 0;
      foundReturn = false;
      returnLine = -1;
    }

    if (!inComponent) continue;

    for (const ch of line) {
      if (ch === '{') braceDepth++;
      if (ch === '}') braceDepth--;
    }

    // Check for early returns (not the final JSX return)
    if (braceDepth <= 2 && /^\s*return\s/.test(line) && !foundReturn) {
      // Check if this looks like an early return (conditional)
      // Look backwards for an if statement
      let hasIf = false;
      for (let k = Math.max(0, i - 3); k < i; k++) {
        if (/^\s*if\s*\(/.test(lines[k])) hasIf = true;
      }
      if (hasIf) {
        foundReturn = true;
        returnLine = i + 1;
      }
    }

    // If we found an early return, check for hooks after it
    if (foundReturn && braceDepth > 0) {
      const hookMatch = line.match(hookPattern);
      if (hookMatch && braceDepth <= 2) {
        issues.push({
          file: relPath,
          line: i + 1,
          type: 'HOOK_AFTER_EARLY_RETURN',
          hook: hookMatch[1],
          component: componentName,
          returnAtLine: returnLine,
          hookLine: trimmed.substring(0, 100)
        });
      }
    }

    if (braceDepth <= 0 && inComponent) {
      inComponent = false;
      foundReturn = false;
    }
  }

  // Strategy 3: Look for React 19's use() called conditionally
  const useCallPattern = /\buse\s*\(/g;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (useCallPattern.test(line)) {
      // Check if it's React's use() (not useState, useEffect, etc.)
      const trimmed = line.trim();
      // Make sure it's standalone "use(" not "useState(" etc
      if (/\buse\s*\(/.test(trimmed) && !/(useState|useEffect|useMemo|useCallback|useRef|useContext|useReducer|useId|useLayoutEffect|useRouter|usePathname|useSearchParams|useParams|useTransition|useDeferredValue|useOptimistic|useActionState|useFormStatus|useSelectedLayout|useInsertionEffect|useImperativeHandle|useSyncExternalStore|useBreakpoint|useChatRealtime|useConversationsRealtime|useAgentPresence|useSidebar|useIsMobile|useModuleCheck|useTheme|useBranding|useCurrency|useToast|useForm|useFieldArray|useFormContext|useWatch|useDebounce|useDebouncedCallback|useLocalStorage|useHotkeys|useSortable|useDraggable|useDroppable|useDndMonitor|useSensors|useSensor|useMediaQuery|useCommandPalette|useQuickActions)\s*\(/.test(trimmed)) {
        issues.push({
          file: relPath,
          line: i + 1,
          type: 'REACT19_USE',
          hookLine: trimmed.substring(0, 100)
        });
      }
    }
    useCallPattern.lastIndex = 0;
  }
}

// Deduplicate
const seen = new Set();
const unique = issues.filter(i => {
  const key = `${i.file}:${i.line}:${i.hook || i.type}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

console.log(`\nFound ${unique.length} potential issues:\n`);
unique.forEach(i => {
  console.log(`[${i.type}] ${i.file}:${i.line}`);
  if (i.hook) console.log(`  Hook: ${i.hook}`);
  if (i.ifCondition) console.log(`  If: ${i.ifCondition}`);
  if (i.hookLine) console.log(`  Line: ${i.hookLine}`);
  if (i.component) console.log(`  Component: ${i.component}`);
  if (i.returnAtLine) console.log(`  Return at line: ${i.returnAtLine}`);
  console.log();
});
