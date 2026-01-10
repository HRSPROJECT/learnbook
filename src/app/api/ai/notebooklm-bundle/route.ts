import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/groq'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const context = {
            country: body.country || 'India',
            educationLevel: body.educationLevel || 'school',
            board: body.board || 'CBSE',
            classGrade: body.classGrade || 'Class 12',
            subject: body.subject || 'Mathematics'
        }

        const chapter = {
            name: body.chapterName,
            concepts: body.concepts || [],
            description: body.description
        }

        const resources = body.resources || []

        const prompt = `Create a NotebookLM study bundle for:

Chapter: ${chapter.name}
Student level: ${context.classGrade} (${context.board})
Concepts: ${chapter.concepts.join(', ')}

Available resources:
${resources.map((r: any) => `- ${r.title}: ${r.url}`).join('\n')}

Create:
1. List of source URLs to import
2. 3-5 study prompts for the AI
3. A context prompt explaining the student's level

Return JSON:
{
  "sources": ["url1", "url2"],
  "studyPrompts": ["What is...", "Explain...", "Compare..."],
  "contextPrompt": "I am a Class 12 student studying..."
}

Return ONLY the JSON object.`

        let bundle = {
            sources: resources.map((r: any) => r.url),
            studyPrompts: [
                `What are the key concepts in ${chapter.name}?`,
                `Explain ${chapter.concepts[0] || chapter.name} in simple terms.`,
                `How does ${chapter.name} relate to other topics?`
            ],
            contextPrompt: `I am a ${context.classGrade} student from ${context.board} studying ${context.subject}. Please explain concepts at my level.`
        }

        try {
            const text = await generateContent(prompt)
            const jsonMatch = text.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                bundle = JSON.parse(jsonMatch[0])
            }
        } catch (aiError) {
            console.error('AI generation failed, using fallback:', aiError)
        }

        // Generate a NotebookLM-ready URL
        const notebookLMUrl = `https://notebooklm.google.com/notebook/new?${new URLSearchParams({
            title: chapter.name,
            context: bundle.contextPrompt
        }).toString()}`

        return NextResponse.json({
            success: true,
            data: {
                ...bundle,
                notebookLMUrl
            }
        })
    } catch (error) {
        console.error('Error generating NotebookLM bundle:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to generate NotebookLM bundle' },
            { status: 500 }
        )
    }
}
