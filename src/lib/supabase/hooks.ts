'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

// -----------------------------
// Types
// -----------------------------

export interface UserProfile {
    id: string
    full_name: string | null
    country: string | null
    education_level: 'school' | 'college' | null
    board: string | null
    class_grade: string | null
}

export interface StudyTask {
    id: string
    user_id: string
    chapter_id: string | null
    task_date: string
    task_type: 'study' | 'revision' | 'practice' | null
    task_description: string | null
    duration_minutes: number
    time_slot: string | null
    completed: boolean
    skipped: boolean
    created_at: string
}

export interface ChapterProgress {
    id: string
    user_id: string
    chapter_id: string
    status: 'not_started' | 'in_progress' | 'completed' | 'revision'
    completion_percentage: number
    time_spent: number
    last_studied: string | null
    notes: string | null
}

export interface SavedNote {
    id: string
    user_id: string
    chapter_id: string
    subject: string
    chapter_name: string
    notes_data: any
    created_at: string
    updated_at: string
}

// -----------------------------
// useUserProfile Hook
// -----------------------------

export function useUserProfile() {
    const { user } = useAuth()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchProfile = useCallback(async () => {
        if (!user) {
            setProfile(null)
            setLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error)
            }
            setProfile(data)
        } catch (err) {
            console.error('Profile fetch error:', err)
        } finally {
            setLoading(false)
        }
    }, [user, supabase])

    const updateProfile = async (updates: Partial<UserProfile>) => {
        if (!user) return { error: 'Not authenticated' }

        try {
            const { error } = await supabase
                .from('user_profiles')
                .upsert({ id: user.id, ...updates })

            if (error) throw error
            await fetchProfile()
            return { error: null }
        } catch (err: any) {
            return { error: err.message }
        }
    }

    useEffect(() => {
        fetchProfile()
    }, [fetchProfile])

    return { profile, loading, updateProfile, refetch: fetchProfile }
}

// -----------------------------
// useTasks Hook (Todo List)
// -----------------------------

export function useTasks(date?: string) {
    const { user } = useAuth()
    const [tasks, setTasks] = useState<StudyTask[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const targetDate = date || new Date().toISOString().split('T')[0]

    const fetchTasks = useCallback(async () => {
        if (!user) {
            setTasks([])
            setLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('daily_tasks')
                .select('*')
                .eq('user_id', user.id)
                .eq('task_date', targetDate)
                .order('created_at', { ascending: true })

            if (error) throw error
            setTasks(data || [])
        } catch (err) {
            console.error('Tasks fetch error:', err)
        } finally {
            setLoading(false)
        }
    }, [user, supabase, targetDate])

    const addTask = async (task: Partial<StudyTask>) => {
        if (!user) return { error: 'Not authenticated' }

        try {
            const { data, error } = await supabase
                .from('daily_tasks')
                .insert({
                    user_id: user.id,
                    task_date: targetDate,
                    task_description: task.task_description,
                    task_type: task.task_type || 'study',
                    duration_minutes: task.duration_minutes || 30,
                    time_slot: task.time_slot,
                    completed: false,
                    skipped: false
                })
                .select()
                .single()

            if (error) throw error
            setTasks(prev => [...prev, data])
            return { error: null, data }
        } catch (err: any) {
            return { error: err.message }
        }
    }

    const toggleTask = async (taskId: string, completed: boolean) => {
        try {
            const { error } = await supabase
                .from('daily_tasks')
                .update({ completed, updated_at: new Date().toISOString() })
                .eq('id', taskId)

            if (error) throw error
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed } : t))
            return { error: null }
        } catch (err: any) {
            return { error: err.message }
        }
    }

    const deleteTask = async (taskId: string) => {
        try {
            const { error } = await supabase
                .from('daily_tasks')
                .delete()
                .eq('id', taskId)

            if (error) throw error
            setTasks(prev => prev.filter(t => t.id !== taskId))
            return { error: null }
        } catch (err: any) {
            return { error: err.message }
        }
    }

    useEffect(() => {
        fetchTasks()
    }, [fetchTasks])

    return { tasks, loading, addTask, toggleTask, deleteTask, refetch: fetchTasks }
}

// -----------------------------
// useChapterProgress Hook
// -----------------------------

export function useChapterProgress(chapterId?: string) {
    const { user } = useAuth()
    const [progress, setProgress] = useState<ChapterProgress | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchProgress = useCallback(async () => {
        if (!user || !chapterId) {
            setProgress(null)
            setLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('user_progress')
                .select('*')
                .eq('user_id', user.id)
                .eq('chapter_id', chapterId)
                .single()

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching progress:', error)
            }
            setProgress(data)
        } catch (err) {
            console.error('Progress fetch error:', err)
        } finally {
            setLoading(false)
        }
    }, [user, chapterId, supabase])

    const updateProgress = async (updates: Partial<ChapterProgress>) => {
        if (!user || !chapterId) return { error: 'Not authenticated or no chapter' }

        try {
            const { error } = await supabase
                .from('user_progress')
                .upsert({
                    user_id: user.id,
                    chapter_id: chapterId,
                    ...updates,
                    updated_at: new Date().toISOString()
                })

            if (error) throw error
            await fetchProgress()
            return { error: null }
        } catch (err: any) {
            return { error: err.message }
        }
    }

    const markComplete = async () => {
        return updateProgress({
            status: 'completed',
            completion_percentage: 100,
            last_studied: new Date().toISOString()
        })
    }

    useEffect(() => {
        fetchProgress()
    }, [fetchProgress])

    return { progress, loading, updateProgress, markComplete, refetch: fetchProgress }
}

// -----------------------------
// Local Storage Fallback Hooks
// (When Supabase not configured)
// -----------------------------

export function useLocalTasks() {
    const [tasks, setTasks] = useState<StudyTask[]>([])
    const storageKey = 'learnbook_tasks'

    useEffect(() => {
        const saved = localStorage.getItem(storageKey)
        if (saved) {
            setTasks(JSON.parse(saved))
        }
    }, [])

    const saveTasks = (newTasks: StudyTask[]) => {
        setTasks(newTasks)
        localStorage.setItem(storageKey, JSON.stringify(newTasks))
    }

    const addTask = (description: string) => {
        const newTask: StudyTask = {
            id: `task_${Date.now()}`,
            user_id: 'local',
            chapter_id: null,
            task_date: new Date().toISOString().split('T')[0],
            task_type: 'study',
            task_description: description,
            duration_minutes: 30,
            time_slot: null,
            completed: false,
            skipped: false,
            created_at: new Date().toISOString()
        }
        saveTasks([...tasks, newTask])
    }

    const toggleTask = (taskId: string) => {
        saveTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t))
    }

    const deleteTask = (taskId: string) => {
        saveTasks(tasks.filter(t => t.id !== taskId))
    }

    return { tasks, addTask, toggleTask, deleteTask }
}
