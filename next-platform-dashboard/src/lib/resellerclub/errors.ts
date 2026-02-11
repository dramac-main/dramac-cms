// src/lib/resellerclub/errors.ts
// ResellerClub Custom Error Classes

/**
 * Base error class for all ResellerClub API errors
 */
export class ResellerClubError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ResellerClubError';
    
    // Maintain proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ResellerClubError);
    }
  }
  
  /**
   * Create error from API response
   */
  static fromResponse(response: unknown): ResellerClubError {
    if (typeof response === 'object' && response !== null) {
      const res = response as Record<string, unknown>;
      return new ResellerClubError(
        String(res.message || res.error || res.actionstatusdesc || 'Unknown error'),
        String(res.status || res.actionstatus || 'UNKNOWN'),
        typeof res.statusCode === 'number' ? res.statusCode : undefined,
        res
      );
    }
    return new ResellerClubError('Unknown error occurred', 'UNKNOWN');
  }
  
  /**
   * Check if error is a specific type
   */
  isCode(code: string): boolean {
    return this.code === code;
  }
  
  /**
   * Convert to JSON for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

/**
 * Domain is not available for registration
 */
export class DomainNotAvailableError extends ResellerClubError {
  constructor(domain: string) {
    super(
      `Domain ${domain} is not available for registration`,
      'DOMAIN_NOT_AVAILABLE'
    );
    this.name = 'DomainNotAvailableError';
  }
}

/**
 * Insufficient funds in reseller account
 */
export class InsufficientFundsError extends ResellerClubError {
  public required: number;
  public available: number;
  
  constructor(required: number, available: number) {
    super(
      `Insufficient funds: required ${required}, available ${available}`,
      'INSUFFICIENT_FUNDS'
    );
    this.name = 'InsufficientFundsError';
    this.required = required;
    this.available = available;
  }
}

/**
 * Domain has expired and cannot be renewed
 */
export class DomainExpiredError extends ResellerClubError {
  constructor(domain: string) {
    super(
      `Domain ${domain} has expired and may need restoration`,
      'DOMAIN_EXPIRED'
    );
    this.name = 'DomainExpiredError';
  }
}

/**
 * Domain transfer is not allowed
 */
export class TransferNotAllowedError extends ResellerClubError {
  public reason: string;
  
  constructor(domain: string, reason: string) {
    super(
      `Transfer of ${domain} not allowed: ${reason}`,
      'TRANSFER_NOT_ALLOWED'
    );
    this.name = 'TransferNotAllowedError';
    this.reason = reason;
  }
}

/**
 * Auth code (EPP code) is invalid
 */
export class AuthCodeInvalidError extends ResellerClubError {
  constructor(domain: string) {
    super(
      `Invalid auth code (EPP code) for ${domain}`,
      'AUTH_CODE_INVALID'
    );
    this.name = 'AuthCodeInvalidError';
  }
}

/**
 * API configuration is missing or invalid
 */
export class ConfigurationError extends ResellerClubError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR');
    this.name = 'ConfigurationError';
  }
}

/**
 * Request timed out
 */
export class RequestTimeoutError extends ResellerClubError {
  constructor(endpoint: string) {
    super(
      `Request to ${endpoint} timed out`,
      'REQUEST_TIMEOUT'
    );
    this.name = 'RequestTimeoutError';
  }
}

/**
 * Rate limit exceeded
 */
export class RateLimitError extends ResellerClubError {
  constructor() {
    super(
      'Rate limit exceeded. Please try again later.',
      'RATE_LIMIT_EXCEEDED'
    );
    this.name = 'RateLimitError';
  }
}

/**
 * Customer not found
 */
export class CustomerNotFoundError extends ResellerClubError {
  constructor(identifier: string) {
    super(
      `Customer not found: ${identifier}`,
      'CUSTOMER_NOT_FOUND'
    );
    this.name = 'CustomerNotFoundError';
  }
}

/**
 * Contact not found
 */
export class ContactNotFoundError extends ResellerClubError {
  constructor(contactId: string) {
    super(
      `Contact not found: ${contactId}`,
      'CONTACT_NOT_FOUND'
    );
    this.name = 'ContactNotFoundError';
  }
}

/**
 * Purchases are disabled — safety guard to prevent accidental money spending.
 * Set RESELLERCLUB_ALLOW_PURCHASES=true in .env.local to enable paid operations.
 */
export class PurchasesDisabledError extends ResellerClubError {
  constructor(operation: string) {
    super(
      `${operation} is blocked because RESELLERCLUB_ALLOW_PURCHASES is not set to "true". ` +
      `This safety guard prevents accidental charges on your ResellerClub account. ` +
      `Set RESELLERCLUB_ALLOW_PURCHASES=true in your .env.local when you are ready to make real purchases.`,
      'PURCHASES_DISABLED'
    );
    this.name = 'PurchasesDisabledError';
  }
}

/**
 * Domain not found
 */
export class DomainNotFoundError extends ResellerClubError {
  constructor(domain: string) {
    super(
      `Domain not found: ${domain}`,
      'DOMAIN_NOT_FOUND'
    );
    this.name = 'DomainNotFoundError';
  }
}

/**
 * Order not found
 */
export class OrderNotFoundError extends ResellerClubError {
  constructor(orderId: string) {
    super(
      `Order not found: ${orderId}`,
      'ORDER_NOT_FOUND'
    );
    this.name = 'OrderNotFoundError';
  }
}

/**
 * Invalid parameter provided
 */
export class InvalidParameterError extends ResellerClubError {
  public parameter: string;
  
  constructor(parameter: string, message: string) {
    super(
      `Invalid parameter '${parameter}': ${message}`,
      'INVALID_PARAMETER'
    );
    this.name = 'InvalidParameterError';
    this.parameter = parameter;
  }
}

/**
 * Parse error from API response and throw appropriate error
 */
export function parseApiError(response: unknown): ResellerClubError {
  if (typeof response !== 'object' || response === null) {
    return new ResellerClubError('Unknown error', 'UNKNOWN');
  }
  
  const res = response as Record<string, unknown>;
  const status = String(res.status || res.actionstatus || '').toLowerCase();
  const message = String(res.message || res.error || res.actionstatusdesc || '');
  
  // Check for specific error conditions
  if (message.toLowerCase().includes('insufficient fund')) {
    return new InsufficientFundsError(0, 0);
  }
  
  if (message.toLowerCase().includes('not available')) {
    return new DomainNotAvailableError(message);
  }
  
  if (message.toLowerCase().includes('expired')) {
    return new DomainExpiredError(message);
  }
  
  if (message.toLowerCase().includes('auth') && message.toLowerCase().includes('code')) {
    return new AuthCodeInvalidError(message);
  }
  
  if (message.toLowerCase().includes('transfer') && message.toLowerCase().includes('not allowed')) {
    return new TransferNotAllowedError(message, message);
  }
  
  if (message.toLowerCase().includes('customer') && message.toLowerCase().includes('not found')) {
    return new CustomerNotFoundError(message);
  }
  
  if (message.toLowerCase().includes('contact') && message.toLowerCase().includes('not found')) {
    return new ContactNotFoundError(message);
  }
  
  if (status === 'error' || status === 'failed') {
    return ResellerClubError.fromResponse(response);
  }
  
  return ResellerClubError.fromResponse(response);
}
