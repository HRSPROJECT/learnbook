import { NextRequest, NextResponse } from 'next/server'
import { generateWithRetry } from '@/lib/groq'
import { searchWeb } from '@/lib/google-search'

// Simple in-memory cache
const cache = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 60 * 24 // 24 hours

// Search for official syllabus information
async function searchOfficialSyllabus(board: string, classGrade: string, subject?: string): Promise<string> {
    try {
        const query = subject
            ? `${board} ${classGrade} ${subject} official syllabus chapters list 2024`
            : `${board} ${classGrade} all subjects list official syllabus 2024`

        const results = await searchWeb(query, 5)

        if (results.length === 0) {
            return 'No web search results found.'
        }

        // Format search results for LLM context
        return results.map((r, i) =>
            `[${i + 1}] ${r.title}\n${r.snippet}\nSource: ${r.displayLink}`
        ).join('\n\n')
    } catch (error) {
        console.error('Web search error:', error)
        return 'Web search unavailable.'
    }
}

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
            // First, search the web for official syllabus information
            const webSearchResults = await searchOfficialSyllabus(board, classGrade)

            const prompt = `You are an expert education curriculum specialist. Find ALL subjects for this specific student:

STUDENT PROFILE:
- Country: ${country}
- Education Level: ${educationLevel}
- Board/University/Curriculum: ${board}
- Class/Grade/Year: ${classGrade}

WEB SEARCH RESULTS (use this for accuracy):
${webSearchResults}

CRITICAL INSTRUCTIONS:
1. Use the OFFICIAL syllabus from "${board}" for "${classGrade}" - NOT generic subjects
2. The subjects MUST match exactly what students in this specific board and grade study
3. For Indian boards:
   - CBSE Class 10: English, Hindi/Sanskrit, Mathematics, Science, Social Science, etc.
   - ICSE: Different subject names than CBSE
   - State Boards: May have regional language subjects
4. For college: Department-specific subjects based on the course
5. Include subject codes if they exist for this board
6. Use the web search results above to verify accuracy

Return ONLY a valid JSON array with this exact structure:
[
  {
    "id": "unique_slug_lowercase",
    "name": "Official Subject Name as per ${board}",
    "code": "Subject Code (empty if not applicable)",
    "description": "2-3 sentence description from official syllabus"
  }
]

Return ONLY the JSON array. No explanation, no markdown.`

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
            // First, search the web for official chapter list
            const webSearchResults = await searchOfficialSyllabus(board, classGrade, subject)

            const prompt = `You are an expert education curriculum specialist. Find the COMPLETE official chapter list for:

STUDENT PROFILE:
- Country: ${country}
- Board/Curriculum: ${board}
- Class/Grade/Year: ${classGrade}
- Subject: ${subject}

WEB SEARCH RESULTS (use this for accuracy):
${webSearchResults}

CRITICAL INSTRUCTIONS:
1. Use the OFFICIAL syllabus/textbook from "${board}" for "${classGrade}" "${subject}"
2. List chapters in the EXACT order they appear in the official textbook
3. Use the OFFICIAL chapter names - not generic names
4. Examples of specific chapter names:
   - CBSE Class 10 Math: "Real Numbers", "Polynomials", "Pair of Linear Equations in Two Variables"
   - CBSE Class 10 Science: "Chemical Reactions and Equations", "Acids, Bases and Salts"
   - ICSE uses different chapter names than CBSE
5. Use the web search results above to verify chapter names
6. Include 3-5 key concepts for each chapter

Return ONLY a valid JSON array with this exact structure:
[
  {
    "id": "chapter_slug",
    "name": "Official Chapter Name from ${board} Textbook",
    "chapterNumber": 1,
    "description": "What this chapter covers (from official syllabus)",
    "concepts": ["Key Concept 1", "Key Concept 2", "Key Concept 3"],
    "estimatedHours": 8
  }
]

Return ONLY the JSON array. No explanation, no markdown.`

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

Return ONLY the JSON array. No explanation, no markdown.`

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
