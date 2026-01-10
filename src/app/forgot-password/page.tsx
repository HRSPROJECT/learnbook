'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { Mail, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
    const { resetPassword } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [email, setEmail] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email) {
            setError('Please enter your email address')
            return
        }

        setIsLoading(true)
        setError(null)
        try {
            const { error } = await resetPassword(email)
            if (error) {
                setError(error)
            } else {
                setSuccess(true)
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface p-8">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8 text-success" />
                    </div>
                    <h1 className="text-2xl font-bold text-on-surface">Check Your Email</h1>
                    <p className="text-on-surface-variant">
                        We've sent a password reset link to <strong>{email}</strong>.
                        Please check your inbox and click the link to reset your password.
                    </p>
                    <div className="pt-4">
                        <Link href="/login" className="text-primary font-medium hover:underline">
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-on-surface mb-2">Reset Password</h2>
                    <p className="text-on-surface-variant">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                {error && (
                    <div className="p-4 bg-error-container text-on-error-container rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-on-surface mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline bg-surface-container text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary text-on-primary font-medium py-3 px-4 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            'Send Reset Link'
                        )}
                    </button>
                </form>

                <div className="text-center">
                    <Link href="/login" className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    )
}
