import { NextRequest, NextResponse } from 'next/server'
import { searchEducationalResources, searchYouTubeResources } from '@/lib/google-search'
import { generateContent } from '@/lib/groq'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const { topic, subject, grade, learningStyle } = body

        // Search for web resources
        const webResults = await searchEducationalResources(topic, subject, grade)

        // Search for YouTube videos
        const youtubeResults = await searchYouTubeResources(topic, subject)

        // Use Groq to rank and select best resources
        const prompt = `Given the following search results for "${topic}" in ${subject} for ${grade} students, select the top 3 most useful resources. Consider quality, educational value, and appropriateness for the grade level.

Web Results:
${webResults.map((r, i) => `${i + 1}. ${r.title} (${r.displayLink}): ${r.snippet}`).join('\n')}

YouTube Results:
${youtubeResults.map((r, i) => `${i + 1}. ${r.title}: ${r.snippet}`).join('\n')}

Student prefers ${learningStyle || 'visual'} learning.

Return a JSON array of the top 3 resources with this structure:
[
  {
    "title": "Resource Title",
    "url": "https://...",
    "type": "video" | "article" | "interactive",
    "source": "Source name",
    "reason": "Why this is good for the student"
  }
]

Return ONLY the JSON array.`

        try {
            const text = await generateContent(prompt)

            const jsonMatch = text.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
                const resources = JSON.parse(jsonMatch[0])
                return NextResponse.json({
                    success: true,
                    data: {
                        resources,
                        allResults: {
                            web: webResults,
                            youtube: youtubeResults
                        }
                    }
                })
            }
        } catch (aiError) {
            console.error('AI ranking failed, returning raw results:', aiError)
        }

        // Fallback: return raw results
        const resources = [
            ...youtubeResults.slice(0, 2).map(r => ({
                title: r.title,
                url: r.link,
                type: 'video' as const,
                source: 'YouTube'
            })),
            ...webResults.slice(0, 2).map(r => ({
                title: r.title,
                url: r.link,
                type: 'article' as const,
                source: r.displayLink
            }))
        ]

        return NextResponse.json({
            success: true,
            data: { resources }
        })
    } catch (error) {
        console.error('Error curating resources:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to curate resources' },
            { status: 500 }
        )
    }
}
