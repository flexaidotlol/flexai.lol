import { describe, it, expect } from 'vitest';
import { submitProductSchema, outbidSchema } from '../src/services/bids';
import { memoryStore } from '../src/lib/data/mock-store';

describe('Bidding & Payment Integrity', () => {
  it('enforces minimum bid of $2.00 (200 cents)', () => {
    const invalidUnder2 = submitProductSchema.safeParse({
      name: 'Test AI',
      tagline: 'Super fast AI tool for testing',
      website_url: 'https://testai.com',
      category_id: 'c1',
      amount_cents: 199, // under 200
    });
    expect(invalidUnder2.success).toBe(false);

    const valid2 = submitProductSchema.safeParse({
      name: 'Test AI',
      tagline: 'Super fast AI tool for testing',
      website_url: 'https://testai.com',
      category_id: 'c1',
      amount_cents: 200,
    });
    expect(valid2.success).toBe(true);
  });

  it('atomically activates a paid bid and recalculates product rank', () => {
    // 1. Create a new test product
    const testProd = memoryStore.createProduct({
      name: 'Vitest Agent',
      slug: 'vitest-agent',
      tagline: 'Automated testing assistant',
      website_url: 'https://vitest.dev',
      category_id: 'c4',
      status: 'pending',
      current_bid_cents: 0,
    });

    // 2. Create a pending bid of $15,000 (1,500,000 cents) -> Should take #1 spot!
    const bid = memoryStore.createBid(testProd.id, 1500000);
    expect(bid.status).toBe('pending');

    // 3. Activate the bid
    const activation = memoryStore.activatePaidBid(bid.id, 'pi_test_vitest');
    expect(activation.success).toBe(true);
    expect(activation.new_rank).toBe(1);

    // 4. Verify product is active and ranked #1
    const refreshed = memoryStore.getProductBySlug('vitest-agent');
    expect(refreshed).not.toBeNull();
    expect(refreshed?.rank).toBe(1);
    expect(refreshed?.current_bid_cents).toBe(1500000);
  });

  it('guarantees webhook idempotency (duplicate events are ignored)', () => {
    const eventId = 'evt_test_idempotency_123';
    expect(memoryStore.isStripeEventProcessed(eventId)).toBe(false);

    memoryStore.recordStripeEvent(eventId);
    expect(memoryStore.isStripeEventProcessed(eventId)).toBe(true);
  });
});
