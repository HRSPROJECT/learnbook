export interface SearchResult {
    title: string
    link: string
    snippet: string
    displayLink: string
}

export async function searchWeb(query: string, numResults: number = 5): Promise<SearchResult[]> {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID

    if (!apiKey || !searchEngineId) {
        console.warn('Google Search API credentials not configured')
        return []
    }

    try {
        const url = new URL('https://www.googleapis.com/customsearch/v1')
        url.searchParams.append('key', apiKey)
        url.searchParams.append('cx', searchEngineId)
        url.searchParams.append('q', query)
        url.searchParams.append('num', numResults.toString())

        const response = await fetch(url.toString())

        if (!response.ok) {
            throw new Error(`Search API error: ${response.status}`)
        }

        const data = await response.json()

        return (data.items || []).map((item: any) => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet,
            displayLink: item.displayLink
        }))
    } catch (error) {
        console.error('Error searching web:', error)
        return []
    }
}

// Search for educational resources
export async function searchEducationalResources(
    topic: string,
    subject: string,
    grade: string
): Promise<SearchResult[]> {
    const query = `${topic} ${subject} ${grade} tutorial explanation`
    return searchWeb(query, 5)
}

// Search for YouTube videos
export async function searchYouTubeResources(
    topic: string,
    subject: string
): Promise<SearchResult[]> {
    const query = `${topic} ${subject} site:youtube.com tutorial`
    return searchWeb(query, 3)
}

// Search for syllabus information
export async function searchSyllabus(
    board: string,
    grade: string,
    subject: string
): Promise<SearchResult[]> {
    const query = `${board} ${grade} ${subject} syllabus chapters topics official`
    return searchWeb(query, 5)
}
