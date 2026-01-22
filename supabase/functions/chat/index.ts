import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é o assistente virtual do NauticaMarket, um marketplace premium de embarcações náuticas no Brasil. 

Seu papel:
- Ajudar usuários a encontrar a embarcação perfeita para suas necessidades
- Responder perguntas sobre tipos de embarcações (iates, veleiros, lanchas, jet skis, catamarãs, etc.)
- Auxiliar com informações sobre reservas, preços e disponibilidade
- Sugerir roteiros e experiências náuticas
- Ser amigável, profissional e conhecedor do mundo náutico

Personalidade:
- Sofisticado mas acessível
- Entusiasta do mar e da náutica
- Prestativo e proativo em oferecer sugestões
- Usa linguagem clara e elegante

Quando o usuário buscar embarcações, você deve:
1. Perguntar sobre data desejada, número de passageiros e preferências
2. Sugerir opções adequadas ao perfil
3. Explicar características e diferenciais de cada opção
4. Auxiliar no processo de reserva

Sempre responda em português brasileiro.`;

type IncomingMessage = { role: "user" | "assistant" | "system"; content: string };

type RichContentType =
  | "boat_card"
  | "boat_carousel"
  | "booking_calendar"
  | "booking_summary"
  | "quick_actions";

type RichContent = {
  type: RichContentType;
  data: unknown;
};

type PricingRuleRow = {
  pricing_type:
    | "weekday"
    | "weekend"
    | "holiday"
    | "high_season"
    | "low_season"
    | "special";
  price_modifier: number;
  start_date: string | null;
  end_date: string | null;
  day_of_week: number | null;
  is_active: boolean | null;
};

function getDayOfWeek(dateIso: string) {
  // dateIso: YYYY-MM-DD
  const [y, m, d] = dateIso.split("-").map((n) => Number(n));
  // Use UTC to avoid timezone edge cases
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function isWithin(dateIso: string, startIso: string | null, endIso: string | null) {
  if (!startIso && !endIso) return true;
  if (startIso && dateIso < startIso) return false;
  if (endIso && dateIso > endIso) return false;
  return true;
}

function isWeekend(dayOfWeek: number) {
  return dayOfWeek === 0 || dayOfWeek === 6;
}

function pickBestModifier(args: {
  dateIso: string;
  dayOfWeek: number;
  isHoliday: boolean;
  rules: PricingRuleRow[];
}) {
  const { dateIso, dayOfWeek, isHoliday, rules } = args;
  let best = 1;

  for (const rule of rules) {
    if (rule.is_active === false) continue;
    if (!isWithin(dateIso, rule.start_date, rule.end_date)) continue;
    if (rule.day_of_week !== null && rule.day_of_week !== dayOfWeek) continue;

    const type = rule.pricing_type;
    const modifier = Number(rule.price_modifier ?? 1);
    if (!Number.isFinite(modifier) || modifier <= 0) continue;

    let matches = false;
    if (type === "holiday") {
      matches = isHoliday;
    } else if (type === "weekday") {
      matches = !isWeekend(dayOfWeek);
    } else if (type === "weekend") {
      matches = isWeekend(dayOfWeek);
    } else if (type === "high_season" || type === "low_season") {
      matches = rule.start_date !== null || rule.end_date !== null;
    } else if (type === "special") {
      matches = true;
    }

    if (matches) {
      best = Math.max(best, modifier);
    }
  }

  return best;
}

function extractBoatId(text: string) {
  // UUID v4-ish
  const match = text.match(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i
  );
  return match?.[0] ?? null;
}

function extractSelectedDate(text: string) {
  const match = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  return match?.[1] ?? null;
}

function isConfirmBooking(text: string) {
  const t = text.toLowerCase();
  return t.includes("confirmar") && t.includes("reserva");
}

function extractBookingId(text: string) {
  const t = text.toLowerCase();
  if (!t.includes("reserva")) return null;
  return extractBoatId(text);
}

async function createStripeCheckoutSession(args: {
  stripeSecretKey: string;
  appUrl: string;
  bookingId: string;
  amountCents: number;
  currency: string;
  description: string;
  metadata?: Record<string, string>;
}) {
  const {
    stripeSecretKey,
    appUrl,
    bookingId,
    amountCents,
    currency,
    description,
    metadata,
  } = args;

  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('success_url', `${appUrl.replace(/\/$/, '')}/?paid=1&session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${appUrl.replace(/\/$/, '')}/?canceled=1`);

  params.set('line_items[0][price_data][currency]', currency);
  params.set('line_items[0][price_data][unit_amount]', String(amountCents));
  params.set('line_items[0][price_data][product_data][name]', 'Reserva NauticaMarket');
  params.set('line_items[0][price_data][product_data][description]', description);
  params.set('line_items[0][quantity]', '1');

  // “Escrow” (MVP): autoriza e captura depois
  params.set('payment_intent_data[capture_method]', 'manual');
  params.set('client_reference_id', bookingId);
  if (metadata) {
    for (const [k, v] of Object.entries(metadata)) {
      params.set(`metadata[${k}]`, v);
      params.set(`payment_intent_data[metadata][${k}]`, v);
    }
  }

  // Expand para obter payment_intent id
  params.set('expand[0]', 'payment_intent');

  const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const json = await resp.json();
  if (!resp.ok) {
    console.error('Stripe error:', resp.status, json);
    throw new Error('Falha ao iniciar pagamento com Stripe');
  }

  return json as any;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateOnlyISO(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shouldSuggestBoats(lastUserMessage: string) {
  const text = lastUserMessage.toLowerCase();
  return (
    text.includes("mostre") ||
    text.includes("mostrar") ||
    text.includes("opções") ||
    text.includes("opcoes") ||
    text.includes("quais") ||
    text.includes("embar") ||
    text.includes("lancha") ||
    text.includes("iate") ||
    text.includes("veleiro") ||
    text.includes("catamar") ||
    text.includes("jet")
  );
}

function inferBoatType(lastUserMessage: string) {
  const text = lastUserMessage.toLowerCase();
  if (text.includes("jet")) return "jet_ski";
  if (text.includes("iate")) return "yacht";
  if (text.includes("veleir")) return "sailboat";
  if (text.includes("catamar")) return "catamaran";
  if (text.includes("pont")) return "pontoon";
  if (text.includes("pesca")) return "fishing_boat";
  if (text.includes("lancha")) return "speedboat";
  if (text.includes("barco")) return "leisure_boat";
  return null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, ownerId } = (await req.json()) as {
      messages: IncomingMessage[];
      ownerId?: string;
    };
    const apiKey =
      Deno.env.get("OPENROUTER_API_KEY") ??
      Deno.env.get("OPENAI_API_KEY") ??
      Deno.env.get("AI_API_KEY");

    const baseUrl =
      Deno.env.get("OPENROUTER_BASE_URL") ??
      Deno.env.get("OPENAI_BASE_URL") ??
      "https://openrouter.ai/api/v1";

    const model =
      Deno.env.get("OPENROUTER_MODEL") ??
      Deno.env.get("OPENAI_MODEL") ??
      "meta-llama/llama-3.3-70b-instruct:free";

    if (!apiKey) {
      throw new Error(
        "AI_API_KEY is not configured (set OPENROUTER_API_KEY or OPENAI_API_KEY)"
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnon =
      Deno.env.get("SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_ANON_KEY".toLowerCase());
    const supabaseService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL is not configured");
    }

    // Para rich components públicos (boats/owners), preferimos service role para evitar falhas de RLS.
    // Como só retornamos dados públicos (embarcações ativas), não expomos dados sensíveis.
    const supabaseKey = supabaseService ?? supabaseAnon;
    if (!supabaseKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7)
      : null;

    const userClient = jwt && supabaseAnon
      ? createClient(supabaseUrl, supabaseAnon, {
          auth: { persistSession: false },
          global: { headers: { Authorization: `Bearer ${jwt}` } },
        })
      : null;

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const appUrl = Deno.env.get('APP_URL') ?? Deno.env.get('SITE_URL') ?? 'http://localhost:5173';

    // Build system prompt - contextual based on owner page
    let systemContent = SYSTEM_PROMPT;
    if (ownerId) {
      systemContent += `\n\nATENÇÃO: Você está na página de um proprietário específico (ID: ${ownerId}). 
Foque apenas nas embarcações deste proprietário. Não sugira embarcações de outros proprietários.`;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    // OpenRouter recomenda enviar identificadores do app (opcionais)
    const httpReferer = Deno.env.get("OPENROUTER_HTTP_REFERER");
    const appTitle = Deno.env.get("OPENROUTER_APP_TITLE");
    if (httpReferer) headers["HTTP-Referer"] = httpReferer;
    if (appTitle) headers["X-Title"] = appTitle;

    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      // OpenRouter pode retornar 402/403 dependendo do plano/modelo
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({
          error:
            response.status === 402
              ? "Créditos esgotados ou plano incompatível com o modelo."
              : response.status === 401 || response.status === 403
                ? "Falha de autenticação na IA. Verifique a chave/configuração."
                : "Erro ao processar sua mensagem. Tente novamente.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const aiJson = await response.json();
    const assistantText: string =
      aiJson?.choices?.[0]?.message?.content ??
      aiJson?.choices?.[0]?.text ??
      "";

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const selectedBoatId = extractBoatId(lastUserMessage);
    const selectedDate = extractSelectedDate(lastUserMessage);
    const wantBoats = shouldSuggestBoats(lastUserMessage);
    const inferredType = inferBoatType(lastUserMessage);

    let richContent: RichContent | undefined;

    // 0) Confirmação -> cria booking pending
    if (selectedBoatId && selectedDate && isConfirmBooking(lastUserMessage)) {
      if (!userClient) {
        richContent = {
          type: "quick_actions",
          data: {
            type: "quick_actions",
            actions: [
              { label: "Fazer login", action: "Quero fazer login para confirmar a reserva" },
              { label: "Criar conta", action: "Quero criar uma conta para reservar" },
            ],
          },
        };

        return new Response(
          JSON.stringify({
            message: {
              role: "assistant",
              content:
                "Para confirmar a reserva, você precisa estar logado. Quer fazer login ou criar uma conta?",
              richContent,
            },
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Resolve user id from JWT
      const userRes: any = await (userClient as any).auth.getUser(jwt);
      const userId: string | undefined = userRes?.data?.user?.id;
      if (!userId) {
        throw new Error("Usuário não autenticado");
      }

      // Recalcula preço para persistir
      const { data: boat } = await supabase
        .from("boats")
        .select("id, name, base_price, deposit_amount")
        .eq("id", selectedBoatId)
        .eq("is_active", true)
        .maybeSingle();

      if (!boat) {
        throw new Error("Embarcação não encontrada ou inativa");
      }

      const dayOfWeek = getDayOfWeek(selectedDate);
      const { data: holidayRow } = await supabase
        .from("holidays")
        .select("id")
        .eq("date", selectedDate)
        .limit(1)
        .maybeSingle();
      const isHoliday = !!holidayRow;

      const { data: rules } = await supabase
        .from("dynamic_pricing")
        .select("pricing_type, price_modifier, start_date, end_date, day_of_week, is_active")
        .eq("boat_id", boat.id)
        .eq("is_active", true);

      const modifier = pickBestModifier({
        dateIso: selectedDate,
        dayOfWeek,
        isHoliday,
        rules: (rules ?? []) as PricingRuleRow[],
      });

      let loyaltyDiscountPct = 0;
      const { data: profile } = await userClient
        .from("profiles")
        .select("total_rentals")
        .eq("user_id", userId)
        .maybeSingle();
      const totalRentals = Number(profile?.total_rentals ?? 0);
      if (Number.isFinite(totalRentals) && totalRentals > 0 && totalRentals % 5 === 0) {
        loyaltyDiscountPct = 10;
      }

      const basePrice = Number(boat.base_price);
      const priceWithModifier = Math.round(basePrice * modifier * 100) / 100;
      const discountAmount = Math.round((priceWithModifier * loyaltyDiscountPct) / 100 * 100) / 100;
      const totalPrice = Math.max(0, Math.round((priceWithModifier - discountAmount) * 100) / 100);

      // Evita duplicar pending/confirmed no mesmo dia
      const { data: existing } = await userClient
        .from("bookings")
        .select("id, status")
        .eq("user_id", userId)
        .eq("boat_id", boat.id)
        .eq("booking_date", selectedDate)
        .in("status", ["pending", "confirmed", "in_progress"])
        .limit(1)
        .maybeSingle();

      if (existing?.id) {
        richContent = {
          type: "quick_actions",
          data: {
            type: "quick_actions",
            actions: [
              { label: "Ver minhas reservas", action: "Quero ver minhas reservas" },
              { label: "Escolher outra data", action: `Quero reservar a embarcação ${boat.id}` },
            ],
          },
        };

        return new Response(
          JSON.stringify({
            message: {
              role: "assistant",
              content:
                "Você já tem uma reserva ativa (pendente/confirmada) para essa embarcação nessa data.",
              richContent,
            },
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data: created, error: createError } = await userClient
        .from("bookings")
        .insert({
          user_id: userId,
          boat_id: boat.id,
          booking_date: selectedDate,
          passengers: 1,
          base_price: priceWithModifier,
          discount_amount: discountAmount,
          platform_fee: 0,
          total_price: totalPrice,
          deposit_amount: boat.deposit_amount ?? 0,
          status: "pending",
        })
        .select("id")
        .single();

      if (createError) {
        console.error("Create booking error:", createError);
        throw new Error("Não foi possível criar a reserva. Tente novamente.");
      }

      richContent = {
        type: "quick_actions",
        data: {
          type: "quick_actions",
          actions: [
            { label: "Pagar com segurança (Stripe)", action: `Quero pagar a reserva ${created.id}` },
            { label: "Adicionar observações", action: `Quero adicionar observações na reserva ${created.id}` },
          ],
        },
      };

      return new Response(
        JSON.stringify({
          message: {
            role: "assistant",
            content:
              `Reserva criada com sucesso (status: pendente) para ${boat.name} em ${selectedDate}. Próximo passo: pagamento do sinal ou do total (Stripe).`,
            richContent,
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 0.5) Pagamento Stripe para uma reserva existente
    const bookingIdForPayment = extractBookingId(lastUserMessage);
    if (bookingIdForPayment && lastUserMessage.toLowerCase().includes('pagar')) {
      if (!stripeSecretKey) {
        throw new Error('STRIPE_SECRET_KEY is not configured');
      }
      if (!userClient) {
        return new Response(
          JSON.stringify({
            message: {
              role: 'assistant',
              content: 'Para pagar uma reserva, você precisa estar logado. Faça login e tente novamente.',
              richContent: {
                type: 'quick_actions',
                data: {
                  type: 'quick_actions',
                  actions: [
                    { label: 'Fazer login', action: 'Quero fazer login para pagar minha reserva' },
                    { label: 'Criar conta', action: 'Quero criar uma conta para pagar a reserva' },
                  ],
                },
              },
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const userRes: any = await (userClient as any).auth.getUser(jwt);
      const userId: string | undefined = userRes?.data?.user?.id;
      if (!userId) throw new Error('Usuário não autenticado');

      const { data: booking, error: bookingError } = await userClient
        .from('bookings')
        .select('id, boat_id, booking_date, total_price, deposit_amount, status')
        .eq('id', bookingIdForPayment)
        .eq('user_id', userId)
        .maybeSingle();

      if (bookingError) {
        console.error('Booking fetch error:', bookingError);
      }
      if (!booking) {
        throw new Error('Reserva não encontrada (ou não pertence ao usuário)');
      }
      if (!['pending', 'confirmed'].includes(String(booking.status))) {
        throw new Error('Esta reserva não está disponível para pagamento');
      }

      const { data: boat } = await supabase
        .from('boats')
        .select('id, owner_id, name')
        .eq('id', booking.boat_id)
        .maybeSingle();

      const { data: owner } = boat?.owner_id
        ? await supabase.from('owners').select('id, commission_rate').eq('id', boat.owner_id).maybeSingle()
        : { data: null };

      const amount = Number(booking.deposit_amount && booking.deposit_amount > 0 ? booking.deposit_amount : booking.total_price);
      const amountCents = Math.round(amount * 100);
      const commissionRate = Number(owner?.commission_rate ?? 10);
      const platformFee = Math.round((amount * commissionRate) / 100 * 100) / 100;
      const ownerAmount = Math.max(0, Math.round((amount - platformFee) * 100) / 100);

      // Evita criar pagamentos duplicados pendentes
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id, stripe_payment_intent_id, status')
        .eq('booking_id', booking.id)
        .in('status', ['pending', 'held'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingPayment?.stripe_payment_intent_id) {
        // Ainda não temos um link para reabrir sessão com segurança; criaremos uma nova sessão.
      }

      const session = await createStripeCheckoutSession({
        stripeSecretKey,
        appUrl,
        bookingId: booking.id,
        amountCents,
        currency: 'brl',
        description: `${boat?.name ?? 'Embarcação'} em ${booking.booking_date}`,
        metadata: {
          booking_id: booking.id,
          boat_id: booking.boat_id,
          booking_date: booking.booking_date,
        },
      });

      const paymentIntentId = typeof session?.payment_intent === 'string'
        ? session.payment_intent
        : session?.payment_intent?.id;

      await supabase.from('payments').insert({
        booking_id: booking.id,
        stripe_payment_intent_id: paymentIntentId ?? null,
        amount,
        platform_fee: platformFee,
        owner_amount: ownerAmount,
        status: 'pending',
      });

      const richContent = {
        type: 'payment_link',
        data: {
          type: 'payment_link',
          bookingId: booking.id,
          url: session.url,
          amount,
          note: 'O pagamento será autorizado agora e capturado após o check-in (MVP).',
        },
      };

      return new Response(
        JSON.stringify({
          message: {
            role: 'assistant',
            content: 'Perfeito — aqui está seu link de pagamento seguro via Stripe.',
            richContent,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1) Seleção de data -> gerar resumo
    if (selectedBoatId && selectedDate && lastUserMessage.toLowerCase().includes("selec")) {
      const { data: boat, error: boatError } = await supabase
        .from("boats")
        .select("id, name, base_price, deposit_amount")
        .eq("id", selectedBoatId)
        .eq("is_active", true)
        .maybeSingle();

      if (boatError) {
        console.error("Supabase boat fetch error:", boatError);
      }

      if (boat) {
        const dayOfWeek = getDayOfWeek(selectedDate);
        const { data: holidayRow } = await supabase
          .from("holidays")
          .select("id")
          .eq("date", selectedDate)
          .limit(1)
          .maybeSingle();

        const isHoliday = !!holidayRow;

        const { data: rules } = await supabase
          .from("dynamic_pricing")
          .select("pricing_type, price_modifier, start_date, end_date, day_of_week, is_active")
          .eq("boat_id", boat.id)
          .eq("is_active", true);

        const modifier = pickBestModifier({
          dateIso: selectedDate,
          dayOfWeek,
          isHoliday,
          rules: (rules ?? []) as PricingRuleRow[],
        });

        // Fidelidade: a cada 5 aluguéis concluídos, 10% no próximo
        let loyaltyDiscountPct = 0;
        if (userClient) {
          try {
            // getUser(jwt) é compatível em supabase-js v2; mantemos try/catch para evitar falha caso API mude.
            const userRes: any = await (userClient as any).auth.getUser(jwt);
            const userId: string | undefined = userRes?.data?.user?.id;

            if (userId) {
              const { data: profile } = await userClient
                .from("profiles")
                .select("total_rentals")
                .eq("user_id", userId)
                .maybeSingle();

              const totalRentals = Number(profile?.total_rentals ?? 0);
              if (Number.isFinite(totalRentals) && totalRentals > 0 && totalRentals % 5 === 0) {
                loyaltyDiscountPct = 10;
              }
            }
          } catch (err) {
            console.error("Failed to compute loyalty discount:", err);
          }
        }

        const basePrice = Number(boat.base_price);
        const priceWithModifier = Math.round(basePrice * modifier * 100) / 100;
        const discountAmount = Math.round((priceWithModifier * loyaltyDiscountPct) / 100 * 100) / 100;
        const totalPrice = Math.max(0, Math.round((priceWithModifier - discountAmount) * 100) / 100);

        richContent = {
          type: "booking_summary",
          data: {
            type: "booking_summary",
            booking: {
              boatId: boat.id,
              boatName: boat.name,
              date: selectedDate,
              passengers: 1,
              basePrice,
              totalPrice,
              depositAmount: boat.deposit_amount ?? undefined,
            },
          },
        };
      }
    }

    // 2) Pedido de reserva -> mostrar calendário
    if (!richContent && selectedBoatId && lastUserMessage.toLowerCase().includes("reserv")) {
      const { data: boat, error: boatError } = await supabase
        .from("boats")
        .select("id, name")
        .eq("id", selectedBoatId)
        .eq("is_active", true)
        .maybeSingle();

      if (boatError) {
        console.error("Supabase boat fetch error:", boatError);
      }

      if (boat) {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const end = addDays(start, 60);

        const { data: blockedManual } = await supabase
          .from("availability")
          .select("date, is_available")
          .eq("boat_id", boat.id)
          .eq("is_available", false)
          .gte("date", toDateOnlyISO(start))
          .lte("date", toDateOnlyISO(end));

        const { data: booked } = await supabase
          .from("bookings")
          .select("booking_date, status")
          .eq("boat_id", boat.id)
          .in("status", ["pending", "confirmed", "in_progress"])
          .gte("booking_date", toDateOnlyISO(start))
          .lte("booking_date", toDateOnlyISO(end));

        const blockedDatesSet = new Set<string>();
        for (const row of blockedManual ?? []) {
          if (row.date) blockedDatesSet.add(row.date);
        }
        for (const row of booked ?? []) {
          if (row.booking_date) blockedDatesSet.add(row.booking_date);
        }

        const availableDates: string[] = [];
        for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
          const iso = toDateOnlyISO(d);
          if (!blockedDatesSet.has(iso)) availableDates.push(iso);
        }

        richContent = {
          type: "booking_calendar",
          data: {
            type: "booking_calendar",
            boatId: boat.id,
            boatName: boat.name,
            availableDates,
            blockedDates: Array.from(blockedDatesSet),
          },
        };
      }
    }

    if (!richContent && wantBoats) {
      let boatsQuery = supabase
        .from("boats")
        .select("id, owner_id, name, type, description, capacity, base_price, length_meters, has_crew")
        .eq("is_active", true)
        .limit(8);

      if (ownerId) {
        boatsQuery = boatsQuery.eq("owner_id", ownerId);
      }
      if (inferredType) {
        boatsQuery = boatsQuery.eq("type", inferredType);
      }

      const { data: boats, error: boatsError } = await boatsQuery;
      if (boatsError) {
        console.error("Supabase boats query error:", boatsError);
      }

      if (boats && boats.length > 0) {
        const boatIds = boats.map((b) => b.id);
        const ownerIds = Array.from(new Set(boats.map((b) => b.owner_id)));

        const { data: photos } = await supabase
          .from("boat_photos")
          .select("boat_id, url, is_primary")
          .in("boat_id", boatIds)
          .order("is_primary", { ascending: false })
          .order("sort_order", { ascending: true });

        const { data: owners } = await supabase
          .from("owners")
          .select("id, marina_name, city, state")
          .in("id", ownerIds);

        const photosByBoat = new Map<string, Array<{ url: string; is_primary?: boolean }>>();
        for (const p of photos ?? []) {
          const list = photosByBoat.get(p.boat_id) ?? [];
          list.push({ url: p.url, is_primary: p.is_primary ?? false });
          photosByBoat.set(p.boat_id, list);
        }

        const ownersById = new Map<string, { marina_name: string; city?: string | null; state?: string | null }>();
        for (const o of owners ?? []) {
          ownersById.set(o.id, { marina_name: o.marina_name, city: o.city, state: o.state });
        }

        const carouselBoats = boats.map((b) => ({
          id: b.id,
          name: b.name,
          type: b.type,
          description: b.description ?? undefined,
          capacity: b.capacity,
          base_price: b.base_price,
          length_meters: b.length_meters ?? undefined,
          has_crew: b.has_crew ?? undefined,
          photos: photosByBoat.get(b.id) ?? [],
          owner: ownersById.get(b.owner_id),
        }));

        richContent = {
          type: "boat_carousel",
          data: {
            type: "boat_carousel",
            title: ownerId ? "Embarcações desta marina" : "Sugestões para você",
            boats: carouselBoats,
          },
        };
      } else {
        richContent = {
          type: "quick_actions",
          data: {
            type: "quick_actions",
            actions: [
              { label: "Buscar por data", action: "Quero buscar por uma data específica" },
              { label: "Buscar por capacidade", action: "Preciso de uma embarcação para X pessoas" },
              { label: "Ver categorias", action: "Quais tipos de embarcação vocês têm?" },
            ],
          },
        };
      }
    }

    return new Response(
      JSON.stringify({
        message: {
          role: "assistant",
          content: assistantText,
          richContent,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("Chat function error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
