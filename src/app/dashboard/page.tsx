'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    BookOpen, ChevronRight, Settings, Plus, Edit2, Trash2,
    Loader2, Clock, Target, Calendar, Menu, X, LogOut,
    GraduationCap, Sparkles, RefreshCw, ListTodo
} from 'lucide-react'
import { useUserSubjects, useUserSettings, useSubjectChapters } from '@/lib/supabase/subjects'
import { useUserProfile } from '@/lib/supabase/hooks'
import { useAuth } from '@/contexts/AuthContext'
import TodoSidebar from '@/components/TodoSidebar'

export default function DashboardPage() {
    const router = useRouter()
    const { user, signOut } = useAuth()
    const { profile, loading: profileLoading, profileFetched } = useUserProfile()
    const { subjects, loading: subjectsLoading, addSubject, removeSubject, refetch } = useUserSubjects()
    const { settings, updateSettings, loading: settingsLoading } = useUserSettings()

    const [loadingChapters, setLoadingChapters] = useState<string | null>(null)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [showSettingsModal, setShowSettingsModal] = useState(false)
    const [showAddSubjectModal, setShowAddSubjectModal] = useState(false)
    const [todoOpen, setTodoOpen] = useState(false)
    const [newSubject, setNewSubject] = useState({ name: '', description: '' })
    const [isAddingSubject, setIsAddingSubject] = useState(false)

    const motivationalQuotes = [
        "🌟 Every expert was once a beginner. Keep going!",
        "💪 Success is the sum of small efforts repeated daily.",
        "🎯 Focus on progress, not perfection.",
        "🚀 The secret to getting ahead is getting started.",
        "✨ Believe you can and you're halfway there!",
        "📚 Education is the passport to the future."
    ]
    const [currentQuote] = useState(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)])

    const isLoading = profileLoading || subjectsLoading || settingsLoading

    useEffect(() => {
        if (!profileLoading && !user) {
            router.push('/login')
        }
    }, [user, profileLoading, router])

    // Redirect to onboarding if profile is incomplete
    useEffect(() => {
        // Wait for profile fetch to complete AND user to exist
        if (!profileFetched || !user) return

        // Check if profile is missing or has incomplete data
        const isProfileIncomplete = !profile || !profile.board || !profile.class_grade

        if (isProfileIncomplete) {
            console.log('Profile incomplete, redirecting to onboarding:', { profile, profileFetched })
            router.push('/onboarding')
        }
    }, [profile, profileFetched, user, router])

    const loadChaptersForSubject = async (subjectId: string) => {
        const subject = subjects.find(s => s.id === subjectId)
        if (!subject || subject.chapters.length > 0) return // Already loaded

        setLoadingChapters(subjectId)

        try {
            const response = await fetch('/api/curriculum', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    country: profile?.country || 'India',
                    educationLevel: profile?.education_level || 'school',
                    board: profile?.board || 'CBSE',
                    classGrade: profile?.class_grade || 'Class 12',
                    subject: subject.name,
                    searchType: 'chapters'
                })
            })

            const result = await response.json()

            if (result.success && result.data) {
                // Import chapters hook for this specific subject
                const supabase = (await import('@/lib/supabase/client')).createClient()

                const chaptersToAdd = result.data.map((ch: any, index: number) => ({
                    subject_id: subjectId,
                    chapter_number: ch.chapterNumber || index + 1,
                    name: ch.name,
                    description: ch.description || null,
                    concepts: ch.concepts || [],
                    estimated_hours: ch.estimatedHours || 5,
                    progress: 0,
                    status: 'not_started'
                }))

                await supabase.from('subject_chapters').insert(chaptersToAdd)
                await refetch()
            }
        } catch (err) {
            console.error('Error loading chapters:', err)
        } finally {
            setLoadingChapters(null)
        }
    }

    const handleLogout = async () => {
        await signOut()
    }

    const handleRemoveSubject = async (subjectId: string) => {
        if (confirm('Remove this subject?')) {
            await removeSubject(subjectId)
        }
    }

    const handleAddSubject = async () => {
        if (!newSubject.name.trim()) return

        setIsAddingSubject(true)
        try {
            const result = await addSubject({
                name: newSubject.name.trim(),
                description: newSubject.description.trim() || 'Custom subject',
                is_custom: true
            })

            if (!result.error) {
                setNewSubject({ name: '', description: '' })
                setShowAddSubjectModal(false)
            }
        } finally {
            setIsAddingSubject(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen gradient-bg flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary loading-spin" />
            </div>
        )
    }

    if (!user) {
        return null
    }

    const totalChapters = subjects.reduce((acc, s) => acc + s.chapters.length, 0)
    const completedChapters = subjects.reduce(
        (acc, s) => acc + s.chapters.filter(c => c.status === 'completed').length, 0
    )

    return (
        <div className="min-h-screen gradient-bg flex">
            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-card-bg border-r border-card-border
        transform transition-transform lg:relative lg:transform-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                <div className="flex flex-col h-full">
                    <div className="p-6">
                        <Link href="/" className="flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold">LearnBook</span>
                        </Link>

                        {/* Quick Stats */}
                        <div className="space-y-3 mb-6">
                            {/* Stats */}
                            <div className="p-4 rounded-xl bg-secondary space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted">Subjects</span>
                                    <span className="font-bold">{subjects.length}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted">Chapters</span>
                                    <span className="font-bold">{totalChapters}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted">Completed</span>
                                    <span className="font-bold text-success">{completedChapters}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted">Progress</span>
                                    <span className="font-bold text-primary">{totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Subject List */}
                        <nav className="space-y-2">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-muted">Your Subjects</span>
                                <button
                                    onClick={() => setShowAddSubjectModal(true)}
                                    className="p-1 hover:bg-secondary rounded"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            {subjects.map(subject => (
                                <Link
                                    key={subject.id}
                                    href={`/subject/${subject.id}`}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                        <BookOpen className="w-4 h-4 text-primary" />
                                    </div>
                                    <span className="flex-1 truncate text-sm">{subject.name}</span>
                                    <ChevronRight className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100" />
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-auto p-6 border-t border-card-border">
                        <button
                            onClick={() => setShowSettingsModal(true)}
                            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-muted"
                        >
                            <Settings className="w-5 h-5" />
                            <span>Settings</span>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-muted mt-1"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-h-screen overflow-x-hidden">
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between p-4 border-b border-card-border">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
                        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                    <span className="font-bold">Dashboard</span>
                    <button onClick={() => setTodoOpen(!todoOpen)} className="p-2">
                        <ListTodo className="w-5 h-5" />
                    </button>
                </header>

                <div className="p-6 lg:p-8">
                    {/* Welcome Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 flex items-start justify-between"
                    >
                        <div>
                            <h1 className="text-3xl font-bold mb-2">
                                Welcome, {profile?.full_name?.split(' ')[0] || 'Student'}! 👋
                            </h1>
                            <p className="text-muted flex items-center gap-2">
                                <GraduationCap className="w-4 h-4" />
                                {profile?.board || 'Board'} • {profile?.class_grade || 'Class'}
                            </p>
                        </div>
                        <button
                            onClick={() => setTodoOpen(!todoOpen)}
                            className="hidden lg:flex items-center gap-2 btn-secondary"
                        >
                            <ListTodo className="w-4 h-4" />
                            Today's Tasks
                        </button>
                    </motion.div>

                    {/* Motivational Quote */}
                    <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                        <p className="text-center text-sm font-medium">{currentQuote}</p>
                    </div>

                    {/* Subject Cards Grid */}
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {subjects.map((subject, index) => (
                            <motion.div
                                key={subject.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="card-interactive group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                            <BookOpen className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{subject.name}</h3>
                                            {subject.code && (
                                                <p className="text-xs text-muted">Code: {subject.code}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            className="p-1.5 hover:bg-secondary rounded"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-4 h-4 text-muted" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault()
                                                handleRemoveSubject(subject.id)
                                            }}
                                            className="p-1.5 hover:bg-secondary rounded"
                                            title="Remove"
                                        >
                                            <Trash2 className="w-4 h-4 text-muted" />
                                        </button>
                                    </div>
                                </div>

                                <p className="text-sm text-muted mb-4 line-clamp-2">
                                    {subject.description}
                                </p>

                                {subject.chapters.length > 0 ? (
                                    <>
                                        <div className="flex items-center justify-between text-sm mb-2">
                                            <span className="text-muted">Progress</span>
                                            <span className="font-medium">
                                                {subject.chapters.filter(c => c.status === 'completed').length}/{subject.chapters.length} chapters
                                            </span>
                                        </div>
                                        <div className="progress-bar mb-4">
                                            <div
                                                className="progress-fill"
                                                style={{
                                                    width: `${(subject.chapters.filter(c => c.status === 'completed').length / subject.chapters.length) * 100}%`
                                                }}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-4 text-muted text-sm mb-4">
                                        <Sparkles className="w-5 h-5 mx-auto mb-2" />
                                        Click to load chapters
                                    </div>
                                )}

                                <Link
                                    href={`/subject/${subject.id}`}
                                    onClick={() => loadChaptersForSubject(subject.id)}
                                    className="btn-primary w-full flex items-center justify-center gap-2"
                                >
                                    {loadingChapters === subject.id ? (
                                        <>
                                            <Loader2 className="w-4 h-4 loading-spin" />
                                            Loading...
                                        </>
                                    ) : subject.chapters.length > 0 ? (
                                        <>
                                            View Chapters
                                            <ChevronRight className="w-4 h-4" />
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            Load Chapters
                                        </>
                                    )}
                                </Link>
                            </motion.div>
                        ))}

                        {/* Add Subject Card */}
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: subjects.length * 0.1 }}
                            onClick={() => setShowAddSubjectModal(true)}
                            className="card-interactive border-dashed flex flex-col items-center justify-center min-h-[200px] hover:border-primary text-muted hover:text-primary transition-colors"
                        >
                            <Plus className="w-10 h-10 mb-3" />
                            <span className="font-medium">Add Subject</span>
                        </motion.button>
                    </div>
                </div>
            </main>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Todo Sidebar */}
            <TodoSidebar isOpen={todoOpen} onToggle={() => setTodoOpen(!todoOpen)} />

            {/* Add Subject Modal */}
            <AnimatePresence>
                {showAddSubjectModal && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md card"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold">Add New Subject</h3>
                                <button
                                    onClick={() => setShowAddSubjectModal(false)}
                                    className="p-1 hover:bg-secondary rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Subject Name</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="e.g., Mathematics"
                                        value={newSubject.name}
                                        onChange={(e) => setNewSubject(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Brief description of the subject"
                                        value={newSubject.description}
                                        onChange={(e) => setNewSubject(prev => ({ ...prev, description: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowAddSubjectModal(false)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddSubject}
                                    disabled={!newSubject.name.trim() || isAddingSubject}
                                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                                >
                                    {isAddingSubject ? (
                                        <>
                                            <Loader2 className="w-4 h-4 loading-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        'Add Subject'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Settings Modal */}
            {showSettingsModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md card"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold">Settings</h3>
                            <button
                                onClick={() => setShowSettingsModal(false)}
                                className="p-1 hover:bg-secondary rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Daily Study Time</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        className="flex-1 accent-primary"
                                        min={30}
                                        max={300}
                                        step={15}
                                        value={settings.dailyAvailableTime}
                                        onChange={(e) => {
                                            updateSettings({ dailyAvailableTime: parseInt(e.target.value) })
                                        }}
                                    />
                                    <span className="font-medium w-16 text-right">
                                        {settings.dailyAvailableTime}m
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Exam Date (Optional)</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={settings.examDate || ''}
                                    onChange={(e) => {
                                        updateSettings({ examDate: e.target.value })
                                    }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => setShowSettingsModal(false)}
                            className="btn-primary w-full mt-6"
                        >
                            Save Changes
                        </button>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
