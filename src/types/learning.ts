// User profile types
export interface UserProfile {
    id: string
    email: string
    fullName: string
    country: string
    educationLevel: 'school' | 'college'
    board: string
    classGrade: string
    createdAt: string
}

// Subject and Chapter types
export interface Subject {
    id: string
    name: string
    code?: string
    description: string
    isCustom?: boolean
    chapters: Chapter[]
}

export interface Chapter {
    id: string
    subjectId: string
    name: string
    chapterNumber: number
    description: string
    concepts: string[]
    estimatedHours: number
    isCustom?: boolean
    progress: number
    status: 'not_started' | 'in_progress' | 'completed' | 'revision'
}

// Learning data store type
export interface LearningData {
    profile: UserProfile | null
    subjects: Subject[]
    settings: LearningSettings
}

export interface LearningSettings {
    dailyAvailableTime: number // minutes
    examDate?: string
    weakTopics: string[]
    strongTopics: string[]
    learningStyle: 'visual' | 'reading' | 'auditory' | 'kinesthetic'
}

// Initial empty state
export const initialLearningData: LearningData = {
    profile: null,
    subjects: [],
    settings: {
        dailyAvailableTime: 120,
        weakTopics: [],
        strongTopics: [],
        learningStyle: 'visual'
    }
}

// Country options with education systems
export const countryOptions = [
    {
        value: 'india', label: 'India',
        schoolBoards: ['CBSE', 'ICSE', 'State Board', 'IB', 'Cambridge (IGCSE)', 'Other'],
        collegeBoards: ['UGC', 'AICTE', 'University Specific', 'IIT', 'NIT', 'Other']
    },
    {
        value: 'usa', label: 'United States',
        schoolBoards: ['Common Core', 'State Standards', 'AP', 'IB', 'Other'],
        collegeBoards: ['State University', 'Private University', 'Community College', 'Other']
    },
    {
        value: 'uk', label: 'United Kingdom',
        schoolBoards: ['GCSE', 'A-Levels', 'Scottish Highers', 'IB', 'Other'],
        collegeBoards: ['Russell Group', 'University Specific', 'Other']
    },
    {
        value: 'australia', label: 'Australia',
        schoolBoards: ['ATAR', 'VCE', 'HSC', 'QCE', 'WACE', 'Other'],
        collegeBoards: ['Go8 Universities', 'TAFE', 'University Specific', 'Other']
    },
    {
        value: 'canada', label: 'Canada',
        schoolBoards: ['Ontario Curriculum', 'BC Curriculum', 'Alberta Curriculum', 'IB', 'Other'],
        collegeBoards: ['U15 Universities', 'Provincial University', 'College', 'Other']
    },
    {
        value: 'uae', label: 'UAE',
        schoolBoards: ['MOE', 'CBSE', 'IB', 'British', 'American', 'Other'],
        collegeBoards: ['MOE Higher Ed', 'International', 'Other']
    },
    {
        value: 'singapore', label: 'Singapore',
        schoolBoards: ['MOE Singapore', 'GCE O-Level', 'GCE A-Level', 'IB', 'Other'],
        collegeBoards: ['NUS', 'NTU', 'SMU', 'Polytechnic', 'Other']
    },
    {
        value: 'other', label: 'Other',
        schoolBoards: ['National Curriculum', 'IB', 'Cambridge', 'Other'],
        collegeBoards: ['National University', 'Private Institution', 'Other']
    }
]

// School grades
export const schoolGrades = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
    'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
    'Grade 11', 'Grade 12', 'Other'
]

// College years
export const collegeYears = [
    '1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year',
    'Masters 1st Year', 'Masters 2nd Year', 'PhD', 'Other'
]

// Local storage helpers
export const STORAGE_KEY = 'learnbook_data'

export function saveData(data: LearningData): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
}

export function loadData(): LearningData {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            try {
                return JSON.parse(saved)
            } catch {
                return initialLearningData
            }
        }
    }
    return initialLearningData
}

export function clearData(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY)
    }
}
