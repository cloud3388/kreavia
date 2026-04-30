/**
 * api/webhooks/lemonsqueezy.js
 * Lemon Squeezy Webhook Handler
 */
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

// Use Service Role to bypass RLS for webhook updates
const supabase = (supabaseUrl && supabaseServiceRoleKey) 
  ? createClient(supabaseUrl, supabaseServiceRoleKey) 
  : null;

export default async function handler(req, res) {
  // Lemon Squeezy webhooks are always POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Verify Signature
  // Note: Vercel provides req.body as a parsed object. 
  // For signature verification, we ideally need the raw body.
  // In Vercel serverless functions, we might need to use a special config to get raw body if parsed body fails verification.
  const rawBody = JSON.stringify(req.body); 
  const hmac = crypto.createHmac('sha256', webhookSecret);
  const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
  const signature = Buffer.from(req.headers['x-signature'] || '', 'utf8');

  if (signature.length === 0 || !crypto.timingSafeEqual(digest, signature)) {
    console.error('[webhook] Invalid signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { meta, data } = req.body;
  const eventName = meta.event_name;
  const userId = meta.custom_data?.user_id;

  console.log(`[webhook] Received event: ${eventName} for user: ${userId}`);

  if (!userId || !supabase) {
    console.error('[webhook] User ID missing or Supabase not configured');
    return res.status(400).json({ error: 'Context missing' });
  }

  const subId = data.id;
  const attributes = data.attributes;

  try {
    switch (eventName) {
      case 'order_created':
        // 1. Upgrade main user plan
        await supabase
          .from('users')
          .update({ plan: 'pro' })
          .eq('id', userId);

        // 2. Upsert subscription record
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            plan: 'pro',
            status: 'active',
            payment_provider: 'lemonsqueezy',
            provider_sub_id: subId.toString(),
            lemonsqueezy_order_id: attributes.order_id?.toString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        break;

      case 'subscription_cancelled':
        await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        break;

      case 'subscription_resumed':
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            cancelled_at: null
          })
          .eq('user_id', userId);
        break;

      case 'subscription_expired':
      case 'subscription_payment_failed':
        // The real downgrade happens here or when payment fails
        await supabase
          .from('users')
          .update({ plan: 'free' })
          .eq('id', userId);

        await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
            plan: 'free'
          })
          .eq('user_id', userId);
        break;

      default:
        console.warn(`[webhook] Unhandled event: ${eventName}`);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[webhook] Database Error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
