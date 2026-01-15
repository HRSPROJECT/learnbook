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
            // Store Google OAuth tokens if present (for Calendar/Drive sync)
            if (data.session.provider_token) {
                const tokenExpiresAt = data.session.expires_at
                    ? new Date(data.session.expires_at * 1000).toISOString()
                    : new Date(Date.now() + 3600 * 1000).toISOString() // Default 1 hour

                await supabase
                    .from('user_profiles')
                    .upsert({
                        id: data.user.id,
                        google_access_token: data.session.provider_token,
                        google_refresh_token: data.session.provider_refresh_token || null,
                        google_token_expires_at: tokenExpiresAt
                    }, {
                        onConflict: 'id',
                        ignoreDuplicates: false
                    })
            }

            // Check if user has profile to decide redirect
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('id, country')
                .eq('id', data.user.id)
                .single()

            // If no profile or incomplete, go to onboarding; otherwise go to dashboard
            const redirectPath = profile?.country ? '/dashboard' : '/onboarding'
            return NextResponse.redirect(`${origin}${redirectPath}`)
        }

        // Session created, redirect to next page
        return NextResponse.redirect(`${origin}${next}`)
    }

    // No code present, redirect to login
    return NextResponse.redirect(`${origin}/login?error=No authorization code received`)
}
