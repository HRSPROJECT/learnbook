'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

// Types
export interface UserSubject {
    id: string
    user_id: string
    name: string
    code: string | null
    description: string | null
    is_custom: boolean
    created_at: string
    updated_at: string
}

export interface SubjectChapter {
    id: string
    subject_id: string
    chapter_number: number
    name: string
    description: string | null
    concepts: string[]
    estimated_hours: number
    progress: number
    status: 'not_started' | 'in_progress' | 'completed' | 'revision'
    created_at: string
    updated_at: string
}

export interface SubjectWithChapters extends UserSubject {
    chapters: SubjectChapter[]
}

// ---------------------------
// useUserSubjects Hook
// ---------------------------

export function useUserSubjects() {
    const { user } = useAuth()
    const [subjects, setSubjects] = useState<SubjectWithChapters[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    const fetchSubjects = useCallback(async () => {
        if (!user) {
            setSubjects([])
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError(null)

            // Fetch subjects
            const { data: subjectsData, error: subjectsError } = await supabase
                .from('user_subjects')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true })

            if (subjectsError) throw subjectsError

            // Fetch chapters for all subjects
            const subjectIds = (subjectsData || []).map(s => s.id)

            let chaptersData: SubjectChapter[] = []
            if (subjectIds.length > 0) {
                const { data, error: chaptersError } = await supabase
                    .from('subject_chapters')
                    .select('*')
                    .in('subject_id', subjectIds)
                    .order('chapter_number', { ascending: true })

                if (chaptersError) throw chaptersError
                chaptersData = data || []
            }

            // Combine subjects with their chapters
            const subjectsWithChapters: SubjectWithChapters[] = (subjectsData || []).map(subject => ({
                ...subject,
                chapters: chaptersData.filter(ch => ch.subject_id === subject.id)
            }))

            setSubjects(subjectsWithChapters)
        } catch (err: any) {
            console.error('Error fetching subjects:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [user, supabase])

    const addSubject = async (subject: {
        name: string
        code?: string
        description?: string
        is_custom?: boolean
    }) => {
        if (!user) return { error: 'Not authenticated', data: null }

        try {
            const { data, error } = await supabase
                .from('user_subjects')
                .insert({
                    user_id: user.id,
                    name: subject.name,
                    code: subject.code || null,
                    description: subject.description || null,
                    is_custom: subject.is_custom ?? false
                })
                .select()
                .single()

            if (error) throw error

            // Add to local state
            setSubjects(prev => [...prev, { ...data, chapters: [] }])
            return { error: null, data }
        } catch (err: any) {
            console.error('Error adding subject:', err)
            return { error: err.message, data: null }
        }
    }

    const removeSubject = async (subjectId: string) => {
        if (!user) return { error: 'Not authenticated' }

        try {
            const { error } = await supabase
                .from('user_subjects')
                .delete()
                .eq('id', subjectId)
                .eq('user_id', user.id)

            if (error) throw error

            // Remove from local state
            setSubjects(prev => prev.filter(s => s.id !== subjectId))
            return { error: null }
        } catch (err: any) {
            console.error('Error removing subject:', err)
            return { error: err.message }
        }
    }

    const updateSubject = async (subjectId: string, updates: Partial<UserSubject>) => {
        if (!user) return { error: 'Not authenticated' }

        try {
            const { error } = await supabase
                .from('user_subjects')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', subjectId)
                .eq('user_id', user.id)

            if (error) throw error

            // Update local state
            setSubjects(prev => prev.map(s =>
                s.id === subjectId ? { ...s, ...updates } : s
            ))
            return { error: null }
        } catch (err: any) {
            console.error('Error updating subject:', err)
            return { error: err.message }
        }
    }

    useEffect(() => {
        fetchSubjects()
    }, [fetchSubjects])

    return {
        subjects,
        loading,
        error,
        addSubject,
        removeSubject,
        updateSubject,
        refetch: fetchSubjects
    }
}

// ---------------------------
// useSubjectChapters Hook
// ---------------------------

export function useSubjectChapters(subjectId?: string) {
    const { user } = useAuth()
    const [chapters, setChapters] = useState<SubjectChapter[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchChapters = useCallback(async () => {
        if (!user || !subjectId) {
            setChapters([])
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('subject_chapters')
                .select('*')
                .eq('subject_id', subjectId)
                .order('chapter_number', { ascending: true })

            if (error) throw error
            setChapters(data || [])
        } catch (err) {
            console.error('Error fetching chapters:', err)
        } finally {
            setLoading(false)
        }
    }, [user, subjectId, supabase])

    const addChapters = async (chaptersToAdd: Array<{
        chapter_number: number
        name: string
        description?: string
        concepts?: string[]
        estimated_hours?: number
    }>) => {
        if (!user || !subjectId) return { error: 'Not authenticated or no subject' }

        try {
            // First, delete any existing chapters to prevent duplicates
            await supabase
                .from('subject_chapters')
                .delete()
                .eq('subject_id', subjectId)

            const chaptersWithSubject = chaptersToAdd.map(ch => ({
                subject_id: subjectId,
                chapter_number: ch.chapter_number,
                name: ch.name,
                description: ch.description || null,
                concepts: ch.concepts || [],
                estimated_hours: ch.estimated_hours || 5,
                progress: 0,
                status: 'not_started' as const
            }))

            const { data, error } = await supabase
                .from('subject_chapters')
                .insert(chaptersWithSubject)
                .select()

            if (error) throw error

            setChapters(data || [])
            return { error: null, data }
        } catch (err: any) {
            console.error('Error adding chapters:', err)
            return { error: err.message }
        }
    }

    const updateChapterProgress = async (chapterId: string, updates: {
        progress?: number
        status?: 'not_started' | 'in_progress' | 'completed' | 'revision'
    }) => {
        try {
            const { error } = await supabase
                .from('subject_chapters')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', chapterId)

            if (error) throw error

            setChapters(prev => prev.map(ch =>
                ch.id === chapterId ? { ...ch, ...updates } : ch
            ))
            return { error: null }
        } catch (err: any) {
            console.error('Error updating chapter progress:', err)
            return { error: err.message }
        }
    }

    const deleteChapter = async (chapterId: string) => {
        if (!user) return { error: 'Not authenticated' }

        try {
            const { error } = await supabase
                .from('subject_chapters')
                .delete()
                .eq('id', chapterId)

            if (error) throw error

            // Remove from local state
            setChapters(prev => prev.filter(ch => ch.id !== chapterId))
            return { error: null }
        } catch (err: any) {
            console.error('Error deleting chapter:', err)
            return { error: err.message }
        }
    }

    useEffect(() => {
        fetchChapters()
    }, [fetchChapters])

    return {
        chapters,
        loading,
        addChapters,
        updateChapterProgress,
        deleteChapter,
        refetch: fetchChapters
    }
}

// ---------------------------
// useUserSettings Hook
// ---------------------------

export interface UserSettings {
    dailyAvailableTime: number
    examDate?: string
    weakTopics: string[]
    strongTopics: string[]
    learningStyle: 'visual' | 'reading' | 'auditory' | 'kinesthetic'
}

const DEFAULT_SETTINGS: UserSettings = {
    dailyAvailableTime: 120,
    weakTopics: [],
    strongTopics: [],
    learningStyle: 'visual'
}

export function useUserSettings() {
    const { user } = useAuth()
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchSettings = useCallback(async () => {
        if (!user) {
            setSettings(DEFAULT_SETTINGS)
            setLoading(false)
            return
        }

        try {
            // For now, store settings in learning_context table
            const { data, error } = await supabase
                .from('learning_context')
                .select('daily_available_time, exam_date, weak_topics, strong_topics, learning_style')
                .eq('user_id', user.id)
                .single()

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching settings:', error)
            }

            if (data) {
                setSettings({
                    dailyAvailableTime: data.daily_available_time || 120,
                    examDate: data.exam_date || undefined,
                    weakTopics: data.weak_topics || [],
                    strongTopics: data.strong_topics || [],
                    learningStyle: data.learning_style || 'visual'
                })
            }
        } catch (err) {
            console.error('Settings fetch error:', err)
        } finally {
            setLoading(false)
        }
    }, [user, supabase])

    const updateSettings = async (updates: Partial<UserSettings>) => {
        if (!user) return { error: 'Not authenticated' }

        try {
            const { error } = await supabase
                .from('learning_context')
                .upsert({
                    user_id: user.id,
                    subject: 'default', // Required field
                    daily_available_time: updates.dailyAvailableTime ?? settings.dailyAvailableTime,
                    exam_date: updates.examDate ?? settings.examDate,
                    weak_topics: updates.weakTopics ?? settings.weakTopics,
                    strong_topics: updates.strongTopics ?? settings.strongTopics,
                    learning_style: updates.learningStyle ?? settings.learningStyle,
                    updated_at: new Date().toISOString()
                })

            if (error) throw error

            setSettings(prev => ({ ...prev, ...updates }))
            return { error: null }
        } catch (err: any) {
            console.error('Error updating settings:', err)
            return { error: err.message }
        }
    }

    useEffect(() => {
        fetchSettings()
    }, [fetchSettings])

    return { settings, loading, updateSettings, refetch: fetchSettings }
}
