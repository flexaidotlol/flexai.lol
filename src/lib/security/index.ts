import crypto from 'node:crypto';
import { env } from '../env';

/**
 * Creates a one-way privacy-preserving visitor hash using salt
 */
export function hashVisitor(ip: string, userAgent = ''): string {
  const salt = env.IP_HASH_SALT;
  const hash = crypto.createHmac('sha256', salt);
  hash.update(`${ip}:${userAgent}`);
  return hash.digest('hex').substring(0, 32);
}

/**
 * Validates public HTTP/HTTPS URLs against SSRF, internal IPs, and malformed inputs
 */
export function validateSafeUrl(urlString: string): { isValid: boolean; normalizedUrl?: string; error?: string } {
  if (!urlString || typeof urlString !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  let formatted = urlString.trim();
  if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
    formatted = 'https://' + formatted;
  }

  try {
    const parsed = new URL(formatted);

    // Only allow http and https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isValid: false, error: 'Only HTTP and HTTPS protocols are permitted' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check for localhost / loopback
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return { isValid: false, error: 'Internal and localhost addresses are prohibited' };
    }

    // Check for AWS metadata / cloud metadata IP
    if (hostname === '169.254.169.254') {
      return { isValid: false, error: 'Cloud metadata IP addresses are prohibited' };
    }

    // Check for private IPv4 subnets
    const ipMatch = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipMatch) {
      const octet1 = parseInt(ipMatch[1], 10);
      const octet2 = parseInt(ipMatch[2], 10);

      // 10.0.0.0 - 10.255.255.255
      if (octet1 === 10) return { isValid: false, error: 'Private IP addresses are prohibited' };
      // 172.16.0.0 - 172.31.255.255
      if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return { isValid: false, error: 'Private IP addresses are prohibited' };
      // 192.168.0.0 - 192.168.255.255
      if (octet1 === 192 && octet2 === 168) return { isValid: false, error: 'Private IP addresses are prohibited' };
    }

    // Must have a valid dot in domain (e.g. example.com)
    if (!hostname.includes('.')) {
      return { isValid: false, error: 'Domain must have a valid Top-Level Domain (TLD)' };
    }

    return { isValid: true, normalizedUrl: parsed.toString() };
  } catch (err: any) {
    return { isValid: false, error: 'Malformed URL format' };
  }
}

// In-memory rate limiting map (with sliding window timestamps)
const rateLimitMap = new Map<string, number[]>();

/**
 * In-memory rate limiter with sliding window.
 * Drop-in replaceable with Upstash Redis in cluster environments.
 */
export function checkRateLimit(
  key: string,
  limit: number = 60,
  windowSeconds: number = 60
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const cutoff = now - windowMs;

  const timestamps = rateLimitMap.get(key) || [];
  const validTimestamps = timestamps.filter((t) => t > cutoff);

  if (validTimestamps.length >= limit) {
    const oldest = validTimestamps[0];
    const resetInSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.max(1, resetInSeconds),
    };
  }

  validTimestamps.push(now);
  rateLimitMap.set(key, validTimestamps);

  // Periodically cleanup expired keys
  if (rateLimitMap.size > 5000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (v.every((t) => t <= cutoff)) {
        rateLimitMap.delete(k);
      }
    }
  }

  return {
    allowed: true,
    remaining: limit - validTimestamps.length,
    resetInSeconds: windowSeconds,
  };
}

/**
 * Validates Cloudflare Turnstile token server-side
 */
export async function verifyTurnstileToken(token: string, remoteIp?: string): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY || !token) {
    return true; // Graceful fallback if not configured
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', env.TURNSTILE_SECRET_KEY);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.error('⚠️ Turnstile validation error:', err);
    return true;
  }
}
