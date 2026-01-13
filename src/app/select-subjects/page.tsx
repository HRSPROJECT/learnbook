'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
    BookOpen, ChevronRight, Loader2, Search, Plus, Check,
    X, Sparkles, RefreshCw
} from 'lucide-react'
import { useUserSubjects } from '@/lib/supabase/subjects'
import { useUserProfile } from '@/lib/supabase/hooks'
import { useAuth } from '@/contexts/AuthContext'

interface FetchedSubject {
    id: string
    name: string
    code?: string
    description: string
}

export default function SelectSubjectsPage() {
    const router = useRouter()
    const { user } = useAuth()
    const { profile, loading: profileLoading } = useUserProfile()
    const { subjects: existingSubjects, addSubject, loading: subjectsLoading } = useUserSubjects()

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [availableSubjects, setAvailableSubjects] = useState<FetchedSubject[]>([])
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [customSubject, setCustomSubject] = useState({ name: '', description: '' })
    const [error, setError] = useState('')

    useEffect(() => {
        if (!profileLoading && !user) {
            router.push('/login')
            return
        }
    }, [user, profileLoading, router])

    // Redirect to onboarding if profile is incomplete
    useEffect(() => {
        if (!profileLoading && user && profile !== undefined) {
            if (!profile || !profile.board || !profile.class_grade) {
                router.push('/onboarding')
                return
            }
        }
    }, [profile, profileLoading, user, router])

    useEffect(() => {
        // Redirect to dashboard if user already has subjects
        if (!subjectsLoading && existingSubjects.length > 0) {
            router.push('/dashboard')
            return
        }
    }, [existingSubjects, subjectsLoading, router])

    useEffect(() => {
        if (profile && !profileLoading && profile.board && profile.class_grade) {
            fetchSubjects()
        }
    }, [profile, profileLoading])

    const fetchSubjects = async () => {
        if (!profile) return

        setIsLoading(true)
        setError('')

        try {
            const response = await fetch('/api/curriculum', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    country: profile.country,
                    educationLevel: profile.education_level,
                    board: profile.board,
                    classGrade: profile.class_grade,
                    courseProgram: profile.course_program,  // For college students
                    searchType: 'subjects'
                })
            })

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`)
            }

            const text = await response.text()
            if (!text) {
                throw new Error('Empty response from server')
            }

            let result
            try {
                result = JSON.parse(text)
            } catch (parseError) {
                console.error('JSON parse error:', text)
                throw new Error('Invalid response format')
            }

            if (result.success) {
                setAvailableSubjects(result.data || [])
                if (result.isFallback || result.message) {
                    setError(result.message || 'Using cached curriculum data.')
                }
            } else {
                throw new Error(result.error || 'Unknown error')
            }
        } catch (err: any) {
            console.error('Error fetching subjects:', err)
            if (err.message.includes('429')) {
                setError('High traffic. Please wait 30s and try again.')
            } else {
                setError('Failed to fetch subjects. Please try again.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    const toggleSubject = (subjectId: string) => {
        setSelectedSubjects(prev =>
            prev.includes(subjectId)
                ? prev.filter(id => id !== subjectId)
                : [...prev, subjectId]
        )
    }

    const addCustomSubject = () => {
        if (!customSubject.name.trim()) return

        const newSubject: FetchedSubject = {
            id: `custom_${Date.now()}`,
            name: customSubject.name.trim(),
            description: customSubject.description.trim() || 'Custom subject'
        }

        setAvailableSubjects(prev => [...prev, newSubject])
        setSelectedSubjects(prev => [...prev, newSubject.id])
        setCustomSubject({ name: '', description: '' })
        setShowAddModal(false)
    }

    const handleContinue = async () => {
        if (selectedSubjects.length === 0) return

        setIsSaving(true)

        try {
            // Add each selected subject to Supabase
            for (const subjectId of selectedSubjects) {
                const subjectInfo = availableSubjects.find(s => s.id === subjectId)
                if (!subjectInfo) continue

                await addSubject({
                    name: subjectInfo.name,
                    code: subjectInfo.code,
                    description: subjectInfo.description,
                    is_custom: subjectId.startsWith('custom_')
                })
            }

            router.push('/dashboard')
        } catch (err) {
            console.error('Error saving subjects:', err)
            setError('Failed to save subjects. Please try again.')
            setIsSaving(false)
        }
    }

    const filteredSubjects = availableSubjects.filter(s =>
        (s.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (s.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )

    if (profileLoading || isLoading) {
        return (
            <div className="min-h-screen gradient-bg flex items-center justify-center">
                <div className="text-center">
                    <Sparkles className="w-16 h-16 text-primary mx-auto loading-pulse" />
                    <h2 className="text-xl font-bold mt-4">Searching Curriculum...</h2>
                    <p className="text-muted mt-2">
                        Finding subjects for {profile?.board} {profile?.class_grade}
                    </p>
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <main className="min-h-screen gradient-bg">
            {/* Header */}
            <header className="border-b border-card-border">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Select Your Subjects</h1>
                            <p className="text-sm text-muted">
                                {profile?.board} • {profile?.class_grade}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 rounded-xl bg-warning/10 border border-warning/30 flex items-center gap-3"
                    >
                        <RefreshCw className="w-5 h-5 text-warning" />
                        <span className="text-sm">{error}</span>
                        <button
                            onClick={fetchSubjects}
                            className="ml-auto text-sm text-primary hover:underline"
                        >
                            Retry
                        </button>
                    </motion.div>
                )}

                {/* Search & Add */}
                <div className="flex gap-3 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                        <input
                            type="text"
                            className="input pl-12"
                            placeholder="Search subjects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Subject
                    </button>
                </div>

                {/* Selection Info */}
                <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/30">
                    <p className="text-sm">
                        <span className="font-medium text-primary">{selectedSubjects.length}</span> subjects selected
                        {selectedSubjects.length === 0 && ' — Select at least one subject to continue'}
                    </p>
                </div>

                {/* Subject Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {filteredSubjects.map((subject, index) => {
                        const isSelected = selectedSubjects.includes(subject.id)

                        return (
                            <motion.button
                                key={subject.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: Math.min(index * 0.03, 0.3),
                                    duration: 0.2,
                                    ease: "easeOut"
                                }}
                                onClick={() => toggleSubject(subject.id)}
                                className={`
                  p-4 rounded-xl border-2 text-left transition-all relative
                  ${isSelected
                                        ? 'border-primary bg-primary/10'
                                        : 'border-card-border hover:border-muted bg-card-bg'}
                `}
                            >
                                {isSelected && (
                                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <h3 className="font-bold mb-1 pr-8">{subject.name}</h3>
                                {subject.code && (
                                    <p className="text-xs text-muted mb-2">Code: {subject.code}</p>
                                )}
                                <p className="text-sm text-muted line-clamp-2">{subject.description}</p>
                            </motion.button>
                        )
                    })}
                </div>

                {/* Continue Button */}
                <div className="flex justify-end">
                    <button
                        onClick={handleContinue}
                        disabled={selectedSubjects.length === 0 || isSaving}
                        className="btn-primary flex items-center gap-2 px-8"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 loading-spin" />
                                Setting Up...
                            </>
                        ) : (
                            <>
                                Continue to Dashboard
                                <ChevronRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Add Subject Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md card"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Add Custom Subject</h3>
                            <button
                                onClick={() => setShowAddModal(false)}
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
                                    placeholder="e.g., Advanced Mathematics"
                                    value={customSubject.name}
                                    onChange={(e) => setCustomSubject(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Brief description of the subject"
                                    value={customSubject.description}
                                    onChange={(e) => setCustomSubject(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="btn-secondary flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addCustomSubject}
                                disabled={!customSubject.name.trim()}
                                className="btn-primary flex-1"
                            >
                                Add Subject
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </main>
    )
}
