const fs = require("fs");
const path = require("path");

function findFiles(dir, ext) {
  let results = [];
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const full = path.join(dir, item);
      if (item === "node_modules" || item === ".next") continue;
      const stat = fs.statSync(full);
      if (stat.isDirectory()) results = results.concat(findFiles(full, ext));
      else if (full.endsWith(ext)) results.push(full);
    }
  } catch (e) {}
  return results;
}

const files = findFiles("src", ".tsx");
let violationCount = 0;

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  if (!content.includes("'use client'") && !content.includes('"use client"'))
    continue;

  const lines = content.split("\n");
  let inFunction = false;
  let braceDepth = 0;
  let firstReturnLine = -1;
  let hooksAfterReturn = [];
  let functionName = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect component function start
    if (/^(export\s+)?(default\s+)?function\s+[A-Z]/.test(line)) {
      // Print any previous findings
      if (hooksAfterReturn.length > 0) {
        violationCount++;
        console.log(
          "\n=== VIOLATION FOUND: " + file + " (" + functionName + ") ===",
        );
        console.log("First return at line: " + (firstReturnLine + 1));
        for (const h of hooksAfterReturn) {
          console.log(
            "  Hook after return - Line " +
              h.line +
              ": " +
              h.hook +
              " - " +
              h.text.substring(0, 100),
          );
        }
      }
      inFunction = true;
      braceDepth = 0;
      firstReturnLine = -1;
      hooksAfterReturn = [];
      functionName = (line.match(/function\s+(\w+)/) || [])[1] || "unknown";
    }

    if (inFunction) {
      for (const ch of lines[i]) {
        if (ch === "{") braceDepth++;
        if (ch === "}") braceDepth--;
      }

      // Early return at component level (brace depth 1)
      if (
        braceDepth === 1 &&
        /^\s*(if\s*\(|return\s)/.test(lines[i]) &&
        /return\s/.test(lines[i])
      ) {
        if (firstReturnLine === -1) firstReturnLine = i;
      }

      // Hooks after first return
      if (firstReturnLine !== -1 && i > firstReturnLine + 1) {
        const hookMatch = lines[i].match(
          /\b(useState|useEffect|useCallback|useMemo|useRef|useRouter|usePathname|useSearchParams|useParams|useTransition|useContext|useReducer|useId|useLayoutEffect|useFormState|useFormStatus|useOptimistic)\s*\(/,
        );
        if (hookMatch && braceDepth >= 1) {
          hooksAfterReturn.push({
            line: i + 1,
            hook: hookMatch[1],
            text: lines[i].trim(),
          });
        }
      }

      if (braceDepth <= 0) {
        if (hooksAfterReturn.length > 0) {
          violationCount++;
          console.log(
            "\n=== VIOLATION FOUND: " + file + " (" + functionName + ") ===",
          );
          console.log("First return at line: " + (firstReturnLine + 1));
          for (const h of hooksAfterReturn) {
            console.log(
              "  Hook after return - Line " +
                h.line +
                ": " +
                h.hook +
                " - " +
                h.text.substring(0, 100),
            );
          }
        }
        inFunction = false;
        hooksAfterReturn = [];
      }
    }
  }

  // Handle last function in file
  if (hooksAfterReturn.length > 0) {
    violationCount++;
    console.log(
      "\n=== VIOLATION FOUND: " + file + " (" + functionName + ") ===",
    );
    console.log("First return at line: " + (firstReturnLine + 1));
    for (const h of hooksAfterReturn) {
      console.log(
        "  Hook after return - Line " +
          h.line +
          ": " +
          h.hook +
          " - " +
          h.text.substring(0, 100),
      );
    }
  }
}

console.log("\n=== SCAN COMPLETE ===");
console.log("Total violations found: " + violationCount);
console.log(
  "Total client component files scanned: " +
    files.filter((f) => {
      const c = fs.readFileSync(f, "utf8");
      return c.includes("'use client'") || c.includes('"use client"');
    }).length,
);
