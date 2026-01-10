import { NextRequest, NextResponse } from 'next/server'
import { generateWithRetry } from '@/lib/groq'

// Simple in-memory cache
const cache = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 60 * 24 // 24 hours

export async function POST(request: NextRequest) {
    let body: any = {}

    try {
        body = await request.json()
    } catch (e) {
        return NextResponse.json(
            { success: false, error: 'Invalid request body' },
            { status: 400 }
        )
    }

    const { country, educationLevel, board, classGrade, searchType, subject } = body

    // Debug: Log incoming request
    console.log('Curriculum API request:', { country, educationLevel, board, classGrade, searchType, subject })

    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey || apiKey === 'your_groq_api_key') {
        return NextResponse.json(
            { success: false, error: 'GROQ_API_KEY not configured' },
            { status: 500 }
        )
    }

    const cacheKey = JSON.stringify({ country, educationLevel, board, classGrade, searchType, subject })
    if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey)!
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            console.log('Returning cached data for:', cacheKey)
            return NextResponse.json({ success: true, data: cached.data, isCached: true })
        }
    }

    try {
        if (searchType === 'subjects') {
            const prompt = `You are an expert education curriculum specialist. Find ALL subjects for:

STUDENT PROFILE:
- Country: ${country}
- Education Level: ${educationLevel}
- Board/University/Curriculum: ${board}
- Class/Grade/Year: ${classGrade}

IMPORTANT INSTRUCTIONS:
1. Use OFFICIAL syllabus from the specified board (e.g., CBSE, ICSE, State Board, IB, Cambridge, AP, etc.)
2. Include ALL compulsory subjects for this grade
3. Include common elective subjects
4. Use the EXACT subject names as per the official curriculum
5. For Indian boards, include subjects like Hindi, English, Mathematics, Science (or Physics/Chemistry/Biology for higher classes), Social Science, etc.
6. For college/university, include department-specific subjects

Return ONLY a valid JSON array with this exact structure:
[
  {
    "id": "unique_slug_lowercase",
    "name": "Official Subject Name",
    "code": "Subject Code (LEAVE EMPTY if not applicable)",
    "description": "2-3 sentence description of what this subject covers according to the official syllabus"
  }
]

Return ONLY the JSON array. No explanation, no markdown code blocks.`

            const text = await generateWithRetry(prompt)

            const jsonMatch = text.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
                try {
                    const subjects = JSON.parse(jsonMatch[0])
                    cache.set(cacheKey, { data: subjects, timestamp: Date.now() })
                    return NextResponse.json({ success: true, data: subjects })
                } catch (parseError) {
                    console.error('JSON parse error:', parseError)
                }
            }
        }

        if (searchType === 'chapters') {
            const prompt = `You are an expert education curriculum specialist. Find the COMPLETE official syllabus for:

STUDENT PROFILE:
- Country: ${country}
- Board/Curriculum: ${board}
- Class/Grade/Year: ${classGrade}
- Subject: ${subject}

CRITICAL INSTRUCTIONS:
1. Use the OFFICIAL syllabus from ${board} for Class/Grade ${classGrade}
2. List ALL chapters/units in the EXACT order they appear in the official textbook
3. Use the OFFICIAL chapter names (not generic names)
4. For example, if this is CBSE Class 10 Mathematics, use actual NCERT chapter names like "Real Numbers", "Polynomials", "Pair of Linear Equations in Two Variables", etc.
5. Include accurate estimated study hours based on chapter difficulty and size
6. List 3-5 KEY concepts covered in each chapter
7. DO NOT make up chapters - use only official curriculum

Return ONLY a valid JSON array with this exact structure:
[
  {
    "id": "chapter_slug",
    "name": "Official Chapter/Unit Name from Textbook",
    "chapterNumber": 1,
    "description": "What this chapter covers (2-3 sentences from official syllabus)",
    "concepts": ["Key Concept 1", "Key Concept 2", "Key Concept 3", "Key Concept 4"],
    "estimatedHours": 8
  }
]

Return ONLY the JSON array. No explanation, no markdown code blocks.`

            const text = await generateWithRetry(prompt)

            const jsonMatch = text.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
                try {
                    const chapters = JSON.parse(jsonMatch[0])
                    cache.set(cacheKey, { data: chapters, timestamp: Date.now() })
                    return NextResponse.json({ success: true, data: chapters })
                } catch (parseError) {
                    console.error('JSON parse error:', parseError)
                }
            }
        }

        if (searchType === 'topics') {
            const { chapterName } = body

            const prompt = `You are an expert education curriculum specialist. Find all topics within:

STUDENT PROFILE:
- Board/Curriculum: ${board}
- Class/Grade: ${classGrade}
- Subject: ${subject}
- Chapter: ${chapterName}

INSTRUCTIONS:
1. List ALL topics and subtopics from the official syllabus
2. Use official topic names as they appear in textbooks
3. Include key learning points for each topic

Return ONLY a valid JSON array:
[
  {
    "id": "topic_slug",
    "name": "Official Topic Name",
    "description": "What this topic covers",
    "keyPoints": ["Point 1", "Point 2", "Point 3"],
    "difficulty": "easy|medium|hard",
    "estimatedMinutes": 30
  }
]

Return ONLY the JSON array. No explanation, no markdown code blocks.`

            const text = await generateWithRetry(prompt)

            const jsonMatch = text.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
                try {
                    const topics = JSON.parse(jsonMatch[0])
                    cache.set(cacheKey, { data: topics, timestamp: Date.now() })
                    return NextResponse.json({ success: true, data: topics })
                } catch (parseError) {
                    console.error('JSON parse error:', parseError)
                }
            }
        }

        return NextResponse.json(
            { success: false, error: 'Failed to parse AI response' },
            { status: 500 }
        )

    } catch (error: any) {
        console.error('Curriculum API error:', error)

        if (error.message?.includes('429') || error.message?.includes('rate limit')) {
            return NextResponse.json(
                { success: false, error: 'API rate limit exceeded. Please try again in a minute.' },
                { status: 429 }
            )
        }

        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch curriculum data' },
            { status: 500 }
        )
    }
}
