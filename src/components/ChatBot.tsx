'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles, Minimize2, Maximize2 } from 'lucide-react'
import FormattedText from '@/components/FormattedText'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

interface ChatContext {
    subject?: string
    chapter?: string
    board?: string
    classGrade?: string
}

interface ChatBotProps {
    context?: ChatContext
}

export default function ChatBot({ context }: ChatBotProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return

        const userMessage: Message = {
            id: `msg_${Date.now()}`,
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    context
                })
            })

            const result = await response.json()

            if (result.success) {
                const assistantMessage: Message = {
                    id: `msg_${Date.now()}`,
                    role: 'assistant',
                    content: result.data.content,
                    timestamp: new Date()
                }
                setMessages(prev => [...prev, assistantMessage])
            } else {
                throw new Error(result.error)
            }
        } catch (error) {
            const errorMessage: Message = {
                id: `msg_${Date.now()}`,
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date()
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen)
        setIsMinimized(false)
    }

    return (
        <>
            {/* Chat Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-50"
                    >
                        <MessageCircle className="w-6 h-6 text-white" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1
                        }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className={`fixed bg-card-bg border border-card-border shadow-2xl overflow-hidden z-50 flex flex-col ${isFullscreen
                                ? 'inset-4 rounded-2xl'
                                : 'bottom-6 right-6 w-[380px] max-w-[calc(100vw-48px)] rounded-2xl'
                            }`}
                        style={{ height: isFullscreen ? 'auto' : (isMinimized ? 'auto' : '500px') }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-card-border bg-secondary/50">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm">LearnBook AI</h3>
                                    <p className="text-xs text-muted">
                                        {context?.chapter ? `Helping with ${context.chapter}` : 'Ask me anything'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={toggleFullscreen}
                                    className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
                                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                                >
                                    <Maximize2 className="w-4 h-4" />
                                </button>
                                {!isFullscreen && (
                                    <button
                                        onClick={() => setIsMinimized(!isMinimized)}
                                        className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
                                    >
                                        <Minimize2 className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setIsOpen(false)
                                        setIsFullscreen(false)
                                    }}
                                    className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {!isMinimized && (
                            <>
                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.length === 0 && (
                                        <div className="text-center py-8">
                                            <Bot className={`${isFullscreen ? 'w-16 h-16' : 'w-12 h-12'} text-muted mx-auto mb-3`} />
                                            <p className={`${isFullscreen ? 'text-base' : 'text-sm'} text-muted`}>
                                                Hi! I'm your AI learning assistant. Ask me anything about your studies!
                                            </p>
                                            {context?.chapter && (
                                                <p className={`${isFullscreen ? 'text-sm' : 'text-xs'} text-primary mt-2`}>
                                                    Currently studying: {context.chapter}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {messages.map(message => (
                                        <div
                                            key={message.id}
                                            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
                                        >
                                            {message.role === 'assistant' && (
                                                <div className={`${isFullscreen ? 'w-10 h-10' : 'w-7 h-7'} rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0`}>
                                                    <Bot className={`${isFullscreen ? 'w-5 h-5' : 'w-4 h-4'} text-primary`} />
                                                </div>
                                            )}
                                            <div
                                                className={`${isFullscreen ? 'max-w-[70%]' : 'max-w-[80%]'} rounded-2xl px-4 py-2 ${message.role === 'user'
                                                    ? 'bg-primary text-white rounded-br-sm'
                                                    : 'bg-secondary rounded-bl-sm'
                                                    }`}
                                            >
                                                <p className={`${isFullscreen ? 'text-base' : 'text-sm'} whitespace-pre-wrap`}>
                                                    {message.role === 'assistant' ? (
                                                        <FormattedText text={message.content} />
                                                    ) : (
                                                        message.content
                                                    )}
                                                </p>
                                            </div>
                                            {message.role === 'user' && (
                                                <div className={`${isFullscreen ? 'w-10 h-10' : 'w-7 h-7'} rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0`}>
                                                    <User className={`${isFullscreen ? 'w-5 h-5' : 'w-4 h-4'} text-accent`} />
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {isLoading && (
                                        <div className="flex gap-3">
                                            <div className={`${isFullscreen ? 'w-10 h-10' : 'w-7 h-7'} rounded-lg bg-primary/20 flex items-center justify-center`}>
                                                <Bot className={`${isFullscreen ? 'w-5 h-5' : 'w-4 h-4'} text-primary`} />
                                            </div>
                                            <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-3">
                                                <Loader2 className={`${isFullscreen ? 'w-5 h-5' : 'w-4 h-4'} loading-spin`} />
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <div className={`${isFullscreen ? 'p-4' : 'p-3'} border-t border-card-border`}>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className={`input flex-1 ${isFullscreen ? 'py-3 text-base' : 'py-2'}`}
                                            placeholder="Ask a question..."
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            disabled={isLoading}
                                        />
                                        <button
                                            onClick={sendMessage}
                                            disabled={!input.trim() || isLoading}
                                            className={`btn-primary ${isFullscreen ? 'p-3' : 'p-2'}`}
                                        >
                                            <Send className={`${isFullscreen ? 'w-5 h-5' : 'w-4 h-4'}`} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
