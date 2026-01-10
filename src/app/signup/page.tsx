'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'

export default function SignupPage() {
    const { signInWithGoogle, signUpWithEmail } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    })

    const handleGoogleSignup = async () => {
        setIsGoogleLoading(true)
        setError(null)
        try {
            const { error } = await signInWithGoogle()
            if (error) setError(error)
        } catch (err: any) {
            setError(err.message || 'An error occurred')
        } finally {
            setIsGoogleLoading(false)
        }
    }

    const handleEmailSignup = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.email || !formData.password || !formData.confirmPassword) {
            setError('Please fill in all fields')
            return
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setIsLoading(true)
        setError(null)
        try {
            const { error } = await signUpWithEmail(formData.email, formData.password)
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
                        We've sent a confirmation link to <strong>{formData.email}</strong>.
                        Please check your inbox and click the link to verify your account.
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
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left: Branding */}
            <div className="relative hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-primary to-primary-container text-white p-12 overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
                <div className="relative z-10 max-w-lg text-center">
                    <h1 className="text-5xl font-bold mb-6">LearnBook</h1>
                    <p className="text-xl text-blue-100 leading-relaxed">
                        Join thousands of students mastering their subjects with AI-powered learning.
                    </p>
                </div>
            </div>

            {/* Right: Signup Form */}
            <div className="flex items-center justify-center p-8 bg-surface">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-on-surface mb-2">Create Account</h2>
                        <p className="text-on-surface-variant">Start your personalized learning journey</p>
                    </div>

                    {error && (
                        <div className="p-4 bg-error-container text-on-error-container rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Email Signup Form */}
                    <form onSubmit={handleEmailSignup} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline bg-surface-container text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-outline bg-surface-container text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                    placeholder="Min. 6 characters"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline bg-surface-container text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                    placeholder="Confirm your password"
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
                                'Create Account'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-outline"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-surface text-on-surface-variant">or continue with</span>
                        </div>
                    </div>

                    {/* Google Signup */}
                    <button
                        onClick={handleGoogleSignup}
                        disabled={isGoogleLoading}
                        className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isGoogleLoading ? (
                            <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                        )}
                        Continue with Google
                    </button>

                    <p className="text-center text-sm text-on-surface-variant">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>

                    <p className="text-center text-xs text-on-surface-variant">
                        By creating an account, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </div>
        </div>
    )
}
