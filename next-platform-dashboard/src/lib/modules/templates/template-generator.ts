/**
 * Template Generator
 * Phase EM-22: Module Templates Library
 *
 * Generates module files from templates using Handlebars templating.
 */

import Handlebars from "handlebars";
import { ModuleTemplate, getTemplateById } from "./template-registry";
import fs from "fs-extra";
import path from "path";

// Register Handlebars helpers
Handlebars.registerHelper("toTitleCase", (str: string) => {
  if (!str) return "";
  return str.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
});

Handlebars.registerHelper("toPascalCase", (str: string) => {
  if (!str) return "";
  return str
    .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, (c) => c.toUpperCase());
});

Handlebars.registerHelper("toCamelCase", (str: string) => {
  if (!str) return "";
  return str.replace(/[-_](\w)/g, (_, c) => c.toUpperCase());
});

Handlebars.registerHelper("toKebabCase", (str: string) => {
  if (!str) return "";
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
});

Handlebars.registerHelper("toSnakeCase", (str: string) => {
  if (!str) return "";
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
});

Handlebars.registerHelper("lowercase", (str: string) => {
  if (!str) return "";
  return str.toLowerCase();
});

Handlebars.registerHelper("uppercase", (str: string) => {
  if (!str) return "";
  return str.toUpperCase();
});

Handlebars.registerHelper("if_eq", function (
  this: unknown,
  a: unknown,
  b: unknown,
  options: Handlebars.HelperOptions
) {
  if (a === b) {
    return options.fn(this);
  }
  return options.inverse(this);
});

Handlebars.registerHelper("if_not_eq", function (
  this: unknown,
  a: unknown,
  b: unknown,
  options: Handlebars.HelperOptions
) {
  if (a !== b) {
    return options.fn(this);
  }
  return options.inverse(this);
});

Handlebars.registerHelper("json", (obj: unknown) => {
  return JSON.stringify(obj, null, 2);
});

export interface GenerateOptions {
  templateId: string;
  outputDir: string;
  variables: Record<string, unknown>;
}

export interface GenerationResult {
  success: boolean;
  filesCreated: string[];
  errors: string[];
}

/**
 * Generate module from template
 */
export async function generateFromTemplate(
  options: GenerateOptions
): Promise<GenerationResult> {
  const template = getTemplateById(options.templateId);
  if (!template) {
    return {
      success: false,
      filesCreated: [],
      errors: [`Template not found: ${options.templateId}`],
    };
  }

  const result: GenerationResult = {
    success: true,
    filesCreated: [],
    errors: [],
  };

  try {
    // Process variables
    const context = processVariables(template, options.variables);

    // Get template directory
    const templateDir = path.join(__dirname, "files", options.templateId);

    // Check if template directory exists
    if (!(await fs.pathExists(templateDir))) {
      result.errors.push(`Template directory not found: ${templateDir}`);
      result.success = false;
      return result;
    }

    // Get all template files
    const files = await getTemplateFiles(templateDir);

    // Ensure output directory exists
    await fs.ensureDir(options.outputDir);

    // Process each file
    for (const file of files) {
      try {
        const relativePath = path.relative(templateDir, file);
        const outputPath = processPath(relativePath, context);
        const fullOutputPath = path.join(options.outputDir, outputPath);

        // Read template content
        const content = await fs.readFile(file, "utf-8");

        // Process content if it's a template file
        let processedContent = content;
        if (file.endsWith(".hbs")) {
          const compiled = Handlebars.compile(content);
          processedContent = compiled(context);
        }

        // Write output file (remove .hbs extension)
        const finalPath = fullOutputPath.replace(/\.hbs$/, "");
        await fs.ensureDir(path.dirname(finalPath));
        await fs.writeFile(finalPath, processedContent);

        result.filesCreated.push(finalPath);
      } catch (fileError) {
        result.errors.push(
          `Error processing ${file}: ${fileError instanceof Error ? fileError.message : String(fileError)}`
        );
      }
    }

    // Create package.json
    const packageJsonPath = await createPackageJson(
      options.outputDir,
      template,
      context
    );
    result.filesCreated.push(packageJsonPath);

    // Create tsconfig.json
    const tsconfigPath = await createTsConfig(options.outputDir);
    result.filesCreated.push(tsconfigPath);

    // Create README.md
    const readmePath = await createReadme(
      options.outputDir,
      template,
      context
    );
    result.filesCreated.push(readmePath);

    if (result.errors.length > 0) {
      result.success = false;
    }
  } catch (error) {
    result.success = false;
    result.errors.push(
      `Generation failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return result;
}

/**
 * Process template variables and add computed values
 */
function processVariables(
  template: ModuleTemplate,
  variables: Record<string, unknown>
): Record<string, unknown> {
  const context: Record<string, unknown> = { ...variables };

  // Generate module ID from name
  if (typeof variables.moduleName === "string") {
    context.moduleId = variables.moduleName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  // Process item names for data-list template
  if (typeof variables.itemName === "string") {
    context.itemNamePascal = (variables.itemName as string)
      .replace(/[-_](\w)/g, (_: string, c: string) => c.toUpperCase())
      .replace(/^\w/, (c: string) => c.toUpperCase());

    context.itemNameCamel = (variables.itemName as string).replace(
      /[-_](\w)/g,
      (_: string, c: string) => c.toUpperCase()
    );
  }

  // Process fields
  if (typeof variables.fields === "string") {
    context.fieldNames = variables.fields.split(",").map((f: string) => f.trim());
  }

  // Process form fields
  if (typeof variables.formFields === "string") {
    context.formFieldNames = variables.formFields.split(",").map((f: string) => f.trim());
  }

  // Process entity names for CRUD template
  if (typeof variables.entityName === "string") {
    context.entityNamePascal = (variables.entityName as string)
      .replace(/[-_](\w)/g, (_: string, c: string) => c.toUpperCase())
      .replace(/^\w/, (c: string) => c.toUpperCase());

    context.entityNameCamel = (variables.entityName as string).replace(
      /[-_](\w)/g,
      (_: string, c: string) => c.toUpperCase()
    );

    // Generate plural form (simple rule)
    const entityName = variables.entityName as string;
    if (entityName.endsWith("y")) {
      context.entityNamePlural = entityName.slice(0, -1) + "ies";
    } else if (entityName.endsWith("s") || entityName.endsWith("x") || entityName.endsWith("ch") || entityName.endsWith("sh")) {
      context.entityNamePlural = entityName + "es";
    } else {
      context.entityNamePlural = entityName + "s";
    }
  }

  // Process chart types for dashboard template
  if (variables.chartTypes) {
    context.showLineChart =
      variables.chartTypes === "line" || variables.chartTypes === "all";
    context.showBarChart =
      variables.chartTypes === "bar" || variables.chartTypes === "all";
    context.showPieChart =
      variables.chartTypes === "pie" || variables.chartTypes === "all";
    context.showAllCharts = variables.chartTypes === "all";
  }

  // Add template metadata
  context.templateId = template.id;
  context.templateName = template.name;
  context.generatedAt = new Date().toISOString();

  return context;
}

/**
 * Process file path, replacing placeholders with variable values
 */
function processPath(
  filePath: string,
  context: Record<string, unknown>
): string {
  let result = filePath;

  // Replace placeholders in path
  Object.entries(context).forEach(([key, value]) => {
    if (typeof value === "string") {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }
  });

  return result;
}

/**
 * Recursively get all template files
 */
async function getTemplateFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await getTemplateFiles(fullPath)));
      } else {
        files.push(fullPath);
      }
    }
  } catch (_error) {
    // Directory doesn't exist or can't be read
    console.warn(`Could not read directory: ${dir}`);
  }

  return files;
}

/**
 * Create package.json for the generated module
 */
async function createPackageJson(
  outputDir: string,
  template: ModuleTemplate,
  context: Record<string, unknown>
): Promise<string> {
  const pkg = {
    name: `@dramac-modules/${context.moduleId}`,
    version: "1.0.0",
    description: context.description || template.description,
    main: "dist/index.js",
    types: "dist/index.d.ts",
    scripts: {
      dev: "dramac dev",
      build: "dramac build",
      validate: "dramac validate",
      deploy: "dramac deploy",
      test: "vitest",
      lint: "eslint src/",
      typecheck: "tsc --noEmit",
    },
    dependencies: Object.fromEntries(
      template.dependencies.map((dep) => [dep, "latest"])
    ),
    devDependencies: {
      typescript: "^5.4.0",
      "@types/react": "^18.2.0",
      "@types/node": "^20.0.0",
      vitest: "^1.0.0",
      eslint: "^8.0.0",
    },
    peerDependencies: {
      react: "^18.0.0",
      "react-dom": "^18.0.0",
    },
    dramac: {
      templateId: template.id,
      generatedAt: context.generatedAt,
    },
  };

  const filePath = path.join(outputDir, "package.json");
  await fs.writeJson(filePath, pkg, { spaces: 2 });
  return filePath;
}

/**
 * Create tsconfig.json for the generated module
 */
async function createTsConfig(outputDir: string): Promise<string> {
  const tsconfig = {
    compilerOptions: {
      target: "ES2020",
      lib: ["DOM", "DOM.Iterable", "ES2020"],
      module: "ESNext",
      moduleResolution: "bundler",
      jsx: "react-jsx",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      declaration: true,
      declarationMap: true,
      outDir: "./dist",
      rootDir: "./src",
    },
    include: ["src/**/*"],
    exclude: ["node_modules", "dist"],
  };

  const filePath = path.join(outputDir, "tsconfig.json");
  await fs.writeJson(filePath, tsconfig, { spaces: 2 });
  return filePath;
}

/**
 * Create README.md for the generated module
 */
async function createReadme(
  outputDir: string,
  template: ModuleTemplate,
  context: Record<string, unknown>
): Promise<string> {
  const readme = `# ${context.moduleName}

${context.description || template.description}

## Getting Started

This module was generated from the **${template.name}** template.

### Development

\`\`\`bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Validate module
pnpm validate

# Build for production
pnpm build
\`\`\`

### Deployment

\`\`\`bash
# Deploy to Dramac platform
pnpm deploy
\`\`\`

## Features

${template.features.map((f) => `- ${f}`).join("\n")}

## Structure

\`\`\`
├── dramac.config.ts    # Module configuration
├── src/
│   ├── Dashboard.tsx   # Main dashboard component
│   ├── Settings.tsx    # Settings page
│   └── api/            # API routes
├── package.json
└── tsconfig.json
\`\`\`

## License

Private - All rights reserved.

---

Generated with [Dramac Module Templates](https://dramacagency.com) on ${new Date().toLocaleDateString()}
`;

  const filePath = path.join(outputDir, "README.md");
  await fs.writeFile(filePath, readme);
  return filePath;
}

/**
 * Validate template variables before generation
 */
export function validateVariables(
  templateId: string,
  variables: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const template = getTemplateById(templateId);
  if (!template) {
    return { valid: false, errors: [`Template not found: ${templateId}`] };
  }

  const errors: string[] = [];

  for (const variable of template.variables) {
    if (variable.required && !variables[variable.name]) {
      errors.push(`Required variable missing: ${variable.label}`);
    }

    if (variables[variable.name] !== undefined) {
      const value = variables[variable.name];

      // Type validation
      switch (variable.type) {
        case "number":
          if (typeof value !== "number" && isNaN(Number(value))) {
            errors.push(`${variable.label} must be a number`);
          }
          break;
        case "boolean":
          if (typeof value !== "boolean") {
            errors.push(`${variable.label} must be a boolean`);
          }
          break;
        case "select":
          if (
            variable.options &&
            !variable.options.some((opt) => opt.value === value)
          ) {
            errors.push(`${variable.label} has an invalid value`);
          }
          break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Preview generated file paths without creating files
 */
export async function previewGeneration(
  options: GenerateOptions
): Promise<string[]> {
  const template = getTemplateById(options.templateId);
  if (!template) {
    return [];
  }

  const context = processVariables(template, options.variables);
  const templateDir = path.join(__dirname, "files", options.templateId);

  try {
    const files = await getTemplateFiles(templateDir);
    return files.map((file) => {
      const relativePath = path.relative(templateDir, file);
      const outputPath = processPath(relativePath, context);
      return path.join(options.outputDir, outputPath.replace(/\.hbs$/, ""));
    });
  } catch {
    return [];
  }
}
