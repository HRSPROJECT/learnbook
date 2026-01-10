export async function createGoogleDoc(accessToken: string, title: string, content: string) {
    const metadata = {
        name: title,
        mimeType: 'application/vnd.google-apps.document'
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
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body
    })

    if (!response.ok) {
        throw new Error('Failed to create file in Drive')
    }

    return response.json()
}
