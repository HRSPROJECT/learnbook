// Onboarding step data
export interface OnboardingData {
    // Step 1: Country & Education
    country: string
    educationLevel: 'school' | 'college' | ''

    // Step 2: Board & Class
    board: string
    classGrade: string

    // Step 3: Subject
    subject: string

    // Step 4: Schedule
    examDate: string
    dailyAvailableTime: number // minutes

    // Step 5: Preferences
    weakTopics: string[]
    strongTopics: string[]
    learningStyle: string
}

export const initialOnboardingData: OnboardingData = {
    country: '',
    educationLevel: '',
    board: '',
    classGrade: '',
    subject: '',
    examDate: '',
    dailyAvailableTime: 120,
    weakTopics: [],
    strongTopics: [],
    learningStyle: 'visual'
}

// Country options with education systems
export const countryOptions = [
    { value: 'india', label: 'India', boards: ['CBSE', 'ICSE', 'State Board', 'IB', 'Other'] },
    { value: 'usa', label: 'United States', boards: ['Common Core', 'AP', 'IB', 'Other'] },
    { value: 'uk', label: 'United Kingdom', boards: ['GCSE', 'A-Levels', 'IB', 'Other'] },
    { value: 'australia', label: 'Australia', boards: ['ATAR', 'VCE', 'HSC', 'QCE', 'Other'] },
    { value: 'canada', label: 'Canada', boards: ['Provincial Curriculum', 'IB', 'AP', 'Other'] },
    { value: 'uae', label: 'UAE', boards: ['MOE', 'CBSE', 'IB', 'British', 'American', 'Other'] },
    { value: 'singapore', label: 'Singapore', boards: ['MOE Singapore', 'IB', 'Other'] },
    { value: 'germany', label: 'Germany', boards: ['Abitur', 'IB', 'Other'] },
    { value: 'other', label: 'Other', boards: ['Other'] }
]

// School grades by education level
export const schoolGrades = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
    'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
    'Grade 11', 'Grade 12', 'Other'
]

export const collegeYears = [
    '1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Other'
]

// Common subjects
export const commonSubjects = [
    { value: 'mathematics', label: 'Mathematics' },
    { value: 'physics', label: 'Physics' },
    { value: 'chemistry', label: 'Chemistry' },
    { value: 'biology', label: 'Biology' },
    { value: 'computer_science', label: 'Computer Science' },
    { value: 'english', label: 'English' },
    { value: 'economics', label: 'Economics' },
    { value: 'business', label: 'Business Studies' },
    { value: 'accountancy', label: 'Accountancy' },
    { value: 'history', label: 'History' },
    { value: 'geography', label: 'Geography' },
    { value: 'other', label: 'Other' }
]

// Learning styles
export const learningStyles = [
    { value: 'visual', label: 'Visual', description: 'I learn best through diagrams, charts, and videos' },
    { value: 'reading', label: 'Reading/Writing', description: 'I prefer reading textbooks and taking notes' },
    { value: 'auditory', label: 'Auditory', description: 'I learn best through lectures and discussions' },
    { value: 'kinesthetic', label: 'Hands-on', description: 'I prefer practical exercises and experiments' }
]
