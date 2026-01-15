'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import {
    ChevronLeft, BookOpen, Clock, Target, ExternalLink, Play,
    Loader2, Youtube, FileText, Lightbulb, AlertTriangle, CheckCircle2,
    Brain, ChevronRight, Sparkles, RefreshCw, Save, Check, HardDrive, Maximize2, X, FileDown
} from 'lucide-react'
import { useSubjectChapters } from '@/lib/supabase/subjects'
import ChatBot from '@/components/ChatBot'
import { useAuth } from '@/contexts/AuthContext'
import { createGoogleDocInFolder } from '@/lib/google-drive'
import FormattedText, { MathFormula } from '@/components/FormattedText'

interface Video {
    title: string
    channel: string
    url: string
    thumbnail?: string
    duration?: string
    description?: string
}

interface Summary {
    overview: string
    keyPoints: string[]
    formulas?: { name: string; formula: string; usage: string }[]
    importantTerms?: { term: string; definition: string }[]
    commonMistakes?: string[]
    examTips?: string[]
    practiceQuestions?: { question: string; hint: string }[]
}

export default function ChapterDetailPage() {
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()
    const chapterId = params.id as string
    const subjectId = searchParams.get('subject')

    const { updateChapterProgress } = useSubjectChapters(subjectId || undefined)

    const [data, setData] = useState<any | null>(null)
    const [subject, setSubject] = useState<any | null>(null)
    const [chapter, setChapter] = useState<any | null>(null)
    const [videos, setVideos] = useState<Video[]>([])
    const [summary, setSummary] = useState<Summary | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [loadingVideos, setLoadingVideos] = useState(false)
    const [loadingSummary, setLoadingSummary] = useState(false)
    const [activeTab, setActiveTab] = useState<'overview' | 'videos' | 'notes'>('overview')
    const [showNotebookModal, setShowNotebookModal] = useState(false)
    const [copiedText, setCopiedText] = useState('')
    const [notesSaved, setNotesSaved] = useState(false)
    const { session } = useAuth()
    const [isCompleted, setIsCompleted] = useState(false)
    const [isSavingToDrive, setIsSavingToDrive] = useState(false)
    const [fullscreenVideo, setFullscreenVideo] = useState<Video | null>(null)
    const [isExportingPdf, setIsExportingPdf] = useState(false)

    // Export notes as PDF
    const handleExportPdf = async () => {
        if (!summary || !chapter) return

        setIsExportingPdf(true)
        try {
            // Create a styled HTML document for printing
            const printContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${chapter.name} - Study Notes</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
        }
        
        h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; color: #6366f1; }
        h2 { font-size: 20px; font-weight: 600; margin: 24px 0 12px; color: #1a1a1a; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
        h3 { font-size: 16px; font-weight: 600; margin: 16px 0 8px; color: #374151; }
        
        .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
        .date { color: #9ca3af; font-size: 12px; }
        
        p { margin: 8px 0; }
        
        .overview { background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
        
        ul, ol { margin: 8px 0; padding-left: 24px; }
        li { margin: 6px 0; }
        
        .key-point { display: flex; align-items: flex-start; gap: 8px; margin: 8px 0; }
        .key-point::before { content: "✓"; color: #22c55e; font-weight: bold; }
        
        .formula-box { 
            background: #f0fdf4; 
            border: 1px solid #bbf7d0; 
            padding: 12px 16px; 
            border-radius: 8px; 
            margin: 8px 0;
            font-family: 'Courier New', monospace;
        }
        .formula-name { font-weight: 600; color: #166534; }
        .formula-expr { font-size: 18px; margin: 8px 0; }
        .formula-usage { font-size: 13px; color: #6b7280; }
        
        .term-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .term-box { background: #f3f4f6; padding: 12px; border-radius: 8px; }
        .term-name { font-weight: 600; color: #1f2937; }
        .term-def { font-size: 13px; color: #4b5563; margin-top: 4px; }
        
        .tip-box { 
            background: #fefce8; 
            border-left: 4px solid #eab308; 
            padding: 12px 16px; 
            margin: 8px 0;
            border-radius: 0 8px 8px 0;
        }
        
        .mistake-box { 
            background: #fef2f2; 
            border-left: 4px solid #ef4444; 
            padding: 12px 16px; 
            margin: 8px 0;
            border-radius: 0 8px 8px 0;
        }

        .footer { 
            margin-top: 40px; 
            padding-top: 16px; 
            border-top: 1px solid #e5e7eb; 
            font-size: 12px; 
            color: #9ca3af; 
            text-align: center; 
        }

        @media print {
            body { padding: 20px; }
            h2 { page-break-after: avoid; }
            .formula-box, .term-box, .tip-box, .mistake-box { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <h1>${chapter.name}</h1>
    <p class="subtitle">${subject?.name || 'LearnBook'}</p>
    <p class="date">Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    
    <h2>📖 Overview</h2>
    <div class="overview">
        <p>${summary.overview}</p>
    </div>
    
    <h2>✅ Key Points</h2>
    ${summary.keyPoints?.map(point => `<div class="key-point">${point}</div>`).join('') || '<p>No key points</p>'}
    
    ${summary.formulas && summary.formulas.length > 0 ? `
    <h2>📐 Important Formulas</h2>
    ${summary.formulas.map(f => `
        <div class="formula-box">
            <div class="formula-name">${f.name}</div>
            <div class="formula-expr">${f.formula}</div>
            <div class="formula-usage">${f.usage}</div>
        </div>
    `).join('')}
    ` : ''}
    
    ${summary.importantTerms && summary.importantTerms.length > 0 ? `
    <h2>📚 Important Terms</h2>
    <div class="term-grid">
        ${summary.importantTerms.map(t => `
            <div class="term-box">
                <div class="term-name">${t.term}</div>
                <div class="term-def">${t.definition}</div>
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    ${summary.examTips && summary.examTips.length > 0 ? `
    <h2>💡 Exam Tips</h2>
    ${summary.examTips.map(tip => `<div class="tip-box">${tip}</div>`).join('')}
    ` : ''}
    
    ${summary.commonMistakes && summary.commonMistakes.length > 0 ? `
    <h2>⚠️ Common Mistakes to Avoid</h2>
    ${summary.commonMistakes.map(mistake => `<div class="mistake-box">${mistake}</div>`).join('')}
    ` : ''}
    
    <div class="footer">
        Generated by LearnBook AI • ${new Date().getFullYear()}
    </div>
</body>
</html>
            `.trim()

            // Open print dialog with styled content
            const printWindow = window.open('', '_blank', 'width=800,height=600')
            if (printWindow) {
                printWindow.document.write(printContent)
                printWindow.document.close()
                printWindow.focus()

                // Wait for fonts to load then print
                setTimeout(() => {
                    printWindow.print()
                    printWindow.close()
                }, 500)
            }
        } catch (error) {
            console.error('PDF export error:', error)
            alert('Failed to export PDF. Please try again.')
        } finally {
            setIsExportingPdf(false)
        }
    }

    // Save Summary to Google Drive
    const handleSaveToDrive = async () => {
        if (!summary || !chapter) return
        if (!session?.provider_token) {
            alert('Please sign in with Google to save to Drive. You may need to sign out and sign in again.')
            return
        }

        setIsSavingToDrive(true)
        try {
            const content = `
Chapter: ${chapter.name}
Subject: ${subject?.name || 'LearnBook'}
Date: ${new Date().toLocaleDateString()}

OVERVIEW
${summary.overview}

KEY POINTS
${summary.keyPoints.map(p => `- ${p}`).join('\n')}

IMPORTANT TERMS
${summary.importantTerms?.map(t => `- ${t.term}: ${t.definition}`).join('\n') || 'N/A'}

FORMULAS
${summary.formulas?.map(f => `- ${f.name}: ${f.formula}`).join('\n') || 'N/A'}
            `.trim()

            const result = await createGoogleDocInFolder(
                session.provider_token,
                `${subject?.name || 'Study'} - ${chapter.name}`,
                content
            )

            if (confirm('Notes saved to Google Drive! Open now?')) {
                window.open(result.webViewLink, '_blank')
            }
        } catch (error: any) {
            console.error('Drive save error:', error)
            alert(error.message || 'Failed to save to Drive. Check your permissions.')
        } finally {
            setIsSavingToDrive(false)
        }
    }

    useEffect(() => {
        const loadChapterData = async () => {
            if (!subjectId || !chapterId) {
                router.push('/dashboard')
                return
            }

            try {
                const { createClient } = await import('@/lib/supabase/client')
                const supabase = createClient()

                // Get subject
                const { data: subjectData } = await supabase
                    .from('user_subjects')
                    .select('*')
                    .eq('id', subjectId)
                    .single()

                if (!subjectData) {
                    router.push('/dashboard')
                    return
                }

                setSubject({
                    id: subjectData.id,
                    name: subjectData.name,
                    code: subjectData.code,
                    description: subjectData.description,
                    chapters: []
                } as any)

                // Get chapter
                const { data: chapterData } = await supabase
                    .from('subject_chapters')
                    .select('*')
                    .eq('id', chapterId)
                    .single()

                if (chapterData) {
                    setChapter({
                        id: chapterData.id,
                        subjectId: chapterData.subject_id,
                        name: chapterData.name,
                        chapterNumber: chapterData.chapter_number,
                        description: chapterData.description,
                        concepts: chapterData.concepts || [],
                        estimatedHours: chapterData.estimated_hours || 5,
                        progress: chapterData.progress || 0,
                        status: chapterData.status || 'not_started'
                    } as any)

                    // Set completion status from database
                    setIsCompleted(chapterData.status === 'completed')

                    // Load saved notes from database if they exist
                    if (chapterData.notes) {
                        setSummary(chapterData.notes as Summary)
                        setNotesSaved(true)
                    }
                }

                // Get user profile for API calls
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data: profileData } = await supabase
                        .from('user_profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single()

                    if (profileData) {
                        setData({
                            profile: {
                                country: profileData.country,
                                board: profileData.board,
                                classGrade: profileData.class_grade,
                                educationLevel: profileData.education_level
                            }
                        } as any)
                    }
                }
            } catch (err) {
                console.error('Error loading chapter:', err)
            } finally {
                setIsLoading(false)
            }
        }

        loadChapterData()
    }, [chapterId, subjectId, router])

    // Load videos
    const loadVideos = async () => {
        if (!subject || !chapter || !data?.profile) return

        setLoadingVideos(true)
        try {
            const response = await fetch('/api/youtube', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: subject.name,
                    chapter: chapter.name,
                    board: data.profile.board,
                    classGrade: data.profile.classGrade,
                    country: data.profile.country
                })
            })

            const result = await response.json()
            if (result.success && result.data) {
                setVideos(result.data)
            }
        } catch (error) {
            console.error('Error loading videos:', error)
        } finally {
            setLoadingVideos(false)
        }
    }

    // Load AI summary and save to Supabase
    const loadSummary = async () => {
        if (!subject || !chapter || !data?.profile) return

        setLoadingSummary(true)
        try {
            const response = await fetch('/api/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: subject.name,
                    chapter: chapter.name,
                    concepts: chapter.concepts,
                    board: data.profile.board,
                    classGrade: data.profile.classGrade
                })
            })

            const result = await response.json()
            if (result.success && result.data) {
                setSummary(result.data)

                // Save notes to Supabase
                try {
                    const { createClient } = await import('@/lib/supabase/client')
                    const supabase = createClient()

                    const notesWithTimestamp = {
                        ...result.data,
                        generated_at: new Date().toISOString()
                    }

                    await supabase
                        .from('subject_chapters')
                        .update({ notes: notesWithTimestamp })
                        .eq('id', chapterId)

                    setNotesSaved(true)
                    console.log('✅ Notes saved to Supabase')
                } catch (saveError) {
                    console.error('Failed to save notes to database:', saveError)
                }
            }
        } catch (error) {
            console.error('Error loading summary:', error)
        } finally {
            setLoadingSummary(false)
        }
    }

    // Save notes to Supabase (manual save button if needed)
    const saveNotes = async () => {
        if (!summary || !chapterId) return
        try {
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()

            const notesWithTimestamp = {
                ...summary,
                generated_at: new Date().toISOString()
            }

            await supabase
                .from('subject_chapters')
                .update({ notes: notesWithTimestamp })
                .eq('id', chapterId)

            setNotesSaved(true)
        } catch (error) {
            console.error('Failed to save notes:', error)
        }
    }

    // Mark chapter as complete
    const toggleComplete = async () => {
        if (!chapterId || !subjectId) return
        const newState = !isCompleted
        setIsCompleted(newState)

        // Update database
        await updateChapterProgress(chapterId, {
            status: newState ? 'completed' : 'not_started',
            progress: newState ? 100 : 0
        })
    }

    // Generate NotebookLM export data
    const generateNotebookLMData = () => {
        if (!chapter || !subject || !data?.profile) return

        // Create comprehensive search queries for NotebookLM's web search
        const searchQueries = [
            `${chapter.name} ${subject.name} ${data.profile.board} Class ${data.profile.classGrade}`,
            `${chapter.name} ${subject.name} notes PDF`,
            `${chapter.name} ${subject.name} lecture notes`,
            `${chapter.name} NCERT solutions`,
            `${chapter.name} important questions answers`,
        ]

        // Compile video URLs
        const videoUrls = videos
            .filter(v => v.url && !v.url.includes('search_query'))
            .map(v => v.url)

        // Create YouTube search if no direct videos
        const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${chapter.name} ${subject.name} ${data.profile.board} class ${data.profile.classGrade}`)}`

        // Compile all concepts
        const concepts = chapter.concepts?.join(', ') || 'N/A'

        // Generate comprehensive text for NotebookLM
        const notebookText = `📚 STUDY GUIDE: ${chapter.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 SUBJECT: ${subject.name}
🏫 BOARD: ${data.profile.board}
🎓 CLASS: ${data.profile.classGrade}
🌍 COUNTRY: ${data.profile.country}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 COPY THESE INTO "SEARCH WEB" BOX:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${searchQueries.map((q, i) => `${i + 1}. ${q}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📹 YOUTUBE VIDEOS (paste as websites):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${videoUrls.length > 0 ? videoUrls.join('\n') : youtubeSearchUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 KEY CONCEPTS TO STUDY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${concepts}

${chapter.description ? `\n📋 CHAPTER DESCRIPTION:\n${chapter.description}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 SUGGESTED STUDY PROMPTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Explain ${chapter.name} in simple terms for a Class ${data.profile.classGrade} student
• What are the most important concepts in ${chapter.name}?
• Create a summary of ${chapter.name} with key formulas
• What questions are commonly asked from ${chapter.name} in ${data.profile.board} exams?
• Explain the applications of ${chapter.name} in real life
• What are common mistakes students make in ${chapter.name}?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generated by LearnBook AI
`

        setCopiedText(notebookText)
        setShowNotebookModal(true)
    }

    // Copy and open NotebookLM
    const copyAndOpenNotebook = async () => {
        await navigator.clipboard.writeText(copiedText)
        window.open('https://notebooklm.google.com/', '_blank')
    }

    // Extract YouTube video ID from URL
    const extractVideoId = (url: string): string => {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /youtube\.com\/v\/([^&\n?#]+)/,
        ]
        for (const pattern of patterns) {
            const match = url.match(pattern)
            if (match) return match[1]
        }
        return ''
    }


    // Auto-load content when tab changes
    useEffect(() => {
        if (activeTab === 'videos' && videos.length === 0 && !loadingVideos) {
            loadVideos()
        }
        if (activeTab === 'notes' && !summary && !loadingSummary) {
            loadSummary()
        }
    }, [activeTab])

    if (isLoading) {
        return (
            <div className="min-h-screen gradient-bg flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary loading-spin" />
            </div>
        )
    }

    if (!chapter || !subject) {
        return (
            <div className="min-h-screen gradient-bg flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Chapter Not Found</h2>
                    <Link href="/dashboard" className="text-primary">Back to Dashboard</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen gradient-bg">
            {/* Header */}
            <header className="border-b border-card-border sticky top-0 bg-background/80 backdrop-blur z-40">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/subject/${subjectId}`}
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 text-sm text-muted mb-1">
                                <span>{subject.name}</span>
                                <ChevronRight className="w-3 h-3" />
                                <span>Chapter {chapter.chapterNumber}</span>
                                {isCompleted && (
                                    <span className="px-2 py-0.5 rounded-full bg-success/20 text-success text-xs flex items-center gap-1">
                                        <Check className="w-3 h-3" />
                                        Completed
                                    </span>
                                )}
                            </div>
                            <h1 className="text-xl font-bold">{chapter.name}</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleComplete}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${isCompleted
                                    ? 'bg-success/20 border-success text-success'
                                    : 'btn-secondary'
                                    }`}
                            >
                                {isCompleted ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Completed
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Mark Complete
                                    </>
                                )}
                            </button>
                            <button
                                onClick={generateNotebookLMData}
                                className="btn-secondary flex items-center gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                NotebookLM
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="card text-center">
                        <Clock className="w-5 h-5 mx-auto mb-2 text-primary" />
                        <p className="text-lg font-bold">{chapter.estimatedHours}h</p>
                        <p className="text-xs text-muted">Estimated Time</p>
                    </div>
                    <div className="card text-center">
                        <Target className="w-5 h-5 mx-auto mb-2 text-accent" />
                        <p className="text-lg font-bold">{chapter.concepts?.length || 0}</p>
                        <p className="text-xs text-muted">Concepts</p>
                    </div>
                    <div className="card text-center">
                        <Youtube className="w-5 h-5 mx-auto mb-2 text-red-500" />
                        <p className="text-lg font-bold">{videos.length}</p>
                        <p className="text-xs text-muted">Videos</p>
                    </div>
                    <div className="card text-center">
                        <Brain className="w-5 h-5 mx-auto mb-2 text-success" />
                        <p className="text-lg font-bold">{chapter.progress || 0}%</p>
                        <p className="text-xs text-muted">Progress</p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 border-b border-card-border">
                    {[
                        { id: 'overview', label: 'Overview', icon: BookOpen },
                        { id: 'videos', label: 'Videos', icon: Youtube },
                        { id: 'notes', label: 'AI Notes', icon: FileText }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted hover:text-foreground'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                    >
                        {/* Invisible Mentor: Why This Matters */}
                        <div className="card bg-primary-container/20 border-l-4 border-primary">
                            <div className="flex items-start gap-4">
                                <Lightbulb className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                                <div>
                                    <h2 className="font-bold text-lg mb-1">Why This Matters</h2>
                                    <p className="text-muted text-sm leading-relaxed">
                                        Mastering <strong>{chapter.name}</strong> is crucial for understanding advanced topics in <strong>{subject?.name}</strong>.
                                        This concept appears frequently in exams and builds the foundation for real-world applications.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {chapter.description && (
                            <div className="card">
                                <h2 className="font-bold text-lg mb-3">About This Chapter</h2>
                                <p className="text-muted">{chapter.description}</p>
                            </div>
                        )}

                        {/* Concepts */}
                        <div className="card">
                            <h2 className="font-bold text-lg mb-3">Key Concepts</h2>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {chapter.concepts?.map((concept: string, index: number) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-secondary"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                            <CheckCircle2 className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="font-medium">{concept}</span>
                                    </div>
                                )) || <p className="text-muted">No concepts listed</p>}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => setActiveTab('videos')}
                                className="card hover:border-primary transition-colors text-left group"
                            >
                                <Youtube className="w-8 h-8 text-red-500 mb-3 group-hover:scale-110 transition-transform" />
                                <h3 className="font-bold mb-1">Watch Videos</h3>
                                <p className="text-sm text-muted">AI-curated educational videos</p>
                            </button>
                            <button
                                onClick={() => setActiveTab('notes')}
                                className="card hover:border-primary transition-colors text-left group"
                            >
                                <FileText className="w-8 h-8 text-accent mb-3 group-hover:scale-110 transition-transform" />
                                <h3 className="font-bold mb-1">AI Study Notes</h3>
                                <p className="text-sm text-muted">Summary, formulas, and tips</p>
                            </button>
                        </div>

                        {/* Invisible Mentor: What Next */}
                        <div className="card bg-secondary/50 border-l-4 border-secondary">
                            <div className="flex items-start gap-4">
                                <Target className="w-6 h-6 text-secondary-foreground mt-1 flex-shrink-0" />
                                <div>
                                    <h2 className="font-bold text-lg mb-1">Your Next Step</h2>
                                    <p className="text-muted text-sm">
                                        Once you're comfortable with these concepts, try solving 5 practice problems or taking a quick quiz to test your retention.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'videos' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {/* Quick YouTube Search */}
                        <div className="mb-6 p-4 rounded-xl bg-secondary flex items-center justify-between">
                            <div>
                                <p className="font-medium">Can't find what you need?</p>
                                <p className="text-sm text-muted">Search directly on YouTube</p>
                            </div>
                            <a
                                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${chapter.name} ${subject.name} ${data?.profile?.board} class ${data?.profile?.classGrade}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary flex items-center gap-2"
                            >
                                <Youtube className="w-4 h-4" />
                                Search YouTube
                            </a>
                        </div>

                        {loadingVideos ? (
                            <div className="text-center py-12">
                                <Loader2 className="w-8 h-8 text-primary mx-auto loading-spin" />
                                <p className="text-muted mt-4">Finding the best educational videos...</p>
                            </div>
                        ) : videos.length > 0 ? (
                            <div className="grid md:grid-cols-2 gap-4">
                                {videos.map((video, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="card group hover:border-red-500 overflow-hidden cursor-pointer"
                                        onClick={() => setFullscreenVideo(video)}
                                    >
                                        {/* Thumbnail */}
                                        <div className="relative w-full h-40 rounded-lg overflow-hidden bg-secondary mb-3 flex items-center justify-center">
                                            {video.thumbnail ? (
                                                <img
                                                    src={video.thumbnail}
                                                    alt={video.title}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none'
                                                    }}
                                                />
                                            ) : null}
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                                                <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <Play className="w-6 h-6 text-white ml-1" />
                                                </div>
                                            </div>

                                            {/* Fullscreen & External Actions */}
                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFullscreenVideo(video);
                                                    }}
                                                    title="Watch Fullscreen"
                                                >
                                                    <Maximize2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        window.open(video.url, '_blank');
                                                    }}
                                                    title="Open on YouTube"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="p-3">
                                            <h3 className="font-medium line-clamp-2 mb-1 group-hover:text-red-500 transition-colors">
                                                {video.title}
                                            </h3>
                                            <p className="text-sm text-muted mb-2">{video.channel}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Youtube className="w-12 h-12 text-muted mx-auto mb-4" />
                                <h3 className="text-lg font-medium mb-2">Load Educational Videos</h3>
                                <p className="text-muted mb-4">AI will find the best videos for this chapter</p>
                                <button onClick={loadVideos} className="btn-primary">
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Find Videos
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'notes' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {loadingSummary ? (
                            <div className="text-center py-12">
                                <Loader2 className="w-8 h-8 text-primary mx-auto loading-spin" />
                                <p className="text-muted mt-4">Generating AI study notes...</p>
                            </div>
                        ) : summary ? (
                            <div className="space-y-6">
                                {/* Notes Actions Bar */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-card-border">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-primary" />
                                        <span className="font-medium">AI Study Notes</span>
                                        {notesSaved && (
                                            <span className="text-xs text-success flex items-center gap-1">
                                                <Check className="w-3 h-3" />
                                                Saved
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleExportPdf}
                                            disabled={isExportingPdf}
                                            className="btn-secondary flex items-center gap-2"
                                            title="Export as PDF"
                                        >
                                            {isExportingPdf ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <FileDown className="w-4 h-4" />
                                            )}
                                            PDF
                                        </button>
                                        <button
                                            onClick={handleSaveToDrive}
                                            disabled={isSavingToDrive}
                                            className="btn-primary flex items-center gap-2"
                                            title="Save Notes to Google Drive"
                                        >
                                            {isSavingToDrive ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <HardDrive className="w-4 h-4" />
                                            )}
                                            Drive
                                        </button>
                                    </div>
                                </div>

                                {/* Overview */}
                                <div className="card">
                                    <h2 className="font-bold text-lg mb-3">Chapter Overview</h2>
                                    <div className="text-foreground/80 leading-relaxed">
                                        <FormattedText text={summary.overview} />
                                    </div>
                                </div>

                                {/* Key Points */}
                                <div className="card">
                                    <h2 className="font-bold text-lg mb-3">Key Points</h2>
                                    <ul className="space-y-2">
                                        {summary.keyPoints?.map((point, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-success mt-1 flex-shrink-0" />
                                                <div className="text-foreground/80">
                                                    <FormattedText text={point} />
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Formulas */}
                                {summary.formulas && summary.formulas.length > 0 && (
                                    <div className="card">
                                        <h2 className="font-bold text-lg mb-3">Important Formulas</h2>
                                        <div className="space-y-3">
                                            {summary.formulas.map((f, i) => (
                                                <div key={i} className="p-4 rounded-lg border border-card-border bg-card-bg">
                                                    <div className="font-bold text-foreground mb-2">
                                                        <FormattedText text={f.name} />
                                                    </div>
                                                    <p className="text-xl font-mono text-accent bg-secondary/50 p-2 rounded inline-block">
                                                        <MathFormula formula={f.formula} />
                                                    </p>
                                                    <div className="text-sm text-foreground/70 mt-2">
                                                        <FormattedText text={f.usage} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Important Terms */}
                                {summary.importantTerms && summary.importantTerms.length > 0 && (
                                    <div className="card">
                                        <h2 className="font-bold text-lg mb-3">Important Terms</h2>
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            {summary.importantTerms.map((t, i) => (
                                                <div key={i} className="p-4 rounded-lg border border-card-border bg-card-bg">
                                                    <div className="font-bold text-foreground mb-1">
                                                        <FormattedText text={t.term} />
                                                    </div>
                                                    <div className="text-sm text-foreground/80">
                                                        <FormattedText text={t.definition} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Exam Tips */}
                                {summary.examTips && summary.examTips.length > 0 && (
                                    <div className="card border-warning/30">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Lightbulb className="w-5 h-5 text-warning" />
                                            <h2 className="font-bold text-lg">Exam Tips</h2>
                                        </div>
                                        <ul className="space-y-2">
                                            {summary.examTips.map((tip, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <ChevronRight className="w-4 h-4 text-warning mt-1 flex-shrink-0" />
                                                    <span className="text-muted">{tip}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <FileText className="w-12 h-12 text-muted mx-auto mb-4" />
                                <h3 className="text-lg font-medium mb-2">Generate AI Notes</h3>
                                <button onClick={loadSummary} className="btn-primary">
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Generate Notes
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </main>

            {/* AI Chatbot */}
            <ChatBot
                context={{
                    subject: subject.name,
                    chapter: chapter.name,
                    board: data?.profile?.board,
                    classGrade: data?.profile?.classGrade
                }}
            />

            {/* NotebookLM Modal */}
            {showNotebookModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card-bg border border-card-border rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-card-border">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg">Export to NotebookLM</h2>
                                    <p className="text-sm text-muted">Study smarter with AI</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowNotebookModal(false)}
                                className="p-2 hover:bg-secondary rounded-lg"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Visual Instructions */}
                        <div className="p-4 bg-primary/10 border-b border-card-border">
                            <h3 className="font-semibold mb-3">📋 Quick Guide (3 Easy Steps):</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="text-center">
                                    <div className="relative rounded-lg overflow-hidden bg-secondary mb-2">
                                        <img
                                            src="/images/step1.png"
                                            alt="Step 1: Copy data"
                                            className="w-full h-24 object-cover"
                                        />
                                        <div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">1</div>
                                    </div>
                                    <p className="text-xs text-muted">Click "Copy All"</p>
                                </div>
                                <div className="text-center">
                                    <div className="relative rounded-lg overflow-hidden bg-secondary mb-2">
                                        <img
                                            src="/images/step2.png"
                                            alt="Step 2: Add sources"
                                            className="w-full h-24 object-cover"
                                        />
                                        <div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">2</div>
                                    </div>
                                    <p className="text-xs text-muted">Add sources → Websites</p>
                                </div>
                                <div className="text-center">
                                    <div className="relative rounded-lg overflow-hidden bg-secondary mb-2">
                                        <img
                                            src="/images/step3.png"
                                            alt="Step 3: Search web"
                                            className="w-full h-24 object-cover"
                                        />
                                        <div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">3</div>
                                    </div>
                                    <p className="text-xs text-muted">Paste in "Search web"</p>
                                </div>
                            </div>
                        </div>

                        {/* Content Preview */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <pre className="text-xs bg-secondary rounded-lg p-4 overflow-x-auto whitespace-pre-wrap font-mono">
                                {copiedText}
                            </pre>
                        </div>

                        {/* Actions */}
                        <div className="p-4 border-t border-card-border flex gap-3">
                            <button
                                onClick={async () => {
                                    await navigator.clipboard.writeText(copiedText)
                                    alert('Copied to clipboard!')
                                }}
                                className="btn-secondary flex-1"
                            >
                                📋 Copy Only
                            </button>
                            <button
                                onClick={copyAndOpenNotebook}
                                className="btn-primary flex-1 flex items-center justify-center gap-2"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Copy All & Open NotebookLM
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Fullscreen Video Player Modal */}
            {fullscreenVideo && (
                <div className="fixed inset-0 bg-black z-50 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 bg-black/80">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-white font-medium truncate">{fullscreenVideo.title}</h3>
                            <p className="text-gray-400 text-sm">{fullscreenVideo.channel}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <a
                                href={fullscreenVideo.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm transition-colors"
                            >
                                <Youtube className="w-4 h-4" />
                                Open on YouTube
                            </a>
                            <button
                                onClick={() => setFullscreenVideo(null)}
                                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Video Player */}
                    <div className="flex-1 flex items-center justify-center bg-black">
                        <iframe
                            src={`https://www.youtube.com/embed/${extractVideoId(fullscreenVideo.url)}?autoplay=1&rel=0`}
                            className="w-full h-full max-w-[1600px] max-h-[900px] aspect-video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={fullscreenVideo.title}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
