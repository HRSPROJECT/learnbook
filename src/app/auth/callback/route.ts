import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/select-subjects'
    const error = searchParams.get('error')
    const error_description = searchParams.get('error_description')

    // Handle OAuth errors from provider
    if (error) {
        console.error('OAuth error:', error, error_description)
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error_description || error)}`)
    }

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        )

        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
            console.error('Exchange error:', exchangeError)
            return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(exchangeError.message)}`)
        }

        if (data.session) {
            // Check if user has profile to decide redirect
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('id', data.user.id)
                .single()

            // If no profile, go to onboarding; otherwise go to dashboard/select-subjects
            const redirectPath = profile ? '/dashboard' : '/onboarding'
            return NextResponse.redirect(`${origin}${redirectPath}`)
        }

        // Session created, redirect to next page
        return NextResponse.redirect(`${origin}${next}`)
    }

    // No code present, redirect to login
    return NextResponse.redirect(`${origin}/login?error=No authorization code received`)
}
