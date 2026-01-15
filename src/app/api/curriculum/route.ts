import { NextRequest, NextResponse } from 'next/server'
import { generateWithFallback } from '@/lib/ai-client'
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
            // More specific query for chapters/topics
            query = `"${board}" "${subjectOrCourse}" "${classGrade}" official syllabus curriculum chapters topics 2024 2025`
        } else {
            // More specific query for subjects list
            query = `"${board}" "${classGrade}" official syllabus subjects list curriculum 2024 2025`
        }

        console.log('Web search query:', query)
        const results = await searchWeb(query, 5)

        if (results.length === 0) {
            return 'No web search results found.'
        }

        // Format results with more context
        return results.map((r, i) =>
            `[Source ${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.link}\nDomain: ${r.displayLink}`
        ).join('\n\n---\n\n')
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
                prompt = `You are extracting subjects from official university syllabus data.

CONTEXT:
University: ${board}
Program: ${courseProgram}
Year: ${classGrade}
Country: ${country}

WEB SEARCH RESULTS (OFFICIAL SYLLABUS):
${webSearchResults}

CRITICAL RULES:
1. Extract ALL subjects from the web search results above
2. Return 8-12 subjects minimum (all subjects for this year/semester)
3. DO NOT limit to only 3-4 subjects
4. Include ALL mandatory subjects
5. Include elective subjects if mentioned
6. Use EXACT subject names from search results
7. If web search has limited info, include all standard subjects for "${courseProgram} ${classGrade}"

EXAMPLE for B.E. First Year (8+ subjects):
[
  {"id": "engg-math-1", "name": "Engineering Mathematics-I", "code": "FE101", "description": "Calculus, differential equations, linear algebra"},
  {"id": "engg-physics", "name": "Engineering Physics", "code": "FE102", "description": "Mechanics, thermodynamics, optics, modern physics"},
  {"id": "engg-chemistry", "name": "Engineering Chemistry", "code": "FE103", "description": "Atomic structure, chemical bonding, thermodynamics"},
  {"id": "basic-electrical", "name": "Basic Electrical Engineering", "code": "FE104", "description": "DC circuits, AC circuits, electrical machines"},
  {"id": "engg-mechanics", "name": "Engineering Mechanics", "code": "FE105", "description": "Statics, dynamics, kinematics"},
  {"id": "engg-graphics", "name": "Engineering Graphics", "code": "FE106", "description": "Orthographic projections, isometric views, CAD"},
  {"id": "programming", "name": "Fundamentals of Programming", "code": "FE107", "description": "C programming, algorithms, problem solving"},
  {"id": "communication", "name": "Professional Communication Skills", "code": "FE108", "description": "Technical writing, presentation skills"},
  {"id": "workshop", "name": "Workshop Practice", "code": "FE109", "description": "Fitting, welding, machining, carpentry"}
]

Now extract ALL subjects from the web search results. Return 8-12 subjects minimum. Return ONLY valid JSON array:

`
            } else {
                prompt = `You are extracting subjects from official board syllabus data.

CONTEXT:
Board: ${board}
Grade: ${classGrade}
Education Level: ${educationLevel}
Country: ${country}

WEB SEARCH RESULTS (OFFICIAL SYLLABUS):
${webSearchResults}

CRITICAL RULES:
1. Extract ALL subjects from the web search results above
2. Return 6-10 subjects minimum (all subjects for this grade)
3. DO NOT limit to only 3-4 subjects
4. Include ALL mandatory subjects
5. Include elective subjects if mentioned
6. Use EXACT subject names from search results
7. If web search has limited info, include all standard subjects for "${board} ${classGrade}"

EXAMPLE for CBSE Class 10 (6+ subjects):
[
  {"id": "mathematics", "name": "Mathematics", "code": "041", "description": "Number systems, algebra, geometry, trigonometry, statistics"},
  {"id": "science", "name": "Science", "code": "086", "description": "Physics, chemistry, biology"},
  {"id": "social-science", "name": "Social Science", "code": "087", "description": "History, geography, civics, economics"},
  {"id": "english", "name": "English Language & Literature", "code": "184", "description": "Reading, writing, literature, grammar"},
  {"id": "hindi", "name": "Hindi Course A", "code": "002", "description": "Hindi language, literature, grammar"},
  {"id": "computer", "name": "Information Technology", "code": "402", "description": "Computer basics, programming, applications"}
]

Now extract ALL subjects from the web search results. Return 6-10 subjects minimum. Return ONLY valid JSON array:

`
            }

            console.log('Generating subjects with AI...')
            console.log('Web search results length:', webSearchResults.length)
            console.log('Prompt being sent:', prompt.substring(0, 300) + '...')
            const text = await generateWithFallback(prompt)
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

            const prompt = `Extract chapters/units/modules from official syllabus data.

CONTEXT:
Board/University: ${board}
Year: ${classGrade}
Subject: ${subject}
${courseProgram ? `Program: ${courseProgram}` : ''}

OFFICIAL SYLLABUS DATA:
${webSearchResults}

CRITICAL EXTRACTION RULES:
1. Look for "Unit", "Module", "Chapter", "Topic" in the syllabus above
2. Extract EXACT names - do NOT paraphrase or simplify
3. Maintain EXACT order from syllabus
4. If syllabus says "Unit 1: Single Variable Calculus & Fourier Series" → use that EXACT name
5. DO NOT create generic names like "Calculus" or "Linear Algebra"
6. Include all sub-topics in description
7. MUST include "concepts" array with 3-5 key concepts per chapter
8. Return 5-8 chapters/units (complete syllabus)
9. IF web search has no detailed syllabus, use standard curriculum for "${board} ${classGrade} ${subject}"

CORRECT EXAMPLE (from web search):
[
  {"id": "unit-1", "name": "Single Variable Calculus & Fourier Series", "chapterNumber": 1, "description": "Limits, continuity, differentiation, integration, Fourier series", "concepts": ["Limits", "Derivatives", "Integration", "Fourier Series"], "estimatedHours": 12},
  {"id": "unit-2", "name": "Multivariable Calculus – Partial Differentiation", "chapterNumber": 2, "description": "Functions of several variables, partial derivatives, chain rule", "concepts": ["Partial Derivatives", "Chain Rule", "Jacobian"], "estimatedHours": 10},
  {"id": "unit-3", "name": "Applications of Partial Differentiation", "chapterNumber": 3, "description": "Maxima, minima, Lagrange multipliers, Taylor series", "concepts": ["Maxima-Minima", "Lagrange Multipliers", "Taylor Series"], "estimatedHours": 10},
  {"id": "unit-4", "name": "Linear Algebra – Matrices and System of Linear Equations", "chapterNumber": 4, "description": "Matrix operations, determinants, rank, system of equations", "concepts": ["Matrices", "Determinants", "Rank", "Linear Systems"], "estimatedHours": 12},
  {"id": "unit-5", "name": "Linear Algebra – Eigen Values, Eigen Vectors, and Diagonalization", "chapterNumber": 5, "description": "Eigenvalues, eigenvectors, diagonalization, quadratic forms", "concepts": ["Eigenvalues", "Eigenvectors", "Diagonalization"], "estimatedHours": 12}
]

WRONG EXAMPLE (generic names):
[
  {"name": "Calculus"}, ❌ Too generic
  {"name": "Linear Algebra"}, ❌ Too generic
  {"name": "Differential Equations"} ❌ Not from syllabus
]

Now extract from the syllabus above. Use EXACT unit/chapter names. Return ONLY valid JSON array:

`

            console.log('Generating chapters with AI...')
            const text = await generateWithFallback(prompt)
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

            const text = await generateWithFallback(prompt)
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
