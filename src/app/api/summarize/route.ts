import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subject, chapter, concepts, board, classGrade } = body

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash'
    })

    const prompt = `Create a comprehensive study summary for a student:
- Subject: ${subject}
- Chapter: ${chapter}
- Board: ${board}
- Class: ${classGrade}
- Key Concepts: ${concepts?.join(', ') || 'General overview'}

Create a detailed study guide with:

Return a JSON object with this structure:
{
  "overview": "2-3 sentence overview of this chapter",
  "keyPoints": [
    "Key point 1",
    "Key point 2",
    "Key point 3",
    "Key point 4",
    "Key point 5"
  ],
  "formulas": [
    {
      "name": "Formula name",
      "formula": "Mathematical formula",
      "usage": "When to use this formula"
    }
  ],
  "importantTerms": [
    {
      "term": "Term",
      "definition": "Definition"
    }
  ],
  "commonMistakes": [
    "Common mistake 1",
    "Common mistake 2"
  ],
  "examTips": [
    "Tip for exams 1",
    "Tip for exams 2"
  ],
  "practiceQuestions": [
    {
      "question": "Sample question",
      "hint": "Hint for solving"
    }
  ]
}

Make it exam-focused. Return ONLY the JSON object, no markdown.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const summary = JSON.parse(jsonMatch[0])
      return NextResponse.json({ success: true, data: summary })
    }

    return NextResponse.json({ success: true, data: null })
  } catch (error: any) {
    console.error('Summary error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
