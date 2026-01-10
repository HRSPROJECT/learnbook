'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    ChevronLeft, ChevronRight, Clock, CheckCircle2, Circle,
    Play, SkipForward, Calendar, Loader2, BookOpen, RotateCcw, PenTool
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createCalendarEvent, convertTaskToEvent } from '@/lib/google-calendar'

interface Task {
    id: string
    chapterId: string
    chapterName: string
    taskType: 'study' | 'revision' | 'practice'
    durationMinutes: number
    timeSlot: string
    completed: boolean
    skipped: boolean
    description?: string
}

interface DaySchedule {
    date: string
    dayName: string
    isToday: boolean
    tasks: Task[]
}

export default function TimetablePage() {
    const router = useRouter()
    const { session } = useAuth()
    const [schedule, setSchedule] = useState<DaySchedule[]>([])
    const [selectedDay, setSelectedDay] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [isSyncing, setIsSyncing] = useState(false)

    // Sync to Calendar Function
    const handleSyncToCalendar = async () => {
        if (!session?.provider_token) {
            alert('Please sign in with Google to sync to your calendar. You may need to sign out and sign in again.')
            return
        }

        if (!confirm('Add these study sessions to your Google Calendar?')) return

        setIsSyncing(true)
        let successCount = 0
        const currentTasks = schedule[selectedDay].tasks
        const date = schedule[selectedDay].date

        try {
            for (const task of currentTasks) {
                if (task.completed || task.skipped) continue

                try {
                    const event = convertTaskToEvent(task, date)
                    await createCalendarEvent(session.provider_token, event)
                    successCount++
                } catch (err) {
                    console.error('Failed to sync task:', task.id, err)
                }
            }
            alert(`Successfully added ${successCount} study sessions to your Google Calendar!`)
        } catch (error) {
            console.error('Sync error:', error)
            alert('Failed to sync to calendar. Check your permissions.')
        } finally {
            setIsSyncing(false)
        }
    }

    useEffect(() => {
        const savedProfile = localStorage.getItem('learnbook_profile')
        if (!savedProfile) {
            router.push('/onboarding')
            return
        }

        generateWeekSchedule()
        setIsLoading(false)
    }, [router])

    const generateWeekSchedule = () => {
        const today = new Date()
        const weekSchedule: DaySchedule[] = []

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

        for (let i = 0; i < 7; i++) {
            const date = new Date(today)
            date.setDate(date.getDate() + i)

            const tasks: Task[] = [
                {
                    id: `${i}-1`,
                    chapterId: 'ch1',
                    chapterName: 'Calculus - Differentiation',
                    taskType: 'study',
                    durationMinutes: 45,
                    timeSlot: '9:00 AM',
                    completed: i === 0 && Math.random() > 0.5,
                    skipped: false,
                    description: 'Learn the concept of limits and introduction to derivatives'
                },
                {
                    id: `${i}-2`,
                    chapterId: 'ch1',
                    chapterName: 'Calculus - Differentiation',
                    taskType: 'practice',
                    durationMinutes: 30,
                    timeSlot: '10:00 AM',
                    completed: false,
                    skipped: false,
                    description: 'Solve practice problems on basic derivatives'
                },
                {
                    id: `${i}-3`,
                    chapterId: 'ch1',
                    chapterName: 'Calculus - Differentiation',
                    taskType: 'revision',
                    durationMinutes: 20,
                    timeSlot: '4:00 PM',
                    completed: false,
                    skipped: false,
                    description: 'Quick review of formulas and key concepts'
                }
            ]

            weekSchedule.push({
                date: date.toISOString().split('T')[0],
                dayName: dayNames[date.getDay()],
                isToday: i === 0,
                tasks
            })
        }

        setSchedule(weekSchedule)
    }

    const toggleTaskComplete = (taskId: string) => {
        setSchedule(prev => prev.map(day => ({
            ...day,
            tasks: day.tasks.map(task =>
                task.id === taskId ? { ...task, completed: !task.completed, skipped: false } : task
            )
        })))
    }

    const skipTask = (taskId: string) => {
        setSchedule(prev => prev.map(day => ({
            ...day,
            tasks: day.tasks.map(task =>
                task.id === taskId ? { ...task, skipped: true, completed: false } : task
            )
        })))
    }

    const getTaskIcon = (type: string) => {
        switch (type) {
            case 'study': return BookOpen
            case 'practice': return PenTool
            case 'revision': return RotateCcw
            default: return BookOpen
        }
    }

    const getTaskColor = (type: string) => {
        switch (type) {
            case 'study': return 'primary'
            case 'practice': return 'accent'
            case 'revision': return 'success'
            default: return 'primary'
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen gradient-bg flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary loading-spin" />
            </div>
        )
    }

    const currentDay = schedule[selectedDay]
    const completedTasks = currentDay?.tasks.filter(t => t.completed).length || 0
    const totalTasks = currentDay?.tasks.length || 0
    const totalMinutes = currentDay?.tasks.reduce((acc, t) => acc + t.durationMinutes, 0) || 0

    return (
        <div className="min-h-screen gradient-bg">
            {/* Header */}
            <header className="border-b border-card-border">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 hover:bg-secondary rounded-lg transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold">Daily Timetable</h1>
                        <p className="text-sm text-muted">Your optimized study schedule</p>
                    </div>

                    <button
                        onClick={handleSyncToCalendar}
                        disabled={isSyncing}
                        className="btn-secondary flex items-center gap-2 text-sm py-2 px-3"
                    >
                        {isSyncing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Calendar className="w-4 h-4" />
                        )}
                        Sync to Calendar
                    </button>

                    <div className="flex items-center gap-2 border-l border-card-border pl-4">
                        <Clock className="w-5 h-5 text-primary" />
                        <span className="font-medium">{totalMinutes} min</span>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8">
                {/* Week Selector */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between mb-4">
                        <button
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            onClick={() => setSelectedDay(Math.max(0, selectedDay - 1))}
                            disabled={selectedDay === 0}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-lg font-bold">
                            {currentDay?.isToday ? 'Today' : currentDay?.dayName}, {formatDate(currentDay?.date)}
                        </h2>
                        <button
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            onClick={() => setSelectedDay(Math.min(6, selectedDay + 1))}
                            disabled={selectedDay === 6}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Day Pills */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {schedule.map((day, index) => (
                            <button
                                key={day.date}
                                onClick={() => setSelectedDay(index)}
                                className={`
                  flex-shrink-0 px-4 py-3 rounded-xl transition-all text-center min-w-[80px]
                  ${selectedDay === index
                                        ? 'bg-primary text-white'
                                        : 'bg-secondary hover:bg-card-border'}
                `}
                            >
                                <p className="text-xs font-medium mb-1">
                                    {day.isToday ? 'Today' : day.dayName.slice(0, 3)}
                                </p>
                                <p className="text-sm">
                                    {new Date(day.date).getDate()}
                                </p>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Progress Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card mb-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted mb-1">Day Progress</p>
                            <p className="text-2xl font-bold">{completedTasks}/{totalTasks} tasks</p>
                        </div>
                        <div className="w-20 h-20 relative">
                            <svg className="w-20 h-20 transform -rotate-90">
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="36"
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    fill="none"
                                    className="text-secondary"
                                />
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="36"
                                    stroke="url(#gradient)"
                                    strokeWidth="6"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(completedTasks / totalTasks) * 226} 226`}
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#6366f1" />
                                        <stop offset="100%" stopColor="#22d3ee" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                                {Math.round((completedTasks / totalTasks) * 100)}%
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Task List */}
                <div className="space-y-4">
                    {currentDay?.tasks.map((task, index) => {
                        const TaskIcon = getTaskIcon(task.taskType)
                        const color = getTaskColor(task.taskType)

                        return (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + index * 0.1 }}
                                className={`card relative overflow-hidden ${task.completed ? 'opacity-60' : task.skipped ? 'opacity-40' : ''
                                    }`}
                            >
                                {/* Color accent bar */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${color}`} />

                                <div className="flex items-start gap-4 pl-4">
                                    {/* Status Toggle */}
                                    <button
                                        onClick={() => toggleTaskComplete(task.id)}
                                        className="flex-shrink-0 mt-1"
                                    >
                                        {task.completed ? (
                                            <CheckCircle2 className="w-6 h-6 text-success" />
                                        ) : (
                                            <Circle className="w-6 h-6 text-muted hover:text-primary transition-colors" />
                                        )}
                                    </button>

                                    {/* Task Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-7 h-7 rounded-lg bg-${color}/20 flex items-center justify-center`}>
                                                <TaskIcon className={`w-4 h-4 text-${color}`} />
                                            </div>
                                            <span className={`capitalize text-sm font-medium text-${color}`}>
                                                {task.taskType}
                                            </span>
                                            <span className="text-muted">•</span>
                                            <span className="text-sm text-muted">{task.durationMinutes} min</span>
                                        </div>

                                        <h3 className={`font-medium mb-1 ${task.completed ? 'line-through' : ''}`}>
                                            {task.chapterName}
                                        </h3>

                                        {task.description && (
                                            <p className="text-sm text-muted">{task.description}</p>
                                        )}

                                        {task.skipped && (
                                            <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-warning/20 text-warning">
                                                Skipped - Will be rescheduled
                                            </span>
                                        )}
                                    </div>

                                    {/* Time & Actions */}
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="text-sm font-medium">{task.timeSlot}</span>

                                        {!task.completed && !task.skipped && (
                                            <div className="flex gap-2">
                                                <button
                                                    className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                                                    title="Start"
                                                >
                                                    <Play className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="p-2 rounded-lg bg-warning/20 text-warning hover:bg-warning/30 transition-colors"
                                                    onClick={() => skipTask(task.id)}
                                                    title="Skip"
                                                >
                                                    <SkipForward className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Empty State */}
                {currentDay?.tasks.length === 0 && (
                    <div className="text-center py-12">
                        <Calendar className="w-12 h-12 text-muted mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No tasks for this day</h3>
                        <p className="text-muted">Your AI will generate tasks based on your roadmap.</p>
                    </div>
                )}
            </main>
        </div>
    )
}

function formatDate(dateStr?: string) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
