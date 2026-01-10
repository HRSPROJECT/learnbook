import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/groq'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const context = {
            country: body.country,
            educationLevel: body.educationLevel,
            board: body.board,
            classGrade: body.classGrade,
            subject: body.subject,
            examDate: body.examDate,
            dailyAvailableTime: body.dailyAvailableTime || 120,
            weakTopics: body.weakTopics || [],
            strongTopics: body.strongTopics || []
        }

        // Generate syllabus/chapters
        const syllabusPrompt = `You are an education expert. Based on the following learning context, generate a structured syllabus with chapters.

Context:
- Country: ${context.country}
- Education Level: ${context.educationLevel}
- Board/University: ${context.board}
- Class/Grade: ${context.classGrade}
- Subject: ${context.subject}

Return a JSON array of chapters with this structure:
[
  {
    "id": "unique_id",
    "name": "Chapter Name",
    "order": 1,
    "importanceWeight": 0.8,
    "prerequisites": [],
    "concepts": ["concept1", "concept2"],
    "estimatedHours": 10,
    "description": "Brief description of what this chapter covers"
  }
]

Return ONLY the JSON array, no other text. Include 3-4 most important chapters.`

        const syllabusText = await generateContent(syllabusPrompt)
        let chapters = []

        const syllabusMatch = syllabusText.match(/\[[\s\S]*\]/)
        if (syllabusMatch) {
            chapters = JSON.parse(syllabusMatch[0])
        }

        // Generate roadmap
        const roadmapPrompt = `You are a learning optimization expert. Create an optimal learning roadmap.

Student Context:
- Daily available time: ${context.dailyAvailableTime} minutes
- Exam date: ${context.examDate || 'No specific date'}
- Weak topics: ${context.weakTopics.join(', ') || 'None specified'}
- Strong topics: ${context.strongTopics.join(', ') || 'None specified'}

Chapters to cover:
${JSON.stringify(chapters, null, 2)}

Create a roadmap that:
1. Respects chapter dependencies (prerequisites first)
2. Allocates more time to weak topics
3. Includes revision points before the exam
4. Marks important milestones

Return a JSON array with this structure:
[
  {
    "chapterId": "chapter_id",
    "chapterName": "Chapter Name",
    "startDate": "${new Date().toISOString().split('T')[0]}",
    "endDate": "2024-01-20",
    "isMilestone": false,
    "isRevision": false,
    "priority": "high"
  }
]

Start from today: ${new Date().toISOString().split('T')[0]}
Return ONLY the JSON array.`

        let roadmap = []
        const roadmapText = await generateContent(roadmapPrompt)

        const roadmapMatch = roadmapText.match(/\[[\s\S]*\]/)
        if (roadmapMatch) {
            roadmap = JSON.parse(roadmapMatch[0])
        }

        return NextResponse.json({
            success: true,
            data: {
                chapters,
                roadmap
            }
        })
    } catch (error) {
        console.error('Error generating roadmap:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to generate roadmap' },
            { status: 500 }
        )
    }
}
