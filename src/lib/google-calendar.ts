// Calendar API scopes required: https://www.googleapis.com/auth/calendar.app.created
// Drive API scopes required: https://www.googleapis.com/auth/drive.file

// Helper to check and refresh token if needed
async function getValidToken(currentToken: string): Promise<string> {
    // Try using the current token first
    const testResponse = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + currentToken)
    if (testResponse.ok) {
        return currentToken
    }
    
    // Token expired - user needs to re-authenticate
    throw new Error('TOKEN_EXPIRED')
}

// 1. Create (or find) the dedicated LearnBook calendar
async function getOrCreateCalendar(accessToken: string): Promise<string> {
    const validToken = await getValidToken(accessToken)
    
    // List calendars to see if "LearnBook Schedule" exists
    const listResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: { 'Authorization': `Bearer ${validToken}` }
    })

    if (listResponse.ok) {
        const data = await listResponse.json()
        const existing = data.items.find((c: any) => c.summary === 'LearnBook Schedule')
        if (existing) return existing.id
    }

    // Create new calendar if not found
    const createResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${validToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            summary: 'LearnBook Schedule',
            description: 'Study plan synced from LearnBook'
        })
    })

    if (!createResponse.ok) {
        const error = await createResponse.json()
        throw new Error(`Failed to create calendar: ${error.error?.message || 'Unknown error'}`)
    }

    const newCal = await createResponse.json()
    return newCal.id
}

export interface CalendarEvent {
    summary: string
    description: string
    start: { dateTime?: string; date?: string; timeZone?: string }
    end: { dateTime?: string; date?: string; timeZone?: string }
    reminders?: {
        useDefault: boolean
        overrides?: { method: 'email' | 'popup'; minutes: number }[]
    }
}

export async function createCalendarEvent(accessToken: string, event: CalendarEvent) {
    try {
        const validToken = await getValidToken(accessToken)
        
        // 1. Ensure we have the target calendar
        const calendarId = await getOrCreateCalendar(validToken)

        // 2. Create event in THAT calendar
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${validToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(event)
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(`Calendar API error: ${error.error?.message || 'Unknown error'}`)
        }

        return response.json()
    } catch (error: any) {
        if (error.message === 'TOKEN_EXPIRED') {
            throw new Error('Your session has expired. Please sign out and sign in again with Google.')
        }
        throw error
    }
}

export function convertTaskToEvent(task: any, date: string): CalendarEvent {
    const [time, period] = task.timeSlot.split(' ')
    let [hours, minutes] = time.split(':').map(Number)

    // Convert to 24h
    if (period === 'PM' && hours !== 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0

    const startDate = new Date(date)
    startDate.setHours(hours, minutes, 0)

    const endDate = new Date(startDate)
    endDate.setMinutes(startDate.getMinutes() + task.durationMinutes)

    return {
        summary: `Study: ${task.chapterName}`,
        description: `Task: ${task.taskType}\n${task.description || ''}`,
        start: {
            dateTime: startDate.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
            dateTime: endDate.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'popup', minutes: 10 } // Remind 10 mins before
            ]
        }
    }
}

export function convertTodoToEvent(todo: any): CalendarEvent {
    // Todos are treated as All-Day events
    const taskDate = todo.task_date || new Date().toISOString().split('T')[0]
    
    return {
        summary: `📚 ${todo.task_description || 'Study Task'}`,
        description: `Type: ${todo.task_type || 'General'}\nStatus: ${todo.completed ? '✅ Completed' : '⏳ Pending'}\n\n✨ Created from LearnBook\n🔔 Don't forget to complete this task!`,
        start: {
            date: taskDate // YYYY-MM-DD
        },
        end: {
            date: taskDate // YYYY-MM-DD
        },
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'popup', minutes: 540 },  // 9am (9 hours before 6pm)
                { method: 'email', minutes: 540 },  // Email at 9am
                { method: 'popup', minutes: 120 }   // 2 hours before end of day
            ]
        }
    }
}
