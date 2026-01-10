import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion, GroqMessage } from '@/lib/groq'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { messages, context } = body

        // Build system prompt
        const systemPrompt = `You are LearnBook AI, a helpful and knowledgeable learning assistant. You help students understand concepts, solve problems, and learn effectively.

${context ? `Current Learning Context:
- Subject: ${context.subject}
- Chapter: ${context.chapter}
- Board/Curriculum: ${context.board}
- Class/Grade: ${context.classGrade}

Focus your answers on this context when relevant.` : ''}

Guidelines:
1. Give clear, step-by-step explanations
2. Use examples to illustrate concepts
3. Be encouraging and supportive
4. Format responses with markdown for readability
5. Keep answers concise but complete`

        // Convert messages to Groq format
        const groqMessages: GroqMessage[] = messages.map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        }))

        const response = await chatCompletion(groqMessages, systemPrompt)

        return NextResponse.json({
            success: true,
            data: {
                role: 'assistant',
                content: response
            }
        })
    } catch (error: any) {
        console.error('Chat error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
