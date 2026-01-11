'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    CheckCircle2, Circle, Plus, Trash2, ChevronRight,
    ChevronLeft, Calendar, Clock, BookOpen, ListTodo, RefreshCw, Loader2
} from 'lucide-react'
import { useLocalTasks, StudyTask } from '@/lib/supabase/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { createCalendarEvent, convertTodoToEvent } from '@/lib/google-calendar'

interface TodoSidebarProps {
    isOpen?: boolean
    onToggle?: () => void
}

export default function TodoSidebar({ isOpen = true, onToggle }: TodoSidebarProps) {
    const { session } = useAuth()
    const { tasks, addTask, toggleTask, deleteTask } = useLocalTasks()
    const [newTaskText, setNewTaskText] = useState('')
    const [showAddForm, setShowAddForm] = useState(false)
    const [isSyncing, setIsSyncing] = useState(false)

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

    const handleAddTask = () => {
        if (newTaskText.trim()) {
            addTask(newTaskText.trim())
            setNewTaskText('')
            setShowAddForm(false)
        }
    }

    const handleSyncToCalendar = async () => {
        if (!session?.provider_token) {
            alert('Please sign in with Google to sync tasks.')
            return
        }

        if (todayTasks.length === 0) {
            alert('No tasks to sync for today.')
            return
        }

        if (!confirm(`Sync ${todayTasks.length} tasks to your "LearnBook Schedule" calendar?`)) return

        setIsSyncing(true)
        let count = 0
        try {
            for (const task of todayTasks) {
                // Skip if already completed (optional preference, but usually good)
                // if (task.completed) continue 

                // We don't have a way to check exact dupes yet without ID storage, 
                // but "LearnBook Schedule" is isolated so it's safer.
                try {
                    const event = convertTodoToEvent(task)
                    await createCalendarEvent(session.provider_token, event)
                    count++
                } catch (e) {
                    console.error(e)
                }
            }
            alert(`Synced ${count} tasks to Google Calendar!`)
        } catch (error) {
            console.error(error)
            alert('Failed to sync tasks.')
        } finally {
            setIsSyncing(false)
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
                        className="fixed right-0 top-0 h-full w-full sm:w-80 z-40 flex flex-col shadow-2xl bg-surface border-l border-card-border"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-card-border">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <ListTodo className="w-5 h-5 text-primary" />
                                    <h2 className="font-bold">Today's Tasks</h2>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={handleSyncToCalendar}
                                        disabled={isSyncing}
                                        className="p-1.5 hover:bg-secondary rounded-lg text-primary"
                                        title="Sync to Google Calendar"
                                    >
                                        {isSyncing ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="w-4 h-4" />
                                        )}
                                    </button>
                                    <button
                                        onClick={onToggle}
                                        className="p-1.5 hover:bg-secondary rounded-lg"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-muted">{today}</p>


                            {/* Progress Bar */}
                            <div className="mt-3">
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
                                                    onClick={() => toggleTask(task.id)}
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
                                                    onClick={() => deleteTask(task.id)}
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
