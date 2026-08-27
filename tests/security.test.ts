import { describe, it, expect } from 'vitest';
import { validateSafeUrl, hashVisitor, checkRateLimit } from '../src/lib/security';

describe('Security & SSRF Protections', () => {
  it('allows valid public HTTPS domains', () => {
    const res1 = validateSafeUrl('https://example.com');
    expect(res1.isValid).toBe(true);

    const res2 = validateSafeUrl('https://app.superagent.ai/features');
    expect(res2.isValid).toBe(true);
  });

  it('rejects localhost, loopbacks, and local hostnames', () => {
    expect(validateSafeUrl('http://localhost:8080').isValid).toBe(false);
    expect(validateSafeUrl('http://127.0.0.1:3000').isValid).toBe(false);
    expect(validateSafeUrl('http://0.0.0.0').isValid).toBe(false);
    expect(validateSafeUrl('http://internal.service.local').isValid).toBe(false);
  });

  it('rejects AWS metadata IP addresses (169.254.169.254)', () => {
    expect(validateSafeUrl('http://169.254.169.254/latest/meta-data/').isValid).toBe(false);
  });

  it('rejects private IPv4 networks (10.x, 192.168.x, 172.16.x)', () => {
    expect(validateSafeUrl('http://10.0.0.1').isValid).toBe(false);
    expect(validateSafeUrl('http://192.168.1.1').isValid).toBe(false);
    expect(validateSafeUrl('http://172.20.0.5').isValid).toBe(false);
  });

  it('rejects non-HTTP protocols (file://, javascript:, gopher:)', () => {
    expect(validateSafeUrl('file:///etc/passwd').isValid).toBe(false);
    expect(validateSafeUrl('javascript:alert(1)').isValid).toBe(false);
  });

  it('generates consistent, salted visitor hashes without leaking IP', () => {
    const hash1 = hashVisitor('198.51.100.1', 'Mozilla/5.0');
    const hash2 = hashVisitor('198.51.100.1', 'Mozilla/5.0');
    const hash3 = hashVisitor('198.51.100.2', 'Mozilla/5.0');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1.length).toBe(32);
  });

  it('enforces rate limits per key', () => {
    const testKey = 'test-ip-' + Date.now();
    for (let i = 0; i < 5; i++) {
      const res = checkRateLimit(testKey, 5, 10);
      expect(res.allowed).toBe(true);
    }
    const blocked = checkRateLimit(testKey, 5, 10);
    expect(blocked.allowed).toBe(false);
  });
});
