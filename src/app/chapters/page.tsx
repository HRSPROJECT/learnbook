'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    ChevronLeft, BookOpen, Clock, Target, ChevronRight,
    AlertCircle, CheckCircle2, Loader2, ExternalLink, Play
} from 'lucide-react'

interface Chapter {
    id: string
    name: string
    description: string
    concepts: string[]
    estimatedHours: number
    importance: 'high' | 'medium' | 'low'
    progress: number
    prerequisites: string[]
}

export default function ChaptersPage() {
    const router = useRouter()
    const [chapters, setChapters] = useState<Chapter[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const savedProfile = localStorage.getItem('learnbook_profile')
        if (!savedProfile) {
            router.push('/onboarding')
            return
        }

        // Mock chapters data
        const mockChapters: Chapter[] = [
            {
                id: 'ch1',
                name: 'Calculus - Differentiation',
                description: 'Master the fundamentals of differential calculus including limits, derivatives, and their real-world applications.',
                concepts: ['Limits', 'Derivatives', 'Chain Rule', 'Applications of Derivatives', 'Maxima & Minima'],
                estimatedHours: 15,
                importance: 'high',
                progress: 35,
                prerequisites: []
            },
            {
                id: 'ch2',
                name: 'Calculus - Integration',
                description: 'Learn integral calculus including various integration techniques and their applications in finding areas and volumes.',
                concepts: ['Indefinite Integrals', 'Definite Integrals', 'Integration by Parts', 'Substitution', 'Applications'],
                estimatedHours: 15,
                importance: 'high',
                progress: 0,
                prerequisites: ['ch1']
            },
            {
                id: 'ch3',
                name: 'Vectors and 3D Geometry',
                description: 'Explore vector algebra and three-dimensional coordinate geometry, essential for physics and engineering.',
                concepts: ['Vector Operations', 'Dot Product', 'Cross Product', '3D Lines', '3D Planes'],
                estimatedHours: 12,
                importance: 'medium',
                progress: 0,
                prerequisites: []
            },
            {
                id: 'ch4',
                name: 'Probability',
                description: 'Master probability theory and statistical concepts that form the foundation of data science and machine learning.',
                concepts: ['Basic Probability', 'Conditional Probability', 'Bayes Theorem', 'Random Variables', 'Distributions'],
                estimatedHours: 10,
                importance: 'high',
                progress: 0,
                prerequisites: []
            }
        ]

        setChapters(mockChapters)
        setIsLoading(false)
    }, [router])

    if (isLoading) {
        return (
            <div className="min-h-screen gradient-bg flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary loading-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen gradient-bg">
            {/* Header */}
            <header className="border-b border-card-border">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 hover:bg-secondary rounded-lg transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold">Chapter Intelligence</h1>
                        <p className="text-sm text-muted">Understand your syllabus deeply</p>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8">
                <div className="grid gap-6">
                    {chapters.map((chapter, index) => (
                        <motion.div
                            key={chapter.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link href={`/chapter/${chapter.id}`}>
                                <div className="card group">
                                    <div className="flex items-start gap-4">
                                        {/* Icon */}
                                        <div className={`
                      w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0
                      ${chapter.progress > 0
                                                ? 'bg-primary/20'
                                                : 'bg-secondary'}
                      group-hover:scale-110 transition-transform
                    `}>
                                            <BookOpen className={`w-7 h-7 ${chapter.progress > 0 ? 'text-primary' : 'text-muted'}`} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-lg">{chapter.name}</h3>
                                                <span className={`badge-${chapter.importance}`}>
                                                    {chapter.importance}
                                                </span>
                                            </div>

                                            <p className="text-sm text-muted mb-3 line-clamp-2">
                                                {chapter.description}
                                            </p>

                                            {/* Meta Info */}
                                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                                <span className="flex items-center gap-1 text-muted">
                                                    <Clock className="w-4 h-4" />
                                                    {chapter.estimatedHours} hours
                                                </span>
                                                <span className="flex items-center gap-1 text-muted">
                                                    <Target className="w-4 h-4" />
                                                    {chapter.concepts.length} concepts
                                                </span>
                                                {chapter.prerequisites.length > 0 && (
                                                    <span className="flex items-center gap-1 text-warning">
                                                        <AlertCircle className="w-4 h-4" />
                                                        Requires: {chapters.find(c => c.id === chapter.prerequisites[0])?.name.split(' - ')[0]}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Progress Bar */}
                                            {chapter.progress > 0 && (
                                                <div className="mt-3">
                                                    <div className="flex items-center justify-between text-sm mb-1">
                                                        <span className="text-muted">Progress</span>
                                                        <span className="font-medium text-primary">{chapter.progress}%</span>
                                                    </div>
                                                    <div className="progress-bar">
                                                        <div
                                                            className="progress-fill"
                                                            style={{ width: `${chapter.progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Concepts Preview */}
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {chapter.concepts.slice(0, 4).map(concept => (
                                                    <span key={concept} className="chip text-xs">
                                                        {concept}
                                                    </span>
                                                ))}
                                                {chapter.concepts.length > 4 && (
                                                    <span className="chip text-xs">
                                                        +{chapter.concepts.length - 4} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Arrow */}
                                        <ChevronRight className="w-5 h-5 text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    )
}
