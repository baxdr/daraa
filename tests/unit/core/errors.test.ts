/**
 * Tests for core/errors — domain error taxonomy.
 */
import { describe, it, expect } from 'vitest';
import {
  DomainError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitedError,
  isDomainError,
} from '@/core/errors';

describe('core/errors', () => {
  it('DomainError preserves code, message, frozen details', () => {
    const err = new DomainError('validation_failed', 'bad input', { field: 'email' });
    expect(err.code).toBe('validation_failed');
    expect(err.message).toBe('bad input');
    expect(err.details).toEqual({ field: 'email' });
    expect(Object.isFrozen(err.details)).toBe(true);
    expect(err.name).toBe('DomainError');
  });

  it('ValidationError sets correct code and name', () => {
    const err = new ValidationError('zod failed');
    expect(err.code).toBe('validation_failed');
    expect(err.name).toBe('ValidationError');
    expect(isDomainError(err)).toBe(true);
  });

  it('NotFoundError formats message with identifier', () => {
    const err = new NotFoundError('Project', 'abc-123');
    expect(err.message).toBe('Project not found: abc-123');
    expect(err.details).toEqual({ resource: 'Project', identifier: 'abc-123' });
  });

  it('NotFoundError omits identifier when absent', () => {
    const err = new NotFoundError('Project');
    expect(err.message).toBe('Project not found');
    expect(err.details).toEqual({ resource: 'Project' });
  });

  it('UnauthorizedError defaults message', () => {
    const err = new UnauthorizedError();
    expect(err.code).toBe('unauthorized');
    expect(err.message).toBe('Authentication required');
  });

  it('ForbiddenError formats action + resource', () => {
    const err = new ForbiddenError('write', 'project:42');
    expect(err.message).toBe('Not permitted to write on project:42');
    expect(err.details).toEqual({ action: 'write', resource: 'project:42' });
  });

  it('ConflictError surfaces details', () => {
    const err = new ConflictError('email already taken', { email: 'a@b.com' });
    expect(err.code).toBe('conflict');
    expect(err.details).toEqual({ email: 'a@b.com' });
  });

  it('RateLimitedError encodes retry-after', () => {
    const err = new RateLimitedError(30);
    expect(err.message).toContain('30s');
    expect(err.details).toEqual({ retryAfterSeconds: 30 });
  });

  it('isDomainError discriminates from generic Error', () => {
    expect(isDomainError(new Error('plain'))).toBe(false);
    expect(isDomainError(new ValidationError('x'))).toBe(true);
    expect(isDomainError(null)).toBe(false);
  });
});
