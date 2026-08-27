import { describe, it, expect, beforeEach } from 'vitest';
import { memoryStore } from '../src/lib/data/mock-store';
import { centsToDollars, formatDomain, slugify } from '../src/lib/utils/format';

describe('Leaderboard Ordering & Ranking Mechanics', () => {
  it('correctly orders products by highest bid first', () => {
    const products = memoryStore.getProducts();
    expect(products.length).toBeGreaterThan(0);

    for (let i = 0; i < products.length - 1; i++) {
      expect(products[i].current_bid_cents).toBeGreaterThanOrEqual(products[i + 1].current_bid_cents);
    }
  });

  it('correctly calculates projected ranks for arbitrary bid amounts', () => {
    const calc1 = memoryStore.calculateExpectedRank(2000000); // $20,000 > $12,456
    expect(calc1.expected_rank).toBe(1);

    const calc2 = memoryStore.calculateExpectedRank(50); // $0.50, below seeded #1 at $1.00
    expect(calc2.expected_rank).toBeGreaterThan(1);
  });

  it('formats cents into USD currency strings accurately', () => {
    expect(centsToDollars(500)).toBe('$5');
    expect(centsToDollars(1245600)).toBe('$12,456');
    expect(centsToDollars(550)).toBe('$5.50');
  });

  it('correctly sanitizes domains', () => {
    expect(formatDomain('https://chatgpt.com/search?q=1')).toBe('chatgpt.com');
    expect(formatDomain('www.midjourney.com')).toBe('midjourney.com');
  });

  it('generates URL safe slugs', () => {
    expect(slugify('Super Agent AI 2.0')).toBe('super-agent-ai-20');
    expect(slugify('  Claude 3.5 Sonnet  ')).toBe('claude-35-sonnet');
  });
});
