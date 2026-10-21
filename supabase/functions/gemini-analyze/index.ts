// Supabase Edge Function: gemini-analyze
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const SYSTEM_PROMPT = `You are an expert medical visual health educator specializing in dermatology, skin conditions, and visual health observations.
Analyze the provided image carefully and thoroughly. Provide an objective, educational assessment of the visual features visible in the image.

Respond ONLY with a valid JSON object matching this exact structure:
{
  "condition": "Primary observation or possible condition name",
  "confidence": <integer between 15 and 92 reflecting visual feature clarity>,
  "description": "Detailed educational description of what is visually observed in the image (3-4 sentences)",
  "causes": ["Possible factor 1", "Possible factor 2", "Possible factor 3"],
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "doctorAdvice": "Specific specialist guidance and urgency level"
}

Important: This is strictly for educational and informational purposes. Not a medical diagnosis.`;

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

    const { base64Image, mimeType, context } = await req.json();
    if (!base64Image) {
      return new Response(JSON.stringify({ error: 'Missing base64Image' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '').trim();
    const cleanMime = mimeType || 'image/jpeg';
    const prompt = context ? `${SYSTEM_PROMPT}\n\nContext: ${context}` : SYSTEM_PROMPT;

    let lastError = null;
    for (const model of MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                { inline_data: { mime_type: cleanMime, data: cleanBase64 } }
              ]
            }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 1200,
              responseMimeType: 'application/json'
            }
          })
        });

        if (res.ok) {
          const data = await res.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          const parsed = JSON.parse(rawText);
          return new Response(JSON.stringify({ result: parsed, raw: rawText, model }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const text = await res.text();
        lastError = new Error(`Model ${model} returned ${res.status}: ${text}`);
      } catch (err) {
        lastError = err;
      }
    }

    return new Response(JSON.stringify({ error: lastError?.message || 'Vision analysis failed' }), {
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
