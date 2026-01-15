'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

interface AuthContextType {
    user: User | null
    session: Session | null
    loading: boolean
    signInWithGoogle: () => Promise<{ error: string | null }>
    connectGoogle: () => Promise<{ error: string | null }>
    signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
    signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
    resetPassword: (email: string) => Promise<{ error: string | null }>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session)
                setUser(session?.user ?? null)
                setLoading(false)
            }
        )

        return () => subscription.unsubscribe()
    }, [supabase.auth])

    const signInWithGoogle = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    scopes: 'openid email profile https://www.googleapis.com/auth/calendar.app.created https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata',
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent'
                    }
                }
            })

            if (error) {
                return { error: error.message }
            }

            return { error: null }
        } catch (err) {
            return { error: 'An unexpected error occurred' }
        }
    }

    const connectGoogle = async () => {
        try {
            // Link Google account to existing user
            const { error } = await supabase.auth.linkIdentity({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    scopes: 'openid email profile https://www.googleapis.com/auth/calendar.app.created https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata',
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent'
                    }
                }
            })

            if (error) {
                return { error: error.message }
            }

            return { error: null }
        } catch (err) {
            return { error: 'An unexpected error occurred' }
        }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    const signInWithEmail = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (error) {
                return { error: error.message }
            }

            router.push('/dashboard')
            return { error: null }
        } catch (err) {
            return { error: 'An unexpected error occurred' }
        }
    }

    const signUpWithEmail = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`
                }
            })

            if (error) {
                return { error: error.message }
            }

            return { error: null }
        } catch (err) {
            return { error: 'An unexpected error occurred' }
        }
    }

    const resetPassword = async (email: string) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`
            })

            if (error) {
                return { error: error.message }
            }

            return { error: null }
        } catch (err) {
            return { error: 'An unexpected error occurred' }
        }
    }

    return (
        <AuthContext.Provider value={{
            user,
            session,
            loading,
            signInWithGoogle,
            connectGoogle,
            signInWithEmail,
            signUpWithEmail,
            resetPassword,
            signOut
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
