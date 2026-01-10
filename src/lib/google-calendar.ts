// Calendar API scopes required: https://www.googleapis.com/auth/calendar.app.created

// 1. Create (or find) the dedicated LearnBook calendar
async function getOrCreateCalendar(accessToken: string): Promise<string> {
    // List calendars to see if "LearnBook Schedule" exists
    const listResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
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
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            summary: 'LearnBook Schedule',
            description: 'Study plan synced from LearnBook'
        })
    })

    if (!createResponse.ok) throw new Error('Failed to create LearnBook calendar')

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
    // 1. Ensure we have the target calendar
    const calendarId = await getOrCreateCalendar(accessToken)

    // 2. Create event in THAT calendar
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
    })

    if (!response.ok) {
        throw new Error('Failed to create calendar event')
    }

    return response.json()
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
    // Todos are treated as All-Day events. 
    // If we wanted a specific time, we'd need a time field in the Todo interface.
    return {
        summary: `Todo: ${todo.task_description || 'Study Task'}`,
        description: `Type: ${todo.task_type || 'General'}\nStatus: ${todo.completed ? 'Completed' : 'Pending'}`,
        start: {
            date: todo.task_date // YYYY-MM-DD
        },
        end: {
            date: todo.task_date // YYYY-MM-DD
        },
        reminders: {
            useDefault: false,
            overrides: [
                // For all-day events, 'minutes' is minutes before 5pm the day before (usually), 
                // or similar depending on client. 
                // Actually, for all-day events, popup reminders might behave differently.
                // Let's rely on user's default daily briefing or set a reasonable popup.
                { method: 'popup', minutes: 720 } // 12 hours before (e.g. 5pm previous day? or 8am current day?)
                // Note: The behavior of minutues for all-day events varies.
                // Safest is often just to have it on the calendar.
            ]
        }
    }
}
