/**
 * Domain error types.
 *
 * These errors live in the core layer and carry no framework dependencies.
 * Adapters in application/infrastructure translate them into HTTP responses,
 * UI toasts, or log entries.
 *
 * Convention: every domain error sets `name` for serialization and exposes a
 * machine-readable `code` so callers can branch without parsing messages.
 */

export type DomainErrorCode =
  | 'validation_failed'
  | 'not_found'
  | 'unauthorized'
  | 'forbidden'
  | 'conflict'
  | 'rate_limited'
  | 'invariant_violated'
  | 'external_service_failure';

export class DomainError extends Error {
  public readonly code: DomainErrorCode;
  public readonly details: Readonly<Record<string, unknown>> | undefined;

  constructor(code: DomainErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.details = details ? Object.freeze({ ...details }) : undefined;
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('validation_failed', message, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, identifier?: string) {
    super(
      'not_found',
      identifier ? `${resource} not found: ${identifier}` : `${resource} not found`,
      identifier ? { resource, identifier } : { resource },
    );
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Authentication required') {
    super('unauthorized', message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends DomainError {
  constructor(action: string, resource?: string) {
    super(
      'forbidden',
      resource ? `Not permitted to ${action} on ${resource}` : `Not permitted to ${action}`,
      resource ? { action, resource } : { action },
    );
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('conflict', message, details);
    this.name = 'ConflictError';
  }
}

export class RateLimitedError extends DomainError {
  constructor(retryAfterSeconds?: number) {
    super(
      'rate_limited',
      retryAfterSeconds
        ? `Too many requests; retry after ${retryAfterSeconds}s`
        : 'Too many requests',
      retryAfterSeconds ? { retryAfterSeconds } : undefined,
    );
    this.name = 'RateLimitedError';
  }
}

export class InvariantViolatedError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('invariant_violated', message, details);
    this.name = 'InvariantViolatedError';
  }
}

export class ExternalServiceError extends DomainError {
  constructor(service: string, message: string, details?: Record<string, unknown>) {
    super('external_service_failure', `${service}: ${message}`, { service, ...details });
    this.name = 'ExternalServiceError';
  }
}

export function isDomainError(value: unknown): value is DomainError {
  return value instanceof DomainError;
}
