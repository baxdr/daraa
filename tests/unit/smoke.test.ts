/**
 * Phase 0 smoke test — proves the test harness boots and module aliases work.
 * Replaced/expanded in Phase 12 (real coverage of core/use-cases).
 */
import { describe, it, expect } from 'vitest';
import { isPublicIp } from '@/lib/url-guard';

describe('test harness — Phase 0 smoke', () => {
  it('boots vitest with module alias resolution', () => {
    expect(typeof isPublicIp).toBe('function');
  });

  it('blocks AWS instance metadata IP', () => {
    expect(isPublicIp('169.254.169.254')).toBe(false);
  });

  it('blocks RFC1918 private ranges', () => {
    expect(isPublicIp('10.0.0.1')).toBe(false);
    expect(isPublicIp('192.168.1.1')).toBe(false);
    expect(isPublicIp('172.16.0.1')).toBe(false);
  });

  it('allows public IPv4 addresses', () => {
    expect(isPublicIp('8.8.8.8')).toBe(true);
    expect(isPublicIp('1.1.1.1')).toBe(true);
  });
});
