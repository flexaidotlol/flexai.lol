import Stripe from 'stripe';
import { env } from '../env';

const hasStripe = Boolean(env.STRIPE_SECRET_KEY && !env.STRIPE_SECRET_KEY.includes('mock'));

export const stripe = hasStripe
  ? new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia' as any,
      typescript: true,
    })
  : null;

export interface CreateCheckoutParams {
  productId: string;
  productName: string;
  amountCents: number;
  bidId: string;
  userEmail?: string;
  returnUrl: string;
}

export async function createStripeCheckoutSession(params: CreateCheckoutParams): Promise<{ url: string; sessionId: string }> {
  const { productId, productName, amountCents, bidId, userEmail, returnUrl } = params;

  if (amountCents < env.MINIMUM_BID_CENTS) {
    throw new Error(`Minimum bid amount is $${(env.MINIMUM_BID_CENTS / 100).toFixed(2)}`);
  }

  // If real Stripe is configured, create live Stripe Checkout session
  if (stripe) {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: env.STRIPE_CURRENCY,
            product_data: {
              name: `FlexAI Leaderboard Rank — ${productName}`,
              description: `FlexAI is a public leaderboard. You pay to stand above everyone else. Rank is the bid — nothing else. Completed payment claims the rank. One-time non-recurring payment.`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        description: `FlexAI.lol listing for ${productName}. One-time competitive ranking payment.`,
      },
      custom_text: {
        submit: {
          message: 'FlexAI is a public pay-to-rank arena. By completing this payment, your AI is placed live on the leaderboard. Contact @ByManuuDB on X for any questions before initiating a dispute.',
        },
      },
      metadata: {
        productId,
        bidId,
        amountCents: amountCents.toString(),
      },
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&bid_id=${bidId}&product_id=${productId}&status=success`,
      cancel_url: `${returnUrl}?status=cancelled`,
    });

    return {
      url: session.url || `${returnUrl}?session_id=${session.id}&bid_id=${bidId}&product_id=${productId}`,
      sessionId: session.id,
    };
  }

  // Local Development simulation mode
  const mockSessionId = 'cs_mock_' + Math.random().toString(36).substring(2, 12);
  const redirectUrl = `/bid/success?session_id=${mockSessionId}&bid_id=${bidId}&product_id=${productId}&simulated=true`;

  return {
    url: redirectUrl,
    sessionId: mockSessionId,
  };
}

export function constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event | null {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    return null;
  }
  return stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
}
