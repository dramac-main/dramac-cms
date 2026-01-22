/**
 * Phase EM-31: OAuth Service
 * Implements OAuth 2.0 for external API access
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export interface OAuthClient {
  id: string;
  site_id: string;
  module_id: string;
  name: string;
  client_id: string;
  client_secret_hash: string;
  redirect_uris: string[];
  scopes: string[];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccessToken {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface TokenPayload {
  sub: string;
  scope: string;
  client_id: string;
  site_id: string;
  module_id: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

export interface CreateClientInput {
  name: string;
  redirectUris: string[];
  scopes: string[];
}

export interface AuthCodeRequest {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  state?: string;
  codeChallenge?: string;
  codeChallengeMethod?: 'S256' | 'plain';
}

function getServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

export class OAuthService {
  private siteId: string;
  private moduleId: string;
  private supabase: SupabaseClient;

  constructor(siteId: string, moduleId: string, supabaseClient?: SupabaseClient) {
    this.siteId = siteId;
    this.moduleId = moduleId;
    this.supabase = supabaseClient || getServiceClient();
  }

  // ============================================================
  // CLIENT MANAGEMENT
  // ============================================================

  /**
   * Create a new OAuth client
   */
  async createClient(input: CreateClientInput, createdBy?: string): Promise<{
    client: OAuthClient;
    clientSecret: string;
  }> {
    // Validate redirect URIs
    for (const uri of input.redirectUris) {
      if (!this.isValidRedirectUri(uri)) {
        throw new Error(`Invalid redirect URI: ${uri}`);
      }
    }

    // Validate scopes
    const validScopes = ['read', 'write', 'delete', 'admin'];
    for (const scope of input.scopes) {
      if (!validScopes.includes(scope)) {
        throw new Error(`Invalid scope: ${scope}`);
      }
    }

    // Generate client credentials
    const clientId = `dram_${crypto.randomBytes(12).toString('hex')}`;
    const clientSecret = `dram_secret_${crypto.randomBytes(32).toString('hex')}`;
    const secretHash = this.hashSecret(clientSecret);

    const { data, error } = await this.supabase
      .from('module_oauth_clients')
      .insert({
        site_id: this.siteId,
        module_id: this.moduleId,
        name: input.name,
        client_id: clientId,
        client_secret_hash: secretHash,
        redirect_uris: input.redirectUris,
        scopes: input.scopes,
        is_active: true,
        created_by: createdBy || null
      })
      .select()
      .single();

    if (error) throw error;

    return {
      client: data,
      clientSecret // Only returned once - client must store it securely
    };
  }

  /**
   * Get OAuth client by client_id
   */
  async getClient(clientId: string): Promise<OAuthClient | null> {
    const { data, error } = await this.supabase
      .from('module_oauth_clients')
      .select('*')
      .eq('module_id', this.moduleId)
      .eq('client_id', clientId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  /**
   * Get all OAuth clients for the module
   */
  async getClients(): Promise<OAuthClient[]> {
    const { data, error } = await this.supabase
      .from('module_oauth_clients')
      .select('*')
      .eq('module_id', this.moduleId)
      .order('created_at');

    if (error) throw error;
    return data || [];
  }

  /**
   * Update OAuth client
   */
  async updateClient(clientId: string, updates: {
    name?: string;
    redirectUris?: string[];
    scopes?: string[];
    isActive?: boolean;
  }): Promise<OAuthClient> {
    const updateData: Record<string, string | string[]> = {};
    
    if (updates.name) updateData.name = updates.name;
    if (updates.redirectUris) {
      for (const uri of updates.redirectUris) {
        if (!this.isValidRedirectUri(uri)) {
          throw new Error(`Invalid redirect URI: ${uri}`);
        }
      }
      updateData.redirect_uris = updates.redirectUris;
    }
    if (updates.scopes) updateData.scopes = updates.scopes;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await this.supabase
      .from('module_oauth_clients')
      .update(updateData)
      .eq('module_id', this.moduleId)
      .eq('client_id', clientId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete OAuth client
   */
  async deleteClient(clientId: string): Promise<void> {
    const { error } = await this.supabase
      .from('module_oauth_clients')
      .delete()
      .eq('module_id', this.moduleId)
      .eq('client_id', clientId);

    if (error) throw error;
  }

  /**
   * Regenerate client secret
   */
  async regenerateClientSecret(clientId: string): Promise<string> {
    const clientSecret = `dram_secret_${crypto.randomBytes(32).toString('hex')}`;
    const secretHash = this.hashSecret(clientSecret);

    const { error } = await this.supabase
      .from('module_oauth_clients')
      .update({ client_secret_hash: secretHash })
      .eq('module_id', this.moduleId)
      .eq('client_id', clientId);

    if (error) throw error;
    return clientSecret;
  }

  /**
   * Validate client credentials
   */
  async validateClient(clientId: string, clientSecret: string): Promise<OAuthClient | null> {
    const secretHash = this.hashSecret(clientSecret);

    const { data, error } = await this.supabase
      .from('module_oauth_clients')
      .select('*')
      .eq('module_id', this.moduleId)
      .eq('client_id', clientId)
      .eq('client_secret_hash', secretHash)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;
    return data;
  }

  // ============================================================
  // AUTHORIZATION CODE FLOW
  // ============================================================

  /**
   * Generate authorization code
   */
  async generateAuthCode(
    request: AuthCodeRequest,
    userId: string
  ): Promise<{ code: string; state?: string }> {
    // Validate client
    const client = await this.getClient(request.clientId);
    if (!client) {
      throw new Error('Invalid client');
    }

    // Validate redirect URI
    if (!client.redirect_uris.includes(request.redirectUri)) {
      throw new Error('Invalid redirect URI');
    }

    // Validate scopes
    const invalidScopes = request.scopes.filter(s => !client.scopes.includes(s));
    if (invalidScopes.length > 0) {
      throw new Error(`Invalid scopes: ${invalidScopes.join(', ')}`);
    }

    // Generate authorization code
    const code = crypto.randomBytes(32).toString('hex');
    const codeHash = this.hashSecret(code);

    // Store code (expires in 10 minutes)
    const { error } = await this.supabase
      .from('module_oauth_codes')
      .insert({
        code_hash: codeHash,
        client_id: request.clientId,
        user_id: userId,
        redirect_uri: request.redirectUri,
        scopes: request.scopes,
        code_challenge: request.codeChallenge || null,
        code_challenge_method: request.codeChallengeMethod || null,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      });

    if (error) throw error;

    return { code, state: request.state };
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    codeVerifier?: string
  ): Promise<AccessToken> {
    // Validate client
    const client = await this.validateClient(clientId, clientSecret);
    if (!client) {
      throw new Error('Invalid client credentials');
    }

    // Find and validate code
    const codeHash = this.hashSecret(code);
    
    const { data: authCode, error } = await this.supabase
      .from('module_oauth_codes')
      .select('*')
      .eq('code_hash', codeHash)
      .eq('client_id', clientId)
      .eq('redirect_uri', redirectUri)
      .is('used_at', null)
      .single();

    if (error || !authCode) {
      throw new Error('Invalid authorization code');
    }

    // Check expiration
    if (new Date(authCode.expires_at) < new Date()) {
      throw new Error('Authorization code expired');
    }

    // Verify PKCE if used
    if (authCode.code_challenge) {
      if (!codeVerifier) {
        throw new Error('Code verifier required');
      }
      
      const verified = this.verifyCodeChallenge(
        codeVerifier,
        authCode.code_challenge,
        authCode.code_challenge_method || 'S256'
      );
      
      if (!verified) {
        throw new Error('Invalid code verifier');
      }
    }

    // Mark code as used
    await this.supabase
      .from('module_oauth_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('code_hash', codeHash);

    // Generate tokens
    return this.generateTokens(authCode.user_id, authCode.scopes, clientId);
  }

  // ============================================================
  // TOKEN MANAGEMENT
  // ============================================================

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(
    userId: string,
    scopes: string[],
    clientId: string
  ): Promise<AccessToken> {
    const jwtSecret = getJwtSecret();
    const now = Math.floor(Date.now() / 1000);

    // Access token (1 hour)
    const accessToken = jwt.sign(
      {
        sub: userId,
        scope: scopes.join(' '),
        client_id: clientId,
        site_id: this.siteId,
        module_id: this.moduleId,
        type: 'access'
      },
      jwtSecret,
      { expiresIn: '1h' }
    );

    // Refresh token (30 days)
    const refreshToken = jwt.sign(
      {
        sub: userId,
        client_id: clientId,
        site_id: this.siteId,
        module_id: this.moduleId,
        type: 'refresh'
      },
      jwtSecret,
      { expiresIn: '30d' }
    );

    // Store refresh token hash
    const refreshHash = this.hashSecret(refreshToken);
    await this.supabase
      .from('module_oauth_refresh_tokens')
      .insert({
        token_hash: refreshHash,
        client_id: clientId,
        user_id: userId,
        scopes,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: refreshToken,
      scope: scopes.join(' ')
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
  ): Promise<AccessToken> {
    // Validate client
    const client = await this.validateClient(clientId, clientSecret);
    if (!client) {
      throw new Error('Invalid client credentials');
    }

    // Validate refresh token
    const tokenHash = this.hashSecret(refreshToken);
    
    const { data: storedToken, error } = await this.supabase
      .from('module_oauth_refresh_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .eq('client_id', clientId)
      .is('revoked_at', null)
      .single();

    if (error || !storedToken) {
      throw new Error('Invalid refresh token');
    }

    if (new Date(storedToken.expires_at) < new Date()) {
      throw new Error('Refresh token expired');
    }

    // Generate new tokens (rotate refresh token for security)
    const tokens = await this.generateTokens(
      storedToken.user_id,
      storedToken.scopes,
      clientId
    );

    // Revoke old refresh token
    await this.supabase
      .from('module_oauth_refresh_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('token_hash', tokenHash);

    return tokens;
  }

  /**
   * Validate access token
   */
  validateAccessToken(token: string): {
    valid: boolean;
    payload?: TokenPayload;
    userId?: string;
    scopes?: string[];
    error?: string;
  } {
    try {
      const jwtSecret = getJwtSecret();
      const decoded = jwt.verify(token, jwtSecret) as TokenPayload;
      
      if (decoded.type !== 'access') {
        return { valid: false, error: 'Invalid token type' };
      }
      
      if (decoded.module_id !== this.moduleId) {
        return { valid: false, error: 'Token not valid for this module' };
      }

      if (decoded.site_id !== this.siteId) {
        return { valid: false, error: 'Token not valid for this site' };
      }

      return {
        valid: true,
        payload: decoded,
        userId: decoded.sub,
        scopes: decoded.scope.split(' ')
      };
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        return { valid: false, error: 'Token expired' };
      }
      return { valid: false, error: err.message };
    }
  }

  /**
   * Revoke a refresh token
   */
  async revokeToken(token: string): Promise<void> {
    const tokenHash = this.hashSecret(token);
    
    await this.supabase
      .from('module_oauth_refresh_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('token_hash', tokenHash);
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.supabase
      .from('module_oauth_refresh_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('revoked_at', null);
  }

  /**
   * Revoke all tokens for a client
   */
  async revokeAllClientTokens(clientId: string): Promise<void> {
    await this.supabase
      .from('module_oauth_refresh_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('client_id', clientId)
      .is('revoked_at', null);
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  /**
   * Hash a secret value
   */
  private hashSecret(secret: string): string {
    return crypto.createHash('sha256').update(secret).digest('hex');
  }

  /**
   * Verify PKCE code challenge
   */
  private verifyCodeChallenge(
    verifier: string,
    challenge: string,
    method: string
  ): boolean {
    if (method === 'plain') {
      return verifier === challenge;
    }

    // S256 method
    const hash = crypto.createHash('sha256').update(verifier).digest();
    const computed = hash.toString('base64url');
    
    return computed === challenge;
  }

  /**
   * Validate redirect URI
   */
  private isValidRedirectUri(uri: string): boolean {
    try {
      const url = new URL(uri);
      
      // Allow localhost for development
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return true;
      }
      
      // Must be HTTPS in production
      if (url.protocol !== 'https:') {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate PKCE code verifier
   */
  static generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Generate PKCE code challenge from verifier
   */
  static generateCodeChallenge(verifier: string): string {
    const hash = crypto.createHash('sha256').update(verifier).digest();
    return hash.toString('base64url');
  }
}

/**
 * Create authorization URL helper
 */
export function createAuthorizationUrl(options: {
  baseUrl: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  state?: string;
  codeChallenge?: string;
  codeChallengeMethod?: 'S256' | 'plain';
}): string {
  const url = new URL(`${options.baseUrl}/oauth/authorize`);
  
  url.searchParams.set('client_id', options.clientId);
  url.searchParams.set('redirect_uri', options.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', options.scopes.join(' '));
  
  if (options.state) {
    url.searchParams.set('state', options.state);
  }
  
  if (options.codeChallenge) {
    url.searchParams.set('code_challenge', options.codeChallenge);
    url.searchParams.set('code_challenge_method', options.codeChallengeMethod || 'S256');
  }
  
  return url.toString();
}
