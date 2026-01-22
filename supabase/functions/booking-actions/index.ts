// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!supabaseUrl || !anonKey || !serviceKey) {
      throw new Error("SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY must be configured");
    }
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : null;
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const action = body?.action;
    const bookingId = body?.bookingId;

    if (!action || !bookingId) {
      return new Response(JSON.stringify({ error: "Missing action/bookingId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    const serviceClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const userRes = await userClient.auth.getUser(jwt);
    const userId = userRes?.data?.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "checkin") {
      const { data: booking, error: bookingError } = await userClient
        .from("bookings")
        .select("id, user_id, status, check_in_at")
        .eq("id", bookingId)
        .eq("user_id", userId)
        .maybeSingle();

      if (bookingError) {
        console.error("Booking fetch error:", bookingError);
      }
      if (!booking) {
        return new Response(JSON.stringify({ error: "Reserva não encontrada" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (booking.check_in_at) {
        return new Response(JSON.stringify({ ok: true, already: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (booking.status !== "confirmed") {
        return new Response(
          JSON.stringify({ error: "A reserva precisa estar confirmada para realizar check-in" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const { data: payment } = await serviceClient
        .from("payments")
        .select("id, booking_id, stripe_payment_intent_id, status")
        .eq("booking_id", booking.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!payment?.stripe_payment_intent_id) {
        return new Response(JSON.stringify({ error: "Pagamento não encontrado para esta reserva" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (payment.status !== "held") {
        return new Response(
          JSON.stringify({ error: "Pagamento ainda não está retido/confirmado. Conclua o pagamento primeiro." }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Capture manual payment intent on check-in
      const captureResp = await fetch(
        `https://api.stripe.com/v1/payment_intents/${payment.stripe_payment_intent_id}/capture`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${stripeSecretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams().toString(),
        },
      );

      const captureJson = await captureResp.json();
      if (!captureResp.ok) {
        console.error("Stripe capture error:", captureResp.status, captureJson);
        return new Response(JSON.stringify({ error: "Falha ao liberar pagamento no check-in" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const now = new Date().toISOString();

      await serviceClient
        .from("payments")
        .update({ status: "released", released_at: now })
        .eq("id", payment.id)
        .eq("status", "held");

      await serviceClient
        .from("bookings")
        .update({ status: "in_progress", check_in_at: now })
        .eq("id", booking.id)
        .eq("status", "confirmed");

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unsupported action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("booking-actions error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
