'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
    BookOpen, ChevronRight, ChevronLeft, Globe, GraduationCap,
    Check, Loader2, User, Mail, Lock
} from 'lucide-react'
import { countryOptions, schoolGrades, collegeYears } from '@/types/learning'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from '@/lib/supabase/hooks'

const steps = [
    { id: 1, title: 'Create Account', icon: User },
    { id: 2, title: 'Your Country', icon: Globe },
    { id: 3, title: 'Education Type', icon: GraduationCap },
    { id: 4, title: 'Your Institution', icon: BookOpen },
]

export default function OnboardingPage() {
    const router = useRouter()
    const { user, signInWithGoogle, loading: authLoading } = useAuth()
    const { profile, updateProfile, loading: profileLoading } = useUserProfile()
    const [currentStep, setCurrentStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [authError, setAuthError] = useState('')

    // Form data
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        country: '',
        educationLevel: '' as 'school' | 'college' | '',
        board: '',
        classGrade: '',
        customBoard: '',
        customGrade: ''
    })

    // If user is already authenticated and has profile, redirect to dashboard
    useEffect(() => {
        if (!authLoading && !profileLoading && user && profile) {
            router.push('/select-subjects')
        }
    }, [user, profile, authLoading, profileLoading, router])

    // If user is authenticated but no profile, skip to step 2
    useEffect(() => {
        if (!authLoading && user && currentStep === 1) {
            setFormData(prev => ({
                ...prev,
                fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
                email: user.email || ''
            }))
            setCurrentStep(2)
        }
    }, [user, authLoading, currentStep])

    const updateForm = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }))
    }

    const selectedCountry = countryOptions.find(c => c.value === formData.country)
    const boards = formData.educationLevel === 'school'
        ? selectedCountry?.schoolBoards || []
        : selectedCountry?.collegeBoards || []
    const grades = formData.educationLevel === 'school' ? schoolGrades : collegeYears

    const canProceed = () => {
        switch (currentStep) {
            case 1: return formData.fullName && formData.email
            case 2: return formData.country
            case 3: return formData.educationLevel
            case 4: return (formData.board || formData.customBoard) && (formData.classGrade || formData.customGrade)
            default: return false
        }
    }

    const nextStep = () => {
        if (currentStep < 4) setCurrentStep(prev => prev + 1)
    }

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1)
    }

    const handleGoogleSignIn = async () => {
        setAuthError('')
        const result = await signInWithGoogle()
        if (result.error) {
            setAuthError(result.error)
        }
    }

    const handleComplete = async () => {
        if (!user) {
            setAuthError('Please sign in first')
            return
        }

        setIsLoading(true)

        try {
            // Save profile to Supabase
            const { error } = await updateProfile({
                full_name: formData.fullName,
                country: formData.country,
                education_level: formData.educationLevel as 'school' | 'college',
                board: formData.board === 'Other' ? formData.customBoard : formData.board,
                class_grade: formData.classGrade === 'Other' ? formData.customGrade : formData.classGrade
            })

            if (error) {
                throw new Error(error)
            }

            // Redirect to subject selection
            router.push('/select-subjects')
        } catch (err: any) {
            console.error('Error saving profile:', err)
            setAuthError(err.message || 'Failed to save profile')
            setIsLoading(false)
        }
    }

    if (authLoading || profileLoading) {
        return (
            <div className="min-h-screen gradient-bg flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary loading-spin" />
            </div>
        )
    }

    return (
        <main className="min-h-screen gradient-bg flex flex-col">
            {/* Header */}
            <header className="p-6">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold">LearnBook</span>
                </div>
            </header>

            {/* Progress Stepper */}
            <div className="px-6 py-4">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all
                    ${currentStep > step.id
                                            ? 'bg-success text-white'
                                            : currentStep === step.id
                                                ? 'bg-primary text-white glow'
                                                : 'bg-secondary text-muted'}
                  `}>
                                        {currentStep > step.id ? (
                                            <Check className="w-5 h-5" />
                                        ) : (
                                            <step.icon className="w-5 h-5" />
                                        )}
                                    </div>
                                    <span className={`text-xs mt-2 hidden md:block ${currentStep >= step.id ? 'text-foreground' : 'text-muted'
                                        }`}>
                                        {step.title}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`
                    w-12 md:w-20 h-0.5 mx-2 transition-all
                    ${currentStep > step.id ? 'bg-success' : 'bg-card-border'}
                  `} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-xl">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="card"
                        >
                            {/* Step 1: Create Account */}
                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-bold mb-2">Create Your Account</h2>
                                        <p className="text-muted">Let's get you started on your learning journey.</p>
                                    </div>

                                    {authError && (
                                        <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
                                            {authError}
                                        </div>
                                    )}

                                    {/* Google Sign In Button */}
                                    <button
                                        onClick={handleGoogleSignIn}
                                        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-card-border hover:border-primary transition-colors"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                        <span className="font-medium">Continue with Google</span>
                                    </button>

                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 h-px bg-card-border" />
                                        <span className="text-sm text-muted">or continue with email</span>
                                        <div className="flex-1 h-px bg-card-border" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                                            <input
                                                type="text"
                                                className="input pl-12"
                                                placeholder="Enter your name"
                                                value={formData.fullName}
                                                onChange={(e) => updateForm('fullName', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                                            <input
                                                type="email"
                                                className="input pl-12"
                                                placeholder="your@email.com"
                                                value={formData.email}
                                                onChange={(e) => updateForm('email', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Password (Optional for demo)</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                                            <input
                                                type="password"
                                                className="input pl-12"
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={(e) => updateForm('password', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Country Selection */}
                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-bold mb-2">Where are you from?</h2>
                                        <p className="text-muted">This helps us find the right curriculum for you.</p>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {countryOptions.map(country => (
                                            <button
                                                key={country.value}
                                                type="button"
                                                className={`p-4 rounded-xl border-2 transition-all text-center ${formData.country === country.value
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-card-border hover:border-muted'
                                                    }`}
                                                onClick={() => {
                                                    updateForm('country', country.value)
                                                    updateForm('board', '')
                                                }}
                                            >
                                                <span className="font-medium">{country.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Education Level */}
                            {currentStep === 3 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-bold mb-2">Are you in school or college?</h2>
                                        <p className="text-muted">We'll customize your experience accordingly.</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            className={`p-6 rounded-xl border-2 transition-all ${formData.educationLevel === 'school'
                                                ? 'border-primary bg-primary/10'
                                                : 'border-card-border hover:border-muted'
                                                }`}
                                            onClick={() => {
                                                updateForm('educationLevel', 'school')
                                                updateForm('board', '')
                                                updateForm('classGrade', '')
                                            }}
                                        >
                                            <GraduationCap className="w-10 h-10 mx-auto mb-3 text-primary" />
                                            <span className="font-bold text-lg block">School</span>
                                            <p className="text-sm text-muted mt-1">K-12 / High School</p>
                                        </button>
                                        <button
                                            type="button"
                                            className={`p-6 rounded-xl border-2 transition-all ${formData.educationLevel === 'college'
                                                ? 'border-primary bg-primary/10'
                                                : 'border-card-border hover:border-muted'
                                                }`}
                                            onClick={() => {
                                                updateForm('educationLevel', 'college')
                                                updateForm('board', '')
                                                updateForm('classGrade', '')
                                            }}
                                        >
                                            <BookOpen className="w-10 h-10 mx-auto mb-3 text-accent" />
                                            <span className="font-bold text-lg block">College</span>
                                            <p className="text-sm text-muted mt-1">University / Degree</p>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Board & Class */}
                            {currentStep === 4 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-bold mb-2">Your Institution Details</h2>
                                        <p className="text-muted">We'll fetch subjects based on your curriculum.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            {formData.educationLevel === 'school' ? 'Board / Curriculum' : 'University Type'}
                                        </label>
                                        <select
                                            className="select"
                                            value={formData.board}
                                            onChange={(e) => updateForm('board', e.target.value)}
                                        >
                                            <option value="">Select your board</option>
                                            {boards.map(board => (
                                                <option key={board} value={board}>{board}</option>
                                            ))}
                                        </select>
                                        {formData.board === 'Other' && (
                                            <input
                                                type="text"
                                                className="input mt-2"
                                                placeholder="Enter your board/university name"
                                                value={formData.customBoard}
                                                onChange={(e) => updateForm('customBoard', e.target.value)}
                                            />
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            {formData.educationLevel === 'school' ? 'Grade / Class' : 'Year'}
                                        </label>
                                        <select
                                            className="select"
                                            value={formData.classGrade}
                                            onChange={(e) => updateForm('classGrade', e.target.value)}
                                        >
                                            <option value="">Select your {formData.educationLevel === 'school' ? 'grade' : 'year'}</option>
                                            {grades.map(grade => (
                                                <option key={grade} value={grade}>{grade}</option>
                                            ))}
                                        </select>
                                        {formData.classGrade === 'Other' && (
                                            <input
                                                type="text"
                                                className="input mt-2"
                                                placeholder="Enter your grade/year"
                                                value={formData.customGrade}
                                                onChange={(e) => updateForm('customGrade', e.target.value)}
                                            />
                                        )}
                                    </div>

                                    {authError && (
                                        <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
                                            {authError}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-6">
                        <button
                            type="button"
                            className="btn-secondary flex items-center gap-2"
                            onClick={prevStep}
                            disabled={currentStep === 1 || (currentStep === 2 && !!user)}
                            style={{ visibility: currentStep === 1 || (currentStep === 2 && !!user) ? 'hidden' : 'visible' }}
                        >
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>

                        {currentStep < 4 ? (
                            <button
                                type="button"
                                className="btn-primary flex items-center gap-2"
                                onClick={nextStep}
                                disabled={!canProceed()}
                            >
                                Continue <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="btn-primary flex items-center gap-2"
                                onClick={handleComplete}
                                disabled={!canProceed() || isLoading || !user}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 loading-spin" />
                                        Setting Up...
                                    </>
                                ) : (
                                    <>
                                        Find My Subjects
                                        <ChevronRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}
