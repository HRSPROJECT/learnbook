// Groq API-based AI functions for LearnBook
// This file maintains the same interface as the original Gemini-based version
// but uses Groq API under the hood

import { generateContent, generateWithRetry, callGroqAPI, GroqMessage } from './groq'

export interface LearningContext {
    country: string
    educationLevel: 'school' | 'college'
    board: string
    classGrade: string
    subject: string
    examDate?: string
    dailyAvailableTime: number // minutes
    weakTopics: string[]
    strongTopics: string[]
    learningStyle?: string
}

export interface Chapter {
    id: string
    name: string
    order: number
    importanceWeight: number
    prerequisites: string[]
    concepts: string[]
    estimatedHours: number
    description?: string
}

export interface RoadmapItem {
    chapterId: string
    chapterName: string
    startDate: string
    endDate: string
    isMilestone: boolean
    isRevision: boolean
    priority: 'high' | 'medium' | 'low'
}

export interface DailyTask {
    id: string
    chapterId: string
    chapterName: string
    taskType: 'study' | 'revision' | 'practice'
    durationMinutes: number
    timeSlot: string
    completed: boolean
}

// Generate syllabus based on user context
export async function generateSyllabus(context: LearningContext): Promise<Chapter[]> {
    const prompt = `You are an education expert. Based on the following learning context, generate a structured syllabus with chapters.

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

Return ONLY the JSON array, no other text. Include 3-4 most important chapters for MVP purposes.`

    try {
        const text = await generateWithRetry(prompt)
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0])
        }
        throw new Error('Could not parse syllabus response')
    } catch (error) {
        console.error('Error generating syllabus:', error)
        return getDefaultChapters(context.subject)
    }
}

// Generate optimized learning roadmap
export async function generateRoadmap(
    context: LearningContext,
    chapters: Chapter[]
): Promise<RoadmapItem[]> {
    const prompt = `You are a learning optimization expert. Create an optimal learning roadmap.

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
    "startDate": "2024-01-15",
    "endDate": "2024-01-20",
    "isMilestone": false,
    "isRevision": false,
    "priority": "high"
  }
]

Start from today: ${new Date().toISOString().split('T')[0]}
Return ONLY the JSON array.`

    try {
        const text = await generateWithRetry(prompt)
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0])
        }
        throw new Error('Could not parse roadmap response')
    } catch (error) {
        console.error('Error generating roadmap:', error)
        return generateDefaultRoadmap(chapters)
    }
}

// Generate daily timetable
export async function generateTimetable(
    context: LearningContext,
    currentChapter: Chapter,
    date: string
): Promise<DailyTask[]> {
    const prompt = `Create a study timetable for today.

Date: ${date}
Available time: ${context.dailyAvailableTime} minutes
Current chapter: ${currentChapter.name}
Chapter concepts: ${currentChapter.concepts.join(', ')}

Create a balanced timetable with study, practice, and revision tasks.
Return a JSON array:
[
  {
    "id": "task_1",
    "chapterId": "${currentChapter.id}",
    "chapterName": "${currentChapter.name}",
    "taskType": "study",
    "durationMinutes": 30,
    "timeSlot": "9:00 AM - 9:30 AM",
    "completed": false
  }
]

Return ONLY the JSON array.`

    try {
        const text = await generateWithRetry(prompt)
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0])
        }
        throw new Error('Could not parse timetable response')
    } catch (error) {
        console.error('Error generating timetable:', error)
        return generateDefaultTimetable(currentChapter, context.dailyAvailableTime)
    }
}

// Generate chapter intelligence
export async function generateChapterIntelligence(
    context: LearningContext,
    chapter: Chapter,
    allChapters: Chapter[]
): Promise<{
    whyItMatters: string
    whatBreaksIfSkipped: string
    recommendedDepth: 'light' | 'medium' | 'deep'
    keyTakeaways: string[]
}> {
    const prompt = `Analyze this chapter for a ${context.classGrade} ${context.subject} student.

Chapter: ${chapter.name}
Description: ${chapter.description || 'No description'}
Concepts: ${chapter.concepts.join(', ')}
Prerequisites: ${chapter.prerequisites.join(', ') || 'None'}

Other chapters in syllabus: ${allChapters.map(c => c.name).join(', ')}

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

    try {
        const text = await generateContent(prompt)
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0])
        }
        throw new Error('Could not parse chapter intelligence response')
    } catch (error) {
        console.error('Error generating chapter intelligence:', error)
        return {
            whyItMatters: `${chapter.name} is a foundational topic in ${context.subject} that builds understanding for advanced concepts.`,
            whatBreaksIfSkipped: 'Skipping this chapter may cause difficulty in understanding dependent topics.',
            recommendedDepth: 'medium',
            keyTakeaways: chapter.concepts.slice(0, 4)
        }
    }
}

// Generate NotebookLM study bundle
export async function generateNotebookLMBundle(
    context: LearningContext,
    chapter: Chapter,
    resources: { title: string; url: string }[]
): Promise<{
    sources: string[]
    studyPrompts: string[]
    contextPrompt: string
}> {
    const prompt = `Create a NotebookLM study bundle for:

Chapter: ${chapter.name}
Student level: ${context.classGrade} (${context.board})
Concepts: ${chapter.concepts.join(', ')}

Available resources:
${resources.map(r => `- ${r.title}: ${r.url}`).join('\n')}

Create:
1. List of source URLs to import
2. 3-5 study prompts for the AI
3. A context prompt explaining the student's level

Return JSON:
{
  "sources": ["url1", "url2"],
  "studyPrompts": ["What is...", "Explain...", "Compare..."],
  "contextPrompt": "I am a Class 12 student studying..."
}

Return ONLY the JSON object.`

    try {
        const text = await generateContent(prompt)
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0])
        }
        throw new Error('Could not parse NotebookLM bundle response')
    } catch (error) {
        console.error('Error generating NotebookLM bundle:', error)
        return {
            sources: resources.map(r => r.url),
            studyPrompts: [
                `What are the key concepts in ${chapter.name}?`,
                `Explain ${chapter.concepts[0]} in simple terms.`,
                `How does ${chapter.name} relate to other topics?`
            ],
            contextPrompt: `I am a ${context.classGrade} student from ${context.board} studying ${context.subject}. Please explain concepts at my level.`
        }
    }
}

// Default chapters for MVP (Mathematics example)
function getDefaultChapters(subject: string): Chapter[] {
    if (subject.toLowerCase().includes('math')) {
        return [
            {
                id: 'ch1_calculus',
                name: 'Calculus - Differentiation',
                order: 1,
                importanceWeight: 0.9,
                prerequisites: [],
                concepts: ['Limits', 'Derivatives', 'Chain Rule', 'Applications'],
                estimatedHours: 15,
                description: 'Introduction to differential calculus and its applications'
            },
            {
                id: 'ch2_integration',
                name: 'Calculus - Integration',
                order: 2,
                importanceWeight: 0.9,
                prerequisites: ['ch1_calculus'],
                concepts: ['Indefinite Integrals', 'Definite Integrals', 'Integration by Parts'],
                estimatedHours: 15,
                description: 'Integral calculus and various integration techniques'
            },
            {
                id: 'ch3_vectors',
                name: 'Vectors and 3D Geometry',
                order: 3,
                importanceWeight: 0.7,
                prerequisites: [],
                concepts: ['Vector Operations', 'Dot Product', 'Cross Product', '3D Lines and Planes'],
                estimatedHours: 12,
                description: 'Vector algebra and three-dimensional geometry'
            },
            {
                id: 'ch4_probability',
                name: 'Probability',
                order: 4,
                importanceWeight: 0.8,
                prerequisites: [],
                concepts: ['Probability Basics', 'Conditional Probability', 'Bayes Theorem', 'Distributions'],
                estimatedHours: 10,
                description: 'Probability theory and its applications'
            }
        ]
    }

    // Generic chapters for other subjects
    return [
        {
            id: 'ch1',
            name: 'Introduction',
            order: 1,
            importanceWeight: 0.7,
            prerequisites: [],
            concepts: ['Fundamentals', 'Key Terms'],
            estimatedHours: 5,
            description: 'Introduction to the subject'
        },
        {
            id: 'ch2',
            name: 'Core Concepts',
            order: 2,
            importanceWeight: 0.9,
            prerequisites: ['ch1'],
            concepts: ['Main Topic 1', 'Main Topic 2'],
            estimatedHours: 10,
            description: 'Core concepts and theories'
        },
        {
            id: 'ch3',
            name: 'Applications',
            order: 3,
            importanceWeight: 0.8,
            prerequisites: ['ch2'],
            concepts: ['Practical Applications', 'Problem Solving'],
            estimatedHours: 8,
            description: 'Real-world applications'
        }
    ]
}

// Generate default roadmap
function generateDefaultRoadmap(chapters: Chapter[]): RoadmapItem[] {
    const today = new Date()
    let currentDate = new Date(today)

    return chapters.map((chapter, index) => {
        const startDate = new Date(currentDate)
        const daysNeeded = Math.ceil(chapter.estimatedHours / 2) // 2 hours per day
        currentDate.setDate(currentDate.getDate() + daysNeeded)
        const endDate = new Date(currentDate)

        return {
            chapterId: chapter.id,
            chapterName: chapter.name,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            isMilestone: index === chapters.length - 1,
            isRevision: false,
            priority: chapter.importanceWeight > 0.8 ? 'high' : chapter.importanceWeight > 0.5 ? 'medium' : 'low'
        }
    })
}

// Generate default timetable
function generateDefaultTimetable(chapter: Chapter, availableTime: number): DailyTask[] {
    const tasks: DailyTask[] = []
    let remainingTime = availableTime
    let taskId = 1

    // Study task (50% of time)
    const studyTime = Math.min(Math.floor(availableTime * 0.5), 60)
    if (studyTime > 0) {
        tasks.push({
            id: `task_${taskId++}`,
            chapterId: chapter.id,
            chapterName: chapter.name,
            taskType: 'study',
            durationMinutes: studyTime,
            timeSlot: '9:00 AM - 10:00 AM',
            completed: false
        })
        remainingTime -= studyTime
    }

    // Practice task (30% of time)
    const practiceTime = Math.min(Math.floor(availableTime * 0.3), 45)
    if (practiceTime > 0 && remainingTime > 0) {
        tasks.push({
            id: `task_${taskId++}`,
            chapterId: chapter.id,
            chapterName: chapter.name,
            taskType: 'practice',
            durationMinutes: practiceTime,
            timeSlot: '4:00 PM - 4:45 PM',
            completed: false
        })
        remainingTime -= practiceTime
    }

    // Revision task (20% of time)
    const revisionTime = Math.min(Math.floor(availableTime * 0.2), 30)
    if (revisionTime > 0 && remainingTime > 0) {
        tasks.push({
            id: `task_${taskId++}`,
            chapterId: chapter.id,
            chapterName: chapter.name,
            taskType: 'revision',
            durationMinutes: revisionTime,
            timeSlot: '8:00 PM - 8:30 PM',
            completed: false
        })
    }

    return tasks
}

// Re-export for compatibility (deprecated - use groq.ts directly)
export function getGeminiModel() {
    console.warn('getGeminiModel is deprecated. Use functions from @/lib/groq instead.')
    return {
        generateContent: async (prompt: string) => ({
            response: {
                text: () => generateContent(prompt)
            }
        })
    }
}
