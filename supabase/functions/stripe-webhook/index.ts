// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

type StripeEvent = {
  id: string;
  type: string;
  created: number;
  data: { object: any };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeWebhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY is not configured");
    }

    const signatureHeader = req.headers.get("stripe-signature") ?? req.headers.get("Stripe-Signature");
    if (!signatureHeader) {
      return new Response(JSON.stringify({ error: "Missing Stripe-Signature header" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // IMPORTANT: Stripe requires verifying against the RAW request body
    const rawBody = await req.text();

    const isValid = await verifyStripeSignature({
      signatureHeader,
      payload: rawBody,
      secret: stripeWebhookSecret,
      toleranceSeconds: 300,
    });

    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(rawBody) as StripeEvent;

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // Minimal webhook handler to update booking/payment status
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const bookingId = session?.client_reference_id ?? session?.metadata?.booking_id;
        const paymentIntentId = typeof session?.payment_intent === "string"
          ? session.payment_intent
          : session?.payment_intent?.id;

        if (!bookingId) {
          console.warn("checkout.session.completed missing booking id");
          break;
        }

        if (paymentIntentId) {
          await supabase
            .from("payments")
            .update({
              status: "held",
              held_at: new Date().toISOString(),
              stripe_payment_intent_id: paymentIntentId,
            })
            .eq("booking_id", bookingId)
            .eq("status", "pending");
        } else {
          await supabase
            .from("payments")
            .update({
              status: "held",
              held_at: new Date().toISOString(),
            })
            .eq("booking_id", bookingId)
            .eq("status", "pending");
        }

        await supabase
          .from("bookings")
          .update({ status: "confirmed" })
          .eq("id", bookingId)
          .eq("status", "pending");

        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        const bookingId = session?.client_reference_id ?? session?.metadata?.booking_id;
        if (!bookingId) break;

        await supabase
          .from("payments")
          .update({ status: "failed" })
          .eq("booking_id", bookingId)
          .in("status", ["pending", "held"]);

        // Booking stays pending; user can retry payment.
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        const paymentIntentId = pi?.id;
        if (!paymentIntentId) break;

        await supabase
          .from("payments")
          .update({ status: "failed" })
          .eq("stripe_payment_intent_id", paymentIntentId)
          .in("status", ["pending", "held"]);

        break;
      }

      default:
        // No-op for now
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Stripe webhook error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

async function verifyStripeSignature(args: {
  signatureHeader: string;
  payload: string;
  secret: string;
  toleranceSeconds: number;
}) {
  const { signatureHeader, payload, secret, toleranceSeconds } = args;

  const parts = signatureHeader.split(",").map((p) => p.trim());
  const tPart = parts.find((p) => p.startsWith("t="));
  const v1Parts = parts.filter((p) => p.startsWith("v1="));

  if (!tPart || v1Parts.length === 0) return false;

  const timestamp = Number(tPart.slice(2));
  if (!Number.isFinite(timestamp)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSeconds) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expected = await hmacSha256Hex(secret, signedPayload);

  // Constant-time-ish compare against any of the v1 signatures
  for (const v of v1Parts) {
    const sig = v.slice(3);
    if (timingSafeEqualHex(expected, sig)) return true;
  }
  return false;
}

async function hmacSha256Hex(secret: string, message: string) {
  const keyData = new TextEncoder().encode(secret);
  const msgData = new TextEncoder().encode(message);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, msgData);
  return toHex(new Uint8Array(sig));
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualHex(a: string, b: string) {
  // Normalize
  const aa = a.toLowerCase();
  const bb = b.toLowerCase();
  if (aa.length !== bb.length) return false;

  let out = 0;
  for (let i = 0; i < aa.length; i++) {
    out |= aa.charCodeAt(i) ^ bb.charCodeAt(i);
  }
  return out === 0;
}
