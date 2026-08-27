import type { APIRoute } from 'astro';
import { constructWebhookEvent } from '../../../lib/stripe';
import { processPaidBid } from '../../../services/bids';
import { supabaseServer } from '../../../lib/supabase/server';
import { memoryStore } from '../../../lib/data/mock-store';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing stripe signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rawBody = await request.text();
  let event: any;

  try {
    event = constructWebhookEvent(rawBody, signature);
  } catch (err: any) {
    console.error('⚠️ Stripe Webhook signature verification failed:', err.message);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!event) {
    // If webhook secret not configured or simulated in local testing, parse payload safely
    try {
      event = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { status: 400 });
    }
  }

  const eventId = event.id;
  const eventType = event.type;

  // Idempotency check
  if (supabaseServer) {
    const { data: existing } = await supabaseServer
      .from('stripe_events')
      .select('id')
      .eq('stripe_event_id', eventId)
      .single();

    if (existing) {
      console.log(`ℹ️ Stripe Event ${eventId} already processed.`);
      return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200 });
    }
  } else {
    if (memoryStore.isStripeEventProcessed(eventId)) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200 });
    }
  }

  try {
    switch (eventType) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const bidId = session.metadata?.bidId;
        const paymentIntentId = session.payment_intent as string | undefined;
        const customerEmail = session.customer_details?.email || session.customer_email;

        if (bidId) {
          await processPaidBid(bidId, paymentIntentId, customerEmail);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.warn(`Payment failed for Intent: ${paymentIntent.id}`);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        console.info(`Checkout session expired: ${session.id}`);
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${eventType}`);
    }

    // Record processed event for idempotency
    if (supabaseServer) {
      await supabaseServer.from('stripe_events').insert({
        stripe_event_id: eventId,
        event_type: eventType,
        payload_reference: event,
      });
    } else {
      memoryStore.recordStripeEvent(eventId);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error executing webhook transaction:', err);
    return new Response(JSON.stringify({ error: 'Webhook processing failure' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
