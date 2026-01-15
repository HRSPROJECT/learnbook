// Drive API scopes required: https://www.googleapis.com/auth/drive.file

// Helper to check token validity
async function getValidToken(currentToken: string): Promise<string> {
    const testResponse = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + currentToken)
    if (testResponse.ok) {
        return currentToken
    }
    throw new Error('TOKEN_EXPIRED')
}

export async function createGoogleDoc(accessToken: string, title: string, content: string) {
    try {
        const validToken = await getValidToken(accessToken)
        
        const metadata = {
            name: title,
            mimeType: 'application/vnd.google-apps.document',
            parents: [] // Will be saved to root or "LearnBook" folder if we create one
        }

        // Multipart upload: Metadata + Content
        const boundary = '-------314159265358979323846'
        const delimiter = `\r\n--${boundary}\r\n`
        const closeDelimiter = `\r\n--${boundary}--`

        const body =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: text/plain\r\n\r\n' +
            content +
            closeDelimiter

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${validToken}`,
                'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(`Drive API error: ${error.error?.message || 'Unknown error'}`)
        }

        return response.json()
    } catch (error: any) {
        if (error.message === 'TOKEN_EXPIRED') {
            throw new Error('Your session has expired. Please sign out and sign in again with Google.')
        }
        throw error
    }
}

// Get or create LearnBook folder in Drive
export async function getOrCreateLearnBookFolder(accessToken: string): Promise<string> {
    try {
        const validToken = await getValidToken(accessToken)
        
        // Search for existing folder
        const searchResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=name='LearnBook Notes' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            {
                headers: { 'Authorization': `Bearer ${validToken}` }
            }
        )

        if (searchResponse.ok) {
            const data = await searchResponse.json()
            if (data.files && data.files.length > 0) {
                return data.files[0].id
            }
        }

        // Create folder if not found
        const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${validToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'LearnBook Notes',
                mimeType: 'application/vnd.google-apps.folder'
            })
        })

        if (!createResponse.ok) {
            throw new Error('Failed to create LearnBook folder')
        }

        const folder = await createResponse.json()
        return folder.id
    } catch (error: any) {
        if (error.message === 'TOKEN_EXPIRED') {
            throw new Error('Your session has expired. Please sign out and sign in again with Google.')
        }
        throw error
    }
}

// Save to LearnBook folder
export async function createGoogleDocInFolder(accessToken: string, title: string, content: string) {
    try {
        const validToken = await getValidToken(accessToken)
        const folderId = await getOrCreateLearnBookFolder(validToken)
        
        const metadata = {
            name: title,
            mimeType: 'application/vnd.google-apps.document',
            parents: [folderId]
        }

        const boundary = '-------314159265358979323846'
        const delimiter = `\r\n--${boundary}\r\n`
        const closeDelimiter = `\r\n--${boundary}--`

        const body =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: text/plain\r\n\r\n' +
            content +
            closeDelimiter

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${validToken}`,
                'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(`Drive API error: ${error.error?.message || 'Unknown error'}`)
        }

        const result = await response.json()
        return {
            ...result,
            webViewLink: `https://docs.google.com/document/d/${result.id}/edit`
        }
    } catch (error: any) {
        if (error.message === 'TOKEN_EXPIRED') {
            throw new Error('Your session has expired. Please sign out and sign in again with Google.')
        }
        throw error
    }
}
