'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    CheckCircle2, Circle, Plus, Trash2, ChevronRight,
    ChevronLeft, Calendar, Clock, BookOpen, ListTodo
} from 'lucide-react'
import { useLocalTasks, StudyTask } from '@/lib/supabase/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { createCalendarEvent, convertTodoToEvent } from '@/lib/google-calendar'
import { getValidGoogleToken, hasGoogleTokens } from '@/lib/google-tokens'

interface TodoSidebarProps {
    isOpen?: boolean
    onToggle?: () => void
}

export default function TodoSidebar({ isOpen = true, onToggle }: TodoSidebarProps) {
    const { session, connectGoogle } = useAuth()
    const { tasks, addTask, toggleTask, deleteTask } = useLocalTasks()
    const [newTaskText, setNewTaskText] = useState('')
    const [showAddForm, setShowAddForm] = useState(false)
    const [googleToken, setGoogleToken] = useState<string | null>(null)

    // Check if user has Google identity linked (from session) - this is immediate
    const hasGoogleIdentity = !!session?.user?.identities?.some(
        (identity) => identity.provider === 'google'
    )

    // Also check for provider_token (available right after OAuth)
    const hasProviderToken = !!session?.provider_token

    // Combined check: either has Google identity OR has stored tokens
    const [hasStoredTokens, setHasStoredTokens] = useState(false)
    const hasGoogleAccess = hasGoogleIdentity || hasProviderToken || hasStoredTokens

    // Check for stored Google tokens on mount (for sync functionality)
    useEffect(() => {
        const checkGoogleTokens = async () => {
            try {
                const hasTokens = await hasGoogleTokens()
                setHasStoredTokens(hasTokens)
                if (hasTokens) {
                    const token = await getValidGoogleToken()
                    setGoogleToken(token)
                }
            } catch (error) {
                console.log('Token check failed, using session identity')
            }
        }
        checkGoogleTokens()
    }, [session])

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    })

    const todayTasks = tasks.filter(t =>
        t.task_date === new Date().toISOString().split('T')[0]
    )
    const completedCount = todayTasks.filter(t => t.completed).length
    const progress = todayTasks.length > 0 ? (completedCount / todayTasks.length) * 100 : 0

    // Auto-sync to calendar using stored tokens
    const syncToCalendar = async (task: StudyTask, action: 'add' | 'update' | 'delete') => {
        // Try to get a valid token (either from state or refresh)
        let token = googleToken
        if (!token) {
            token = await getValidGoogleToken()
            if (token) setGoogleToken(token)
        }
        if (!token) return

        try {
            if (action === 'add' || action === 'update') {
                const event = convertTodoToEvent(task)
                await createCalendarEvent(token, event)
            }
            // Note: Calendar delete would need event ID tracking
        } catch (error) {
            console.error('Auto-sync failed:', error)
            // If token error, clear cached token
            if (String(error).includes('TOKEN_EXPIRED')) {
                setGoogleToken(null)
            }
        }
    }

    const handleAddTask = async () => {
        if (newTaskText.trim()) {
            const newTask = addTask(newTaskText.trim())
            setNewTaskText('')
            setShowAddForm(false)

            // Auto-sync to calendar
            if (newTask && hasGoogleAccess) {
                try {
                    await syncToCalendar(newTask, 'add')
                    console.log('✅ Task synced to calendar')
                } catch (error) {
                    console.error('Failed to sync:', error)
                }
            }
        }
    }

    const handleToggleTask = async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId)
        toggleTask(taskId)

        // Auto-sync status update
        if (task) {
            await syncToCalendar({ ...task, completed: !task.completed }, 'update')
        }
    }

    const handleDeleteTask = async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId)
        deleteTask(taskId)

        // Auto-sync deletion
        if (task) {
            await syncToCalendar(task, 'delete')
        }
    }

    return (
        <>
            {/* Toggle Button when closed */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onClick={onToggle}
                        className="fixed right-0 top-1/2 -translate-y-1/2 bg-card-bg border border-card-border border-r-0 rounded-l-xl p-3 z-30 hover:bg-secondary transition-colors"
                    >
                        <ListTodo className="w-5 h-5" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <AnimatePresence>
                {isOpen && (
                    <motion.aside
                        initial={{ x: 320 }}
                        animate={{ x: 0 }}
                        exit={{ x: 320 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-80 z-40 flex flex-col shadow-2xl bg-surface border-l border-card-border"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-card-border">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <ListTodo className="w-5 h-5 text-primary" />
                                    <h2 className="font-bold">Today's Tasks</h2>
                                    {hasGoogleAccess && (
                                        <span className="text-xs text-success">• Auto-synced</span>
                                    )}
                                </div>
                                <button
                                    onClick={onToggle}
                                    className="p-1.5 hover:bg-secondary rounded-lg"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-sm text-muted">{today}</p>

                            {/* Connect Google Banner */}
                            {!hasGoogleAccess && (
                                <div className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                                    <p className="text-xs text-muted mb-2">
                                        🔔 Connect Google to auto-sync tasks to Calendar & save to Drive
                                    </p>
                                    <button
                                        onClick={connectGoogle}
                                        className="btn-primary w-full text-xs py-1.5"
                                    >
                                        Connect Google Account
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Progress Bar */}
                        <div className="px-4 py-3 border-b border-card-border">
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-muted">{completedCount}/{todayTasks.length} completed</span>
                                <span className="text-primary">{Math.round(progress)}%</span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-primary to-accent"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>

                        {/* Tasks List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {todayTasks.length === 0 ? (
                                <div className="text-center py-8">
                                    <Calendar className="w-10 h-10 text-muted mx-auto mb-3" />
                                    <p className="text-sm text-muted">No tasks for today</p>
                                    <p className="text-xs text-muted mt-1">Add one to get started!</p>
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {todayTasks.map(task => (
                                        <motion.div
                                            key={task.id}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className={`group p-3 rounded-xl border transition-all ${task.completed
                                                ? 'bg-success/10 border-success/30'
                                                : 'bg-secondary border-transparent hover:border-primary/30'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <button
                                                    onClick={() => handleToggleTask(task.id)}
                                                    className="mt-0.5 flex-shrink-0"
                                                >
                                                    {task.completed ? (
                                                        <CheckCircle2 className="w-5 h-5 text-success" />
                                                    ) : (
                                                        <Circle className="w-5 h-5 text-muted hover:text-primary transition-colors" />
                                                    )}
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm ${task.completed ? 'line-through text-muted' : ''}`}>
                                                        {task.task_description}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {task.task_type && (
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${task.task_type === 'study' ? 'bg-primary/20 text-primary' :
                                                                task.task_type === 'revision' ? 'bg-accent/20 text-accent' :
                                                                    'bg-warning/20 text-warning'
                                                                }`}>
                                                                {task.task_type}
                                                            </span>
                                                        )}
                                                        {task.duration_minutes && (
                                                            <span className="text-xs text-muted flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {task.duration_minutes}m
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-error/20 rounded transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4 text-error" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>

                        {/* Add Task Form */}
                        <div className="p-4 border-t border-card-border">
                            <AnimatePresence mode="wait">
                                {showAddForm ? (
                                    <motion.div
                                        key="form"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-2"
                                    >
                                        <input
                                            type="text"
                                            className="input w-full text-sm"
                                            placeholder="What do you need to study?"
                                            value={newTaskText}
                                            onChange={(e) => setNewTaskText(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                                            autoFocus
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setShowAddForm(false)}
                                                className="btn-secondary flex-1 text-sm py-2"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleAddTask}
                                                className="btn-primary flex-1 text-sm py-2"
                                            >
                                                Add Task
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.button
                                        key="button"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setShowAddForm(true)}
                                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-card-border hover:border-primary hover:bg-primary/5 transition-all text-sm text-muted hover:text-primary"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Task
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Overlay when open on mobile */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onToggle}
                        className="fixed inset-0 bg-black/30 z-30 lg:hidden"
                    />
                )}
            </AnimatePresence>
        </>
    )
}
