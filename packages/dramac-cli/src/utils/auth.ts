import path from 'path';
import os from 'os';
import fs from 'fs-extra';

const CONFIG_DIR = path.join(os.homedir(), '.dramac');
const TOKEN_FILE = path.join(CONFIG_DIR, 'token');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export interface AuthConfig {
  token?: string;
  apiUrl?: string;
  userId?: string;
  email?: string;
  agencyId?: string;
  agencyName?: string;
}

export function getAuthToken(): string | null {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      return fs.readFileSync(TOKEN_FILE, 'utf-8').trim();
    }
  } catch {
    // Ignore errors
  }
  return null;
}

export function saveAuthToken(token: string): void {
  fs.ensureDirSync(CONFIG_DIR);
  fs.writeFileSync(TOKEN_FILE, token, { mode: 0o600 });
}

export function clearAuthToken(): void {
  try {
    fs.removeSync(TOKEN_FILE);
  } catch {
    // Ignore errors
  }
}

export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

export function getAuthConfig(): AuthConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return fs.readJsonSync(CONFIG_FILE);
    }
  } catch {
    // Ignore errors
  }
  return {};
}

export function saveAuthConfig(config: Partial<AuthConfig>): void {
  fs.ensureDirSync(CONFIG_DIR);
  const existing = getAuthConfig();
  const merged = { ...existing, ...config };
  fs.writeJsonSync(CONFIG_FILE, merged, { spaces: 2, mode: 0o600 });
}

export function clearAuthConfig(): void {
  try {
    fs.removeSync(CONFIG_FILE);
    fs.removeSync(TOKEN_FILE);
  } catch {
    // Ignore errors
  }
}

export function getConfigDir(): string {
  return CONFIG_DIR;
}
