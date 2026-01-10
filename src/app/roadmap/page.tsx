'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    BookOpen, Target, Clock, ChevronLeft, Calendar, CheckCircle2,
    Circle, Flag, AlertCircle, Loader2
} from 'lucide-react'

interface RoadmapItem {
    chapterId: string
    chapterName: string
    startDate: string
    endDate: string
    isMilestone: boolean
    isRevision: boolean
    priority: 'high' | 'medium' | 'low'
    status: 'pending' | 'in_progress' | 'completed'
    description?: string
    concepts?: string[]
}

export default function RoadmapPage() {
    const router = useRouter()
    const [roadmap, setRoadmap] = useState<RoadmapItem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const savedProfile = localStorage.getItem('learnbook_profile')
        if (!savedProfile) {
            router.push('/onboarding')
            return
        }

        // Generate mock roadmap
        const today = new Date()
        const mockRoadmap: RoadmapItem[] = [
            {
                chapterId: 'ch1',
                chapterName: 'Calculus - Differentiation',
                startDate: today.toISOString().split('T')[0],
                endDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                isMilestone: false,
                isRevision: false,
                priority: 'high',
                status: 'in_progress',
                description: 'Master the fundamentals of differential calculus including limits, derivatives, and their applications.',
                concepts: ['Limits', 'Derivatives', 'Chain Rule', 'Applications of Derivatives']
            },
            {
                chapterId: 'ch2',
                chapterName: 'Calculus - Integration',
                startDate: new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                isMilestone: false,
                isRevision: false,
                priority: 'high',
                status: 'pending',
                description: 'Learn integral calculus including indefinite and definite integrals, and various integration techniques.',
                concepts: ['Indefinite Integrals', 'Definite Integrals', 'Integration by Parts', 'Substitution']
            },
            {
                chapterId: 'rev1',
                chapterName: 'Calculus Revision',
                startDate: new Date(today.getTime() + 16 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: new Date(today.getTime() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                isMilestone: true,
                isRevision: true,
                priority: 'medium',
                status: 'pending',
                description: 'Review and consolidate calculus concepts before moving to the next topic.'
            },
            {
                chapterId: 'ch3',
                chapterName: 'Vectors and 3D Geometry',
                startDate: new Date(today.getTime() + 19 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: new Date(today.getTime() + 26 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                isMilestone: false,
                isRevision: false,
                priority: 'medium',
                status: 'pending',
                description: 'Explore vector algebra and three-dimensional coordinate geometry.',
                concepts: ['Vector Operations', 'Dot Product', 'Cross Product', '3D Lines and Planes']
            },
            {
                chapterId: 'ch4',
                chapterName: 'Probability',
                startDate: new Date(today.getTime() + 27 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: new Date(today.getTime() + 34 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                isMilestone: true,
                isRevision: false,
                priority: 'high',
                status: 'pending',
                description: 'Master probability theory and its applications.',
                concepts: ['Basic Probability', 'Conditional Probability', 'Bayes Theorem', 'Distributions']
            }
        ]

        setRoadmap(mockRoadmap)
        setIsLoading(false)
    }, [router])

    const updateStatus = (chapterId: string, newStatus: 'pending' | 'in_progress' | 'completed') => {
        setRoadmap(prev => prev.map(item =>
            item.chapterId === chapterId ? { ...item, status: newStatus } : item
        ))
    }

    const completedCount = roadmap.filter(r => r.status === 'completed').length
    const progressPercentage = roadmap.length > 0 ? (completedCount / roadmap.length) * 100 : 0

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
                        <h1 className="text-xl font-bold">Learning Roadmap</h1>
                        <p className="text-sm text-muted">Your personalized path to mastery</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        <span className="font-medium">{completedCount}/{roadmap.length}</span>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8">
                {/* Progress Overview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card mb-8"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold">Overall Progress</h2>
                            <p className="text-sm text-muted">
                                {completedCount} of {roadmap.length} milestones completed
                            </p>
                        </div>
                        <span className="text-3xl font-bold text-primary">{Math.round(progressPercentage)}%</span>
                    </div>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </motion.div>

                {/* Timeline */}
                <div className="space-y-6">
                    {roadmap.map((item, index) => (
                        <motion.div
                            key={item.chapterId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex gap-6"
                        >
                            {/* Timeline Node */}
                            <div className="flex flex-col items-center">
                                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  ${item.status === 'completed'
                                        ? 'bg-success'
                                        : item.status === 'in_progress'
                                            ? 'bg-primary glow'
                                            : 'bg-secondary border-2 border-card-border'}
                `}>
                                    {item.status === 'completed' ? (
                                        <CheckCircle2 className="w-6 h-6 text-white" />
                                    ) : item.isMilestone ? (
                                        <Flag className="w-5 h-5 text-warning" />
                                    ) : item.isRevision ? (
                                        <AlertCircle className="w-5 h-5 text-accent" />
                                    ) : (
                                        <BookOpen className={`w-5 h-5 ${item.status === 'in_progress' ? 'text-white' : 'text-muted'}`} />
                                    )}
                                </div>
                                {index < roadmap.length - 1 && (
                                    <div className={`w-0.5 flex-1 min-h-[40px] mt-2 ${item.status === 'completed' ? 'bg-success' : 'bg-card-border'
                                        }`} />
                                )}
                            </div>

                            {/* Content Card */}
                            <div className={`flex-1 card ${item.status === 'in_progress' ? 'border-primary' : ''}`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-lg">{item.chapterName}</h3>
                                            <span className={`badge-${item.priority}`}>{item.priority}</span>
                                            {item.isRevision && (
                                                <span className="px-2 py-0.5 rounded-full text-xs bg-accent/20 text-accent">
                                                    Revision
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted">
                                            <Calendar className="w-4 h-4" />
                                            {formatDateRange(item.startDate, item.endDate)}
                                        </div>
                                    </div>

                                    {/* Status Selector */}
                                    <select
                                        value={item.status}
                                        onChange={(e) => updateStatus(item.chapterId, e.target.value as any)}
                                        className={`
                      px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer border
                      ${item.status === 'completed'
                                                ? 'bg-success/20 text-success border-success/30'
                                                : item.status === 'in_progress'
                                                    ? 'bg-primary/20 text-primary border-primary/30'
                                                    : 'bg-secondary text-muted border-card-border'}
                    `}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>

                                {item.description && (
                                    <p className="text-sm text-muted mb-3">{item.description}</p>
                                )}

                                {item.concepts && item.concepts.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {item.concepts.map(concept => (
                                            <span key={concept} className="chip text-xs">
                                                {concept}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {item.status === 'in_progress' && (
                                    <div className="mt-4 pt-4 border-t border-card-border flex gap-3">
                                        <Link
                                            href={`/chapter/${item.chapterId}`}
                                            className="btn-primary text-sm py-2 px-4"
                                        >
                                            Continue Learning
                                        </Link>
                                        <Link
                                            href="/timetable"
                                            className="btn-secondary text-sm py-2 px-4"
                                        >
                                            View Today's Tasks
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    )
}

function formatDateRange(start: string, end: string) {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`
}
