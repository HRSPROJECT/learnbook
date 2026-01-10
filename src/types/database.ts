export interface UserProfile {
    id: string
    full_name: string | null
    country: string | null
    education_level: 'school' | 'college' | null
    board: string | null
    class_grade: string | null
    course_program: string | null
    created_at: string
    updated_at: string
}

export interface LearningContext {
    id: string
    user_id: string
    subject: string
    exam_date: string | null
    daily_available_time: number
    weak_topics: string[]
    strong_topics: string[]
    learning_style: string | null
    created_at: string
    updated_at: string
}

export interface Chapter {
    id: string
    subject: string
    board: string
    class_grade: string
    chapter_name: string
    chapter_order: number
    importance_weight: number
    prerequisites: string[]
    concepts: string[]
    estimated_hours: number
    description: string | null
    created_at: string
}

export interface UserProgress {
    id: string
    user_id: string
    chapter_id: string
    status: 'not_started' | 'in_progress' | 'completed' | 'revision'
    completion_percentage: number
    time_spent: number
    last_studied: string | null
    notes: string | null
    created_at: string
    updated_at: string
}

export interface DailyTask {
    id: string
    user_id: string
    chapter_id: string | null
    task_date: string
    task_type: 'study' | 'revision' | 'practice'
    task_description: string | null
    duration_minutes: number
    time_slot: string | null
    completed: boolean
    skipped: boolean
    created_at: string
    updated_at: string
}

export interface RoadmapItem {
    id: string
    user_id: string
    learning_context_id: string
    chapter_id: string
    chapter_name: string
    start_date: string
    end_date: string
    is_milestone: boolean
    is_revision: boolean
    priority: 'high' | 'medium' | 'low'
    status: 'pending' | 'in_progress' | 'completed'
    created_at: string
}
