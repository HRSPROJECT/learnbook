import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

interface YouTubeVideo {
    title: string
    channel: string
    url: string
    thumbnail: string
    description: string
    videoId: string
}

// Search YouTube using Data API v3
async function searchYouTube(query: string, maxResults: number = 6): Promise<YouTubeVideo[]> {
    if (!YOUTUBE_API_KEY) {
        console.log('YouTube API key not configured, using AI fallback')
        return []
    }

    try {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${maxResults}&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}&relevanceLanguage=en&videoEmbeddable=true`

        const response = await fetch(searchUrl)
        const data = await response.json()

        if (data.error) {
            console.error('YouTube API error:', data.error)
            return []
        }

        if (!data.items || data.items.length === 0) {
            return []
        }

        return data.items.map((item: any) => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
            description: item.snippet.description
        }))
    } catch (error) {
        console.error('YouTube search error:', error)
        return []
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { subject, chapter, board, classGrade, country, topic } = body

        // Build search queries based on context
        const queries = [
            `${chapter} ${subject} ${board} class ${classGrade}`,
            `${chapter} ${subject} explanation`,
            `${chapter} ${subject} ${country || 'India'} lecture`
        ]

        // Try YouTube Data API v3 first
        if (YOUTUBE_API_KEY) {
            const videos: YouTubeVideo[] = []

            // Search with first query
            const results = await searchYouTube(queries[0], 6)

            if (results.length > 0) {
                return NextResponse.json({
                    success: true,
                    data: results,
                    source: 'youtube_api'
                })
            }

            // Try alternate query if first fails
            const altResults = await searchYouTube(queries[1], 6)
            if (altResults.length > 0) {
                return NextResponse.json({
                    success: true,
                    data: altResults,
                    source: 'youtube_api'
                })
            }
        }

        // Fallback: Use Gemini to suggest search terms and create search links
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

        const prompt = `For a student studying:
- Subject: ${subject}
- Chapter: ${chapter}
- Board: ${board}
- Class: ${classGrade}
- Country: ${country || 'India'}

Suggest 5 specific YouTube video searches that would find helpful educational content.
For each suggestion, provide:
1. A specific search query
2. A recommended channel name (if known)
3. Brief description of what this video would teach

Return as JSON array:
[
  {
    "searchQuery": "specific search terms for YouTube",
    "channel": "Recommended Channel",
    "description": "What this video teaches"
  }
]

Focus on popular education channels like Physics Wallah, Vedantu, Khan Academy, etc.
Return ONLY the JSON array.`

        const result = await model.generateContent(prompt)
        const text = result.response.text()

        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
            const suggestions = JSON.parse(jsonMatch[0])

            // Convert to video links with YouTube search URLs
            const videos = suggestions.map((s: any, index: number) => ({
                title: s.searchQuery,
                channel: s.channel || 'YouTube Search',
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent(s.searchQuery)}`,
                thumbnail: null,
                description: s.description,
                isSearchLink: true
            }))

            return NextResponse.json({
                success: true,
                data: videos,
                source: 'ai_suggestions',
                message: 'Add YOUTUBE_API_KEY to .env for direct video results'
            })
        }

        // Ultimate fallback - direct search links
        const fallbackVideos = [
            {
                title: `${chapter} - ${subject} Full Lecture`,
                channel: 'YouTube Search',
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${chapter} ${subject} ${board} ${classGrade}`)}`,
                description: `Search for ${chapter} lectures`
            },
            {
                title: `${chapter} - Quick Revision`,
                channel: 'YouTube Search',
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${chapter} ${subject} revision one shot`)}`,
                description: 'Quick revision videos'
            },
            {
                title: `${chapter} - Solved Problems`,
                channel: 'YouTube Search',
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${chapter} ${subject} solved problems numericals`)}`,
                description: 'Practice problems with solutions'
            }
        ]

        return NextResponse.json({
            success: true,
            data: fallbackVideos,
            source: 'fallback'
        })

    } catch (error: any) {
        console.error('YouTube API error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
