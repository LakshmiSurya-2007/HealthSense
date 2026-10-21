// Client-side Gemini service calling secure server-side endpoints
// Never exposes GEMINI_API_KEY to client or in client bundle

export interface ChatMessage {
  role: 'user' | 'assistant' | 'model' | string
  content: string
}

export interface ImageAnalysisData {
  condition: string
  confidence: number
  description: string
  causes: string[]
  recommendations: string[]
  doctorAdvice: string
}

export async function askGemini(messages: ChatMessage[], reportContext?: any): Promise<string> {
  if (!messages || messages.length === 0) {
    throw new Error('Please enter a message.')
  }

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, reportContext })
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: `Server returned HTTP ${res.status}` }))
      throw new Error(errData.error || `AI Chat request failed with status ${res.status}`)
    }

    const data = await res.json()
    if (!data.text) {
      throw new Error('Received an empty response from the AI assistant.')
    }
    return data.text
  } catch (err: any) {
    console.error('Gemini chat error:', err)
    throw new Error(err.message || 'Unable to communicate with HealthSense AI. Please check your connection.')
  }
}

export async function analyzeImageWithGemini(
  base64Image: string,
  mimeType: string,
  context?: string
): Promise<string> {
  if (!base64Image) {
    throw new Error('Please select an image to analyze.')
  }

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base64Image,
        mimeType: mimeType || 'image/jpeg',
        context: context?.trim() || undefined
      })
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: `Server returned HTTP ${res.status}` }))
      throw new Error(errData.error || `Image analysis failed with status ${res.status}`)
    }

    const data = await res.json()
    if (data.result) {
      return JSON.stringify(data.result)
    }
    if (data.raw) {
      return data.raw
    }
    throw new Error('Received invalid response from image analysis service.')
  } catch (err: any) {
    console.error('Gemini vision error:', err)
    throw new Error(err.message || 'Image analysis service encountered an error. Please try again.')
  }
}
