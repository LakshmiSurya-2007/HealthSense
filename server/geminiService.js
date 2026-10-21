// Server-side Gemini service for HealthSense AI
// Uses GEMINI_API_KEY from environment, never exposed to client

const SYSTEM_PROMPT = `You are HealthSense AI, an advanced, compassionate, and highly informative preventive health assistant.
You specialize in chronic disease prevention, cardiovascular health, type 2 diabetes, hypertension, kidney health, nutrition, sleep, exercise, and lifestyle medicine.

Communication Style & Response Formatting:
1. Format all responses using rich GitHub-flavored Markdown for maximum clarity and readability:
   - Use bold section headings (### or ####) to structure answers logically.
   - Use bullet points (*) for lists of factors, symptoms, tips, or recommendations.
   - Use numbered lists (1, 2, 3) for sequential steps or practical action plans.
   - Use Markdown tables when comparing concepts, dietary choices, or clinical reference ranges.
   - Highlight key terms, metrics, and normal reference ranges in **bold**.
   - Provide clear paragraph breaks between thoughts.
   - Conclude with a concise "Key Takeaways" or summary section.
   - Use warning or safety callout notes (> ⚠️ **Important Note:** ...) when discussing red-flag symptoms or medication precautions.
   - Use medical terminology accurately while explaining it in plain, friendly English with real-world examples.
   - Use appropriate emojis sparingly to guide the eye (e.g., 🩺, 💡, 🏃, 🥗, ⚠️).

2. Core Guidelines:
   - Answer the user's actual question directly and thoroughly, rather than repeating generic boilerplates.
   - If the user asks follow-up questions, use the conversation history to maintain context.
   - If essential information is missing, provide a helpful answer based on common scenarios and ask a polite clarifying question.
   - Never provide a definitive clinical diagnosis or declare certainty about a user's personal medical condition.
   - Always include an appropriate medical disclaimer and advise consulting a qualified physician or healthcare provider for personal clinical decisions.
   - If severe emergency symptoms are described (sudden crushing chest pain, difficulty breathing, signs of stroke), urge immediate emergency medical care.`;

const IMAGE_ANALYSIS_PROMPT = `You are an expert medical visual health educator specializing in dermatology, skin conditions, and visual health observations.
Analyze the provided image carefully and thoroughly. Provide an objective, educational assessment of the visual features visible in the image.

Respond ONLY with a valid JSON object matching this exact structure:
{
  "condition": "Primary observation or possible condition name (e.g., Eczema / Atopic Dermatitis, Contact Dermatitis, Psoriasis, Benign Nevus)",
  "confidence": <integer between 15 and 92 reflecting visual feature clarity>,
  "description": "Detailed educational description of what is visually observed in the image, noting color, border, texture, and distribution (3-4 sentences)",
  "causes": [
    "Possible contributing cause or trigger 1",
    "Possible contributing cause or trigger 2",
    "Possible contributing cause or trigger 3"
  ],
  "recommendations": [
    "Evidence-based general care recommendation 1",
    "Evidence-based general care recommendation 2",
    "Evidence-based general care recommendation 3"
  ],
  "doctorAdvice": "Specific guidance on what specialist to see (e.g. Board-certified Dermatologist), urgency level, and what questions to ask"
}

Important Medical Rules:
- This visual assessment is strictly for educational and informational purposes. It is NOT a medical diagnosis.
- Avoid claiming 100% certainty or offering definitive diagnoses.
- Never invent arbitrary or misleading data. Base observations on actual visual evidence in the image.
- If additional context is provided by the user, incorporate it into the causes and recommendations.`;

const SUPPORTED_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash'
];

function getApiKey() {
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment. Please set GEMINI_API_KEY in your .env file.');
  }
  return key;
}

function parseGeminiError(status, text) {
  try {
    const json = JSON.parse(text);
    const msg = json.error?.message || text;
    if (status === 404) {
      return `Gemini model error: The requested model is not available or retired. (${msg})`;
    }
    if (status === 429) {
      return `Gemini quota exceeded: You have reached the rate limit for this API key. (${msg})`;
    }
    if (status === 400) {
      return `Gemini invalid request: ${msg}`;
    }
    if (status === 401 || status === 403) {
      return `Gemini authentication error: Invalid or unauthorized API key. (${msg})`;
    }
    if (status === 503) {
      return `Gemini service temporarily overloaded. (${msg})`;
    }
    return `Gemini API error (${status}): ${msg}`;
  } catch {
    return `Gemini API returned HTTP ${status}: ${text}`;
  }
}

function buildReportContextPrompt(report) {
  if (!report) return '';
  const lines = [
    '\n\nACTIVE USER HEALTH REPORT CONTEXT:',
    'The user is asking questions specifically about their generated HealthSense AI Assessment report.',
    `Report ID: ${report.reportId || report.id || 'N/A'}`,
    `Assessment Date: ${report.createdAt || report.assessment_date || new Date().toISOString()}`,
    `Overall Health Score: ${report.healthScore ?? report.health_score ?? 'N/A'}/100`,
    `Overall Risk Level: ${(report.riskLevel || report.risk_level || 'N/A').toUpperCase()}`,
    '',
    'Predicted Disease Risk Estimates:',
    `- Type 2 Diabetes Risk: ${report.diabetesRisk ?? report.diabetes_risk ?? 'N/A'}%`,
    `- Cardiovascular Disease Risk: ${report.heartRisk ?? report.heart_risk ?? 'N/A'}%`,
    `- Hypertension Risk: ${report.hypertensionRisk ?? report.hypertension_risk ?? 'N/A'}%`,
    `- Chronic Kidney Disease Burden: ${report.kidneyRisk ?? report.kidney_risk ?? 'N/A'}%`,
  ];

  const inp = report.input || report.input_parameters;
  if (inp) {
    lines.push(
      '',
      'User Submitted Health Parameters:',
      `- Age: ${inp.age || 'N/A'} years | Biological Sex: ${inp.gender || 'N/A'}`,
      `- Height: ${inp.height_cm || 'N/A'} cm | Weight: ${inp.weight_kg || 'N/A'} kg | BMI: ${inp.bmi || 'N/A'} kg/m²`,
      `- Blood Pressure: ${inp.blood_pressure_sys || 'N/A'}/${inp.blood_pressure_dia || 'N/A'} mmHg`,
      `- Fasting Blood Glucose: ${inp.glucose || 'N/A'} mg/dL`,
      `- Total Cholesterol: ${inp.cholesterol || 'N/A'} mg/dL`,
      `- Resting Heart Rate: ${inp.heart_rate || 'N/A'} bpm`,
      `- Smoking Status: ${inp.smoking_status || 'N/A'} | Alcohol: ${inp.alcohol_consumption || 'N/A'}`,
      `- Physical Activity Level: ${inp.physical_activity || 'N/A'} | Sleep Duration: ${inp.sleep_hours || 'N/A'} hrs/night`,
      `- Family History: Type 2 Diabetes=${inp.family_diabetes ? 'Yes' : 'No'}, Heart Disease=${inp.family_heart ? 'Yes' : 'No'}, Hypertension=${inp.family_hypertension ? 'Yes' : 'No'}, Kidney Disease=${inp.family_kidney ? 'Yes' : 'No'}`
    );
  }

  const factors = report.riskFactors || report.risk_factors;
  if (factors && factors.length > 0) {
    lines.push('', 'Identified Key Risk Factors & Drivers:');
    factors.forEach((f, idx) => lines.push(`  * ${f}`));
  }

  const recs = report.recommendations || report.suggestions;
  if (recs && recs.length > 0) {
    lines.push('', 'Preventive Health Recommendations Generated:');
    recs.forEach((r, idx) => lines.push(`  * ${r}`));
  }

  lines.push(
    '',
    'Special Instructions for Report Consultation:',
    '1. Directly reference the user\'s specific metrics (e.g. mention their actual blood pressure, BMI, cholesterol, and risk percentages).',
    '2. Explain what their risk percentages mean in encouraging, understandable terms without presenting them as clinical diagnoses.',
    '3. Explain WHY their specific parameters (such as elevated blood pressure, cholesterol, or family history) contribute to risk.',
    '4. Provide clear, evidence-informed dietary, exercise, and sleep suggestions tailored to their exact profile.',
    '5. Outline concrete discussion points for them to bring up with their physician.',
    '6. Strict Medical Safety: Never prescribe medications or advise altering/stopping prescribed treatments. Emphasize that this is an educational risk estimation. Urge immediate emergency care for any acute red-flag symptoms (e.g. chest pressure, shortness of breath, sudden numbness).'
  );

  return lines.join('\n');
}

export async function handleChatRequest(messages, reportContext) {
  const apiKey = getApiKey();

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('Messages array is required and must not be empty.');
  }

  const systemInstructionText = reportContext
    ? `${SYSTEM_PROMPT}\n${buildReportContextPrompt(reportContext)}`
    : SYSTEM_PROMPT;

  // Format contents for Gemini generateContent
  // Gemini expects: { role: 'user' | 'model', parts: [{ text }] }
  const contents = messages.slice(-16).map(m => ({
    role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
    parts: [{ text: String(m.content || '') }]
  }));

  let lastError = null;

  for (const model of SUPPORTED_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstructionText }] },
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
        if (text) {
          return { text, model };
        }
      }

      const errText = await res.text();
      const parsedMsg = parseGeminiError(res.status, errText);
      console.warn(`[Gemini Chat] Model ${model} returned ${res.status}:`, parsedMsg);
      lastError = new Error(parsedMsg);

      // If quota or auth error, don't retry other models with same key
      if (res.status === 401 || res.status === 403 || res.status === 429) {
        throw lastError;
      }
    } catch (err) {
      lastError = err;
      if (err.message?.includes('quota') || err.message?.includes('authentication')) {
        throw err;
      }
    }
  }

  throw lastError || new Error('All supported Gemini models failed to generate a response.');
}

export async function handleAnalyzeRequest({ base64Image, mimeType, context }) {
  const apiKey = getApiKey();

  if (!base64Image) {
    throw new Error('Image data is required for visual analysis.');
  }

  const cleanMime = mimeType || 'image/jpeg';
  const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '').trim();

  // Validate base64 payload size (e.g. limit 10MB)
  const estimatedBytes = cleanBase64.length * 0.75;
  if (estimatedBytes > 10 * 1024 * 1024) {
    throw new Error('Image file is too large. Please upload an image under 10MB.');
  }

  const promptText = context
    ? `${IMAGE_ANALYSIS_PROMPT}\n\nPatient Context / Symptoms: ${context}`
    : IMAGE_ANALYSIS_PROMPT;

  let lastError = null;

  for (const model of SUPPORTED_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: promptText },
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
        if (rawText) {
          // Parse JSON result safely
          try {
            const parsed = JSON.parse(rawText);
            return { result: parsed, raw: rawText, model };
          } catch {
            const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) || rawText.match(/({[\s\S]*})/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
              return { result: parsed, raw: rawText, model };
            }
            return {
              result: {
                condition: 'Visual Observation Completed',
                confidence: 60,
                description: rawText,
                causes: ['Skin irritation or individual reaction'],
                recommendations: ['Keep the area clean, avoid scratching, and observe for changes.'],
                doctorAdvice: 'Consult a dermatologist or primary care provider for personalized diagnosis.'
              },
              raw: rawText,
              model
            };
          }
        }
      }

      const errText = await res.text();
      const parsedMsg = parseGeminiError(res.status, errText);
      console.warn(`[Gemini Vision] Model ${model} returned ${res.status}:`, parsedMsg);
      lastError = new Error(parsedMsg);

      if (res.status === 401 || res.status === 403 || res.status === 429) {
        throw lastError;
      }
    } catch (err) {
      lastError = err;
      if (err.message?.includes('quota') || err.message?.includes('authentication')) {
        throw err;
      }
    }
  }

  throw lastError || new Error('All supported Gemini vision models failed to analyze the image.');
}
