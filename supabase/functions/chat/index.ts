import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, ownerId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build system prompt - contextual based on owner page
    let systemContent = SYSTEM_PROMPT;
    if (ownerId) {
      systemContent += `\n\nATENÇÃO: Você está na página de um proprietário específico (ID: ${ownerId}). 
Foque apenas nas embarcações deste proprietário. Não sugira embarcações de outros proprietários.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        stream: true,
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
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos esgotados. Por favor, adicione mais créditos." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar sua mensagem. Tente novamente." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
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
