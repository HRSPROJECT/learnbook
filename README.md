<p align="center">
  <img src="public/logo.svg" alt="LearnBook Logo" width="80" height="80">
</p>

<h1 align="center">LearnBook</h1>

<p align="center">
  <strong>AI-Powered Learning Control Layer</strong><br>
  Smart roadmaps, dynamic timetables, and personalized curriculum — all optimized for your goals.
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js">
  <img alt="React" src="https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript">
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?style=flat-square&logo=supabase">
  <img alt="TailwindCSS" src="https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=flat-square&logo=tailwindcss">
</p>

---

## ✨ Overview

LearnBook is an **AI learning companion** that decides *what* to learn and *when*. Unlike content platforms, LearnBook acts as a **control layer** for your education — it doesn't create content, it orchestrates your learning journey.

### Key Features

| Feature | Description |
|---------|-------------|
| 🎯 **Smart Roadmaps** | AI-optimized learning paths based on your goals, available time, and exam dates |
| ⏰ **Dynamic Timetables** | Daily schedules that adapt when you skip tasks or need more time |
| 📚 **Chapter Intelligence** | Understand why each topic matters and dependencies between concepts |
| 🤖 **AI Chatbot** | Get instant help with explanations, summaries, and study guidance |
| 📺 **YouTube Integration** | Curated video resources for each topic you're learning |
| 🧠 **NotebookLM Ready** | Export curated sources and prompts for deep study sessions |

---

## 🏗️ Architecture

```
learnbook/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API Routes
│   │   │   ├── ai/             # AI chat & summarization
│   │   │   ├── curriculum/     # Dynamic curriculum generation
│   │   │   ├── youtube/        # Video resource fetching
│   │   │   └── chat/           # Conversational AI
│   │   ├── auth/               # Authentication callbacks
│   │   ├── dashboard/          # Main user dashboard
│   │   ├── onboarding/         # User setup flow
│   │   ├── roadmap/            # Learning roadmap view
│   │   ├── subject/            # Subject details & chapters
│   │   └── timetable/          # Daily schedule management
│   ├── components/             # Reusable UI components
│   │   ├── ChatBot.tsx         # AI assistant sidebar
│   │   ├── FormattedText.tsx   # Markdown/text rendering
│   │   └── TodoSidebar.tsx     # Task management panel
│   ├── contexts/               # React contexts (Auth)
│   ├── lib/                    # Core utilities
│   │   ├── gemini.ts           # Google Gemini AI integration
│   │   ├── groq.ts             # Groq AI integration
│   │   ├── google-search.ts    # Web search for syllabus data
│   │   ├── google-calendar.ts  # Calendar sync
│   │   └── supabase/           # Database client & hooks
│   └── types/                  # TypeScript definitions
├── supabase/
│   └── migrations/             # Database schema
└── public/                     # Static assets
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** or **yarn** or **pnpm**
- **Supabase** account (free tier works)
- **Groq** API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/learnbook.git
   cd learnbook
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your credentials:
   ```env
   # Supabase (Required)
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

   # AI Provider (Required - at least one)
   GROQ_API_KEY=your_groq_api_key
   GEMINI_API_KEY=your_gemini_api_key  # Optional fallback

   # Google APIs (Optional but recommended)
   YOUTUBE_API_KEY=your_youtube_api_key
   GOOGLE_SEARCH_API_KEY=your_google_search_api_key
   GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
   ```

4. **Set up the database**

   Run the migrations in your Supabase dashboard (SQL Editor) in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_add_subjects_table.sql`
   - `supabase/migrations/003_add_notes_column.sql`
   - `supabase/migrations/004_add_course_program.sql`

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 🔧 Configuration

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Enable **Email** and **Google** authentication providers
3. Copy your project URL and anon key to `.env`
4. Run the SQL migrations in the SQL Editor

### AI Providers

| Provider | Purpose | Get API Key |
|----------|---------|-------------|
| **Groq** | Primary AI (fast, recommended) | [console.groq.com](https://console.groq.com/keys) |
| **Gemini** | Fallback AI provider | [aistudio.google.com](https://aistudio.google.com/app/apikey) |

### Google APIs (Optional)

| API | Purpose | Setup |
|-----|---------|-------|
| **YouTube Data API v3** | Fetch educational videos | [Google Cloud Console](https://console.cloud.google.com/apis/library/youtube.googleapis.com) |
| **Custom Search API** | Web search for syllabus data | [Programmable Search Engine](https://programmablesearchengine.google.com/) |

---

## 📚 API Reference

### `/api/curriculum` (POST)

Generates curriculum data (subjects, chapters, topics) using AI + web search.

**Request Body:**
```json
{
  "country": "India",
  "educationLevel": "school",
  "board": "CBSE",
  "classGrade": "Class 12",
  "searchType": "subjects" | "chapters" | "topics",
  "subject": "Physics",           // Required for chapters/topics
  "courseProgram": "B.Tech CSE"   // For college students
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": "physics", "name": "Physics", "code": "042", "description": "..." }
  ]
}
```

### `/api/ai` (POST)

AI-powered explanations, summaries, and study assistance.

### `/api/youtube` (GET)

Fetches relevant educational videos for a topic.

### `/api/chat` (POST)

Conversational AI for study help and Q&A.

---

## 🗄️ Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `user_profiles` | User info, education level, board, grade |
| `user_subjects` | Subjects selected by users |
| `chapters` | Syllabus chapters with metadata |
| `user_progress` | Chapter completion tracking |
| `daily_tasks` | Scheduled study tasks |
| `roadmap_items` | Learning path milestones |
| `learning_context` | Subject-specific settings |

All tables use **Row Level Security (RLS)** to ensure users can only access their own data.

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16.1 (App Router) |
| **UI** | React 19.2, Tailwind CSS 4.0 |
| **Animation** | Framer Motion 12 |
| **Icons** | Lucide React |
| **Authentication** | Supabase Auth (Email + OAuth) |
| **Database** | PostgreSQL via Supabase |
| **AI** | Groq (Llama 3), Google Gemini |
| **Language** | TypeScript 5 |

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 🔒 Security

- **Row Level Security (RLS)** on all user tables
- **Supabase Auth** for secure authentication
- **Environment variables** for all sensitive keys
- **Server-side API routes** — no exposed credentials

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) for the amazing React framework
- [Supabase](https://supabase.com) for the backend infrastructure
- [Groq](https://groq.com) & [Google Gemini](https://ai.google.dev) for AI capabilities
- [Tailwind CSS](https://tailwindcss.com) for utility-first styling

---

<p align="center">
  <strong>Built with ❤️ for learners everywhere</strong>
</p>
