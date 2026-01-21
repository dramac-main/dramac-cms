import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to templates directory (relative to dist/utils)
export function getTemplatesDir(): string {
  // In development, templates are at ../templates relative to src
  // In production, templates are at ../../templates relative to dist/utils
  const devPath = path.join(__dirname, '..', '..', 'templates');
  const prodPath = path.join(__dirname, '..', '..', 'templates');
  
  if (fs.existsSync(devPath)) {
    return devPath;
  }
  
  return prodPath;
}

export function getAvailableTemplates(): string[] {
  const templatesDir = getTemplatesDir();
  
  if (!fs.existsSync(templatesDir)) {
    return ['basic'];
  }
  
  const entries = fs.readdirSync(templatesDir, { withFileTypes: true });
  return entries
    .filter((e: fs.Dirent) => e.isDirectory())
    .map((e: fs.Dirent) => e.name);
}

export function templateExists(name: string): boolean {
  const templatePath = path.join(getTemplatesDir(), name);
  return fs.existsSync(templatePath);
}

export interface TemplateContext {
  moduleName: string;
  moduleId: string;
  displayName: string;
  description: string;
  category: string;
  hasDashboard: boolean;
  hasSettings: boolean;
  hasApi: boolean;
  year: number;
  [key: string]: any;
}

export async function processTemplate(
  templateName: string,
  outputDir: string,
  context: TemplateContext
): Promise<void> {
  const templateDir = path.join(getTemplatesDir(), templateName);
  
  if (!fs.existsSync(templateDir)) {
    throw new Error(`Template "${templateName}" not found`);
  }
  
  // Copy template to output directory
  await fs.copy(templateDir, outputDir);
  
  // Register Handlebars helpers
  registerHandlebarsHelpers();
  
  // Find all .hbs files
  const hbsFiles = await glob('**/*.hbs', { cwd: outputDir, dot: true });
  
  for (const file of hbsFiles) {
    const filePath = path.join(outputDir, file);
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Compile and render template
    const template = Handlebars.compile(content, { noEscape: true });
    const result = template(context);
    
    // Write to new file without .hbs extension
    const newPath = filePath.replace('.hbs', '');
    await fs.writeFile(newPath, result);
    
    // Remove original .hbs file
    await fs.remove(filePath);
  }
}

function registerHandlebarsHelpers(): void {
  // Conditional helper
  Handlebars.registerHelper('if_eq', function(this: any, a: any, b: any, options: any) {
    if (a === b) {
      return options.fn(this);
    }
    return options.inverse(this);
  });
  
  // Unless equal helper
  Handlebars.registerHelper('unless_eq', function(this: any, a: any, b: any, options: any) {
    if (a !== b) {
      return options.fn(this);
    }
    return options.inverse(this);
  });
  
  // Lowercase helper
  Handlebars.registerHelper('lowercase', function(str: string) {
    return str.toLowerCase();
  });
  
  // Uppercase helper
  Handlebars.registerHelper('uppercase', function(str: string) {
    return str.toUpperCase();
  });
  
  // Title case helper
  Handlebars.registerHelper('titlecase', function(str: string) {
    return str.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  });
  
  // Camel case helper
  Handlebars.registerHelper('camelcase', function(str: string) {
    return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  });
  
  // Pascal case helper
  Handlebars.registerHelper('pascalcase', function(str: string) {
    const camel = str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  });
  
  // JSON stringify helper
  Handlebars.registerHelper('json', function(obj: any) {
    return JSON.stringify(obj, null, 2);
  });
}

export function toTitleCase(str: string): string {
  return str.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

export function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export function toPascalCase(str: string): string {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}
