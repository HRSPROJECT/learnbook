'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
    const router = useRouter()
    const supabase = createClient()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.password || !formData.confirmPassword) {
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
            const { error } = await supabase.auth.updateUser({
                password: formData.password
            })

            if (error) {
                setError(error.message)
            } else {
                setSuccess(true)
                setTimeout(() => {
                    router.push('/login')
                }, 3000)
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
                    <h1 className="text-2xl font-bold text-on-surface">Password Updated!</h1>
                    <p className="text-on-surface-variant">
                        Your password has been successfully updated. You'll be redirected to login shortly.
                    </p>
                    <div className="pt-4">
                        <Link href="/login" className="text-primary font-medium hover:underline">
                            Go to Login
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
                    <h2 className="text-3xl font-bold text-on-surface mb-2">Set New Password</h2>
                    <p className="text-on-surface-variant">
                        Enter your new password below.
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
                            New Password
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
                            Confirm New Password
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
                            'Update Password'
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
