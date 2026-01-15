// Smart AI client with Gemini primary and Groq fallback
import { generateWithRetry as groqGenerate } from './groq'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent'

/**
 * Try Gemini first, fallback to Groq if rate limited
 */
export async function generateWithFallback(prompt: string, fast = false): Promise<string> {
    const maxTokens = fast ? 4096 : 8192

    // Try Gemini first (more accurate)
    if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key' && GEMINI_API_KEY.length > 10) {
        try {
            console.log('Trying Gemini API...')
            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: maxTokens,
                    }
                })
            })

            if (response.ok) {
                const data = await response.json()
                if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    console.log('✅ Gemini API success')
                    return data.candidates[0].content.parts[0].text
                }
            }

            // Check if rate limited
            if (response.status === 429) {
                console.log('⚠️ Gemini rate limited, falling back to Groq...')
            } else {
                console.log(`⚠️ Gemini error (${response.status}), falling back to Groq...`)
            }
        } catch (error) {
            console.log('⚠️ Gemini failed, falling back to Groq...', error)
        }
    } else {
        console.log('Gemini API key not configured, using Groq...')
    }

    // Fallback to Groq
    try {
        console.log('Using Groq API...')
        return await groqGenerate(prompt)
    } catch (error: any) {
        console.error('Both Gemini and Groq failed:', error)
        throw new Error(`AI generation failed: ${error.message}`)
    }
}

/**
 * Generate with retry logic - tries Gemini, then Groq
 */
export async function generateContent(prompt: string): Promise<string> {
    return generateWithFallback(prompt)
}
