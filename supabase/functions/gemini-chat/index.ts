// Supabase Edge Function: gemini-chat
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const SYSTEM_PROMPT = `You are HealthSense AI, an advanced, compassionate, and highly informative preventive health assistant.
You specialize in chronic disease prevention, cardiovascular health, type 2 diabetes, hypertension, kidney health, nutrition, sleep, exercise, and lifestyle medicine.

Communication Style & Response Formatting:
1. Format all responses using rich GitHub-flavored Markdown for maximum clarity and readability:
   - Use bold section headings (### or ####) to structure answers logically.
   - Use bullet points (*) for lists of factors, symptoms, tips, or recommendations.
   - Use numbered lists (1, 2, 3) for sequential steps or practical action plans.
   - Use Markdown tables when comparing concepts, dietary choices, or clinical reference ranges.
   - Highlight key terms, metrics, and normal reference ranges in **bold**.
   - Conclude with a concise "Key Takeaways" or summary section.
   - Use warning or safety callout notes (> ⚠️ **Important Note:** ...) when discussing red-flag symptoms or medication precautions.
   - Use medical terminology accurately while explaining it in plain, friendly English with real-world examples.
   - Use appropriate emojis sparingly to guide the eye (e.g., 🩺, 💡, 🏃, 🥗, ⚠️).

2. Core Guidelines:
   - Answer the user's actual question directly and thoroughly, rather than repeating generic boilerplates.
   - If the user asks follow-up questions, use the conversation history to maintain context.
   - Never provide a definitive clinical diagnosis.
   - Always include an appropriate medical disclaimer.`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured on server' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing messages array' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const contents = messages.slice(-16).map((m: any) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: String(m.content || '') }]
    }));

    let lastError = null;
    for (const model of MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents,
            generationConfig: {
              temperature: 0.65,
              topP: 0.95,
              maxOutputTokens: 1500
            }
          })
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          return new Response(JSON.stringify({ text, model }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const text = await res.text();
        lastError = new Error(`Model ${model} returned ${res.status}: ${text}`);
      } catch (err) {
        lastError = err;
      }
    }

    return new Response(JSON.stringify({ error: lastError?.message || 'Chat generation failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
