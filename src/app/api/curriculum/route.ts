import { NextRequest, NextResponse } from 'next/server'
import { generateWithRetry } from '@/lib/groq'
import { searchWeb } from '@/lib/google-search'


// Note: No caching - all requests fetch fresh data

// Helper function to extract JSON from AI response
function extractJSON(text: string): any[] | null {
    // Clean the text
    let cleaned = text.trim()

    // Remove markdown code blocks
    cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/g, '')

    // Try to find JSON array in different ways
    const strategies = [
        // Strategy 1: Direct parse
        () => JSON.parse(cleaned),
        // Strategy 2: Find array with regex
        () => {
            const match = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/)
            if (match) return JSON.parse(match[0])
            return null
        },
        // Strategy 3: Find from first [ to last ]
        () => {
            const start = cleaned.indexOf('[')
            const end = cleaned.lastIndexOf(']')
            if (start !== -1 && end > start) {
                return JSON.parse(cleaned.substring(start, end + 1))
            }
            return null
        },
        // Strategy 4: Remove any text before [ and after ]
        () => {
            const start = cleaned.indexOf('[')
            const end = cleaned.lastIndexOf(']')
            if (start !== -1 && end > start) {
                let jsonStr = cleaned.substring(start, end + 1)
                // Fix common JSON issues
                jsonStr = jsonStr.replace(/,\s*]/g, ']') // trailing comma
                jsonStr = jsonStr.replace(/,\s*}/g, '}') // trailing comma in objects
                return JSON.parse(jsonStr)
            }
            return null
        }
    ]

    for (const strategy of strategies) {
        try {
            const result = strategy()
            if (result && Array.isArray(result) && result.length > 0) {
                return result
            }
        } catch {
            // Continue to next strategy
        }
    }

    return null
}


// Search for official syllabus information
async function searchOfficialSyllabus(board: string, classGrade: string, subjectOrCourse?: string): Promise<string> {
    try {
        let query: string
        if (subjectOrCourse) {
            query = `${board} ${subjectOrCourse} ${classGrade} official syllabus 2024`
        } else {
            query = `${board} ${classGrade} all subjects list official syllabus 2024`
        }

        console.log('Web search query:', query)
        const results = await searchWeb(query, 5)

        if (results.length === 0) {
            return 'No web search results found.'
        }

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

    const { country, educationLevel, board, classGrade, searchType, subject, courseProgram } = body

    console.log('Curriculum API request:', { country, educationLevel, board, classGrade, courseProgram, searchType, subject })

    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey || apiKey === 'your_groq_api_key') {
        return NextResponse.json(
            { success: false, error: 'GROQ_API_KEY not configured' },
            { status: 500 }
        )
    }


    try {
        if (searchType === 'subjects') {
            const webSearchResults = await searchOfficialSyllabus(board, classGrade, courseProgram)
            const isCollege = educationLevel === 'college'
            const courseInfo = courseProgram ? `\n- Course/Program: ${courseProgram}` : ''

            let prompt: string

            if (isCollege && courseProgram) {
                prompt = `You are a university curriculum expert. Return subjects for:

University: ${board}
Course: ${courseProgram}
Year: ${classGrade}
Country: ${country}

${webSearchResults !== 'No web search results found.' && webSearchResults !== 'Web search unavailable.' ? `Reference:\n${webSearchResults}\n` : ''}

Return 6-8 subjects ONLY as a JSON array. No explanation.

Example format:
[
  {"id": "data-structures", "name": "Data Structures", "code": "CS201", "description": "Arrays, linked lists, trees, graphs"}
]

JSON:`
            } else {
                prompt = `You are an education curriculum expert. Return subjects for:

Country: ${country}
Level: ${educationLevel}
Board: ${board}
Grade: ${classGrade}${courseInfo}

${webSearchResults !== 'No web search results found.' && webSearchResults !== 'Web search unavailable.' ? `Reference:\n${webSearchResults}\n` : ''}

Return ALL official subjects as a JSON array. No explanation.

Example format:
[
  {"id": "mathematics", "name": "Mathematics", "code": "041", "description": "Algebra, geometry, statistics"}
]

JSON:`
            }

            console.log('Generating subjects with AI...')
            const text = await generateWithRetry(prompt)
            console.log('AI response (first 500 chars):', text.substring(0, 500))

            const subjects = extractJSON(text)

            if (subjects && subjects.length > 0) {
                return NextResponse.json({ success: true, data: subjects })
            }

            return NextResponse.json(
                { success: false, error: 'Could not generate subjects. Please try again.', canRetry: true },
                { status: 500 }
            )
        }

        if (searchType === 'chapters') {
            const webSearchResults = await searchOfficialSyllabus(board, classGrade, subject)

            const prompt = `You are an education curriculum expert. Return chapters for:

Board: ${board}
Grade: ${classGrade}
Subject: ${subject}
${courseProgram ? `Course: ${courseProgram}` : ''}

${webSearchResults !== 'No web search results found.' && webSearchResults !== 'Web search unavailable.' ? `Reference:\n${webSearchResults}\n` : ''}

Return ALL chapters in order as a JSON array. No explanation.

Example format:
[
  {"id": "chapter-1", "name": "Real Numbers", "chapterNumber": 1, "description": "What this covers", "concepts": ["Concept 1", "Concept 2"], "estimatedHours": 8}
]

JSON:`

            console.log('Generating chapters with AI...')
            const text = await generateWithRetry(prompt)
            console.log('AI response (first 500 chars):', text.substring(0, 500))

            const chapters = extractJSON(text)

            if (chapters && chapters.length > 0) {
                return NextResponse.json({ success: true, data: chapters })
            }

            return NextResponse.json(
                { success: false, error: 'Could not generate chapters. Please try again.', canRetry: true },
                { status: 500 }
            )
        }

        if (searchType === 'topics') {
            const { chapterName } = body

            const prompt = `You are an education curriculum expert. Return topics for:

Board: ${board}
Grade: ${classGrade}
Subject: ${subject}
Chapter: ${chapterName}

Return all topics as a JSON array. No explanation.

Example format:
[
  {"id": "topic-1", "name": "Topic Name", "description": "What it covers", "keyPoints": ["Point 1", "Point 2"], "difficulty": "medium", "estimatedMinutes": 30}
]

JSON:`

            const text = await generateWithRetry(prompt)
            console.log('AI response (first 500 chars):', text.substring(0, 500))

            const topics = extractJSON(text)

            if (topics && topics.length > 0) {
                return NextResponse.json({ success: true, data: topics })
            }

            return NextResponse.json(
                { success: false, error: 'Could not generate topics. Please try again.' },
                { status: 500 }
            )
        }

        return NextResponse.json(
            { success: false, error: 'Invalid searchType. Use: subjects, chapters, or topics' },
            { status: 400 }
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
