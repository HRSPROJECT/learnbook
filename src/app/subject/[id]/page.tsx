'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import {
    ChevronLeft, BookOpen, Plus, Trash2, Check, X,
    Loader2, Clock, Target, Sparkles, Play, CheckCircle2,
    Circle, ChevronRight, RefreshCw
} from 'lucide-react'
import { useUserSubjects, useSubjectChapters, SubjectWithChapters } from '@/lib/supabase/subjects'
import { useUserProfile } from '@/lib/supabase/hooks'
import { useAuth } from '@/contexts/AuthContext'

export default function SubjectPage() {
    const router = useRouter()
    const params = useParams()
    const subjectId = params.id as string

    const { user } = useAuth()
    const { profile, loading: profileLoading } = useUserProfile()
    const { subjects, loading: subjectsLoading, refetch: refetchSubjects } = useUserSubjects()
    const { chapters, loading: chaptersLoading, addChapters, updateChapterProgress, deleteChapter, refetch: refetchChapters } = useSubjectChapters(subjectId)

    const [subject, setSubject] = useState<SubjectWithChapters | null>(null)
    const [isLoadingChapters, setIsLoadingChapters] = useState(false)
    const [showAddChapter, setShowAddChapter] = useState(false)
    const [newChapter, setNewChapter] = useState({
        name: '',
        description: '',
        estimatedHours: 5
    })

    // Prevent multiple auto-load attempts
    const hasAttemptedLoad = useRef(false)

    useEffect(() => {
        if (!profileLoading && !user) {
            router.push('/login')
            return
        }
    }, [user, profileLoading, router])

    useEffect(() => {
        if (!subjectsLoading && subjects.length > 0) {
            const subj = subjects.find(s => s.id === subjectId)
            if (!subj) {
                router.push('/dashboard')
                return
            }
            setSubject(subj)
        }
    }, [subjects, subjectsLoading, subjectId, router])

    // Don't duplicate - use chapters from hook, not from subject
    // (removed the useEffect that was causing duplicates)

    // Auto-load chapters if none exist when page loads (only once)
    useEffect(() => {
        const shouldLoad =
            !chaptersLoading &&
            chapters.length === 0 &&
            subject &&
            profile &&
            !isLoadingChapters &&
            !hasAttemptedLoad.current

        if (shouldLoad) {
            hasAttemptedLoad.current = true
            // Small delay to ensure UI is ready
            const timer = setTimeout(() => {
                loadChaptersFromAI()
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [chaptersLoading, chapters.length, subject, profile, isLoadingChapters])

    const loadChaptersFromAI = async (force = false) => {
        if (!profile || !subject) return

        // If chapters already exist, don't regenerate (unless forced)
        if (chapters.length > 0 && !force) {
            console.log('Chapters already exist, skipping generation')
            return
        }

        setIsLoadingChapters(true)

        try {
            // Debug: Log what profile data is being used
            console.log('Loading chapters with profile:', {
                country: profile.country,
                educationLevel: profile.education_level,
                board: profile.board,
                classGrade: profile.class_grade,
                subject: subject.name
            })

            const response = await fetch('/api/curriculum', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    country: profile.country,
                    educationLevel: profile.education_level,
                    board: profile.board,
                    classGrade: profile.class_grade,
                    subject: subject.name,
                    searchType: 'chapters'
                })
            })

            if (!response.ok) {
                console.error('API error:', response.status, response.statusText)
                alert(`Failed to load chapters: ${response.status}`)
                return
            }

            const result = await response.json()
            console.log('API result:', result)

            if (result.success && result.data) {
                const chaptersToAdd = result.data.map((ch: any, index: number) => ({
                    chapter_number: ch.chapterNumber || index + 1,
                    name: ch.name,
                    description: ch.description || '',
                    concepts: ch.concepts || [],
                    estimated_hours: ch.estimatedHours || 5
                }))

                await addChapters(chaptersToAdd, true)
                await refetchChapters()
            } else {
                console.error('API returned error:', result)
                alert(result.error || 'Failed to load chapters')
            }
        } catch (err) {
            console.error('Error loading chapters:', err)
        } finally {
            setIsLoadingChapters(false)
        }
    }

    const handleUpdateStatus = async (chapterId: string, currentStatus: string) => {
        const nextStatus =
            currentStatus === 'not_started' ? 'in_progress' :
                currentStatus === 'in_progress' ? 'completed' : 'not_started'

        await updateChapterProgress(chapterId, {
            status: nextStatus as 'not_started' | 'in_progress' | 'completed',
            progress: nextStatus === 'completed' ? 100 : 0
        })
    }

    const handleAddChapter = async () => {
        if (!newChapter.name.trim() || !subject) return

        await addChapters([{
            chapter_number: (subject.chapters?.length || 0) + 1,
            name: newChapter.name.trim(),
            description: newChapter.description.trim(),
            estimated_hours: newChapter.estimatedHours
        }])

        await refetchChapters()
        setNewChapter({ name: '', description: '', estimatedHours: 5 })
        setShowAddChapter(false)
    }

    const handleDeleteChapter = async (chapterId: string, chapterName: string) => {
        if (!confirm(`Are you sure you want to delete "${chapterName}"?`)) return
        await deleteChapter(chapterId)
    }

    const isLoading = profileLoading || subjectsLoading

    if (isLoading) {
        return (
            <div className="min-h-screen gradient-bg flex items-center justify-center">
                <div className="text-center">
                    <Sparkles className="w-12 h-12 text-primary mx-auto loading-pulse" />
                    <p className="mt-4 text-muted">Loading...</p>
                </div>
            </div>
        )
    }

    if (!subject) {
        return (
            <div className="min-h-screen gradient-bg flex items-center justify-center">
                <p className="text-muted">Subject not found</p>
            </div>
        )
    }

    const subjectChapters = chapters || []
    const completedCount = subjectChapters.filter(c => c.status === 'completed').length
    const inProgressCount = subjectChapters.filter(c => c.status === 'in_progress').length
    const totalHours = subjectChapters.reduce((acc, c) => acc + (c.estimated_hours || 0), 0)

    return (
        <div className="min-h-screen gradient-bg">
            {/* Header */}
            <header className="border-b border-card-border sticky top-0 bg-background/80 backdrop-blur z-40">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 hover:bg-secondary rounded-lg transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold">{subject.name}</h1>
                        <p className="text-sm text-muted">{subjectChapters.length} chapters</p>
                    </div>
                    <button
                        onClick={() => loadChaptersFromAI(true)}
                        disabled={isLoadingChapters}
                        className="btn-secondary p-2"
                        title="Refresh chapters from AI"
                    >
                        <RefreshCw className={`w-5 h-5 ${isLoadingChapters ? 'loading-spin' : ''}`} />
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="card text-center">
                        <Target className="w-6 h-6 mx-auto mb-2 text-primary" />
                        <p className="text-2xl font-bold">{subjectChapters.length}</p>
                        <p className="text-xs text-muted">Total Chapters</p>
                    </div>

                    <div className="card text-center">
                        <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-success" />
                        <p className="text-2xl font-bold">{completedCount}</p>
                        <p className="text-xs text-muted">Completed</p>
                    </div>

                    <div className="card text-center">
                        <Play className="w-6 h-6 mx-auto mb-2 text-accent" />
                        <p className="text-2xl font-bold">{inProgressCount}</p>
                        <p className="text-xs text-muted">In Progress</p>
                    </div>

                    <div className="card text-center">
                        <Clock className="w-6 h-6 mx-auto mb-2 text-warning" />
                        <p className="text-2xl font-bold">{totalHours}h</p>
                        <p className="text-xs text-muted">Est. Time</p>
                    </div>
                </div>

                {/* Chapter List */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">Chapters</h2>
                    <button
                        onClick={() => setShowAddChapter(true)}
                        className="btn-secondary flex items-center gap-2 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add Chapter
                    </button>
                </div>

                {(isLoadingChapters || chaptersLoading) && (
                    <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 text-primary mx-auto loading-spin" />
                        <p className="text-muted mt-2">Fetching chapters...</p>
                    </div>
                )}

                <div className="space-y-3">
                    {subjectChapters.map((chapter, index) => (
                        <div key={chapter.id} className="card group">
                            <div className="flex items-start gap-4">
                                {/* Status Toggle */}
                                <button
                                    onClick={() => handleUpdateStatus(chapter.id, chapter.status)}
                                    className="flex-shrink-0 mt-1"
                                >
                                    {chapter.status === 'completed' ? (
                                        <CheckCircle2 className="w-6 h-6 text-success" />
                                    ) : chapter.status === 'in_progress' ? (
                                        <Play className="w-6 h-6 text-accent" />
                                    ) : (
                                        <Circle className="w-6 h-6 text-muted hover:text-primary transition-colors" />
                                    )}
                                </button>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs text-muted">Ch. {chapter.chapter_number}</span>
                                    </div>
                                    <h3 className="font-medium">{chapter.name}</h3>
                                    {chapter.description && (
                                        <p className="text-sm text-muted mt-1 line-clamp-2">{chapter.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {chapter.estimated_hours}h
                                        </span>
                                        {chapter.concepts && chapter.concepts.length > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Target className="w-3 h-3" />
                                                {chapter.concepts.length} concepts
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeleteChapter(chapter.id, chapter.name)
                                        }}
                                        className="p-2 hover:bg-red-500/20 rounded-lg text-muted hover:text-red-500 transition-colors"
                                        title="Delete Chapter"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <Link
                                        href={`/chapter/${chapter.id}?subject=${subjectId}`}
                                        className="p-2 hover:bg-secondary rounded-lg"
                                        title="View Details"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {subjectChapters.length === 0 && !isLoadingChapters && !chaptersLoading && (
                    <div className="text-center py-12">
                        <BookOpen className="w-12 h-12 text-muted mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Chapters Yet</h3>
                        <p className="text-muted mb-4">Click refresh to generate chapters with AI</p>
                        <button
                            onClick={() => loadChaptersFromAI()}
                            className="btn-primary"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate Chapters
                        </button>
                    </div>
                )}
            </main>

            {/* Add Chapter Modal */}
            <AnimatePresence>
                {showAddChapter && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md card"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold">Add Chapter</h3>
                                <button
                                    onClick={() => setShowAddChapter(false)}
                                    className="p-1 hover:bg-secondary rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Chapter Name</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="e.g., Introduction to Calculus"
                                        value={newChapter.name}
                                        onChange={(e) => setNewChapter(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Description</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Brief description"
                                        value={newChapter.description}
                                        onChange={(e) => setNewChapter(prev => ({ ...prev, description: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Estimated Hours: {newChapter.estimatedHours}
                                    </label>
                                    <input
                                        type="range"
                                        className="w-full accent-primary"
                                        min={1}
                                        max={30}
                                        value={newChapter.estimatedHours}
                                        onChange={(e) => setNewChapter(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) }))}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowAddChapter(false)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddChapter}
                                    disabled={!newChapter.name.trim()}
                                    className="btn-primary flex-1"
                                >
                                    Add Chapter
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
