import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/groq'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const prompt = `Analyze this chapter for a ${body.classGrade} ${body.subject} student.

Chapter: ${body.chapterName}
Description: ${body.description || 'No description'}
Concepts: ${(body.concepts || []).join(', ')}
Prerequisites: ${(body.prerequisites || []).join(', ') || 'None'}

Other chapters in syllabus: ${(body.allChapters || []).map((c: any) => c.name).join(', ')}

Provide:
1. Why this chapter matters (2-3 sentences)
2. What breaks if skipped (1-2 sentences)
3. Recommended depth: "light", "medium", or "deep"
4. 3-4 key takeaways

Return JSON:
{
  "whyItMatters": "...",
  "whatBreaksIfSkipped": "...",
  "recommendedDepth": "medium",
  "keyTakeaways": ["...", "...", "..."]
}

Return ONLY the JSON object.`

        const text = await generateContent(prompt)

        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            const intelligence = JSON.parse(jsonMatch[0])
            return NextResponse.json({
                success: true,
                data: intelligence
            })
        }

        // Fallback response
        return NextResponse.json({
            success: true,
            data: {
                whyItMatters: `${body.chapterName} is a foundational topic in ${body.subject} that builds understanding for advanced concepts.`,
                whatBreaksIfSkipped: 'Skipping this chapter may cause difficulty in understanding dependent topics.',
                recommendedDepth: 'medium',
                keyTakeaways: (body.concepts || []).slice(0, 4)
            }
        })

    } catch (error) {
        console.error('Error generating chapter intelligence:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to generate chapter intelligence' },
            { status: 500 }
        )
    }
}
