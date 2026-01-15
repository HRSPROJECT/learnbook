import { createClient } from '@/lib/supabase/client'

interface GoogleTokens {
    accessToken: string
    refreshToken: string | null
    expiresAt: Date | null
}

/**
 * Get the stored Google OAuth tokens for the current user
 */
export async function getStoredGoogleTokens(): Promise<GoogleTokens | null> {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('google_access_token, google_refresh_token, google_token_expires_at')
        .eq('id', user.id)
        .single()

    if (!profile?.google_access_token) return null

    return {
        accessToken: profile.google_access_token,
        refreshToken: profile.google_refresh_token,
        expiresAt: profile.google_token_expires_at ? new Date(profile.google_token_expires_at) : null
    }
}

/**
 * Check if the access token is expired or about to expire (within 5 minutes)
 */
export function isTokenExpired(expiresAt: Date | null): boolean {
    if (!expiresAt) return true
    const bufferMs = 5 * 60 * 1000 // 5 minutes buffer
    return Date.now() >= expiresAt.getTime() - bufferMs
}

/**
 * Refresh the Google access token using the refresh token
 */
export async function refreshGoogleToken(refreshToken: string): Promise<string | null> {
    // Note: This requires a server-side endpoint since we need the client secret
    // For now, we'll validate the token and prompt re-auth if expired

    try {
        const response = await fetch('/api/auth/refresh-google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        })

        if (!response.ok) {
            console.error('Failed to refresh Google token')
            return null
        }

        const data = await response.json()
        return data.accessToken
    } catch (error) {
        console.error('Error refreshing Google token:', error)
        return null
    }
}

/**
 * Get a valid Google access token, refreshing if necessary
 */
export async function getValidGoogleToken(): Promise<string | null> {
    const tokens = await getStoredGoogleTokens()
    if (!tokens) return null

    // If token is not expired, return it
    if (!isTokenExpired(tokens.expiresAt)) {
        return tokens.accessToken
    }

    // Token is expired, try to refresh
    if (tokens.refreshToken) {
        const newToken = await refreshGoogleToken(tokens.refreshToken)
        if (newToken) return newToken
    }

    // Couldn't refresh, user needs to re-authenticate
    return null
}

/**
 * Check if user has Google tokens stored (for UI display)
 */
export async function hasGoogleTokens(): Promise<boolean> {
    const tokens = await getStoredGoogleTokens()
    return !!tokens?.accessToken
}
