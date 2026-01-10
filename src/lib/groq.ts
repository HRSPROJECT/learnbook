// Groq API Client for LearnBook
// Replace this with your actual Groq API key
const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export interface GroqMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}

export interface GroqRequestOptions {
    messages: GroqMessage[]
    temperature?: number
    maxTokens?: number
    stream?: boolean
}

export interface GroqResponse {
    id: string
    object: string
    created: number
    model: string
    choices: {
        index: number
        message: {
            role: string
            content: string
        }
        finish_reason: string
    }[]
    usage: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
    }
}

/**
 * Call the Groq API with the specified messages and options
 */
export async function callGroqAPI(options: GroqRequestOptions): Promise<string> {
    const { messages, temperature = 1, maxTokens = 8192, stream = false } = options

    if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key') {
        throw new Error('GROQ_API_KEY not configured. Please add your Groq API key to .env')
    }

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
            messages,
            model: 'openai/gpt-oss-120b',
            temperature,
            max_completion_tokens: maxTokens,
            top_p: 1,
            stream,
            reasoning_effort: 'medium',
            stop: null
        })
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('Groq API error:', response.status, errorText)

        if (response.status === 429) {
            throw new Error('API rate limit exceeded. Please try again in a moment.')
        }
        if (response.status === 401) {
            throw new Error('Invalid Groq API key. Please check your configuration.')
        }
        throw new Error(`Groq API error: ${response.status}`)
    }

    const data: GroqResponse = await response.json()

    if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from Groq API')
    }

    return data.choices[0].message.content
}

/**
 * Generate content with a simple prompt (similar to Gemini's generateContent)
 */
export async function generateContent(prompt: string): Promise<string> {
    return callGroqAPI({
        messages: [{ role: 'user', content: prompt }]
    })
}

/**
 * Generate content with system context and user message
 */
export async function generateWithContext(
    systemPrompt: string,
    userMessage: string
): Promise<string> {
    return callGroqAPI({
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
        ]
    })
}

/**
 * Chat completion with message history
 */
export async function chatCompletion(
    messages: GroqMessage[],
    systemPrompt?: string
): Promise<string> {
    const allMessages: GroqMessage[] = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages

    return callGroqAPI({ messages: allMessages })
}

/**
 * Generate content with retry logic for rate limits
 */
export async function generateWithRetry(
    prompt: string,
    retries = 3
): Promise<string> {
    for (let i = 0; i < retries; i++) {
        try {
            return await generateContent(prompt)
        } catch (error: any) {
            const isRateLimit = error.message?.includes('rate limit') ||
                error.message?.includes('429')

            if (isRateLimit && i < retries - 1) {
                const delay = Math.pow(2, i) * 1000
                console.log(`Rate limit hit. Retrying in ${delay}ms...`)
                await new Promise(resolve => setTimeout(resolve, delay))
                continue
            }
            throw error
        }
    }
    throw new Error('Max retries exceeded')
}
